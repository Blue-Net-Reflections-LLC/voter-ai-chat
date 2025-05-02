import postgres from 'postgres';
import { config } from 'dotenv';
import * as path from 'node:path';
import { calculateParticipationScore, HistoryEvent, VoterScoreData } from '../../participation-score/calculate'; // Import core logic

// Load environment variables
config({
    path: [path.join(__dirname, '../../../../.env.local'), '.env.local'],
});

const databaseUrl = process.env.PG_VOTERDATA_URL;
const schemaName = process.env.PG_VOTERDATA_SCHEMA;

if (!databaseUrl || !schemaName) {
    throw new Error("Missing PG_VOTERDATA_URL or PG_VOTERDATA_SCHEMA. Set them in the .env file.");
}

const sql = postgres(databaseUrl, { max: 1 }); // Use single connection
const REGISTRATION_TABLE = sql`${sql(schemaName)}.ga_voter_registration_list`;

const BATCH_SIZE = 5000; // Process N records at a time

// Define the structure for batch updates
interface VoterScoreUpdate {
    voter_registration_number: string;
    participation_score: number;
}

// Helper function to validate a score value
function isValidScore(score: any): boolean {
    return score !== undefined && 
           score !== null && 
           !isNaN(score) && 
           typeof score === 'number' &&
           score >= 1.0 && 
           score <= 10.0;
}

async function calculateAndStoreScores() {
    console.log('Starting Participation Score calculation process...');
    let totalProcessed = 0;
    let totalUpdated = 0;
    let totalErrors = 0; 
    let offset = 0;

    try {
        while (true) {
            console.log(`Fetching next batch (offset: ${offset}, size: ${BATCH_SIZE})...`);
            const voters = await sql<any[]>`
                SELECT
                    voter_registration_number,
                    status,
                    voting_events
                FROM ${REGISTRATION_TABLE}
                -- Optional: Only process rows where score is NULL if you only want to fill missing ones
                -- WHERE participation_score IS NULL
                ORDER BY voter_registration_number -- Consistent ordering is crucial for batches
                LIMIT ${BATCH_SIZE}
                OFFSET ${offset};
            `;

            if (voters.length === 0) {
                console.log("No more voters found in this batch. Exiting loop.");
                break;
            }

            console.log(`Processing ${voters.length} voters...`);
            const updatesToMake: VoterScoreUpdate[] = [];
            let calculationErrorsInBatch = 0; // Track errors during the calculation phase

            // Calculate scores for the entire batch first
            for (const voter of voters) {
                try {
                    if (!voter.voter_registration_number) {
                        console.error(`Error: Voter without registration number found. Skipping update.`);
                        calculationErrorsInBatch++;
                        continue;
                    }

                    const status = voter.status?.toUpperCase() === 'ACTIVE' ? 'Active' : 'Inactive';
                    const historyEvents: HistoryEvent[] = voter.voting_events || [];
                    const voterData: VoterScoreData = { status, historyEvents };

                    const score = calculateParticipationScore(voterData);

                    // Enhanced validation for score
                    if (!isValidScore(score)) {
                        console.error(`Error: Calculated score ${score} is invalid for voter ${voter.voter_registration_number}. Skipping update for this voter.`);
                        calculationErrorsInBatch++;
                    } else {
                        updatesToMake.push({
                            voter_registration_number: voter.voter_registration_number,
                            participation_score: score,
                        });
                    }
                } catch (error) {
                    console.error(`Error calculating score for voter ${voter.voter_registration_number}:`, error);
                    calculationErrorsInBatch++;
                }
            }

            let updatedInBatch = 0;
            let updateError = false;

            // Perform the batch update if there are calculated scores
            if (updatesToMake.length > 0) {
                try {
                    console.log(`Attempting to update ${updatesToMake.length} voters in a single batch...`);
                    
                    // Debug output for first few items
                    console.log(`First 3 items in batch (for debugging):`);
                    updatesToMake.slice(0, 3).forEach((item, idx) => {
                        console.log(`Item ${idx}: reg=${item.voter_registration_number}, score=${item.participation_score}, type=${typeof item.participation_score}`);
                    });
                    
                    // Try with a more explicit batch update approach
                    try {
                        // Create a string of values for the SQL IN clause
                        const valueSets = updatesToMake.map(update => 
                            `('${update.voter_registration_number}', ${update.participation_score})`
                        ).join(', ');
                        
                        // Use raw SQL to construct the batch update - more explicit control
                        const query = `
                            UPDATE ${schemaName}.ga_voter_registration_list AS target
                            SET participation_score = source.score
                            FROM (VALUES ${valueSets}) AS source(reg_num, score)
                            WHERE target.voter_registration_number = source.reg_num;
                        `;
                        
                        const result = await sql.unsafe(query);
                        updatedInBatch = result.count || 0;
                        console.log(`Batch update successful using explicit SQL. Rows affected: ${updatedInBatch}`);
                    } catch (batchError) {
                        console.error(`Error with explicit batch update approach:`, batchError);
                        console.log(`Falling back to individual updates...`);
                        
                        // Fall back to individual updates if batch method fails
                        await sql.begin(async (transaction) => {
                            for (const update of updatesToMake) {
                                try {
                                    const result = await transaction`
                                        UPDATE ${REGISTRATION_TABLE}
                                        SET participation_score = ${update.participation_score}
                                        WHERE voter_registration_number = ${update.voter_registration_number};
                                    `;
                                    if (result.count > 0) {
                                        updatedInBatch++;
                                    }
                                } catch (rowError) {
                                    console.error(`Error updating voter ${update.voter_registration_number}:`, rowError);
                                    // Continue with other updates in the transaction
                                }
                            }
                        });
                        console.log(`Completed individual updates. Total updates: ${updatedInBatch}`);
                    }
                } catch (error) {
                    console.error(`Fatal error performing updates for offset ${offset}:`, error);
                    updateError = true;
                }
            } else {
                console.log("No valid scores calculated in this batch to update.");
            }

            totalProcessed += voters.length;
            totalUpdated += updatedInBatch; 
            totalErrors += calculationErrorsInBatch + (updateError ? 1 : 0);
            offset += voters.length; // Increment offset regardless of update success to avoid infinite loops

            console.log(`Batch complete. Calculated: ${voters.length}, Calculation Errors: ${calculationErrorsInBatch}, Updated: ${updatedInBatch}, Update Error: ${updateError}.`);
            console.log(`TOTALS - Processed: ${totalProcessed}, Updated: ${totalUpdated}, Errors: ${totalErrors}`);
        }

        console.log('Participation Score calculation complete.');

    } catch (error) {
        console.error('Fatal error during score calculation process:', error);
        process.exit(1);
    } finally {
        await sql.end({ timeout: 5 });
        console.log('Database connection closed.');
    }
}

// Execute the function
calculateAndStoreScores(); 