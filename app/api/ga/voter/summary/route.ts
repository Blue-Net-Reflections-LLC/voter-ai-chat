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
    const results = await sql.unsafe(`
      SELECT ${field} AS label, COUNT(*) AS count
      FROM ${table}
      ${fullWhere}
      GROUP BY ${field}
      ORDER BY count DESC
      LIMIT ${AGG_LIMIT}
    `);
    return results.map((row: any) => ({
      label: row.label,
      count: Number(row.count)
    }));
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

async function getDemographicsAggregates(whereClause: string, shouldQuery: boolean) {
  if (!shouldQuery) {
    return {
      race: [],
      gender: [],
      age_range: [],
    };
  }
  const racePromise = getAggregateCounts('race', 'GA_VOTER_REGISTRATION_LIST', whereClause);
  const genderPromise = getAggregateCounts('gender', 'GA_VOTER_REGISTRATION_LIST', whereClause);

  // Age range logic
  const currentYear = new Date().getFullYear();
  const ageRanges = [
    { label: '18-23', sql: `(birth_year <= ${currentYear - 18} AND birth_year >= ${currentYear - 23})` },
    { label: '25-44', sql: `(birth_year <= ${currentYear - 25} AND birth_year >= ${currentYear - 44})` },
    { label: '45-64', sql: `(birth_year <= ${currentYear - 45} AND birth_year >= ${currentYear - 64})` },
    { label: '65-74', sql: `(birth_year <= ${currentYear - 65} AND birth_year >= ${currentYear - 74})` },
    { label: '75+',   sql: `(birth_year <= ${currentYear - 75})` },
  ];
  const ageRangePromises = ageRanges.map(async (range) => {
    // Add non-null, non-empty birth_year filter
    const extraFilter = `(birth_year IS NOT NULL AND TRIM(CAST(birth_year AS TEXT)) != '')`;
    const fullWhere = whereClause
      ? whereClause.replace(/^WHERE/i, `WHERE ${extraFilter} AND ${range.sql} AND`)
      : `WHERE ${extraFilter} AND ${range.sql}`;
    const result = await sql.unsafe(`
      SELECT COUNT(*) AS count
      FROM GA_VOTER_REGISTRATION_LIST
      ${fullWhere}
    `);
    return { label: range.label, count: parseInt(result[0]?.count || '0', 10) };
  });

  const [race, gender, age_range] = await Promise.all([
    racePromise,
    genderPromise,
    Promise.all(ageRangePromises),
  ]);
  return { race, gender, age_range };
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
    const shouldQueryDemographics = !section || section === 'demographics';
    // TODO: Add flags for other sections

    // Get aggregates for each section
    const votingInfo = await getVotingInfoAggregates(whereClause, shouldQueryVotingInfo);
    const districts = await getDistrictsAggregates(whereClause, shouldQueryDistricts);
    const demographics = await getDemographicsAggregates(whereClause, shouldQueryDemographics);
    // TODO: Call other section functions

    // --- Assemble response ---
    const response: VoterSummaryResponse = {
      voting_info: votingInfo,
      districts: districts,
      demographics: demographics,
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