import { NextRequest, NextResponse } from 'next/server';
import { buildVoterListWhereClause } from '@/lib/voter/build-where-clause';
import { sql } from '@/lib/voter/db';
import { AGE_RANGES } from './ageRangeUtils';
import { ELECTION_DATES } from '@/app/ga/voter/list/constants'; // Import the single source of truth
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
    // List of known date fields (add more as needed)
    const dateFields = new Set([
      'derived_last_vote_date',
      'registration_date',
      'last_vote_date',
      'last_modified_date',
      'date_of_last_contact',
      'voter_created_date',
    ]);
    // Add extra filter for non-null, non-empty values (string fields) or just non-null (date fields)
    const extraFilter = dateFields.has(field)
      ? `(${field} IS NOT NULL)`
      : `(${field} IS NOT NULL AND TRIM(${field}) != '')`;
    // If whereClause is not empty, append with AND; otherwise, just use extraFilter
    const fullWhere = whereClause
      ? whereClause.replace(/^WHERE/i, `WHERE ${extraFilter} AND`)
      : `WHERE ${extraFilter}`;
    const orderBy = field === 'derived_last_vote_date' ? 'label DESC' :
      field === 'census_tract' ? 'label ASC' : 'count DESC';
    const results = await sql.unsafe(`
      SELECT ${field} AS label, COUNT(*) AS count
      FROM ${table}
      ${fullWhere}
      GROUP BY ${field}
      ORDER BY ${orderBy}
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

  // Age range logic using AGE_RANGES utility
  const currentYear = new Date().getFullYear();
  const ageRangePromises = AGE_RANGES.map(async (range) => {
    // Add non-null, non-empty birth_year filter
    const extraFilter = `(birth_year IS NOT NULL AND TRIM(CAST(birth_year AS TEXT)) != '')`;
    const fullWhere = whereClause
      ? whereClause.replace(/^WHERE/i, `WHERE ${extraFilter} AND ${range.getSql(currentYear)} AND`)
      : `WHERE ${extraFilter} AND ${range.getSql(currentYear)}`;
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

async function getVotingHistoryAggregates(whereClause: string, shouldQuery: boolean) {
  if (!shouldQuery) {
    return {
      election_date_counts: [],
      participated_election_years: [],
    };
  }

  // election_date_counts: Total votes on each distinct election date in the last 16 years
  const electionDateCountsPromise = (async () => {
    try {
      const currentYear = new Date().getFullYear();
      const sixteenYearsAgoYear = currentYear - 16;

      // Calculate the date 16 years ago for filtering
      const sixteenYearsAgo = new Date();
      sixteenYearsAgo.setFullYear(sixteenYearsAgo.getFullYear() - 16);
      const sixteenYearsAgoStr = sixteenYearsAgo.toISOString().split('T')[0]; // Format as YYYY-MM-DD

      const sqlQuery = `
        WITH FilteredVoters AS (
            SELECT voter_registration_number, voting_events
            FROM GA_VOTER_REGISTRATION_LIST
            ${whereClause} -- Apply user filters here
        ),
        UnrolledEvents AS (
            SELECT
                (event_data ->> 'election_date')::DATE AS election_date
            FROM
                FilteredVoters,
                jsonb_array_elements(voting_events) AS event_data
            WHERE
                voting_events IS NOT NULL
                AND jsonb_typeof(voting_events) = 'array'
                AND (event_data ->> 'election_date') IS NOT NULL
        )
        SELECT
            election_date::TEXT AS label, -- Return date as string label
            COUNT(*) AS count
        FROM
            UnrolledEvents
        WHERE
            election_date >= $1::DATE -- Filter for last 16 years
            AND EXTRACT(YEAR FROM election_date) % 2 = 0 -- Filter for even years only
        GROUP BY
            election_date
        ORDER BY
            election_date DESC
        LIMIT ${AGG_LIMIT};
      `;
      // Use sql.unsafe() with parameters to prevent SQL injection
      const results = await sql.unsafe(sqlQuery, [sixteenYearsAgoStr]);
      return results.map((row: any) => ({ label: row.label, count: Number(row.count) }));
    } catch (e) {
      console.error(`[voter/summary] Error querying election_date_counts:`, e);
      return [];
    }
  })();

  // participated_election_years: count of voters for each year
  const participatedElectionYearsPromise = (async () => {
    try {
      // Added filter for non-null/non-empty participated_election_years
      const extraFilter = `(participated_election_years IS NOT NULL AND array_length(participated_election_years, 1) > 0)`;
      const fullWhere = whereClause
          ? whereClause.replace(/^WHERE/i, `WHERE ${extraFilter} AND`)
          : `WHERE ${extraFilter}`;

      const sqlQuery = `
        SELECT year::text AS label, COUNT(*) AS count
        FROM (
          SELECT UNNEST(participated_election_years) AS year
          FROM GA_VOTER_REGISTRATION_LIST
          ${fullWhere}
        ) AS years
        GROUP BY year
        ORDER BY year DESC
        LIMIT ${AGG_LIMIT}
      `;
      const results = await sql.unsafe(sqlQuery);
      return results.map((row: any) => ({ label: row.label, count: Number(row.count) }));
    } catch (e) {
      console.error(`[voter/summary] Error querying participated_election_years:`, e);
      return [];
    }
  })();

  const [election_date_counts, participated_election_years] = await Promise.all([
    electionDateCountsPromise,
    participatedElectionYearsPromise,
  ]);
  return { election_date_counts, participated_election_years };
}

async function getCensusAggregates(whereClause: string, shouldQuery: boolean) {
  if (!shouldQuery) {
    return {
      census_tract: [],
    };
  }
  const censusTract = await getAggregateCounts('census_tract', 'GA_VOTER_REGISTRATION_LIST', whereClause);
  return { census_tract: censusTract };
}

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
    const shouldQueryVotingHistory = !section || section === 'voting_history';
    const shouldQueryCensus = !section || section === 'census';
    // TODO: Add flags for other sections

    // Get aggregates for each section
    const votingInfo = await getVotingInfoAggregates(whereClause, shouldQueryVotingInfo);
    const districts = await getDistrictsAggregates(whereClause, shouldQueryDistricts);
    const demographics = await getDemographicsAggregates(whereClause, shouldQueryDemographics);
    const voting_history = await getVotingHistoryAggregates(whereClause, shouldQueryVotingHistory);
    const census = await getCensusAggregates(whereClause, shouldQueryCensus);
    // TODO: Call other section functions

    // --- Assemble response ---
    const response: Partial<VoterSummaryResponse> & { timestamp: string } = {
      voting_info: votingInfo,
      districts: districts,
      demographics: demographics,
      voting_history: voting_history,
      census: census,
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