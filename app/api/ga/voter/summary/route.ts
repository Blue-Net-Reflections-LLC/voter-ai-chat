import { NextRequest, NextResponse } from 'next/server';
import { buildVoterListWhereClause } from '@/lib/voter/build-where-clause';
import { sql } from '@/lib/voter/db';
// import { buildWhereClause } from '@/lib/voter/whereClause'; // TODO: Uncomment and use actual whereClause builder

// --- API Request & Response Contracts ---

// Example: Filter params (expand as needed)
interface VoterSummaryFilters {
  status?: string;
  status_reason?: string;
  residence_city?: string;
  residence_zipcode?: string;
  county_name?: string;
  congressional_district?: string;
  state_senate_district?: string;
  state_house_district?: string;
  race?: string;
  gender?: string;
  birth_year_min?: number;
  birth_year_max?: number;
  derived_last_vote_date?: string;
  participated_election_years?: string;
  census_tract?: string;
  // ...add all other filter fields as needed
}

// Section names
export type VoterSummarySection =
  | 'voting_info'
  | 'districts'
  | 'demographics'
  | 'voting_history'
  | 'census';

// Aggregate result for a field
export interface AggregateItem {
  label: string;
  count: number;
}

// API response structure
export interface VoterSummaryResponse {
  voting_info: Record<string, AggregateItem[]>;
  districts: Record<string, AggregateItem[]>;
  demographics: Record<string, AggregateItem[]>;
  voting_history: Record<string, AggregateItem[]>;
  census: Record<string, AggregateItem[]>;
  timestamp: string;
}

// --- API Handler ---

export async function GET(req: NextRequest) {
  try {
    // Parse filters and section from query params
    const url = new URL(req.url);
    const section = url.searchParams.get('section') as VoterSummarySection | undefined;
    // TODO: Parse all filter params from url.searchParams
    const filters: VoterSummaryFilters = {};
    // Example: filters.status = url.searchParams.get('status') || undefined;
    // ...parse all other filters

    // Only run queries if section is not specified or is voting_info
    const shouldQueryVotingInfo = !section || section === 'voting_info';

    // Build WHERE clause using shared builder
    const whereClause = buildVoterListWhereClause(url.searchParams);

    // --- Voting Info Aggregates ---
    let status: AggregateItem[] = [];
    let status_reason: AggregateItem[] = [];
    let residence_city: AggregateItem[] = [];
    let residence_zipcode: AggregateItem[] = [];

    if (shouldQueryVotingInfo) {
      // Query for status
      try {
        status = await sql.unsafe(`
          SELECT status AS label, COUNT(*) AS count
          FROM GA_VOTER_REGISTRATION_LIST
          ${whereClause}
          GROUP BY status
          ORDER BY count DESC
          LIMIT 500
        `);
      } catch (e) {
        console.error('[voter/summary] Error querying status:', e);
      }
      // Query for status_reason
      try {
        status_reason = await sql.unsafe(`
          SELECT status_reason AS label, COUNT(*) AS count
          FROM GA_VOTER_REGISTRATION_LIST
          ${whereClause}
          GROUP BY status_reason
          ORDER BY count DESC
          LIMIT 500
        `);
      } catch (e) {
        console.error('[voter/summary] Error querying status_reason:', e);
      }
      // Query for residence_city
      try {
        residence_city = await sql.unsafe(`
          SELECT residence_city AS label, COUNT(*) AS count
          FROM GA_VOTER_REGISTRATION_LIST
          ${whereClause}
          GROUP BY residence_city
          ORDER BY count DESC
          LIMIT 500
        `);
      } catch (e) {
        console.error('[voter/summary] Error querying residence_city:', e);
      }
      // Query for residence_zipcode
      try {
        residence_zipcode = await sql.unsafe(`
          SELECT residence_zipcode AS label, COUNT(*) AS count
          FROM GA_VOTER_REGISTRATION_LIST
          ${whereClause}
          GROUP BY residence_zipcode
          ORDER BY count DESC
          LIMIT 500
        `);
      } catch (e) {
        console.error('[voter/summary] Error querying residence_zipcode:', e);
      }
    }

    // --- Assemble response ---
    const response: VoterSummaryResponse = {
      voting_info: {
        status: status || [],
        status_reason: status_reason || [],
        residence_city: residence_city || [],
        residence_zipcode: residence_zipcode || [],
      },
      districts: {
        county_name: [],
        congressional_district: [],
        state_senate_district: [],
        state_house_district: [],
      },
      demographics: {
        race: [],
        gender: [],
        age_range: [], // Calculated from birth_year
      },
      voting_history: {
        derived_last_vote_date: [],
        participated_election_years: [],
      },
      census: {
        census_tract: [],
      },
      timestamp: new Date().toISOString(),
    };

    // TODO: Implement aggregation for other sections (districts, demographics, voting_history, census)

    // If section param is provided, only return that section (others remain empty arrays)
    if (section) {
      Object.keys(response).forEach(key => {
        if (key !== section && key !== 'timestamp') {
          // @ts-ignore
          response[key] = Object.fromEntries(Object.keys(response[key]).map(f => [f, []]));
        }
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('[voter/summary] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch voter summary.' }, { status: 500 });
  }
} 