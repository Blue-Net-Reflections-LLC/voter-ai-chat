import { NextResponse } from 'next/server';
import { sql } from '@/lib/voter/db'; // Direct import of the postgres client
import { buildVoterListWhereClause } from '@/lib/voter/build-where-clause';

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
];

// --- Type Definitions ---
type FilterValues = Record<string, string[]>;
type FilterCombination = Record<string, string>;
type ExtractionResult = { filters: FilterValues } | { error: string };
type YearCountMap = Record<number, number>;

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

// --- API Route Handler ---

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chartType = searchParams.get('chartType');

  if (chartType !== 'demographicRatioOverTime') {
    return NextResponse.json({ message: 'Invalid chart type requested.' }, { status: 400 });
  }

  const extractionResult = extractAllowedFilters(searchParams);
  if ('error' in extractionResult) { // Type guard to check for error
      return NextResponse.json({
          message: extractionResult.error,
          allowedFilters: ALLOWED_COMBO_FILTER_KEYS
      }, { status: 400 });
  }

  const filters = extractionResult.filters;
  if (Object.keys(filters).length === 0) {
    return NextResponse.json({
      message: "Please select filter options to generate the chart."
    }, { status: 400 });
  }

  const combinations = generateFilterCombinations(filters);
  if (combinations.length === 0) {
     return NextResponse.json({ message: 'No valid filter combinations generated.' }, { status: 400 });
  }

  const years = [2004, 2006, 2008, 2010, 2012, 2014, 2016, 2018, 2020, 2022, 2024];

  try {
    // Fetch total counts first (can potentially be cached/precomputed)
    const totalsByYear = await getTotalVotersByYear(years);

    // Fetch counts for each combination in parallel
    const seriesDataPromises = combinations.map(combo => getCountsForCombination(years, combo));
    const seriesResults = await Promise.all(seriesDataPromises);

    // Format the response
    const responseSeries = seriesResults.map((data: YearCountMap, index: number) => {
      const combo = combinations[index];
      return {
        name: formatCombinationName(combo),
        filters: combo,
        data: years.map(year => {
          const count = data[year] || 0;
          const total = totalsByYear[year] || 0;
          // Return null if total is 0, otherwise calculate ratio
          return total > 0 ? (count / total) : null;
        })
      };
    });

    return NextResponse.json({
      years,
      series: responseSeries
    });

  } catch (error) {
    console.error("Error fetching chart data:", error);
    return NextResponse.json({ message: 'Internal Server Error fetching chart data.' }, { status: 500 });
  }
} 