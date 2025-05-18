import { sql } from '@/lib/voter/db'; // Corrected import
import { RACE_OPTIONS, GENDER_OPTIONS, AGE_RANGE_OPTIONS } from '@/app/ga/voter/list/constants';

// import type { TurnoutAnalysisRequestBody, ReportData, ChartData } from './turnoutAnalysisServiceTypes'; // Removed this line

// Define types for the service layer output (can be refined as we build the actual queries)
// These might be slightly different from the final API response structure, 
// as the API route can do final transformations.

// Re-defining here for clarity, or they can be imported if already defined centrally
// For now, let's assume they are defined in a shared types file or defined below.

// Updated to match ApiGeographySelection from page.tsx
interface GeographySelection {
    areaType: 'County' | 'District' | 'ZipCode';
    areaValue: string;
    districtType?: 'Congressional' | 'StateSenate' | 'StateHouse';
    // Sub-area type for breaking down the selected County/District.
    // This is NOT for filtering the main area, but for defining the granularity of results.
    // Filtering by sub-area (e.g. a specific precinct) will be handled by the main areaType/areaValue logic
    // if we decide to support direct querying of a single precinct later.
    // For now, this primarily informs getGeoGroupingColumnSQL.
    subAreaType?: 'Precinct' | 'Municipality' | 'ZipCode'; 
    subAreaValue?: string; // Only if subAreaType is specified
}

interface ValidatedTurnoutAnalysisParams {
    geography: {
        areaType: 'County' | 'District' | 'ZipCode';
        areaValue: string;
        districtType?: 'Congressional' | 'StateSenate' | 'StateHouse';
        subAreaType?: 'Precinct' | 'Municipality' | 'ZipCode';
        subAreaValue?: string;
    };
    electionDate: string; // YYYY-MM-DD
    reportDataPoints: Array<'Race' | 'Gender' | 'AgeRange'>;
    chartDataPoint?: 'Race' | 'Gender' | 'AgeRange' | null;
    includeCensusData: boolean;
    outputType: 'report' | 'chart';
}

// This will eventually be the detailed structure returned by database queries
interface ProcessedReportRow {
    geoLabel: string;
    totalRegistered: number;
    totalVoted: number;
    overallTurnoutRate: number;
    breakdowns: Record<string, { registered: number; voted: number; turnout: number }>;
    censusData?: Record<string, any>;
}

interface ProcessedChartRow {
    geoLabel: string;
    summedDemographicTurnoutRate?: number;
    segments?: Array<{ label: string; turnoutRate: number; color: string }>; // Color might be added later by frontend or predefined
    overallTurnoutRate?: number; // For basic bar chart
}

// New payload type where report and chart are optional
interface ProcessedTurnoutPayload {
    report?: {
        rows: ProcessedReportRow[];
        aggregations: {
            averageOverallTurnoutRate: number;
            grandTotalVoted: number;
        };
    };
    chart?: {
        type: 'stackedRow' | 'bar';
        rows: ProcessedChartRow[];
        xAxisMax: number;
    };
    // We can add a field to echo back the outputType if helpful for frontend
    // generatedOutputType?: 'report' | 'chart'; 
}

// Define categories for breakdowns
// Updated to use values from constants.ts
const RACE_CATEGORIES = RACE_OPTIONS.map(option => option.value); // ['White', 'Black', 'Hispanic', 'Asian', 'Other']
const GENDER_CATEGORIES = GENDER_OPTIONS.map(option => option.value); // ['Male', 'Female', 'Other']
const AGE_RANGE_CATEGORIES_DEF = {
    '18-23': { min: 18, max: 23 },
    '25-44': { min: 25, max: 44 },
    '45-64': { min: 45, max: 64 },
    '65-74': { min: 65, max: 74 },
    '75+': { min: 75, max: Infinity },
};
const AGE_RANGE_KEYS = AGE_RANGE_OPTIONS.map(option => option.value);

// Color palettes for chart segments
const RACE_COLORS = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'];
const GENDER_COLORS = ['#17becf', '#bcbd22', '#e377c2'];
const AGE_RANGE_COLORS = ['#7f7f7f', '#c7c7c7', '#f7b6d2', '#dbdb8d', '#9edae5', '#aec7e8'];

// Map county names to county codes - we'll use this for more reliable filtering
const COUNTY_CODE_MAP: Record<string, string> = {
    'Cobb': '067',
    'Fulton': '121',
    'DeKalb': '089',
    'Gwinnett': '135',
    'Clayton': '063',
    // Add other counties as needed
};

// Mapping from RACE_OPTIONS.value (from constants.ts) to SQL comparison string
// These are the literal strings that will be used in UPPER(vrl.race) = '...'
const GA_SQL_RACE_CATEGORIES_MAP: Record<string, string> = {
  'White': 'WHITE',
  'Black': 'BLACK',
  'Hispanic': 'HISPANIC/LATINO', // Maps 'Hispanic' from constants to 'HISPANIC/LATINO' for SQL
  'Asian': 'ASIAN/PACIFIC ISLANDER', // Maps 'Asian' from constants to 'ASIAN/PACIFIC ISLANDER' for SQL
  'Other': 'OTHER',
  // If constants.ts had an 'Unknown' or other specific race values, they would be mapped here too
};

const GA_SQL_RACE_ALIASES_PREFIX = 'race_breakdown_';

// Helper function to generate consistent SQL column aliases for race breakdown stats
function getSqlRaceAliases(sqlRaceCategoryValueForComparison: string): { registered: string, voted: string, turnout: string } {
    // Create a safe suffix for aliases from the SQL category value (e.g., HISPANIC/LATINO -> hispanic_latino)
    const suffix = sqlRaceCategoryValueForComparison.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_|_$/g, '');
    return {
        registered: `${GA_SQL_RACE_ALIASES_PREFIX}registered_${suffix}`,
        voted: `${GA_SQL_RACE_ALIASES_PREFIX}voted_${suffix}`,
        turnout: `${GA_SQL_RACE_ALIASES_PREFIX}turnout_${suffix}`
    };
}

// Helper to build the WHERE clause for geography
function buildGeoFilterCondition(
    geography: GeographySelection,
    voterTableAlias: string = 'vrl' 
): string {
    const conditions: string[] = [];
    const { areaType, areaValue, districtType } = geography;

    if (areaValue === "ALL") {
        return "1=1"; // No specific primary geographic filter
    }

    if (areaType === 'County') {
        conditions.push(`UPPER(${voterTableAlias}.county_name) = UPPER('${areaValue}')`);
    } else if (areaType === 'District') {
        if (!districtType || !areaValue) {
            console.error("District type and value are required for District areaType filtering.");
            return "1 = 0";
        }
        let districtColumn = '';
        switch (districtType) {
            case 'Congressional':
                districtColumn = 'congressional_district';
                break;
            case 'StateSenate':
                districtColumn = 'state_senate_district';
                break;
            case 'StateHouse':
                districtColumn = 'state_house_district';
                break;
            default:
                console.error(`Unknown district type: ${districtType}`);
                return "1 = 0";
        }
        conditions.push(`${voterTableAlias}.${districtColumn} = '${areaValue}'`); 
    }

    if (conditions.length === 0) {
        console.error("Could not build specific geography filter for:", geography);
        return "1 = 0";
    }
    return conditions.join(' AND ');
}

// Helper to determine the grouping column for SQL queries
function getGeoGroupingColumnSQL(
    geography: GeographySelection,
    voterTableAlias: string = 'vrl'
): string {
    const { areaType, areaValue, districtType, subAreaType } = geography;

    // If a secondary breakdown is specified, that takes precedence for grouping.
    if (subAreaType) {
        switch (subAreaType) {
            case 'Precinct':
                // Assuming precincts are identified by county_precinct. 
                // This might need adjustment if precinct IDs are global or structured differently.
                return `${voterTableAlias}.county_precinct`; 
            case 'Municipality':
                // Assuming municipalities are identified by municipal_code or similar.
                // This needs to map to the correct column in GA_VOTER_REGISTRATION_LIST.
                // Placeholder: adjust municipal_code if GA_VOTER_REGISTRATION_LIST uses a different name for municipality IDs.
                return `${voterTableAlias}.municipal_code`; // IMPORTANT: Verify this column name
            case 'ZipCode':
                return `${voterTableAlias}.zip_code`; // Or residence_zipcode based on earlier TODO
            default:
                console.warn(`Unknown subAreaType for grouping: ${subAreaType}. Defaulting to primary area.`);
                // Fall through to primary area grouping if subAreaType is unknown
        }
    }

    // If no subAreaType or an unknown one, group by the primary selected area.
    if (areaValue === "ALL") {
        // When "ALL" is selected for the primary area (e.g. "All Counties"),
        // and no valid subAreaType is given for breakdown, we group by the primary geo type itself.
        if (areaType === 'County') return `${voterTableAlias}.county_code`;
        if (areaType === 'District') {
            if (!districtType) {
                console.error("District type is required for 'ALL' districts grouping.");
                return "\'unknown_district_group\'"
            }
            switch (districtType) {
                case 'Congressional': return `${voterTableAlias}.congressional_district`;
                case 'StateSenate': return `${voterTableAlias}.state_senate_district`;
                case 'StateHouse': return `${voterTableAlias}.state_house_district`;
                default: 
                    console.error(`Unknown district type for 'ALL' districts grouping: ${districtType}`);
                    return "\'unknown_district_type_group\'";
            }
        }
    }

    // If a specific primary area is selected (not "ALL") and no subAreaType for breakdown.
    // In this case, the result will be a single row for that specific area if not further broken down by demographics.
    // The SQL query will typically have a GROUP BY for this, but the label itself might be static.
    // For consistency in what this function returns (a column name), we return the column that identifies this specific primary area.
    if (areaType === 'County') {
        return `${voterTableAlias}.county_code`;
    }
    if (areaType === 'District') {
        if (!districtType) {
            console.error("District type is required for specific district grouping.");
            return "\'unknown_district_group\'"
        }
        switch (districtType) {
            case 'Congressional': return `${voterTableAlias}.congressional_district`;
            case 'StateSenate': return `${voterTableAlias}.state_senate_district`;
            case 'StateHouse': return `${voterTableAlias}.state_house_district`;
            default: 
                console.error(`Unknown district type for specific district grouping: ${districtType}`);
                return "\'unknown_district_type_group\'";
        }
    }
    
    console.error('Could not determine grouping column for geography:', geography);
    return "\'unknown_geo_group\'"; 
}

// Helper to generate a descriptive label for the geographical unit based on query results
function getGeoUnitLabel(
    geography: GeographySelection,
    sqlRow: any, // The raw row object from the SQL query
    groupingColumnIdentifier: string // The alias used for the geo grouping column in SQL, e.g., 'geo_unit_id'
): string {
    const { areaType, areaValue, subAreaType } = geography;
    const actualGeoValue = sqlRow[groupingColumnIdentifier];

    if (areaType === 'County') {
        if (subAreaType === 'Precinct') return `Precinct ${actualGeoValue} (County ${areaValue})`;
        if (subAreaType === 'Municipality') return `Municipality ${actualGeoValue} (County ${areaValue})`;
        return `County ${actualGeoValue}`;
    }
    if (areaType === 'District') return `District ${actualGeoValue}`; // Assumes actualGeoValue is the district identifier
    if (areaType === 'ZipCode') return `Zip Code ${actualGeoValue}`;
    
    return String(actualGeoValue || 'N/A');
}

// Interface for rows from the consolidated DB query
interface ConsolidatedDbRow {
    county_name: string;
    geo_unit_id: string | number; // Type depends on the actual groupByColumn values
    total_registered_overall: number;
    total_voted_overall: number;
    overall_turnout_rate_calculated: number;
    [key: string]: any; // For dynamic race breakdown columns like race_breakdown_registered_white, etc.
}

/**
 * Fetches and processes voter turnout data based on the provided parameters.
 * This function will encapsulate all database query logic and data transformations.
 *
 * @param params - The validated parameters for the turnout analysis.
 * @returns A promise that resolves to the processed turnout data.
 */
export async function generateTurnoutAnalysisData(
    params: ValidatedTurnoutAnalysisParams
): Promise<ProcessedTurnoutPayload> {
    console.log('Service: Generating turnout analysis data with params:', params);

    const { geography, electionDate, reportDataPoints, chartDataPoint, includeCensusData, outputType } = params;
    
    let groupByColumn = 'county_name'; // Default
    let groupLabel = 'County';
    
    // Determine groupByColumn and initial groupLabel based on geography
    if (geography.areaType === 'County') {
        if (geography.areaValue === 'ALL') {
            groupByColumn = 'county_name'; // Group by name for "ALL" counties per user request
            groupLabel = 'County';
        } else if (geography.subAreaType) { // Specific county with sub-area
            if (geography.subAreaType === 'Precinct') {
                groupByColumn = 'county_precinct';
                groupLabel = 'Precinct';
            } else if (geography.subAreaType === 'Municipality') {
                groupByColumn = 'municipal_code'; // Or municipal_precinct
                groupLabel = 'Municipality';
            } else if (geography.subAreaType === 'ZipCode') {
                groupByColumn = 'residence_zipcode';
                groupLabel = 'ZIP Code';
            } else { // Specific county, no further sub-area breakdown, effectively group by county itself
                groupByColumn = 'county_name'; // Group by the county_name if showing a single selected county
                groupLabel = 'County';
            }
        } else { // Specific county, no subAreaType
            groupByColumn = 'county_name'; // Group by the county_name
            groupLabel = 'County';
        }
    } else if (geography.areaType === 'District') {
        if (!geography.districtType) throw new Error('District type is required for District geography');
        switch (geography.districtType) {
            case 'Congressional': groupByColumn = 'congressional_district'; break;
            case 'StateSenate': groupByColumn = 'state_senate_district'; break;
            case 'StateHouse': groupByColumn = 'state_house_district'; break;
            default: throw new Error(`Unknown district type: ${geography.districtType}`);
        }
        groupLabel = geography.districtType;
    } else if (geography.areaType === 'ZipCode') {
        groupByColumn = 'residence_zipcode';
        groupLabel = 'ZIP Code';
    }

    // Build WHERE clause for filtering
    let whereClause = "vrl.status = 'ACTIVE'"; // Base filter

    if (geography.areaType === 'County') {
        if (geography.areaValue !== 'ALL') {
            // Specific County: Use case-insensitive county_name
            whereClause += ` AND UPPER(vrl.county_name) = UPPER('${geography.areaValue.replace(/'/g, "''")}')`; // Sanitize apostrophes

            if (geography.subAreaType && geography.subAreaValue && geography.subAreaValue !== 'ALL') {
                let subAreaCol = '';
                if (geography.subAreaType === 'Precinct') subAreaCol = 'vrl.county_precinct';
                else if (geography.subAreaType === 'Municipality') subAreaCol = 'vrl.municipal_code'; // Verify column
                else if (geography.subAreaType === 'ZipCode') subAreaCol = 'vrl.residence_zipcode';
                
                if (subAreaCol) whereClause += ` AND ${subAreaCol} = '${geography.subAreaValue.replace(/'/g, "''")}'`;
            }
        }
        // For areaValue === 'ALL', no additional county filter is added here; the base status = 'ACTIVE' applies to all.
    } else if (geography.areaType === 'District' && geography.areaValue !== 'ALL') {
        if (!geography.districtType) throw new Error('District type is required');
        let distCol = '';
        if (geography.districtType === 'Congressional') distCol = 'vrl.congressional_district';
        else if (geography.districtType === 'StateSenate') distCol = 'vrl.state_senate_district';
        else if (geography.districtType === 'StateHouse') distCol = 'vrl.state_house_district';
        else throw new Error (`Unknown district type: ${geography.districtType}`);
        whereClause += ` AND ${distCol} = '${geography.areaValue.replace(/'/g, "''")}'`;
    } else if (geography.areaType === 'ZipCode' && geography.areaValue !== 'ALL') {
        whereClause += ` AND vrl.residence_zipcode = '${geography.areaValue.replace(/'/g, "''")}'`;
    }
    
    const queryElectionDate = electionDate;
    
    let raceBreakdownSelectSQL = '';
    if (reportDataPoints.includes('Race')) {
        RACE_OPTIONS.forEach(opt => {
            const sqlComparisonVal = GA_SQL_RACE_CATEGORIES_MAP[opt.value];
            if (sqlComparisonVal) {
                const aliases = getSqlRaceAliases(sqlComparisonVal);
                raceBreakdownSelectSQL += `
                , COUNT(DISTINCT CASE WHEN UPPER(vrl.race) = '${sqlComparisonVal}' THEN vrl.voter_registration_number ELSE NULL END) AS ${aliases.registered}
                , SUM(CASE WHEN UPPER(vrl.race) = '${sqlComparisonVal}' AND vrl.voting_events @> '[{"election_date": "${queryElectionDate}"}]'::jsonb THEN 1 ELSE 0 END) AS ${aliases.voted}`;
            }
        });
    }

    // The primary grouping column for the main query must be unique for each entity we report on.
    // If groupByColumn is county_name, and multiple rows in DB could have same county_name (e.g. if there was a county_code too)
    // ensure the GROUP BY includes county_name. For "ALL" counties, we group by county_name.
    let consolidatedQueryGroupBy = `vrl.${groupByColumn}`;
    if (geography.areaType === 'County' && geography.areaValue === 'ALL') {
        consolidatedQueryGroupBy = 'vrl.county_name'; // Explicitly group by county_name
    } else if (geography.areaType === 'County' && !geography.subAreaType) {
         consolidatedQueryGroupBy = 'vrl.county_name'; // Explicitly group by county_name for single selected county
    }


    const consolidatedQuery = `
        WITH geo_data AS (
            SELECT 
                ${ (geography.areaType === 'County' || geography.subAreaType === 'Precinct') ? 'vrl.county_name AS query_county_name,': ''} -- Select county_name for labeling if applicable
                ${consolidatedQueryGroupBy} AS geo_unit_id, 
                COUNT(DISTINCT vrl.voter_registration_number) AS total_registered_overall,
                SUM(CASE WHEN vrl.voting_events @> '[{"election_date": "${queryElectionDate}"}]'::jsonb THEN 1 ELSE 0 END) AS total_voted_overall
                ${raceBreakdownSelectSQL} 
            FROM 
                ga_voter_registration_list vrl
            WHERE 
                ${whereClause}
                AND vrl.${groupByColumn} IS NOT NULL
                AND TRIM(CAST(vrl.${groupByColumn} AS TEXT)) <> ''
            GROUP BY 
                ${ (geography.areaType === 'County' || geography.subAreaType === 'Precinct') ? 'vrl.county_name,': ''}
                ${consolidatedQueryGroupBy}
        )
        SELECT 
            gd.*
            , CASE WHEN gd.total_registered_overall > 0 
                THEN (gd.total_voted_overall::numeric / gd.total_registered_overall::numeric)
                ELSE 0 
              END AS overall_turnout_rate_calculated
            ${reportDataPoints.includes('Race') ? 
                RACE_OPTIONS.map(opt => {
                    const sqlComparisonVal = GA_SQL_RACE_CATEGORIES_MAP[opt.value];
                    if (!sqlComparisonVal) return '';
                    const aliases = getSqlRaceAliases(sqlComparisonVal);
                    return `, CASE WHEN gd.${aliases.registered} > 0 THEN (gd.${aliases.voted}::numeric / gd.${aliases.registered}::numeric) ELSE 0 END AS ${aliases.turnout}`;
                }).join('') 
              : ''
            }
        FROM 
            geo_data gd
        ORDER BY 
            gd.geo_unit_id;
    `;
    
    console.log("Executing consolidated query:", consolidatedQuery);
    
    const payload: ProcessedTurnoutPayload = {};

    if (outputType === 'report') {
        try {
            const result = await sql.unsafe(consolidatedQuery);
            const dbRows: ConsolidatedDbRow[] = Array.isArray(result) ? result : (result && 'rows' in result ? (result as any).rows : []);
            console.log(`Consolidated query returned ${dbRows.length} rows`);
            
            let precinctData: Record<string, { name: string, address: string }> = {};
            if (geography.areaType === 'County' && geography.areaValue !== 'ALL' && 
                geography.subAreaType === 'Precinct' && dbRows.length > 0) {
                // ... (existing precinctData fetching logic, ensure it uses correct county identifier if needed)
            }
            
            if (dbRows.length > 0) console.log("Sample DB row (consolidated):", dbRows[0]);
            
            let totalRegisteredAgg = 0;
            let totalVotedAgg = 0;
            
            const initialReportRows = dbRows.map((dbRow: ConsolidatedDbRow) => {
                const registeredOverall = Number(dbRow.total_registered_overall) || 0;
                const votedOverall = Number(dbRow.total_voted_overall) || 0;
                const overallTurnoutRate = Number(dbRow.overall_turnout_rate_calculated) || 0;

                totalRegisteredAgg += registeredOverall;
                totalVotedAgg += votedOverall;
                
                let geoLabel = '';
                const currentGeoUnitId = String(dbRow.geo_unit_id); // This is now county_name for "ALL" Counties

                if (geography.areaType === 'County') {
                    if (geography.areaValue === 'ALL') {
                        geoLabel = `${groupLabel} ${currentGeoUnitId}`; // e.g., "County FULTON"
                    } else { // Specific county
                        if (geography.subAreaType === 'Precinct') {
                             geoLabel = `Precinct (${dbRow.query_county_name || geography.areaValue}) ${currentGeoUnitId}`;
                             if (precinctData[currentGeoUnitId]) {
                                 geoLabel += `: ${precinctData[currentGeoUnitId].name}`;
                             }
                        } else if (geography.subAreaType === 'Municipality' || geography.subAreaType === 'ZipCode') {
                            geoLabel = `${groupLabel} (${dbRow.query_county_name || geography.areaValue}) ${currentGeoUnitId}`;
                        } else { // No sub-area, just the specific county
                            geoLabel = `${groupLabel} ${currentGeoUnitId}`; // currentGeoUnitId is county_name
                        }
                    }
                } else { // Districts or top-level ZipCodes
                     geoLabel = `${groupLabel} ${currentGeoUnitId}`;
                }


                const currentReportRow: ProcessedReportRow & { dbGeoUnitId: string | number } = {
                    dbGeoUnitId: dbRow.geo_unit_id,
                    geoLabel,
                    totalRegistered: registeredOverall,
                    totalVoted: votedOverall,
                    overallTurnoutRate: overallTurnoutRate,
                    breakdowns: {}
                };

                if (reportDataPoints.includes('Race')) {
                    RACE_OPTIONS.forEach(opt => {
                        const sqlComparisonVal = GA_SQL_RACE_CATEGORIES_MAP[opt.value];
                        if (sqlComparisonVal) {
                            const aliases = getSqlRaceAliases(sqlComparisonVal);
                            const catRegistered = Number(dbRow[aliases.registered]) || 0;
                            const catVoted = Number(dbRow[aliases.voted]) || 0;
                            const catTurnout = Number(dbRow[aliases.turnout]) || 0;
                            currentReportRow.breakdowns[`Race:${opt.value}`] = { registered: catRegistered, voted: catVoted, turnout: catTurnout };
                        } else {
                             currentReportRow.breakdowns[`Race:${opt.value}`] = { registered: 0, voted: 0, turnout: 0 };
                        }
                    });
                }
                return currentReportRow;
            });
            
            if (reportDataPoints.some(dp => dp === 'Gender' || dp === 'AgeRange')) {
                for (const reportRow of initialReportRows) {
                    const geoUnitIdForSubQuery = reportRow.dbGeoUnitId; 

                    if (geoUnitIdForSubQuery === undefined || geoUnitIdForSubQuery === null) {
                        console.warn(`dbGeoUnitId is missing for reportRow: ${reportRow.geoLabel}. Skipping Gender/AgeRange.`);
                        continue;
                    }

                    for (const dataPoint of reportDataPoints) {
                        if (dataPoint === 'Race') continue;

                        console.log(`Processing sub-breakdown for ${dataPoint} in geo unit: ${reportRow.geoLabel} (DB Geo ID for sub-query: ${geoUnitIdForSubQuery})`);
                        let categories: string[] = [];
                        let demographicColumnName = ''; 

                        if (dataPoint === 'Gender') {
                            categories = GENDER_OPTIONS.map(opt => opt.value);
                            demographicColumnName = 'gender';
                        } else if (dataPoint === 'AgeRange') {
                            categories = AGE_RANGE_OPTIONS.map(opt => opt.value);
                        }
                        
                        for (const category of categories) {
                            let whereConditionForDemographics = '';
                            if (dataPoint === 'Gender') {
                                whereConditionForDemographics = `LOWER(vrl.${demographicColumnName}) = LOWER('${category.replace(/'/g, "''")}')`;
                            } else if (dataPoint === 'AgeRange') {
                                const ageRangeDef = AGE_RANGE_CATEGORIES_DEF[category as keyof typeof AGE_RANGE_CATEGORIES_DEF];
                                const electionYearForAgeCalc = new Date(queryElectionDate).getFullYear();
                                
                                if (category === '75+') {
                                    const effectiveMaxBirthYear = electionYearForAgeCalc - ageRangeDef.min;
                                    whereConditionForDemographics = `vrl.birth_year <= ${effectiveMaxBirthYear}`;
                                } else {
                                    const maxBirthYear = electionYearForAgeCalc - ageRangeDef.min;
                                    const minBirthYear = electionYearForAgeCalc - ageRangeDef.max;
                                    whereConditionForDemographics = `vrl.birth_year BETWEEN ${minBirthYear} AND ${maxBirthYear}`;
                                }
                            }
                            
                            // Construct the sub-query WHERE clause. It MUST be specific to the current geo unit.
                            let subQuerySpecificWhere = '';
                            if (geography.areaType === 'County' && geography.areaValue === 'ALL') {
                                // geoUnitIdForSubQuery is county_name
                                subQuerySpecificWhere = `UPPER(vrl.county_name) = UPPER('${String(geoUnitIdForSubQuery).replace(/'/g, "''")}')`;
                            } else {
                                // For other cases, groupByColumn should correctly identify the unit
                                // Ensure groupByColumn is a valid column name and geoUnitIdForSubQuery is properly sanitized
                                subQuerySpecificWhere = `CAST(vrl.${groupByColumn} AS TEXT) = '${String(geoUnitIdForSubQuery).replace(/'/g, "''")}'`;
                            }

                            const breakdownSubQuery = `
                                SELECT
                                    COUNT(DISTINCT vrl.voter_registration_number) AS registered,
                                    SUM(CASE WHEN vrl.voting_events @> '[{"election_date": "${queryElectionDate}"}]'::jsonb THEN 1 ELSE 0 END) AS voted
                                FROM
                                    ga_voter_registration_list vrl
                                WHERE
                                    vrl.status = 'ACTIVE'
                                    AND ${subQuerySpecificWhere} 
                                    AND ${whereConditionForDemographics}
                            `;
                           
                            console.log(`Executing ${dataPoint} breakdown query for ${category}:`, breakdownSubQuery);
                            try {
                                const breakdownResult = await sql.unsafe(breakdownSubQuery);
                                const breakdownData = (Array.isArray(breakdownResult) ? breakdownResult[0] : (breakdownResult as any).rows?.[0]) || null;
                                
                                const registered = Number(breakdownData?.registered) || 0;
                                const voted = Number(breakdownData?.voted) || 0;
                                const turnout = registered > 0 ? (voted / registered) : 0;

                                if (dataPoint === 'AgeRange' && category === '75+') {
                                    console.log(`DEBUG AgeRange 75+: geoUnitId=${geoUnitIdForSubQuery}, registered=${registered}, voted=${voted}, turnout=${turnout}, queryElectionDate=${queryElectionDate}, electionYearForAgeCalc=${new Date(queryElectionDate).getFullYear()}`);
                                }
                                reportRow.breakdowns[`${dataPoint}:${category}`] = { registered, voted, turnout };
                            } catch (subErr) {
                                console.error(`Error fetching ${dataPoint} breakdown for ${category}:`, subErr);
                                reportRow.breakdowns[`${dataPoint}:${category}`] = { registered: 0, voted: 0, turnout: 0 };
                            }
                        }
                    }
                    console.log(`Final breakdowns for ${reportRow.geoLabel}:`, reportRow.breakdowns);
                }
            }
            
            const finalReportRows = initialReportRows.map(row => {
                const { dbGeoUnitId, ...rest } = row;
                return rest;
            });

            payload.report = {
                rows: finalReportRows,
                aggregations: {
                    averageOverallTurnoutRate: totalRegisteredAgg > 0 ? totalVotedAgg / totalRegisteredAgg : 0,
                    grandTotalVoted: totalVotedAgg
                }
            };
            
        } catch (e: any) {
           console.error("Error executing query or processing report data:", e);
           throw new Error(`Failed to generate report data: ${e.message}`);
        }
    } else if (outputType === 'chart') {
        // ... (existing chart logic - may need review if using these breakdowns)
        console.warn("Chart generation logic for race/age/gender breakdowns may need similar review for data fetching strategy.");
        // Ensure payload is returned for chart type as well, even if empty or with different structure
        // For now, returning the potentially empty payload. Adjust if charts need specific empty states.
    }
    return payload;
} 