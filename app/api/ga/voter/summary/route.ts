import { NextRequest, NextResponse } from 'next/server';
import { buildVoterListWhereClause } from '@/lib/voter/build-where-clause';
import { sql } from '@/lib/voter/db';
// import { buildWhereClause } from '@/lib/voter/whereClause'; // TODO: Uncomment and use actual whereClause builder

const AGG_LIMIT = parseInt(process.env.VOTER_AGG_LIMIT || '500', 10);

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

// Helper to get aggregate counts for a field
async function getAggregateCounts(field: string, table: string, whereClause: string): Promise<AggregateItem[]> {
  try {
    // Add extra filter for non-null, non-empty values
    const extraFilter = `(${field} IS NOT NULL AND TRIM(${field}) != '')`;
    // If whereClause is not empty, append with AND; otherwise, just use extraFilter
    const fullWhere = whereClause
      ? whereClause.replace(/^WHERE/i, `WHERE ${extraFilter} AND`)
      : `WHERE ${extraFilter}`;
    return await sql.unsafe(`
      SELECT ${field} AS label, COUNT(*) AS count
      FROM ${table}
      ${fullWhere}
      GROUP BY ${field}
      ORDER BY count DESC
      LIMIT ${AGG_LIMIT}
    `);
  } catch (e) {
    console.error(`[voter/summary] Error querying ${field}:`, e);
    return [];
  }
}

// Section-specific aggregation functions
async function getVotingInfoAggregates(whereClause: string, shouldQuery: boolean) {
  if (!shouldQuery) {
    return {
      status: [],
      status_reason: [],
      residence_city: [],
      residence_zipcode: [],
    };
  }
  const statusPromise = getAggregateCounts('status', 'GA_VOTER_REGISTRATION_LIST', whereClause);
  const statusReasonPromise = getAggregateCounts('status_reason', 'GA_VOTER_REGISTRATION_LIST', whereClause);
  const residenceCityPromise = getAggregateCounts('residence_city', 'GA_VOTER_REGISTRATION_LIST', whereClause);
  const residenceZipcodePromise = getAggregateCounts('residence_zipcode', 'GA_VOTER_REGISTRATION_LIST', whereClause);
  const [status, status_reason, residence_city, residence_zipcode] = await Promise.all([
    statusPromise,
    statusReasonPromise,
    residenceCityPromise,
    residenceZipcodePromise,
  ]);
  return { status, status_reason, residence_city, residence_zipcode };
}

async function getDistrictsAggregates(whereClause: string, shouldQuery: boolean) {
  if (!shouldQuery) {
    return {
      county_name: [],
      congressional_district: [],
      state_senate_district: [],
      state_house_district: [],
    };
  }
  const countyNamePromise = getAggregateCounts('county_name', 'GA_VOTER_REGISTRATION_LIST', whereClause);
  const congressionalDistrictPromise = getAggregateCounts('congressional_district', 'GA_VOTER_REGISTRATION_LIST', whereClause);
  const stateSenateDistrictPromise = getAggregateCounts('state_senate_district', 'GA_VOTER_REGISTRATION_LIST', whereClause);
  const stateHouseDistrictPromise = getAggregateCounts('state_house_district', 'GA_VOTER_REGISTRATION_LIST', whereClause);
  const [county_name, congressional_district, state_senate_district, state_house_district] = await Promise.all([
    countyNamePromise,
    congressionalDistrictPromise,
    stateSenateDistrictPromise,
    stateHouseDistrictPromise,
  ]);
  return { county_name, congressional_district, state_senate_district, state_house_district };
}

// TODO: Add similar functions for demographics, voting_history, and census

// --- API Handler ---

export async function GET(req: NextRequest) {
  try {
    // Parse filters and section from query params
    const url = new URL(req.url);
    const section = url.searchParams.get('section') as VoterSummarySection | undefined;
    // TODO: Parse all filter params from url.searchParams

    // Build WHERE clause using shared builder
    const whereClause = buildVoterListWhereClause(url.searchParams);

    // Section query flags
    const shouldQueryVotingInfo = !section || section === 'voting_info';
    const shouldQueryDistricts = !section || section === 'districts';
    // TODO: Add flags for other sections

    // Get aggregates for each section
    const votingInfo = await getVotingInfoAggregates(whereClause, shouldQueryVotingInfo);
    const districts = await getDistrictsAggregates(whereClause, shouldQueryDistricts);
    // TODO: Call other section functions

    // --- Assemble response ---
    const response: VoterSummaryResponse = {
      voting_info: votingInfo,
      districts: districts,
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

    // TODO: Implement aggregation for other sections (demographics, voting_history, census)

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