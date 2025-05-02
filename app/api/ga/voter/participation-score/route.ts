import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/voter/db'; // Assuming this is the correct path for your DB utility
import { buildVoterListWhereClause } from '@/lib/voter/build-where-clause';

// --- API Route Handler ---
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const registrationNumber = searchParams.get('registrationNumber');
  console.log('Participation Score Request Params:', Object.fromEntries(searchParams));

  // Get schema name from environment variables
  const schemaName = process.env.PG_VOTERDATA_SCHEMA;
  if (!schemaName) {
    console.error('Missing environment variable: PG_VOTERDATA_SCHEMA');
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }
  const tableName = `${schemaName}.ga_voter_registration_list`;

  try {
    let score: number | null = null;
    let voterCount: number | null = null; // Keep track of count for aggregate

    if (registrationNumber) {
      console.log(`[DB] Fetching score for single voter: ${registrationNumber}`);
      // Fetch single pre-calculated score
      const query = `
        SELECT participation_score
        FROM ${tableName}
        WHERE voter_registration_number = $1;
      `;
      const result = await sql.unsafe(query, [registrationNumber]);

      if (result.length > 0 && result[0].participation_score !== null) {
        score = parseFloat(result[0].participation_score);
        voterCount = 1; // Indicate single voter result
      } else {
        console.log(`No score found for voter ${registrationNumber}`);
      }
    } else {
      // Calculate average from pre-calculated scores based on filters
      const whereClause = buildVoterListWhereClause(searchParams);
      console.log('Generated WHERE clause for aggregate:', whereClause);

      if (whereClause) {
        console.log(`[DB] Calculating average score with clause: ${whereClause}`);
        // Query for the average score and count, excluding NULL scores
        const query = `
          SELECT
            AVG(participation_score) as average_score,
            COUNT(*) as voter_count
          FROM ${tableName}
          ${whereClause}
            AND participation_score IS NOT NULL;
        `;
        const result = await sql.unsafe(query);

        if (result.length > 0 && result[0].average_score !== null) {
          // Round the average score to one decimal place
          score = Math.round(parseFloat(result[0].average_score) * 10) / 10;
          voterCount = parseInt(result[0].voter_count, 10);
          console.log(`Average score: ${score}, Voter count: ${voterCount}`);
        } else {
          console.log('No voters with scores found matching the criteria.');
        }
      } else {
        // No filters provided, and no registration number - calculate average for ALL voters
        console.log('[DB] No filters provided, calculating average score for all voters...');
        const query = `
          SELECT
            AVG(participation_score) as average_score,
            COUNT(*) as voter_count
          FROM ${tableName}
          WHERE participation_score IS NOT NULL; -- Exclude voters without a score
        `;
        const result = await sql.unsafe(query);

        if (result.length > 0 && result[0].average_score !== null) {
          // Round the average score to one decimal place
          score = Math.round(parseFloat(result[0].average_score) * 10) / 10;
          voterCount = parseInt(result[0].voter_count, 10);
          console.log(`Overall average score: ${score}, Total voter count with scores: ${voterCount}`);
        } else {
          console.log('Could not calculate overall average score (no voters with scores found?).');
        }
      }
    }

    console.log(`Returning score: ${score}`);
    // Return score (null if not found/calculated) and voter count for context
    const responseBody = { score, voterCount };
    return NextResponse.json(responseBody);

  } catch (error) {
    let errorMessage = 'Internal Server Error';
    let statusCode = 500;

    if (error instanceof Error) {
        console.error("Error fetching participation score:", error);
        errorMessage = `Failed to fetch participation score: ${error.message}`;
    }
    console.error("Raw Error:", error);
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

// --- Placeholder/Helper Function Stubs ---

// async function fetchFilteredVotersData(whereClause: string): Promise<VoterScoreData[]> {
//   // Connect to DB
//   // Query GA_VOTER_REGISTRATION_LIST using whereClause for status and voting_events
//   // Return array of VoterScoreData
//   return [];
// }

// function calculateAverageScore(votersData: VoterScoreData[]): number | null {
//   if (!votersData || votersData.length === 0) {
//     return null;
//   }
//   const scores = votersData.map(calculateParticipationScore);
//   const sum = scores.reduce((acc, cur) => acc + cur, 0);
//   const average = sum / scores.length;
//   return Math.round(average * 10) / 10; // Round average
// } 