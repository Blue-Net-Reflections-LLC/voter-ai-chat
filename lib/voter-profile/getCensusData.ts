import { sql } from '@/lib/voter/db';

// Census API key
const CENSUS_API_KEY = '03daa05a0a25133bea51761e8871b479f9fc0e40';

// Helper function to fetch data from Census API
async function fetchCensusData(censusTractId: string, tableId: string) {
  try {
    // Format the census tract ID for the API request (needs to be prefixed with 1400000US)
    const formattedTractId = `1400000US${censusTractId}`;
    
    // Subject tables (like S2301) need a different endpoint structure
    const isSubjectTable = tableId.startsWith('S');
    const endpoint = isSubjectTable
      ? `https://api.census.gov/data/2023/acs/acs5/subject?get=group(${tableId})&ucgid=${formattedTractId}&key=${CENSUS_API_KEY}`
      : `https://api.census.gov/data/2023/acs/acs5?get=group(${tableId})&ucgid=${formattedTractId}&key=${CENSUS_API_KEY}`;
    
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`Census API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching census data (${tableId}):`, error);
    throw error;
  }
}

/**
 * Fetches Census data for a voter based on their census tract.
 * Integrates with Census API (ACS 5-Year Subject Tables) to fetch education and income data.
 */
export async function getCensusData(registration_number: string) {
  try {
    // Fetch the voter's census tract information
    const voterResult = await sql`
      SELECT census_tract
      FROM ga_voter_registration_list
      WHERE voter_registration_number = ${registration_number}
      LIMIT 1;
    `;

    if (voterResult.length === 0) {
      throw new Error('Voter not found');
    }

    const voter = voterResult[0];
    const censusTractId = voter.census_tract;
    
    // If no census tract is available, return appropriate response
    if (!censusTractId) {
      return {
        census: {
          available: false,
          message: "Census tract information not available for this voter"
        }
      };
    }

    // Fetch local census data from our processed table (includes CVAP data)
    const localCensusResult = await sql`
      SELECT 
        total_population,
        pop_white_alone,
        pop_black_alone,
        pop_asian_alone,
        pop_american_indian_alone,
        pop_pacific_islander_alone,
        pop_other_race_alone,
        cvap_total,
        cvap_white_alone,
        cvap_black_alone,
        cvap_asian_alone,
        cvap_american_indian_alone,
        cvap_pacific_islander_alone,
        cvap_other_race_alone,
        cvap_two_or_more_races,
        cvap_hispanic_or_latino,
        cvap_white_alone_not_hispanic,
        median_household_income,
        pct_bachelors_degree_or_higher,
        labor_force_participation_rate,
        unemployment_rate,
        employment_rate,
        cvap_data_year,
        cvap_data_source,
        decennial_data_year
      FROM stg_processed_census_tract_data
      WHERE tract_id = ${censusTractId}
      LIMIT 1;
    `;

    const localCensusData = localCensusResult[0] || null;
    
    // Fetch education attainment data (B15003)
    const educationData = await fetchCensusData(censusTractId, 'B15003');
    
    // Fetch median household income data (B19013) - but prefer local data if available
    const incomeData = await fetchCensusData(censusTractId, 'B19013');
    
    // Fetch employment data (S2301) - but prefer local data if available
    const employmentData = await fetchCensusData(censusTractId, 'S2301');
    
    // Process education data
    // The Census API returns data as array of arrays, where first array contains headers
    const headers = educationData[0];
    const values = educationData[1];
    
    // Create a map of variable names to values
    const educationMap = headers.reduce((acc: Record<string, any>, header: string, index: number) => {
      acc[header] = values[index];
      return acc;
    }, {});
    
    // Total population 25 years and over (denominator for percentages)
    const totalPopulation = Number(educationMap['B15003_001E']) || 0;
    
    // Extract key education metrics
    const highSchoolGraduate = Number(educationMap['B15003_017E']) || 0;
    const someCollege1 = Number(educationMap['B15003_018E']) || 0;
    const someCollege2 = Number(educationMap['B15003_019E']) || 0;
    const someCollege3 = Number(educationMap['B15003_020E']) || 0;
    const associatesDegree = Number(educationMap['B15003_021E']) || 0;
    const bachelorsDegree = Number(educationMap['B15003_022E']) || 0;
    const mastersDegree = Number(educationMap['B15003_023E']) || 0;
    const professionalDegree = Number(educationMap['B15003_024E']) || 0;
    const doctorateDegree = Number(educationMap['B15003_025E']) || 0;
    
    // Calculate aggregated metrics
    const totalSomeCollege = someCollege1 + someCollege2 + someCollege3;
    const totalGraduateDegrees = mastersDegree + professionalDegree + doctorateDegree;
    
    // Calculate percentages if total population > 0
    const calculatePercentage = (value: number) => 
      totalPopulation > 0 ? (value / totalPopulation) * 100 : 0;
    
    // Process income data - prefer local data if available
    const incomeHeaders = incomeData[0];
    const incomeValues = incomeData[1];
    
    // Map income data
    const incomeMap = incomeHeaders.reduce((acc: Record<string, any>, header: string, index: number) => {
      acc[header] = incomeValues[index];
      return acc;
    }, {});
    
    // Extract median household income - prefer local data
    const medianHouseholdIncome = localCensusData?.median_household_income || Number(incomeMap['B19013_001E']) || 0;
    
    // Process employment data - prefer local data if available
    const employmentHeaders = employmentData[0];
    const employmentValues = employmentData[1];
    
    // Map employment data
    const employmentMap = employmentHeaders.reduce((acc: Record<string, any>, header: string, index: number) => {
      acc[header] = employmentValues[index];
      return acc;
    }, {});
    
    // Use local employment data if available, otherwise fall back to API data
    let laborForceParticipationRate: number;
    let unemploymentRate: number;
    let employmentRate: number;
    
    if (localCensusData?.labor_force_participation_rate !== null) {
      laborForceParticipationRate = Number(localCensusData.labor_force_participation_rate) || 0;
      unemploymentRate = Number(localCensusData.unemployment_rate) || 0;
      employmentRate = Number(localCensusData.employment_rate) || 0;
    } else {
      // Fall back to API data
      if (employmentMap['S2301_C02_001E']) {
        laborForceParticipationRate = Number(employmentMap['S2301_C02_001E']) || 0;
      } else {
        laborForceParticipationRate = 72.8; // Fallback
      }
      
      unemploymentRate = Number(employmentMap['S2301_C04_001E']) || 0;
      employmentRate = 100 - unemploymentRate;
    }
    
    // Return formatted census data with population and CVAP data
    return {
      census: {
        available: true,
        tract: censusTractId,
        source: "American Community Survey (ACS) 5-Year Estimates",
        year: "2023",
        // Add population data section
        population: localCensusData ? {
          total: Number(localCensusData.total_population) || 0,
          source: localCensusData.decennial_data_year || "2020 Decennial Census",
          byRace: {
            white: Number(localCensusData.pop_white_alone) || 0,
            black: Number(localCensusData.pop_black_alone) || 0,
            asian: Number(localCensusData.pop_asian_alone) || 0,
            americanIndian: Number(localCensusData.pop_american_indian_alone) || 0,
            pacificIslander: Number(localCensusData.pop_pacific_islander_alone) || 0,
            other: Number(localCensusData.pop_other_race_alone) || 0
          }
        } : null,
        // Add CVAP data section
        cvap: localCensusData ? {
          total: Number(localCensusData.cvap_total) || 0,
          source: localCensusData.cvap_data_source || "Census Bureau CVAP",
          year: localCensusData.cvap_data_year || "2019-2023",
          byRace: {
            white: Number(localCensusData.cvap_white_alone) || 0,
            black: Number(localCensusData.cvap_black_alone) || 0,
            asian: Number(localCensusData.cvap_asian_alone) || 0,
            americanIndian: Number(localCensusData.cvap_american_indian_alone) || 0,
            pacificIslander: Number(localCensusData.cvap_pacific_islander_alone) || 0,
            other: Number(localCensusData.cvap_other_race_alone) || 0,
            twoOrMore: Number(localCensusData.cvap_two_or_more_races) || 0,
            hispanic: Number(localCensusData.cvap_hispanic_or_latino) || 0,
            whiteNonHispanic: Number(localCensusData.cvap_white_alone_not_hispanic) || 0
          }
        } : null,
        education: {
          totalPopulation,
          highSchoolGraduate: {
            count: highSchoolGraduate,
            percentage: calculatePercentage(highSchoolGraduate)
          },
          someCollege: {
            count: totalSomeCollege,
            percentage: calculatePercentage(totalSomeCollege)
          },
          associatesDegree: {
            count: associatesDegree,
            percentage: calculatePercentage(associatesDegree)
          },
          bachelorsDegree: {
            count: bachelorsDegree,
            percentage: calculatePercentage(bachelorsDegree)
          },
          graduateDegrees: {
            count: totalGraduateDegrees,
            percentage: calculatePercentage(totalGraduateDegrees)
          },
          // Higher education summary (bachelor's degree or higher)
          higherEducation: {
            count: bachelorsDegree + totalGraduateDegrees,
            percentage: calculatePercentage(bachelorsDegree + totalGraduateDegrees)
          }
        },
        income: {
          medianHouseholdIncome
        },
        employment: {
          laborForceParticipationRate,
          employmentRate,
          unemploymentRate
        }
      }
    };
  } catch (error) {
    console.error('Error in getCensusData:', error);
    
    // Return graceful error for UI
    return {
      census: {
        available: false,
        message: error instanceof Error ? error.message : 'Error fetching census data',
        error: true
      }
    };
  }
} 