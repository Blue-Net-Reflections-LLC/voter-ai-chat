import { NextRequest, NextResponse } from 'next/server';
import {
  calculateParticipationScore,
  VoterScoreData,
  HistoryEvent,
  calculateAverageScore
} from '@/lib/participation-score/calculate';
import { sql } from '@/lib/voter/db'; // Assuming this is the correct path for your DB utility
import { buildVoterListWhereClause } from '@/lib/voter/build-where-clause';
// import { pool } from '@/lib/db'; // Placeholder for database connection

// --- Helper Function for Filtered Voters Data ---
async function fetchFilteredVotersData(whereClause: string): Promise<VoterScoreData[]> {
  try {
    console.log(`[DB] Fetching filtered voter data with clause: ${whereClause || '(no clause)'}`);
    const query = `
      SELECT
        status as voter_status,
        voting_events
      FROM ga_voter_registration_list
      ${whereClause};
    `;
    const results = await sql.unsafe(query);
    console.log(`[DB] Found ${results.length} voters matching filters.`);
    const votersData = results.map(row => {
      let status: 'Active' | 'Inactive';
      if (row.voter_status?.toUpperCase() === 'ACTIVE') {
        status = 'Active';
      } else {
        status = 'Inactive';
      }
      const historyEvents: HistoryEvent[] = row.voting_events ? row.voting_events : [];
      return {
        status: status,
        historyEvents: historyEvents
      };
    });
    return votersData;
  } catch (dbError) {
    console.error(`[DB] Error fetching filtered voter data:`, dbError);
    throw dbError;
  }
}

// --- API Route Handler ---
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  console.log('Participation Score Request Params:', Object.fromEntries(searchParams));

  try {
    let score: number | null = null;

    // Always build the where clause, which now handles registrationNumber exclusively
    const whereClause = buildVoterListWhereClause(searchParams);
    console.log('Generated WHERE clause:', whereClause);

    // Prevent query if where clause is empty (no filters/reg num)
    if (!whereClause) {
      console.log('No valid filters or registration number provided.');
      // Return a specific response or handle as appropriate, e.g., 400 Bad Request
      return NextResponse.json({ error: 'Missing required query parameters.' }, { status: 400 });
    }

    // Always fetch data based on the where clause
    const votersData = await fetchFilteredVotersData(whereClause);

    // Determine response based on number of results
    if (votersData.length === 1) {
      // If exactly one voter matches (e.g., by registrationNumber or specific filters),
      // calculate and return their individual score.
      console.log('Calculating score for single matching voter.');
      score = calculateParticipationScore(votersData[0]);
    } else if (votersData.length > 1) {
      // If multiple voters match the filters, calculate the average score.
      console.log(`Calculating average score for ${votersData.length} voters.`);
      score = calculateAverageScore(votersData);
    } else {
      // If no voters match the filters or registrationNumber.
      console.log('No voters found matching the criteria.');
      score = null;
    }

    console.log(`Returning score: ${score}`);
    // Include voter count in the response for aggregate requests
    const responseBody = votersData.length > 1 ? { score, voterCount: votersData.length } : { score };
    return NextResponse.json(responseBody);

  } catch (error) {
    let errorMessage = 'Internal Server Error';
    let statusCode = 500;
    // Check if it's a known error type or has a specific message we want to expose
    if (error instanceof Error) {
        // Example: Customize error message based on specific db errors if needed
        // For now, a generic message for database/fetch errors
        errorMessage = 'Failed to fetch voter data.';
    }
    console.error("Error calculating participation score:", error);
    // It's often better to return a JSON error object
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