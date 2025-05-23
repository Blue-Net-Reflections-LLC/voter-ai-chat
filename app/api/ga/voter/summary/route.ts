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
  | 'precincts'
  | 'census';

// Aggregate result for a field
export interface AggregateItem {
  label: string;
  count: number;
  facility_name?: string;
  facility_address?: string;
}

// API response structure
export interface VoterSummaryResponse {
  voting_info: Record<string, AggregateItem[]>;
  districts: Record<string, AggregateItem[]>;
  demographics: Record<string, AggregateItem[]>;
  voting_history: Record<string, AggregateItem[]>;
  precincts: Record<string, AggregateItem[]>;
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
      income_brackets: [],
      education_levels: [],
      unemployment_rates: [],
      population_density: [],
      cvap_demographics: [],
      cvap_registration_rates: [],
    };
  }

  // Income brackets based on median household income
  const incomeBracketsPromise = (async () => {
    try {
      const query = `
        WITH VoterCensusData AS (
          SELECT DISTINCT vrl.census_tract, ct.median_household_income
          FROM GA_VOTER_REGISTRATION_LIST vrl
          INNER JOIN stg_processed_census_tract_data ct ON vrl.census_tract = ct.tract_id
          ${whereClause}
          AND ct.median_household_income IS NOT NULL
        ),
        VotersByTract AS (
          SELECT vrl.census_tract, COUNT(*) as voter_count
          FROM GA_VOTER_REGISTRATION_LIST vrl
          ${whereClause}
          GROUP BY vrl.census_tract
        ),
        IncomeBrackets AS (
          SELECT 
            CASE 
              WHEN vcd.median_household_income < 25000 THEN 'Under $25,000'
              WHEN vcd.median_household_income < 50000 THEN '$25,000 - $50,000'
              WHEN vcd.median_household_income < 75000 THEN '$50,000 - $75,000'
              WHEN vcd.median_household_income < 100000 THEN '$75,000 - $100,000'
              WHEN vcd.median_household_income < 150000 THEN '$100,000 - $150,000'
              ELSE '$150,000+'
            END AS income_bracket,
            vbt.voter_count
          FROM VoterCensusData vcd
          INNER JOIN VotersByTract vbt ON vcd.census_tract = vbt.census_tract
        )
        SELECT income_bracket AS label, SUM(voter_count) AS count
        FROM IncomeBrackets
        GROUP BY income_bracket
        ORDER BY 
          CASE income_bracket
            WHEN 'Under $25,000' THEN 1
            WHEN '$25,000 - $50,000' THEN 2
            WHEN '$50,000 - $75,000' THEN 3
            WHEN '$75,000 - $100,000' THEN 4
            WHEN '$100,000 - $150,000' THEN 5
            WHEN '$150,000+' THEN 6
          END
        LIMIT ${AGG_LIMIT}
      `;
      const results = await sql.unsafe(query);
      return results.map((row: any) => ({ label: row.label, count: Number(row.count) }));
    } catch (e) {
      console.error(`[voter/summary] Error querying income_brackets:`, e);
      return [];
    }
  })();

  // Education levels based on bachelor's degree percentages
  const educationLevelsPromise = (async () => {
    try {
      const query = `
        WITH VoterCensusData AS (
          SELECT DISTINCT vrl.census_tract, ct.pct_bachelors_degree_or_higher
          FROM GA_VOTER_REGISTRATION_LIST vrl
          INNER JOIN stg_processed_census_tract_data ct ON vrl.census_tract = ct.tract_id
          ${whereClause}
          AND ct.pct_bachelors_degree_or_higher IS NOT NULL
        ),
        VotersByTract AS (
          SELECT vrl.census_tract, COUNT(*) as voter_count
          FROM GA_VOTER_REGISTRATION_LIST vrl
          ${whereClause}
          GROUP BY vrl.census_tract
        ),
        EducationLevels AS (
          SELECT 
            CASE 
              WHEN vcd.pct_bachelors_degree_or_higher < 15 THEN 'Low Bachelor''s Rate (0-15%)'
              WHEN vcd.pct_bachelors_degree_or_higher < 30 THEN 'Moderate Bachelor''s Rate (15-30%)'
              WHEN vcd.pct_bachelors_degree_or_higher < 50 THEN 'High Bachelor''s Rate (30-50%)'
              ELSE 'Very High Bachelor''s Rate (50%+)'
            END AS education_level,
            vbt.voter_count
          FROM VoterCensusData vcd
          INNER JOIN VotersByTract vbt ON vcd.census_tract = vbt.census_tract
        )
        SELECT education_level AS label, SUM(voter_count) AS count
        FROM EducationLevels
        GROUP BY education_level
        ORDER BY 
          CASE education_level
            WHEN 'Low Bachelor''s Rate (0-15%)' THEN 1
            WHEN 'Moderate Bachelor''s Rate (15-30%)' THEN 2
            WHEN 'High Bachelor''s Rate (30-50%)' THEN 3
            WHEN 'Very High Bachelor''s Rate (50%+)' THEN 4
          END
        LIMIT ${AGG_LIMIT}
      `;
      const results = await sql.unsafe(query);
      return results.map((row: any) => ({ label: row.label, count: Number(row.count) }));
    } catch (e) {
      console.error(`[voter/summary] Error querying education_levels:`, e);
      return [];
    }
  })();

  // Unemployment rate categories
  const unemploymentRatesPromise = (async () => {
    try {
      const query = `
        WITH VoterCensusData AS (
          SELECT DISTINCT vrl.census_tract, ct.unemployment_rate
          FROM GA_VOTER_REGISTRATION_LIST vrl
          INNER JOIN stg_processed_census_tract_data ct ON vrl.census_tract = ct.tract_id
          ${whereClause}
          AND ct.unemployment_rate IS NOT NULL
        ),
        VotersByTract AS (
          SELECT vrl.census_tract, COUNT(*) as voter_count
          FROM GA_VOTER_REGISTRATION_LIST vrl
          ${whereClause}
          GROUP BY vrl.census_tract
        ),
        UnemploymentCategories AS (
          SELECT 
            CASE 
              WHEN vcd.unemployment_rate < 3 THEN 'Very Low Unemployment (0-3%)'
              WHEN vcd.unemployment_rate < 6 THEN 'Low Unemployment (3-6%)'
              WHEN vcd.unemployment_rate < 10 THEN 'Moderate Unemployment (6-10%)'
              ELSE 'High Unemployment (10%+)'
            END AS unemployment_category,
            vbt.voter_count
          FROM VoterCensusData vcd
          INNER JOIN VotersByTract vbt ON vcd.census_tract = vbt.census_tract
        )
        SELECT unemployment_category AS label, SUM(voter_count) AS count
        FROM UnemploymentCategories
        GROUP BY unemployment_category
        ORDER BY 
          CASE unemployment_category
            WHEN 'Very Low Unemployment (0-3%)' THEN 1
            WHEN 'Low Unemployment (3-6%)' THEN 2
            WHEN 'Moderate Unemployment (6-10%)' THEN 3
            WHEN 'High Unemployment (10%+)' THEN 4
          END
        LIMIT ${AGG_LIMIT}
      `;
      const results = await sql.unsafe(query);
      return results.map((row: any) => ({ label: row.label, count: Number(row.count) }));
    } catch (e) {
      console.error(`[voter/summary] Error querying unemployment_rates:`, e);
      return [];
    }
  })();

  // Population density categories
  const populationDensityPromise = (async () => {
    try {
      const query = `
        WITH VoterCensusData AS (
          SELECT DISTINCT vrl.census_tract, ct.total_population
          FROM GA_VOTER_REGISTRATION_LIST vrl
          INNER JOIN stg_processed_census_tract_data ct ON vrl.census_tract = ct.tract_id
          ${whereClause}
          AND ct.total_population IS NOT NULL
        ),
        VotersByTract AS (
          SELECT vrl.census_tract, COUNT(*) as voter_count
          FROM GA_VOTER_REGISTRATION_LIST vrl
          ${whereClause}
          GROUP BY vrl.census_tract
        ),
        PopulationCategories AS (
          SELECT 
            CASE 
              WHEN vcd.total_population < 1000 THEN 'Low Density (Under 1,000)'
              WHEN vcd.total_population < 3000 THEN 'Medium Density (1,000-3,000)'
              WHEN vcd.total_population < 6000 THEN 'High Density (3,000-6,000)'
              ELSE 'Very High Density (6,000+)'
            END AS density_category,
            vbt.voter_count
          FROM VoterCensusData vcd
          INNER JOIN VotersByTract vbt ON vcd.census_tract = vbt.census_tract
        )
        SELECT density_category AS label, SUM(voter_count) AS count
        FROM PopulationCategories
        GROUP BY density_category
        ORDER BY 
          CASE density_category
            WHEN 'Low Density (Under 1,000)' THEN 1
            WHEN 'Medium Density (1,000-3,000)' THEN 2
            WHEN 'High Density (3,000-6,000)' THEN 3
            WHEN 'Very High Density (6,000+)' THEN 4
          END
        LIMIT ${AGG_LIMIT}
      `;
      const results = await sql.unsafe(query);
      return results.map((row: any) => ({ label: row.label, count: Number(row.count) }));
    } catch (e) {
      console.error(`[voter/summary] Error querying population_density:`, e);
      return [];
    }
  })();

  // CVAP demographics - racial composition of eligible voters
  const cvapDemographicsPromise = (async () => {
    try {
      const query = `
        WITH VoterCensusData AS (
          SELECT DISTINCT 
            vrl.census_tract, 
            ct.cvap_total,
            ct.cvap_white_alone,
            ct.cvap_black_alone,
            ct.cvap_asian_alone,
            ct.cvap_hispanic_or_latino,
            (ct.cvap_american_indian_alone + ct.cvap_pacific_islander_alone + ct.cvap_other_race_alone + ct.cvap_two_or_more_races) AS cvap_other_combined
          FROM GA_VOTER_REGISTRATION_LIST vrl
          INNER JOIN stg_processed_census_tract_data ct ON vrl.census_tract = ct.tract_id
          ${whereClause}
          AND ct.cvap_total IS NOT NULL AND ct.cvap_total > 0
        ),
        VotersByTract AS (
          SELECT vrl.census_tract, COUNT(*) as voter_count
          FROM GA_VOTER_REGISTRATION_LIST vrl
          ${whereClause}
          GROUP BY vrl.census_tract
        ),
        CVAPByRace AS (
          SELECT 
            'White' AS race_category,
            SUM(ROUND((vcd.cvap_white_alone::numeric / vcd.cvap_total::numeric) * vbt.voter_count)) AS estimated_voters
          FROM VoterCensusData vcd
          INNER JOIN VotersByTract vbt ON vcd.census_tract = vbt.census_tract
          UNION ALL
          SELECT 
            'Black' AS race_category,
            SUM(ROUND((vcd.cvap_black_alone::numeric / vcd.cvap_total::numeric) * vbt.voter_count)) AS estimated_voters
          FROM VoterCensusData vcd
          INNER JOIN VotersByTract vbt ON vcd.census_tract = vbt.census_tract
          UNION ALL
          SELECT 
            'Asian' AS race_category,
            SUM(ROUND((vcd.cvap_asian_alone::numeric / vcd.cvap_total::numeric) * vbt.voter_count)) AS estimated_voters
          FROM VoterCensusData vcd
          INNER JOIN VotersByTract vbt ON vcd.census_tract = vbt.census_tract
          UNION ALL
          SELECT 
            'Hispanic/Latino' AS race_category,
            SUM(ROUND((vcd.cvap_hispanic_or_latino::numeric / vcd.cvap_total::numeric) * vbt.voter_count)) AS estimated_voters
          FROM VoterCensusData vcd
          INNER JOIN VotersByTract vbt ON vcd.census_tract = vbt.census_tract
          UNION ALL
          SELECT 
            'Other Races' AS race_category,
            SUM(ROUND((vcd.cvap_other_combined::numeric / vcd.cvap_total::numeric) * vbt.voter_count)) AS estimated_voters
          FROM VoterCensusData vcd
          INNER JOIN VotersByTract vbt ON vcd.census_tract = vbt.census_tract
        )
        SELECT race_category AS label, estimated_voters AS count
        FROM CVAPByRace
        WHERE estimated_voters > 0
        ORDER BY count DESC
        LIMIT ${AGG_LIMIT}
      `;
      const results = await sql.unsafe(query);
      return results.map((row: any) => ({ label: row.label, count: Number(row.count) }));
    } catch (e) {
      console.error(`[voter/summary] Error querying cvap_demographics:`, e);
      return [];
    }
  })();

  // CVAP registration rates - comparison between CVAP and registered voters by race
  const cvapRegistrationRatesPromise = (async () => {
    try {
      const query = `
        WITH CensusTracts AS (
          -- Get unique tracts with CVAP data that have registered voters
          SELECT DISTINCT 
            ct.tract_id,
            ct.cvap_white_alone,
            ct.cvap_black_alone,
            ct.cvap_asian_alone,
            ct.cvap_hispanic_or_latino,
            (COALESCE(ct.cvap_american_indian_alone, 0) + 
             COALESCE(ct.cvap_pacific_islander_alone, 0) + 
             COALESCE(ct.cvap_other_race_alone, 0) + 
             COALESCE(ct.cvap_two_or_more_races, 0)) AS cvap_other_combined
          FROM stg_processed_census_tract_data ct
          INNER JOIN GA_VOTER_REGISTRATION_LIST vrl ON ct.tract_id = vrl.census_tract
          ${whereClause}
          WHERE ct.cvap_total IS NOT NULL AND ct.cvap_total > 0
        ),
        RegisteredVoters AS (
          -- Count registered voters by race in each tract
          SELECT 
            vrl.census_tract,
            COUNT(CASE WHEN vrl.race = 'WHITE' THEN 1 END) as registered_white,
            COUNT(CASE WHEN vrl.race = 'BLACK' THEN 1 END) as registered_black,
            COUNT(CASE WHEN vrl.race = 'ASIAN/PACIFIC ISLANDER' THEN 1 END) as registered_asian,
            COUNT(CASE WHEN vrl.race = 'HISPANIC/LATINO' THEN 1 END) as registered_hispanic,
            COUNT(CASE WHEN vrl.race IN ('AMERICAN INDIAN', 'ALASKAN NATIVE', 'OTHER', 'UNKNOWN') THEN 1 END) as registered_other
          FROM GA_VOTER_REGISTRATION_LIST vrl
          ${whereClause}
          GROUP BY vrl.census_tract
        ),
        RacialComparison AS (
          SELECT 
            'White' AS race_category,
            SUM(ct.cvap_white_alone) AS cvap_count,
            SUM(COALESCE(rv.registered_white, 0)) AS registered_count,
            1 AS sort_order
          FROM CensusTracts ct
          LEFT JOIN RegisteredVoters rv ON ct.tract_id = rv.census_tract
          WHERE ct.cvap_white_alone > 0
          
          UNION ALL
          
          SELECT 
            'Black' AS race_category,
            SUM(ct.cvap_black_alone) AS cvap_count,
            SUM(COALESCE(rv.registered_black, 0)) AS registered_count,
            2 AS sort_order
          FROM CensusTracts ct
          LEFT JOIN RegisteredVoters rv ON ct.tract_id = rv.census_tract
          WHERE ct.cvap_black_alone > 0
          
          UNION ALL
          
          SELECT 
            'Asian/Pacific Islander' AS race_category,
            SUM(ct.cvap_asian_alone) AS cvap_count,
            SUM(COALESCE(rv.registered_asian, 0)) AS registered_count,
            3 AS sort_order
          FROM CensusTracts ct
          LEFT JOIN RegisteredVoters rv ON ct.tract_id = rv.census_tract
          WHERE ct.cvap_asian_alone > 0
          
          UNION ALL
          
          SELECT 
            'Hispanic/Latino' AS race_category,
            SUM(ct.cvap_hispanic_or_latino) AS cvap_count,
            SUM(COALESCE(rv.registered_hispanic, 0)) AS registered_count,
            4 AS sort_order
          FROM CensusTracts ct
          LEFT JOIN RegisteredVoters rv ON ct.tract_id = rv.census_tract
          WHERE ct.cvap_hispanic_or_latino > 0
          
          UNION ALL
          
          SELECT 
            'Other Races' AS race_category,
            SUM(ct.cvap_other_combined) AS cvap_count,
            SUM(COALESCE(rv.registered_other, 0)) AS registered_count,
            5 AS sort_order
          FROM CensusTracts ct
          LEFT JOIN RegisteredVoters rv ON ct.tract_id = rv.census_tract
          WHERE ct.cvap_other_combined > 0
        ),
        FinalData AS (
          -- Create CVAP entries
          SELECT 
            race_category || ' - CVAP Eligible' AS label,
            cvap_count AS count,
            race_category,
            'cvap' AS data_type,
            sort_order * 2 - 1 AS final_sort
          FROM RacialComparison
          WHERE cvap_count > 0
          
          UNION ALL
          
          -- Create Registered entries
          SELECT 
            race_category || ' - Registered' AS label,
            registered_count AS count,
            race_category,
            'registered' AS data_type,
            sort_order * 2 AS final_sort
          FROM RacialComparison
          WHERE registered_count > 0
        )
        SELECT 
          label,
          count,
          race_category,
          data_type
        FROM FinalData
        WHERE count > 0
        ORDER BY final_sort
        LIMIT ${AGG_LIMIT}
      `;
      const results = await sql.unsafe(query);
      return results.map((row: any) => ({ 
        label: `${row.label}: ${Number(row.count).toLocaleString()}`, 
        count: Number(row.count),
        race_category: row.race_category,
        data_type: row.data_type
      }));
    } catch (e) {
      console.error(`[voter/summary] Error querying cvap_registration_rates:`, e);
      return [];
    }
  })();

  const [
    income_brackets,
    education_levels,
    unemployment_rates,
    population_density,
    cvap_demographics,
    cvap_registration_rates
  ] = await Promise.all([
    incomeBracketsPromise,
    educationLevelsPromise,
    unemploymentRatesPromise,
    populationDensityPromise,
    cvapDemographicsPromise,
    cvapRegistrationRatesPromise,
  ]);

  return { 
    income_brackets,
    education_levels,
    unemployment_rates,
    population_density,
    cvap_demographics,
    cvap_registration_rates
  };
}

// Add a new function for precinct aggregates
async function getPrecinctAggregates(whereClause: string, shouldQuery: boolean) {
  if (!shouldQuery) {
    return {
      county_precinct: [],
      municipal_precinct: [],
    };
  }

  // County Precincts with facility information
  const countyPrecinctPromise = (async () => {
    try {
      // REFERENCE_DATA contains facility information for precincts
      // Use JOIN to get facility data along with precinct counts
      const extraFilter = `(v.county_precinct IS NOT NULL AND TRIM(v.county_precinct) != '')`;
      const fullWhere = whereClause
        ? whereClause.replace(/^WHERE/i, `WHERE ${extraFilter} AND`)
        : `WHERE ${extraFilter}`;

      const query = `
        SELECT 
          COALESCE(rd.lookup_value, v.county_precinct) || ' (' || v.county_precinct || ')' AS label,
          COUNT(*) AS count,
          rd.lookup_meta->>'facility_name' AS facility_name,
          rd.lookup_meta->>'facility_address' AS facility_address
        FROM 
          GA_VOTER_REGISTRATION_LIST v
        LEFT JOIN 
          REFERENCE_DATA rd ON 
            rd.lookup_type = 'GA_COUNTY_PRECINCT_DESC' 
            AND rd.state_code = 'GA' 
            AND rd.county_code = v.county_code 
            AND rd.lookup_key = v.county_precinct
        ${fullWhere}
        GROUP BY 
          v.county_precinct, 
          rd.lookup_value,
          rd.lookup_meta->>'facility_name',
          rd.lookup_meta->>'facility_address'
        ORDER BY 
          count DESC
        LIMIT ${AGG_LIMIT}
      `;
      
      const results = await sql.unsafe(query);
      return results.map((row: any) => ({
        label: row.label,
        count: Number(row.count),
        facility_name: row.facility_name,
        facility_address: row.facility_address
      }));
    } catch (e) {
      console.error(`[voter/summary] Error querying county_precinct:`, e);
      return [];
    }
  })();

  // Municipal Precincts with facility information
  const municipalPrecinctPromise = (async () => {
    try {
      // Similar query for municipal precincts
      const extraFilter = `(v.municipal_precinct IS NOT NULL AND TRIM(v.municipal_precinct) != '')`;
      const fullWhere = whereClause
        ? whereClause.replace(/^WHERE/i, `WHERE ${extraFilter} AND`)
        : `WHERE ${extraFilter}`;

      const query = `
        SELECT 
          COALESCE(rd.lookup_value, v.municipal_precinct) || ' (' || v.municipal_precinct || ')' AS label,
          COUNT(*) AS count,
          rd.lookup_meta->>'facility_name' AS facility_name,
          rd.lookup_meta->>'facility_address' AS facility_address
        FROM 
          GA_VOTER_REGISTRATION_LIST v
        LEFT JOIN 
          REFERENCE_DATA rd ON 
            rd.lookup_type = 'GA_MUNICIPAL_PRECINCT_DESC' 
            AND rd.state_code = 'GA' 
            AND rd.county_code = v.county_code 
            AND rd.lookup_key = v.municipal_precinct
        ${fullWhere}
        GROUP BY 
          v.municipal_precinct, 
          rd.lookup_value,
          rd.lookup_meta->>'facility_name',
          rd.lookup_meta->>'facility_address'
        ORDER BY 
          count DESC
        LIMIT ${AGG_LIMIT}
      `;
      
      const results = await sql.unsafe(query);
      return results.map((row: any) => ({
        label: row.label,
        count: Number(row.count),
        facility_name: row.facility_name,
        facility_address: row.facility_address
      }));
    } catch (e) {
      console.error(`[voter/summary] Error querying municipal_precinct:`, e);
      return [];
    }
  })();

  const [county_precinct, municipal_precinct] = await Promise.all([
    countyPrecinctPromise,
    municipalPrecinctPromise,
  ]);

  return { county_precinct, municipal_precinct };
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
    const shouldQueryPrecincts = !section || section === 'precincts';
    const shouldQueryCensus = !section || section === 'census';
    // TODO: Add flags for other sections

    // Get aggregates for each section
    const votingInfo = await getVotingInfoAggregates(whereClause, shouldQueryVotingInfo);
    const districts = await getDistrictsAggregates(whereClause, shouldQueryDistricts);
    const demographics = await getDemographicsAggregates(whereClause, shouldQueryDemographics);
    const voting_history = await getVotingHistoryAggregates(whereClause, shouldQueryVotingHistory);
    const precincts = await getPrecinctAggregates(whereClause, shouldQueryPrecincts);
    const census = await getCensusAggregates(whereClause, shouldQueryCensus);
    // TODO: Call other section functions

    // --- Assemble response ---
    const response: Partial<VoterSummaryResponse> & { timestamp: string } = {
      voting_info: votingInfo,
      districts: districts,
      demographics: demographics,
      voting_history: voting_history,
      precincts: precincts,
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