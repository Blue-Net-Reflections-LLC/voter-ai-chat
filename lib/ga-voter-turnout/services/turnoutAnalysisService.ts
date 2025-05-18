import { sql } from '@/lib/voter/db'; // Corrected import

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
const RACE_CATEGORIES = ['WH', 'BH', 'AP', 'HP', 'OT', 'U']; // White, Black, Asian/Pacific Islander, Hispanic, Other, Unknown
const GENDER_CATEGORIES = ['M', 'F', 'U']; // Male, Female, Unknown/Other
const AGE_RANGE_CATEGORIES_DEF = {
    '18-24': { min: 18, max: 24 },
    '25-34': { min: 25, max: 34 },
    '35-44': { min: 35, max: 44 },
    '45-54': { min: 45, max: 54 },
    '55-64': { min: 55, max: 64 },
    '65+': { min: 65, max: Infinity },
};
const AGE_RANGE_KEYS = Object.keys(AGE_RANGE_CATEGORIES_DEF);

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
    
    // Determine what to group by
    let groupByColumn = 'county_name';
    let groupLabel = 'County';
    
    // If we're breaking down by secondary geography like precincts
    if (geography.areaType === 'County' && geography.subAreaType) {
        if (geography.subAreaType === 'Precinct') {
            groupByColumn = 'county_precinct';
            groupLabel = 'Precinct';
        } else if (geography.subAreaType === 'Municipality') {
            groupByColumn = 'municipal_precinct';
            groupLabel = 'Municipality';
        } else if (geography.subAreaType === 'ZipCode') {
            groupByColumn = 'residence_zipcode';
            groupLabel = 'ZIP Code';
        }
    }
    
    // Build WHERE clause for filtering
    let whereClause = '1=1'; // Default for ALL
    
    if (geography.areaType === 'County' && geography.areaValue !== 'ALL') {
        // Use county_code for more reliable filtering if we have a mapping
        const countyCode = COUNTY_CODE_MAP[geography.areaValue];
        if (countyCode) {
            whereClause = `county_code = '${countyCode}'`;
        } else {
            whereClause = `UPPER(county_name) = UPPER('${geography.areaValue}')`;
        }
        
        // If a subAreaValue is specified and it's not "ALL", add that to the WHERE clause
        if (geography.subAreaType && geography.subAreaValue && geography.subAreaValue !== 'ALL') {
            let subAreaColumn = '';
            if (geography.subAreaType === 'Precinct') {
                subAreaColumn = 'county_precinct';
            } else if (geography.subAreaType === 'Municipality') {
                subAreaColumn = 'municipal_precinct';
            } else if (geography.subAreaType === 'ZipCode') {
                subAreaColumn = 'residence_zipcode';
            }
            
            if (subAreaColumn) {
                whereClause += ` AND ${subAreaColumn} = '${geography.subAreaValue}'`;
            }
        }
    } else if (geography.areaType === 'District' && geography.areaValue !== 'ALL') {
        if (!geography.districtType) {
            throw new Error('District type is required for District geography');
        }
        let districtColumn = '';
        switch (geography.districtType) {
            case 'Congressional': districtColumn = 'congressional_district'; break;
            case 'StateSenate': districtColumn = 'state_senate_district'; break;
            case 'StateHouse': districtColumn = 'state_house_district'; break;
            default: throw new Error(`Unknown district type: ${geography.districtType}`);
        }
        whereClause = `${districtColumn} = '${geography.areaValue}'`;
    }
    
    // Use election date directly instead of adjusting it
    const queryElectionDate = electionDate;
    
    // Build SQL query with proper grouping by geography selection
    const query = `
        WITH geo_stats AS (
            SELECT 
                -- Primary geographic entities
                county_name,
                ${groupByColumn} AS geo_unit_id,
                
                -- Count of registered voters per geographic unit
                COUNT(DISTINCT voter_registration_number) AS total_registered_voters,
                
                -- Count of voters who participated in the selected election using proper JSONB operators
                SUM(CASE WHEN voting_events @> '[{"election_date": "${queryElectionDate}"}]'::jsonb THEN 1 ELSE 0 END) AS voters_who_participated
            FROM 
                ga_voter_registration_list
            WHERE 
                status = 'ACTIVE'
                AND ${whereClause}
                AND ${groupByColumn} IS NOT NULL
                AND TRIM(${groupByColumn}) <> ''
            GROUP BY 
                county_name, ${groupByColumn}
        )
        
        SELECT 
            county_name,
            geo_unit_id,
            total_registered_voters,
            voters_who_participated,
            CASE WHEN total_registered_voters > 0 
                THEN (voters_who_participated::numeric / total_registered_voters::numeric)
                ELSE 0 
            END AS turnout_rate
        FROM 
            geo_stats
        ORDER BY 
            geo_unit_id
    `;
    
    console.log("Executing query:", query);
    
    const payload: ProcessedTurnoutPayload = {};

    if (outputType === 'report') {
        try {
            const result = await sql.unsafe(query);
            const rows = Array.isArray(result) 
                ? result 
                : (typeof result === 'object' && result !== null && 'rows' in result 
                    ? (result as any).rows 
                    : []);
            console.log(`Query returned ${rows.length} rows`);
            
            // If we're doing a precinct-level analysis for a specific county, get precinct descriptions
            let precinctData: Record<string, { name: string, address: string }> = {};
            
            if (geography.areaType === 'County' && geography.areaValue !== 'ALL' && 
                geography.subAreaType === 'Precinct' && rows.length > 0) {
                
                try {
                    // Get county code for reference data lookup
                    const countyCode = COUNTY_CODE_MAP[geography.areaValue] || '';
                    
                    // Query the reference_data table to get facility information
                    const refDataQuery = `
                        SELECT 
                            lookup_key AS precinct_id,
                            lookup_value AS description,
                            lookup_meta->>'facility_name' AS facility_name,
                            lookup_meta->>'facility_address' AS facility_address
                        FROM 
                            reference_data
                        WHERE 
                            lookup_type = 'GA_COUNTY_PRECINCT_DESC'
                            AND state_code = 'GA'
                            AND county_code = '${countyCode}'
                    `;
                    
                    const refResult = await sql.unsafe(refDataQuery);
                    const refRows = Array.isArray(refResult) 
                        ? refResult 
                        : (typeof refResult === 'object' && refResult !== null && 'rows' in refResult 
                            ? (refResult as any).rows 
                            : []);
                    
                    // Create a lookup map of precinct data
                    refRows.forEach((row: any) => {
                        const name = row.facility_name || row.description || row.precinct_id;
                        precinctData[row.precinct_id] = {
                            name,
                            address: row.facility_address || ''
                        };
                    });
                    
                    console.log(`Found ${Object.keys(precinctData).length} precinct descriptions`);
                } catch (refErr) {
                    console.error("Error fetching precinct descriptions:", refErr);
                    // Continue without precinct descriptions if this fails
                }
            }
            
            if (rows.length > 0) {
                console.log("Sample row:", rows[0]);
            }
            
            let totalRegistered = 0;
            let totalVoted = 0;
            
            const reportRows = rows.map((row: any) => {
                const registered = Number(row.total_registered_voters);
                const voted = Number(row.voters_who_participated);
                const turnoutRate = Number(row.turnout_rate);
                
                totalRegistered += registered;
                totalVoted += voted;
                
                // Format the label based on the grouping (County, Precinct, etc.)
                let labelPrefix = groupLabel;
                let geoLabel = '';
                
                if (geography.areaType === 'County' && geography.areaValue !== 'ALL' && geography.subAreaType) {
                    labelPrefix = `${groupLabel} (${row.county_name})`;
                    
                    // For precincts, use the facility name if available
                    if (geography.subAreaType === 'Precinct' && precinctData[row.geo_unit_id]) {
                        geoLabel = `${labelPrefix} ${row.geo_unit_id}: ${precinctData[row.geo_unit_id].name}`;
                    } else {
                        geoLabel = `${labelPrefix} ${row.geo_unit_id}`;
                    }
                } else {
                    geoLabel = `${labelPrefix} ${row.geo_unit_id}`;
                }
                
                return {
                    geoLabel,
                    totalRegistered: registered,
                    totalVoted: voted,
                    overallTurnoutRate: turnoutRate,
                    breakdowns: {}
                };
            });
            
            const averageTurnoutRate = totalRegistered > 0 ? totalVoted / totalRegistered : 0;
            
            payload.report = {
                rows: reportRows,
                aggregations: {
                    averageOverallTurnoutRate: averageTurnoutRate,
                    grandTotalVoted: totalVoted
                }
            };
            
        } catch (e: any) {
            console.error("Error executing query:", e);
            throw new Error(`Failed to generate report data: ${e.message}`);
        }
    } else if (outputType === 'chart') {
        // Chart data implementation
        payload.chart = {
            type: 'bar',
            rows: [],
            xAxisMax: 1.0
        };
    }

    return payload;
} 