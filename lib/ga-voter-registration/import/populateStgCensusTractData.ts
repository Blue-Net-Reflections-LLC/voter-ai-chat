import postgres from 'postgres';
import { config as dotenvConfig } from 'dotenv';
import *   as path from 'node:path';
// You might need to install node-fetch if not using a Node version with global fetch
// import fetch from 'node-fetch'; 

// --- Configuration ---
// Load environment variables from .env.local, adjusting path if needed
dotenvConfig({
    path: ['.env.local', path.join(__dirname, '../../../../.env.local')], 
});

const databaseUrl = process.env.PG_VOTERDATA_URL;
const schemaName = process.env.PG_VOTERDATA_SCHEMA || 'public'; // Default to public if not set

if (!databaseUrl) {
    throw new Error("Missing PG_VOTERDATA_URL. Set it in the .env file.");
}

const sql = postgres(databaseUrl);

const CENSUS_API_KEY = '03daa05a0a25133bea51761e8871b479f9fc0e40'; // From getCensusData.ts
const STAGING_TABLE_NAME = `${schemaName}.stg_processed_census_tract_data`;
const BATCH_SIZE = 50; // Adjust as needed for inserting into the staging table

interface ProcessedTractData {
    tract_id: string;
    census_data_year: string;
    median_household_income: number | null;
    pct_bachelors_degree_only: number | null;
    pct_bachelors_degree_or_higher: number | null;
    labor_force_participation_rate: number | null;
    unemployment_rate: number | null;
    employment_rate: number | null;
    education_total_pop_25_plus: number | null;
}

// --- Census API Fetching Logic (adapted from getCensusData.ts) ---
async function fetchCensusApi(censusTractId: string, tableId: string): Promise<any> {
    try {
        const formattedTractId = `1400000US${censusTractId}`;
        const isSubjectTable = tableId.startsWith('S');
        const endpoint = isSubjectTable
            ? `https://api.census.gov/data/2023/acs/acs5/subject?get=group(${tableId})&ucgid=${formattedTractId}&key=${CENSUS_API_KEY}`
            : `https://api.census.gov/data/2023/acs/acs5?get=group(${tableId})&ucgid=${formattedTractId}&key=${CENSUS_API_KEY}`;

        const response = await fetch(endpoint); // Ensure fetch is available (node-fetch or modern Node.js)
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Census API error for tract ${censusTractId}, table ${tableId}: ${response.status} - ${errorText}`);
            throw new Error(`Census API error: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching census data for tract ${censusTractId}, table ${tableId}:`, error);
        throw error; // Re-throw to handle upstream
    }
}

// --- Data Processing Logic (adapted from getCensusData.ts) ---
function processRawCensusData(
    censusTractId: string,
    educationDataRaw: any,
    incomeDataRaw: any,
    employmentDataRaw: any
): ProcessedTractData | null {
    try {
        // Education (B15003)
        const eduHeaders = educationDataRaw[0];
        const eduValues = educationDataRaw[1] || []; // Handle cases where a tract might not have data
        const eduMap = eduHeaders.reduce((acc: Record<string, any>, header: string, index: number) => {
            acc[header] = eduValues[index];
            return acc;
        }, {});
        const totalPopulationEdu = Number(eduMap['B15003_001E']) || 0;
        const bachelorsDegreeCount = Number(eduMap['B15003_022E']) || 0;
        const mastersDegreeCount = Number(eduMap['B15003_023E']) || 0;
        const professionalDegreeCount = Number(eduMap['B15003_024E']) || 0;
        const doctorateDegreeCount = Number(eduMap['B15003_025E']) || 0;
        const graduateDegreesCount = mastersDegreeCount + professionalDegreeCount + doctorateDegreeCount;
        const higherEducationCount = bachelorsDegreeCount + graduateDegreesCount;

        const calculatePercentage = (value: number, total: number) =>
            total > 0 ? (value / total) * 100 : 0;

        const pct_bachelors_degree_only = calculatePercentage(bachelorsDegreeCount, totalPopulationEdu);
        const pct_bachelors_degree_or_higher = calculatePercentage(higherEducationCount, totalPopulationEdu);

        // Income (B19013)
        const incomeHeaders = incomeDataRaw[0];
        const incomeValues = incomeDataRaw[1] || [];
        const incomeMap = incomeHeaders.reduce((acc: Record<string, any>, header: string, index: number) => {
            acc[header] = incomeValues[index];
            return acc;
        }, {});
        const median_household_income = Number(incomeMap['B19013_001E']) || null;

        // Employment (S2301)
        const empHeaders = employmentDataRaw[0];
        const empValues = employmentDataRaw[1] || [];
        const empMap = empHeaders.reduce((acc: Record<string, any>, header: string, index: number) => {
            acc[header] = empValues[index];
            return acc;
        }, {});
        const labor_force_participation_rate = Number(empMap['S2301_C02_001E']) || null; // Percent of population 16+ in labor force
        const unemployment_rate = Number(empMap['S2301_C04_001E']) || null; // Unemployment rate (percent of civilian labor force)
        const employment_rate = unemployment_rate !== null ? 100 - unemployment_rate : null;

        return {
            tract_id: censusTractId,
            census_data_year: "2023 ACS 5-Year", // As indicated in getCensusData.ts
            median_household_income,
            pct_bachelors_degree_only,
            pct_bachelors_degree_or_higher,
            labor_force_participation_rate,
            unemployment_rate,
            employment_rate,
            education_total_pop_25_plus: totalPopulationEdu,
        };
    } catch (error) {
        console.error(`Error processing raw census data for tract ${censusTractId}:`, error);
        return null; // Skip this tract on processing error
    }
}


// --- Database Upsert Logic for a Single Record ---
async function upsertSingleTractData(tractData: ProcessedTractData): Promise<void> {
    try {
        // Pre-process the single row to ensure correct types
        const toNumberOrNull = (val: number | null | undefined): number | null => {
            if (val === null || typeof val === 'undefined') return null;
            const num = Number(val);
            return isNaN(num) ? null : num;
        };
        const toFixedNumberOrNull = (val: number | null | undefined, digits: number): number | null => {
            if (val === null || typeof val === 'undefined') return null;
            const num = Number(val);
            if (isNaN(num)) return null;
            return Number(num.toFixed(digits));
        };

        const dataToInsert = {
            tract_id: String(tractData.tract_id || ''),
            census_data_year: String(tractData.census_data_year || ''),
            median_household_income: toNumberOrNull(tractData.median_household_income),
            pct_bachelors_degree_only: toFixedNumberOrNull(tractData.pct_bachelors_degree_only, 2),
            pct_bachelors_degree_or_higher: toFixedNumberOrNull(tractData.pct_bachelors_degree_or_higher, 2),
            labor_force_participation_rate: toFixedNumberOrNull(tractData.labor_force_participation_rate, 2),
            unemployment_rate: toFixedNumberOrNull(tractData.unemployment_rate, 2),
            employment_rate: toFixedNumberOrNull(tractData.employment_rate, 2),
            education_total_pop_25_plus: toNumberOrNull(tractData.education_total_pop_25_plus)
        };

        // Using sql template for a single row insert/update
        await sql`
            INSERT INTO ${sql(STAGING_TABLE_NAME)} (
                tract_id, census_data_year, median_household_income,
                pct_bachelors_degree_only, pct_bachelors_degree_or_higher,
                labor_force_participation_rate, unemployment_rate, employment_rate,
                education_total_pop_25_plus
            )
            VALUES (
                ${dataToInsert.tract_id},
                ${dataToInsert.census_data_year},
                ${dataToInsert.median_household_income},
                ${dataToInsert.pct_bachelors_degree_only},
                ${dataToInsert.pct_bachelors_degree_or_higher},
                ${dataToInsert.labor_force_participation_rate},
                ${dataToInsert.unemployment_rate},
                ${dataToInsert.employment_rate},
                ${dataToInsert.education_total_pop_25_plus}
            )
            ON CONFLICT (tract_id) DO UPDATE SET
                census_data_year = EXCLUDED.census_data_year,
                median_household_income = EXCLUDED.median_household_income,
                pct_bachelors_degree_only = EXCLUDED.pct_bachelors_degree_only,
                pct_bachelors_degree_or_higher = EXCLUDED.pct_bachelors_degree_or_higher,
                labor_force_participation_rate = EXCLUDED.labor_force_participation_rate,
                unemployment_rate = EXCLUDED.unemployment_rate,
                employment_rate = EXCLUDED.employment_rate,
                education_total_pop_25_plus = EXCLUDED.education_total_pop_25_plus,
                fetched_at = NOW();
        `;
    } catch (error) {
        console.error(`Error during upsert for tract ${tractData.tract_id}:`, error);
        throw error; // Re-throw to be caught by the main loop
    }
}


// --- Main Script Logic ---
async function main() {
    console.log('Starting script to populate STG_PROCESSED_CENSUS_TRACT_DATA (single insert mode)...');

    let uniqueTracts: { census_tract: string }[];
    try {
        console.log('Fetching unique census tracts for Cobb County from ga_voter_registration_list...');
        uniqueTracts = await sql`
            SELECT DISTINCT
                vrl.census_tract
            FROM
                ${sql(schemaName)}.ga_voter_registration_list vrl
            WHERE
                vrl.county_code = '067' -- Cobb County FIPS code
                AND vrl.census_tract IS NOT NULL AND TRIM(vrl.census_tract) <> '';
        `;
        console.log(`Found ${uniqueTracts.length} unique census tracts in Cobb County.`);
        if (uniqueTracts.length === 0) {
            console.log("No census tracts found. Exiting.");
            return;
        }
    } catch (error) {
        console.error('Failed to fetch unique census tracts:', error);
        return; // Exit if we can't get tracts
    }

    // Remove batching variables
    // let currentBatch: ProcessedTractData[] = []; 
    let processedCount = 0;
    let errorCount = 0;

    for (const [index, row] of uniqueTracts.entries()) { // Add index for progress logging
        const censusTractId = row.census_tract;
        if (!censusTractId) {
            console.warn('Skipping row with null census_tract.');
            errorCount++; // Count as an error/skip
            continue;
        }

        console.log(`[${index + 1}/${uniqueTracts.length}] Processing tract: ${censusTractId}`);
        try {
            // Fetch data (remains the same)
            const educationDataRaw = await fetchCensusApi(censusTractId, 'B15003');
            const incomeDataRaw = await fetchCensusApi(censusTractId, 'B19013');
            const employmentDataRaw = await fetchCensusApi(censusTractId, 'S2301');

            if (educationDataRaw && incomeDataRaw && employmentDataRaw) {
                // Process data (remains the same)
                const processedData = processRawCensusData(
                    censusTractId,
                    educationDataRaw,
                    incomeDataRaw,
                    employmentDataRaw
                );

                if (processedData) {
                    // Insert/Update immediately instead of batching
                    await upsertSingleTractData(processedData);
                    processedCount++;
                } else {
                    // Error occurred during processing
                    errorCount++;
                }
            } else {
                console.warn(`Missing some raw data for tract ${censusTractId}, skipping DB upsert.`);
                errorCount++;
            }

            // Remove batch check
            // if (currentBatch.length >= BATCH_SIZE) { ... }

        } catch (error) {
            // Catch errors from fetch, process, or upsert
            console.error(`Failed to process or upsert tract ${censusTractId}:`, error);
            errorCount++;
            // Optional: Add a delay or break if API errors are frequent
        }
         // Optional: Add a small delay to be kind to the Census API if processing many tracts
         // await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
    }

    // Remove final batch processing
    // if (currentBatch.length > 0) { ... }

    console.log('--- Script Finished ---');
    console.log(`Successfully processed and upserted data for ${processedCount} tracts.`);
    console.log(`Encountered errors/skips for ${errorCount} tracts.`);
}

// --- Script Execution ---
(async () => {
    try {
        await main();
    } catch (error) {
        console.error("Fatal error during script execution:", error);
        process.exit(1);
    } finally {
        await sql.end({ timeout: 5 });
        console.log('Database connection closed.');
    }
})(); 