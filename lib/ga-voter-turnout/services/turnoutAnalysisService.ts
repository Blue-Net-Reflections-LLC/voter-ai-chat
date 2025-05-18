import { sql } from '@/lib/voter/db'; // Corrected import

// import type { TurnoutAnalysisRequestBody, ReportData, ChartData } from './turnoutAnalysisServiceTypes'; // Removed this line

// Define types for the service layer output (can be refined as we build the actual queries)
// These might be slightly different from the final API response structure, 
// as the API route can do final transformations.

// Re-defining here for clarity, or they can be imported if already defined centrally
// For now, let's assume they are defined in a shared types file or defined below.

// Updated to match ApiGeographySelection from page.tsx
interface GeographySelection {
    areaType: 'County' | 'District'; // Primary geo type
    areaValue: string; // Specific county FIPS, district number, or "ALL"
    districtType?: 'Congressional' | 'StateSenate' | 'StateHouse'; // Only if areaType is 'District'
    // Sub-area type for breaking down the selected County/District.
    // This is NOT for filtering the main area, but for defining the granularity of results.
    // Filtering by sub-area (e.g. a specific precinct) will be handled by the main areaType/areaValue logic
    // if we decide to support direct querying of a single precinct later.
    // For now, this primarily informs getGeoGroupingColumnSQL.
    subAreaType?: 'Precinct' | 'Municipality' | 'ZipCode'; 
}

interface ValidatedTurnoutAnalysisParams {
    geography: GeographySelection;
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

// Helper to build the WHERE clause for geography
function buildGeoFilterCondition(
    geography: GeographySelection,
    voterTableAlias: string = 'vrl' 
): string {
    const conditions: string[] = [];
    const { areaType, areaValue, districtType } = geography; // subAreaType is not used for primary filtering here

    // If areaValue is "ALL", it means we don't filter by specific county/district for the primary selection.
    // The breakdown by subAreaType (if any) will happen in grouping.
    if (areaValue === "ALL") {
        return "1=1"; // No specific primary geographic filter
    }

    if (areaType === 'County') {
        conditions.push(`${voterTableAlias}.county_code = '${areaValue}'`);
    } else if (areaType === 'District') {
        if (!districtType || !areaValue) {
            console.error("District type and value are required for District areaType filtering.");
            return "1 = 0"; // Invalid configuration for district filtering
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
                return "1 = 0"; // Invalid district type
        }
        conditions.push(`${voterTableAlias}.${districtColumn} = '${areaValue}'`); 
    }
    // Note: Direct ZipCode filtering as a primary areaType is removed from this new flow.
    // ZipCode is now only a secondary breakdown option.

    if (conditions.length === 0) {
        // This case should ideally not be reached if areaValue !== "ALL" and areaType is valid.
        // It implies an unhandled areaType or an issue.
        console.error("Could not build specific geography filter for:", geography);
        return "1 = 0"; // Fallback to a condition that returns no results
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

    const geoFilterCondition = buildGeoFilterCondition(geography, 'vrl');
    const geoGroupingColumnSql = getGeoGroupingColumnSQL(geography, 'vrl');
    const geoUnitIdentifierAlias = 'geo_unit_id';

    const payload: ProcessedTurnoutPayload = {};

    const cteSelectExpressions: string[] = [
        `vrl.voter_registration_number`,
        `${geoGroupingColumnSql} AS ${geoUnitIdentifierAlias}`,
        `vrl.voting_events`,
        `vrl.race`,
        `vrl.gender`,
        `vrl.date_of_birth`,
        `EXTRACT(YEAR FROM age(timestamp '${electionDate}', vrl.date_of_birth)) AS age_at_election`,
        `vrl.census_tract`
    ];

    const ageRangeCaseStatement = AGE_RANGE_KEYS.map(key => {
        const { min, max } = AGE_RANGE_CATEGORIES_DEF[key as keyof typeof AGE_RANGE_CATEGORIES_DEF];
        return `WHEN EXTRACT(YEAR FROM age(timestamp '${electionDate}', vrl.date_of_birth)) BETWEEN ${min} AND ${max === Infinity ? 999 : max} THEN '${key}'`;
    }).join('\\n            ');

    const registeredVotersInScopeCTE = `
        RegisteredVotersInScope AS (
            SELECT
                ${cteSelectExpressions.join(',\\n                ')},
                CASE
                    ${ageRangeCaseStatement}
                    ELSE 'Unknown'
                END AS age_range_category,
                EXISTS (
                    SELECT 1
                    FROM jsonb_array_elements(vrl.voting_events) AS event
                    WHERE event->>'election_date' = '${electionDate}'
                      AND event->>'voted' = 'true'
                ) AS voted_in_selected_election
            FROM public."GA_VOTER_REGISTRATION_LIST" vrl
            WHERE
                ${geoFilterCondition}
                AND vrl.status = 'ACTIVE'
                AND vrl.registration_date <= '${electionDate}'
        )
    `;

    if (outputType === 'report') {
        console.log('Generating report data...');
        let actualReportRows: ProcessedReportRow[] = [];
        let actualAverageOverallTurnoutRate = 0;
        let actualGrandTotalVoted = 0;
        
        const getCartesianProductCombinations = () => {
            if (reportDataPoints.length === 0) return [{ combination: {}, label: 'Overall' }];
            const dataPointValues: Record<string, string[]> = {};
            if (reportDataPoints.includes('Race')) dataPointValues['Race'] = RACE_CATEGORIES;
            if (reportDataPoints.includes('Gender')) dataPointValues['Gender'] = GENDER_CATEGORIES;
            if (reportDataPoints.includes('AgeRange')) dataPointValues['AgeRange'] = AGE_RANGE_KEYS;
        
            const keys = Object.keys(dataPointValues);
            if (keys.length === 0) return [{ combination: {}, label: 'Overall' }];
        
            const result: Array<{combination: Record<string, string>, label: string}> = [];
            const tempCombination: Record<string, string> = {};
        
            function generate(index: number) {
                if (index === keys.length) {
                    const currentCombination = { ...tempCombination };
                    const label = keys.map(k => `${k}:${currentCombination[k]}`).join(' | ');
                    result.push({ combination: currentCombination, label });
                    return;
                }
            
                const currentKey = keys[index];
                for (const value of dataPointValues[currentKey]) {
                    tempCombination[currentKey] = value;
                    generate(index + 1);
                }
            }
            generate(0);
            return result;
        };
        
        const demographicCombinations = getCartesianProductCombinations();
        let breakdownSelects: string[] = [];

        demographicCombinations.forEach(({ combination, label }) => {
            if (Object.keys(combination).length > 0) {
                const conditions = Object.entries(combination).map(([key, value]) => {
                    if (key === 'Race') return `rvs.race = '${value}'`;
                    if (key === 'Gender') return `rvs.gender = '${value}'`;
                    if (key === 'AgeRange') return `rvs.age_range_category = '${value}'`;
                    return '1=1';
                }).join(' AND ');

                breakdownSelects.push(`
                    COUNT(CASE WHEN ${conditions} THEN 1 ELSE NULL END) AS "registered_${label.replace(/\s*\|\s*/g, '_')}",
                    COUNT(CASE WHEN ${conditions} AND rvs.voted_in_selected_election THEN 1 ELSE NULL END) AS "voted_${label.replace(/\s*\|\s*/g, '_')}"
                `);
            }
        });
        
        const censusTractAggregation = `jsonb_agg(DISTINCT rvs.census_tract) FILTER (WHERE rvs.census_tract IS NOT NULL) AS census_tract_ids_for_geo_unit`;

        const mainQuerySql = `
            WITH ${registeredVotersInScopeCTE}
            SELECT
                rvs.${geoUnitIdentifierAlias} AS geo_unit_id,
                COUNT(DISTINCT rvs.voter_registration_number) AS total_registered_in_unit,
                COUNT(DISTINCT CASE WHEN rvs.voted_in_selected_election THEN rvs.voter_registration_number ELSE NULL END) AS total_voted_in_unit,
                ${breakdownSelects.join(',\\n                ')}${breakdownSelects.length > 0 ? ',' : ''}
                ${censusTractAggregation}
            FROM RegisteredVotersInScope rvs
            GROUP BY rvs.${geoUnitIdentifierAlias}
            ORDER BY rvs.${geoUnitIdentifierAlias};
        `;

        console.log("Executing Report SQL:", mainQuerySql);
        try {
            const result = await sql.unsafe(mainQuerySql);
            console.log(`Report SQL query returned ${(result as any).rows.length} rows.`);

            let grandTotalRegisteredAcrossUnits = 0;

            actualReportRows = (result as any).rows.map((row: any) => {
                const totalRegisteredInUnit = Number(row.total_registered_in_unit);
                const totalVotedInUnit = Number(row.total_voted_in_unit);
                grandTotalRegisteredAcrossUnits += totalRegisteredInUnit;
                actualGrandTotalVoted += totalVotedInUnit;

                const processedRow: ProcessedReportRow = {
                    geoLabel: getGeoUnitLabel(geography, row, 'geo_unit_id'),
                    totalRegistered: totalRegisteredInUnit,
                    totalVoted: totalVotedInUnit,
                    overallTurnoutRate: totalRegisteredInUnit > 0 ? totalVotedInUnit / totalRegisteredInUnit : 0,
                    breakdowns: {},
                };

                demographicCombinations.forEach(({ label }) => {
                    if (label !== 'Overall') {
                        const regCol = `registered_${label.replace(/\s*\|\s*/g, '_')}`;
                        const votedCol = `voted_${label.replace(/\s*\|\s*/g, '_')}`;
                        const registered = Number(row[regCol] || 0);
                        const voted = Number(row[votedCol] || 0);
                        processedRow.breakdowns[label] = {
                            registered,
                            voted,
                            turnout: registered > 0 ? voted / registered : 0,
                        };
                    }
                });
                
                if (includeCensusData && row.census_tract_ids_for_geo_unit) {
                    processedRow.censusData = { _tract_ids_: row.census_tract_ids_for_geo_unit };
                }
                return processedRow;
            });
            
            if (includeCensusData && actualReportRows.length > 0) {
                console.log('Fetching census data for report rows...');
                for (const reportRow of actualReportRows) {
                    if (reportRow.censusData && reportRow.censusData['_tract_ids_']) {
                        const tractIds: string[] = reportRow.censusData['_tract_ids_'];
                        delete reportRow.censusData['_tract_ids_']; // Remove placeholder
                        if (tractIds.length > 0) {
                            const censusQuery = `
                                SELECT 
                                    AVG(median_household_income) as avg_median_household_income,
                                    SUM(total_population) as sum_total_population,
                                    SUM(white_population) as sum_white_population,
                                    SUM(black_population) as sum_black_population,
                                    SUM(asian_population) as sum_asian_population,
                                    SUM(hispanic_population) as sum_hispanic_population,
                                    AVG(poverty_rate) as avg_poverty_rate,
                                    AVG(education_bachelors_or_higher_percentage) as avg_education_bachelors_or_higher_percentage
                                FROM public.stg_processed_census_tract_data
                                WHERE tract_id = ANY($1::text[]) AND state_code_iso = 'GA';
                            `;
                            const censusResult = await sql.unsafe(censusQuery, [tractIds]);
                            if ((censusResult as any).rows.length > 0) {
                                const censusData = (censusResult as any).rows[0];
                                reportRow.censusData = {
                                    medianHouseholdIncome: censusData.avg_median_household_income ? parseFloat(censusData.avg_median_household_income) : null,
                                    totalPopulation: censusData.sum_total_population ? parseInt(censusData.sum_total_population, 10) : null,
                                    whitePopulationPercentage: (censusData.sum_total_population && censusData.sum_white_population) ? (parseInt(censusData.sum_white_population, 10) / parseInt(censusData.sum_total_population, 10)) : null,
                                    blackPopulationPercentage: (censusData.sum_total_population && censusData.sum_black_population) ? (parseInt(censusData.sum_black_population, 10) / parseInt(censusData.sum_total_population, 10)) : null,
                                    asianPopulationPercentage: (censusData.sum_total_population && censusData.sum_asian_population) ? (parseInt(censusData.sum_asian_population, 10) / parseInt(censusData.sum_total_population, 10)) : null,
                                    hispanicPopulationPercentage: (censusData.sum_total_population && censusData.sum_hispanic_population) ? (parseInt(censusData.sum_hispanic_population, 10) / parseInt(censusData.sum_total_population, 10)) : null,
                                    povertyRate: censusData.avg_poverty_rate ? parseFloat(censusData.avg_poverty_rate) : null,
                                    educationBachelorsOrHigherPercentage: censusData.avg_education_bachelors_or_higher_percentage ? parseFloat(censusData.avg_education_bachelors_or_higher_percentage) : null,
                                };
                            } else {
                                reportRow.censusData = {}; 
                            }
                        } else {
                           reportRow.censusData = {}; 
                        }
                    } else if (includeCensusData) { // Ensure censusData object exists if includeCensusData is true
                        reportRow.censusData = {};
                    }
                }
            }

            if (grandTotalRegisteredAcrossUnits > 0) {
                actualAverageOverallTurnoutRate = actualGrandTotalVoted / grandTotalRegisteredAcrossUnits;
            } else {
                actualAverageOverallTurnoutRate = 0;
            }

            payload.report = {
                rows: actualReportRows,
                aggregations: {
                    averageOverallTurnoutRate: actualAverageOverallTurnoutRate,
                    grandTotalVoted: actualGrandTotalVoted,
                },
            };

        } catch (e: any) {
            console.error("Error executing or processing report SQL:", e);
            throw new Error(`Failed to generate report data: ${e.message}`);
        }
    } else if (outputType === 'chart') {
        console.log('Generating chart data...');
        let actualChartRows: ProcessedChartRow[] = [];
        let chartType: 'stackedRow' | 'bar' = 'bar';
        let xAxisMaxValue = 0.5; 

        const chartDataCategory = chartDataPoint; 

        let categorySelectSQL = '';
        let categoryGroupBySQL = '';
        let categoriesForChartLogic: string[] = [];
        let categoryColorsForChart: string[] = [];

        if (chartDataCategory === 'Race') {
            categorySelectSQL = ', rvs.race AS chart_category';
            categoryGroupBySQL = ', rvs.race';
            categoriesForChartLogic = RACE_CATEGORIES;
            categoryColorsForChart = RACE_COLORS;
        } else if (chartDataCategory === 'Gender') {
            categorySelectSQL = ', rvs.gender AS chart_category';
            categoryGroupBySQL = ', rvs.gender';
            categoriesForChartLogic = GENDER_CATEGORIES;
            categoryColorsForChart = GENDER_COLORS;
        } else if (chartDataCategory === 'AgeRange') {
            categorySelectSQL = ', rvs.age_range_category AS chart_category';
            categoryGroupBySQL = ', rvs.age_range_category';
            categoriesForChartLogic = AGE_RANGE_KEYS;
            categoryColorsForChart = AGE_RANGE_COLORS;
        }

        const mainChartQuerySql = `
            WITH ${registeredVotersInScopeCTE}
            SELECT
                rvs.${geoUnitIdentifierAlias} AS geo_unit_id,
                COUNT(DISTINCT rvs.voter_registration_number) AS total_registered_in_unit,
                COUNT(DISTINCT CASE WHEN rvs.voted_in_selected_election THEN rvs.voter_registration_number ELSE NULL END) AS total_voted_in_unit
                ${categorySelectSQL} 
            FROM RegisteredVotersInScope rvs
            GROUP BY rvs.${geoUnitIdentifierAlias}${categoryGroupBySQL}
            ORDER BY rvs.${geoUnitIdentifierAlias}${categoryGroupBySQL};
        `;
        console.log("Executing Chart SQL:", mainChartQuerySql);
        try {
            const result = await sql.unsafe(mainChartQuerySql);
            console.log(`Chart SQL query returned ${(result as any).rows.length} rows.`);
            
            const intermediateChartData: Record<string, 
                Partial<ProcessedChartRow> & { 
                    categoryData?: Record<string, {registered: number, voted: number, turnout: number}>,
                    _overallRegistered?: number, // For simple bar chart total aggregation
                    _overallVoted?: number // For simple bar chart total aggregation
                }
            > = {};

            (result as any).rows.forEach((row: any) => {
                const geoLabelKey = getGeoUnitLabel(geography, row, 'geo_unit_id'); 
                const registered = Number(row.total_registered_in_unit);
                const voted = Number(row.total_voted_in_unit);
                const currentCategoryValue = chartDataCategory ? row.chart_category : 'Overall';

                if (!intermediateChartData[geoLabelKey]) {
                    intermediateChartData[geoLabelKey] = {
                        geoLabel: geoLabelKey,
                        categoryData: {},
                        _overallRegistered: 0,
                        _overallVoted: 0
                    };
                }
                
                if (chartDataCategory) { 
                    if (!intermediateChartData[geoLabelKey].categoryData![currentCategoryValue]) {
                         intermediateChartData[geoLabelKey].categoryData![currentCategoryValue] = { registered: 0, voted: 0, turnout: 0 };
                    }
                    // These are per-category-segment counts for this geo unit
                    intermediateChartData[geoLabelKey].categoryData![currentCategoryValue].registered = registered; 
                    intermediateChartData[geoLabelKey].categoryData![currentCategoryValue].voted = voted;
                    if (registered > 0) {
                        intermediateChartData[geoLabelKey].categoryData![currentCategoryValue].turnout = voted / registered;
                    }
                } else { 
                    // For overall bar chart, SQL already groups by geo_unit_id, so these are totals for the unit
                    intermediateChartData[geoLabelKey]._overallRegistered = registered;
                    intermediateChartData[geoLabelKey]._overallVoted = voted;
                    intermediateChartData[geoLabelKey].overallTurnoutRate = registered > 0 ? voted / registered : 0;
                }
            });

            if (chartDataCategory) {
                chartType = 'stackedRow';
                let maxStackedTurnoutSum = 0;

                actualChartRows = Object.values(intermediateChartData).map(geoData => {
                    const segments: Array<{ label: string; turnoutRate: number; color: string }> = [];
                    let summedDemographicTurnoutRate = 0;

                    categoriesForChartLogic.forEach((cat, index) => {
                        const catData = geoData.categoryData?.[cat];
                        const turnout = catData?.turnout || 0;
                        segments.push({
                            label: cat,
                            turnoutRate: turnout,
                            color: categoryColorsForChart[index % categoryColorsForChart.length] || '#cccccc'
                        });
                        summedDemographicTurnoutRate += turnout; 
                    });
                    
                    if (summedDemographicTurnoutRate > maxStackedTurnoutSum) {
                        maxStackedTurnoutSum = summedDemographicTurnoutRate;
                    }

                    return {
                        geoLabel: geoData.geoLabel!,
                        segments: segments,
                        summedDemographicTurnoutRate: summedDemographicTurnoutRate,
                    };
                });
                xAxisMaxValue = maxStackedTurnoutSum > 0 ? Math.ceil(maxStackedTurnoutSum * 1.1 * 10) / 10 : 0.5; 
                actualChartRows.sort((a, b) => (a.summedDemographicTurnoutRate || 0) - (b.summedDemographicTurnoutRate || 0));

            } else { 
                chartType = 'bar';
                let maxOverallTurnout = 0;
                actualChartRows = Object.values(intermediateChartData).map(geoData => {
                    const overallTurnout = geoData.overallTurnoutRate || 0;
                    if (overallTurnout > maxOverallTurnout) {
                        maxOverallTurnout = overallTurnout;
                    }
                    return {
                        geoLabel: geoData.geoLabel!,
                        overallTurnoutRate: overallTurnout,
                    };
                });
                xAxisMaxValue = maxOverallTurnout > 0 ? Math.ceil(maxOverallTurnout * 1.1 * 10) / 10 : 0.5; 
                actualChartRows.sort((a, b) => (a.overallTurnoutRate || 0) - (b.overallTurnoutRate || 0));
            }
            
            payload.chart = {
                type: chartType,
                rows: actualChartRows,
                xAxisMax: xAxisMaxValue,
            };

        } catch (e: any) {
            console.error("Error executing or processing chart SQL:", e);
            throw new Error(`Failed to generate chart data: ${e.message}`);
        }
    } else {
        console.error('Invalid outputType specified:', outputType);
        throw new Error('Invalid outputType for data generation.');
    }

    return payload;
} 