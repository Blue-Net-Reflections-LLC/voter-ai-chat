import { NextResponse } from 'next/server';
import { sql } from '@/lib/voter/db'; // Direct import of the postgres client
import { buildVoterListWhereClause } from '@/lib/voter/build-where-clause';
import { SCORE_RANGES } from "@/lib/participation-score/constants"; // Import for score range grouping

// Define allowed filter keys based on ga-charting.md
const ALLOWED_COMBO_FILTER_KEYS: string[] = [
  'county',
  'congressionalDistricts',
  'stateSenateDistricts',
  'stateHouseDistricts',
  'status',
  'statusReason',
  'eventParty',
  'ageRange',
  'gender',
  'race',
  'electionType',
  'ballotStyle',
  'countyPrecinct',
  'municipalPrecinct',
];

// Allowed groupBy fields for Snapshot chart
const ALLOWED_SNAPSHOT_GROUP_BY_FIELDS: string[] = [
    'county',
    'status',
    'statusReason',
    'gender',
    'race',
    'party', // Uses last_party_voted
    'voterEventMethod', // Requires special handling
    'participationScoreRange', // Requires special handling
    'neverVoted', // Requires special handling
    'ageRange', // Requires special handling
    'countyPrecinct',
    'municipalPrecinct'
];

// --- Type Definitions ---
type FilterValues = Record<string, string[]>;
type FilterCombination = Record<string, string>;
type ExtractionResult = { filters: FilterValues } | { error: string };
type YearCountMap = Record<number, number>;

interface SnapshotResult {
    category: string | number | boolean | null;
    count: number;
}

// --- Helper Functions ---

function extractAllowedFilters(searchParams: URLSearchParams): ExtractionResult {
  const filters: FilterValues = {};
  let invalidKey: string | null = null;

  // Check for invalid keys first (except chartType)
  for (const key of searchParams.keys()) {
    if (!ALLOWED_COMBO_FILTER_KEYS.includes(key) && key !== 'chartType') {
      invalidKey = key;
      break; // Stop at the first invalid key
    }
  }

  if (invalidKey) {
    return { error: `Invalid filter key: ${invalidKey}` };
  }

  // Extract allowed filters if no invalid keys found
  ALLOWED_COMBO_FILTER_KEYS.forEach(key => {
    // Get all values for the key (handles multiple entries of the same key)
    const values = searchParams.getAll(key);
    if (values.length > 0) {
      filters[key] = values;
    }
  });

  return { filters };
}

function generateFilterCombinations(filters: FilterValues): FilterCombination[] {
  const keys = Object.keys(filters);
  if (keys.length === 0) return [{}];

  const combinations: FilterCombination[] = [];
  const firstKey = keys[0];
  const remainingKeys = keys.slice(1);

  filters[firstKey].forEach(value => {
    const baseCombo: FilterCombination = { [firstKey]: value };
    if (remainingKeys.length === 0) {
      combinations.push(baseCombo);
    } else {
      const remainingFilters: FilterValues = {};
      remainingKeys.forEach(key => { remainingFilters[key] = filters[key]; });
      const subCombinations = generateFilterCombinations(remainingFilters);
      subCombinations.forEach(subCombo => {
        combinations.push({ ...baseCombo, ...subCombo });
      });
    }
  });
  return combinations;
}

async function getCountsForCombination(years: number[], combination: FilterCombination): Promise<YearCountMap> {
  // Create temporary URLSearchParams to use with buildVoterListWhereClause
  const params = new URLSearchParams();
  
  // Add each filter key-value pair to the URLSearchParams
  Object.entries(combination).forEach(([key, value]) => {
    // Convert value to uppercase since DB stores values in uppercase
    const uppercaseValue = typeof value === 'string' ? value.toUpperCase() : value;
    params.append(key, uppercaseValue);
  });
  
  // Use the shared function to build the WHERE clause
  const whereClause = buildVoterListWhereClause(params);
  const yearsValues = years.map(y => `(${y})`).join(', ');

  // Build the query using the WHERE clause (remove "WHERE " prefix if present)
  const whereConditions = whereClause.startsWith('WHERE ') ? whereClause.substring(6) : whereClause;
  
  // Use postgres.js for the query with the WHERE clause
  const query = `
    WITH years(year) AS (VALUES ${yearsValues})
    SELECT
      y.year,
      COUNT(*) AS count
    FROM years y
    CROSS JOIN ga_voter_registration_list v
    WHERE ${whereConditions || 'TRUE'}
      AND y.year = ANY(v.participated_election_years)
    GROUP BY y.year
    ORDER BY y.year
  `;

  try {
    // Execute query
    const result = await sql.unsafe(query);
    
    return result.reduce<YearCountMap>((acc: YearCountMap, row: any) => {
      acc[row.year] = parseInt(String(row.count), 10);
      return acc;
    }, {});
  } catch (error) {
    console.error("Error executing counts query for combination:", combination, error);
    return {}; // Return empty object on error for this combo
  }
}

function formatCombinationName(combination: FilterCombination): string {
  return Object.entries(combination)
    .map(([key, value]) => `${key.replace(/([A-Z])/g, ' $1')}: ${value}`) // Add spaces before caps
    .join(', ');
}

// Simple memoization cache
const memoCache: Record<string, any> = {};

// Simple memoized function wrapper
function memoize<T, R>(fn: (...args: T[]) => Promise<R>): (...args: T[]) => Promise<R> {
  return async (...args: T[]): Promise<R> => {
    const key = JSON.stringify(args);
    if (key in memoCache) {
      return memoCache[key];
    }
    const result = await fn(...args);
    memoCache[key] = result;
    return result;
  };
}

// Original implementation without memoization
async function _getTotalVotersByYear(years: number[]): Promise<YearCountMap> {
  const yearsValues = years.map(y => `(${y})`).join(', ');
  const query = `
      WITH years(year) AS (VALUES ${yearsValues})
      SELECT
        y.year,
        COUNT(*) AS total_count
      FROM years y
      CROSS JOIN ga_voter_registration_list v
      WHERE y.year = ANY(v.participated_election_years)
      GROUP BY y.year
      ORDER BY y.year
  `;
  
  try {
      // Execute query directly with sql client
      const result = await sql.unsafe(query);
      
      const totalsMap: YearCountMap = {};
      years.forEach(y => { totalsMap[y] = 0; });
      
      result.forEach((row: any) => {
          totalsMap[row.year] = parseInt(String(row.total_count), 10);
      });
      
      return totalsMap;
  } catch (error) {
      console.error("Error executing total counts query:", error);
      return years.reduce((acc, year) => {
          acc[year] = 0;
          return acc;
      }, {} as YearCountMap);
  }
}

// Memoized version
const getTotalVotersByYear = memoize(_getTotalVotersByYear);

// Function to get the SQL expression for grouping
function getSnapshotGroupBySQLExpression(groupByField: string): string {
    const currentYear = new Date().getFullYear();
    switch (groupByField) {
        case 'county': return 'UPPER(county_name)';
        case 'status': return 'UPPER(status)';
        case 'statusReason': return 'UPPER(status_reason)';
        case 'gender': return 'UPPER(gender)';
        case 'race': return 'UPPER(race)';
        case 'party': return 'UPPER(last_party_voted)';
        case 'countyPrecinct': return 'UPPER(county_precinct)';
        case 'municipalPrecinct': return 'UPPER(municipal_precinct)';
        case 'neverVoted': return '(derived_last_vote_date IS NULL)'; // Results in TRUE/FALSE categories
        case 'ageRange':
            // Using CASE statement to bucket birth years into age ranges
            return `CASE 
                        WHEN birth_year <= ${currentYear - 75} THEN '75+' 
                        WHEN birth_year <= ${currentYear - 65} THEN '65-74' 
                        WHEN birth_year <= ${currentYear - 45} THEN '45-64' 
                        WHEN birth_year <= ${currentYear - 25} THEN '25-44' 
                        WHEN birth_year <= ${currentYear - 18} THEN '18-24' -- Note: adjusted range slightly for simplicity
                        ELSE 'Under 18 / Invalid' 
                    END`;
        case 'participationScoreRange':
            // Build a CASE statement based on imported SCORE_RANGES
            let scoreCaseStatement = 'CASE ';
            SCORE_RANGES.forEach(range => {
                 if (range.min === 10.0 && range.max === 10.0) {
                     scoreCaseStatement += `WHEN participation_score = ${range.min} THEN '${range.label}' `;
                 } else {
                     scoreCaseStatement += `WHEN participation_score >= ${range.min} AND participation_score <= ${range.max} THEN '${range.label}' `;
                 }
            });
            scoreCaseStatement += "ELSE 'N/A' END";
            return scoreCaseStatement;
        case 'voterEventMethod':
            // This requires unnesting and needs a different query structure later
            return 'REQUIRES_JSON_UNNESTING'; // Placeholder
        default:
            throw new Error(`Invalid groupByField: ${groupByField}`); // Should be caught by earlier validation
    }
}

// *** NEW Helper Function for Combination Counts ***
async function getTotalCountForCombination(
    combination: FilterCombination,
    baseSearchParams: URLSearchParams // Pass original params for non-combo filters
): Promise<number> {
    // Create new params: start with base (for non-combo filters like ageMin etc.)
    // then add the specific filters for this combination
    const paramsForQuery = new URLSearchParams(baseSearchParams);
    
    // Remove combo keys from base params to avoid potential duplication if they were also passed generally
    ALLOWED_COMBO_FILTER_KEYS.forEach(key => paramsForQuery.delete(key));
    
    // Add the specific filters for this combination
    Object.entries(combination).forEach(([key, value]) => {
        // Conversion to uppercase might happen in buildVoterListWhereClause, 
        // but explicit here ensures consistency if buildWhereClause changes
        const uppercaseValue = typeof value === 'string' ? value.toUpperCase() : value;
        paramsForQuery.append(key, uppercaseValue);
    });

    // Use the shared function to build the WHERE clause
    const whereClause = buildVoterListWhereClause(paramsForQuery);

    // Build the simple COUNT query
    const query = `
        SELECT COUNT(*) as count
        FROM ga_voter_registration_list v
        ${whereClause};
    `;

    try {
        // Execute query
        const result = await sql.unsafe(query);
        return result[0] ? Number(result[0].count) : 0;
    } catch (error) {
        console.error("Error executing total count query for combination:", combination, error);
        return 0; // Return 0 on error for this combo
    }
}

// --- API Route Handler ---

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chartType = searchParams.get('chartType');

  // --- Chart Type Validation ---
  const validChartTypes = ['demographicRatioOverTime', 'voterCountsOverTime', 'voterCombinationCounts']; // Added new type
  if (!chartType || !validChartTypes.includes(chartType)) {
    return NextResponse.json({ message: 'Invalid or missing chartType parameter.' }, { status: 400 });
  }

  // --- Logic for Combination-Based Charts (Over Time and Combination Counts) ---
  if (chartType === 'demographicRatioOverTime' || chartType === 'voterCountsOverTime' || chartType === 'voterCombinationCounts') {
    
    // Filter validation and extraction specifically for Combination charts
    const extractionResult = extractAllowedFilters(searchParams); 
    if ('error' in extractionResult) {
      return NextResponse.json({
          message: extractionResult.error,
          allowedFilters: ALLOWED_COMBO_FILTER_KEYS 
      }, { status: 400 });
    }
    const filtersForCombos = extractionResult.filters;
    
    // Check if any combo filters were actually provided
    if (Object.keys(filtersForCombos).length === 0) {
        return NextResponse.json({
          message: "Please select filter options (e.g., Race, Gender, Status) to generate combinations."
        }, { status: 400 });
      }
      
    const combinations = generateFilterCombinations(filtersForCombos);
    if (combinations.length === 0) {
        return NextResponse.json({ message: 'No valid filter combinations generated.' }, { status: 400 });
    }

    // --- Specific logic branch --- 

    // Combination Counts Logic (No Time Dimension)
    if (chartType === 'voterCombinationCounts') {
        try {
            // Fetch total count for each combination in parallel
            const countPromises = combinations.map(combo => 
                getTotalCountForCombination(combo, searchParams) // Pass original searchParams
            );
            const counts = await Promise.all(countPromises);

            // Format the response
            const results = combinations.map((combo, index) => ({
                name: formatCombinationName(combo),
                filters: combo,
                count: counts[index]
            }));

            // Calculate optional total combined count
            const totalCombinedCount = counts.reduce((sum, count) => sum + count, 0);

            // *** Return Combination Counts Response ***
            return NextResponse.json({
                results: results,
                totalCombinedCount: totalCombinedCount // Optional
            });

        } catch (error) {
            console.error("Error fetching voterCombinationCounts data:", error);
            // *** Return Combination Counts Error Response ***
            return NextResponse.json({ message: 'Internal Server Error fetching combination counts data.' }, { status: 500 });
        }
    }

    // Over Time Logic (Existing)
    else { // Must be demographicRatioOverTime or voterCountsOverTime
        const years = [2004, 2006, 2008, 2010, 2012, 2014, 2016, 2018, 2020, 2022, 2024];
        try {
            // Fetch counts for each combination *over time*
            const seriesDataPromises = combinations.map(combo => getCountsForCombination(years, combo)); // Uses original helper
            const seriesResults = await Promise.all(seriesDataPromises);

            // Fetch total counts ONLY if needed for Ratio chart
            let totalsByYear: YearCountMap = {}; 
            if (chartType === 'demographicRatioOverTime') {
                totalsByYear = await getTotalVotersByYear(years);
            }

            // Format the response based on chart type
            const responseSeries = seriesResults.map((data: YearCountMap, index: number) => {
              const combo = combinations[index];
              const name = formatCombinationName(combo);
              const comboFilters = combo; 

              const seriesChartData = years.map(year => {
                const count = data[year] || 0;
                
                if (chartType === 'demographicRatioOverTime') {
                  const total = totalsByYear[year] || 0;
                  return total > 0 ? (count / total) : null;
                } else { // voterCountsOverTime
                  return count > 0 ? count : null; 
                }
              });

              return {
                name: name,
                filters: comboFilters,
                data: seriesChartData
              };
            });
            
            // *** Return Over Time Response ***
            return NextResponse.json({
              years,
              series: responseSeries
            });

        } catch (error) {
            console.error("Error fetching over time chart data:", error);
            // *** Return Over Time Error Response ***
            return NextResponse.json({ message: 'Internal Server Error fetching over time chart data.' }, { status: 500 });
        }
    } // End of Over Time Logic

  } // --- End of Combination-Based Charts Logic Block ---

 // Fallback if chartType was valid but no block handled it (shouldn't happen)
 return NextResponse.json({ message: 'Unhandled valid chart type.' }, { status: 500 });

} // --- End of GET function --- 