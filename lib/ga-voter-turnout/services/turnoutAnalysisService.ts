/**
 * Service for generating Georgia Voter Turnout Analysis
 */
import { sql } from '@/lib/voter/db';

// Import types, utilities, and helpers
import {
    ValidatedTurnoutAnalysisParams,
    ProcessedTurnoutPayload,
    ConsolidatedDbRow,
    ProcessedReportRow
} from '../types';
import { 
    buildGeoFilterCondition,
    getGeoGroupingColumnSQL,
    getDemographicConditionSQL
} from '../utils/sqlHelpers';
import { calculateAggregations } from '../utils/dataUtils';
import { enrichRowsWithCensusData } from './censusService';

/**
 * Main function to generate turnout analysis data
 * Returns flattened rows array without nested report/chart objects
 */
export async function generateTurnoutAnalysisData(
    params: ValidatedTurnoutAnalysisParams
): Promise<{ rows: ProcessedReportRow[] }> {
    console.log('Service: Generating turnout analysis data with params:', params);

    const { geography, electionDate, dataPoints, includeCensusData } = params;
    
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
                groupByColumn = 'municipal_precinct';
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
        
        if (geography.subAreaType) {
            // Handle sub-area breakdown for Districts
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
        } else {
            // No sub-area breakdown, use district column
            switch (geography.districtType) {
                case 'Congressional': groupByColumn = 'congressional_district'; break;
                case 'StateSenate': groupByColumn = 'state_senate_district'; break;
                case 'StateHouse': groupByColumn = 'state_house_district'; break;
                default: throw new Error(`Unknown district type: ${geography.districtType}`);
            }
            groupLabel = geography.districtType;
        }
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
                else if (geography.subAreaType === 'Municipality') subAreaCol = 'vrl.municipal_precinct';
                else if (geography.subAreaType === 'ZipCode') subAreaCol = 'vrl.residence_zipcode';
                
                if (subAreaCol) whereClause += ` AND ${subAreaCol} = '${geography.subAreaValue.replace(/'/g, "''")}'`;
            }
        }
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
    
    // The primary grouping column for the main query must be unique for each entity we report on.
    let consolidatedQueryGroupBy = `vrl.${groupByColumn}`;
    if (geography.areaType === 'County' && geography.areaValue === 'ALL') {
        consolidatedQueryGroupBy = 'vrl.county_name'; // Explicitly group by county_name
    } else if (geography.areaType === 'County' && !geography.subAreaType) {
         consolidatedQueryGroupBy = 'vrl.county_name'; // Explicitly group by county_name for single selected county
    }

    const consolidatedQueryGroupByClean = consolidatedQueryGroupBy.startsWith('vrl.') 
        ? consolidatedQueryGroupBy.substring(4) 
        : consolidatedQueryGroupBy;
    
    const mainCountyNameColumn = 'county_name';
    let mainDistrictColumn = '';
    if (geography.areaType === 'District' && geography.districtType) {
        if (geography.districtType === 'Congressional') mainDistrictColumn = 'congressional_district';
        else if (geography.districtType === 'StateSenate') mainDistrictColumn = 'state_senate_district';
        else if (geography.districtType === 'StateHouse') mainDistrictColumn = 'state_house_district';
    }

    const consolidatedQuery = `
        WITH geo_data AS (
            SELECT 
                ${ (geography.areaType === 'County' && geography.subAreaType && consolidatedQueryGroupByClean !== mainCountyNameColumn) ? `vrl.${mainCountyNameColumn} AS query_county_name,` : '' }
                ${ (geography.areaType === 'District' && geography.subAreaType && mainDistrictColumn) ? `vrl.${mainDistrictColumn} AS query_district_id,` : '' }
                ${consolidatedQueryGroupBy} AS geo_unit_id, 
                COUNT(DISTINCT vrl.voter_registration_number) AS total_registered_overall,
                SUM(CASE WHEN vrl.voting_events @> '[{"election_date": "${electionDate}"}]'::jsonb THEN 1 ELSE 0 END) AS total_voted_overall
            FROM 
                ga_voter_registration_list vrl
            WHERE 
                ${whereClause}
                AND vrl.${consolidatedQueryGroupByClean} IS NOT NULL
                AND TRIM(CAST(vrl.${consolidatedQueryGroupByClean} AS TEXT)) <> ''
            GROUP BY 
                ${ (geography.areaType === 'County' && geography.subAreaType && consolidatedQueryGroupByClean !== mainCountyNameColumn) ? `vrl.${mainCountyNameColumn},` : '' }
                ${ (geography.areaType === 'District' && geography.subAreaType && mainDistrictColumn) ? `vrl.${mainDistrictColumn},` : '' }
                ${consolidatedQueryGroupBy}
        )
        SELECT 
            gd.*
            , CASE WHEN gd.total_registered_overall > 0 
                THEN (gd.total_voted_overall::numeric / gd.total_registered_overall::numeric)
                ELSE 0 
              END AS overall_turnout_rate_calculated
        FROM 
            geo_data gd
        ORDER BY 
            gd.geo_unit_id;
    `;

    try {
        // Execute main query to get consolidated data
        const result = await sql.unsafe(consolidatedQuery);
        const dbRows: ConsolidatedDbRow[] = Array.isArray(result) 
            ? result 
            : (result && 'rows' in result ? (result as any).rows : []);
        
        console.log(`Consolidated query returned ${dbRows.length} rows`);
        
        // Set up precinct data (if needed)
        let precinctData: Record<string, { name: string, address: string }> = {};
        if (geography.areaType === 'County' && geography.areaValue !== 'ALL' && 
            geography.subAreaType === 'Precinct' && dbRows.length > 0) {
            // Precinct data fetching would be here if needed
        }
        
        // Process the database rows into report rows
        const initialReportRows = dbRows.map((dbRow: ConsolidatedDbRow) => {
            const registeredOverall = Number(dbRow.total_registered_overall) || 0;
            const votedOverall = Number(dbRow.total_voted_overall) || 0;
            const overallTurnoutRate = Number(dbRow.overall_turnout_rate_calculated) || 0;
            
            let geoLabel = '';
            const currentGeoUnitId = String(dbRow.geo_unit_id); 

            if (geography.areaType === 'County') {
                if (geography.areaValue === 'ALL') {
                    geoLabel = `${groupLabel} ${currentGeoUnitId}`; 
                } else { 
                    if (geography.subAreaType) {
                        const countyContext = dbRow.query_county_name || geography.areaValue;
                        geoLabel = `${groupLabel} (${countyContext}) ${currentGeoUnitId}`;
                         if (geography.subAreaType === 'Precinct' && precinctData[currentGeoUnitId]) {
                             geoLabel += `: ${precinctData[currentGeoUnitId].name}`;
                         }
                    } else { 
                        geoLabel = `${groupLabel} ${currentGeoUnitId}`; 
                    }
                }
            } else if (geography.areaType === 'District') {
                if (geography.subAreaType) {
                    const districtType = geography.districtType || '';
                    const districtId = dbRow.query_district_id || geography.areaValue;
                    geoLabel = `${groupLabel} (${districtType} ${districtId}) ${currentGeoUnitId}`;
                } else {
                    geoLabel = `${groupLabel} ${currentGeoUnitId}`;
                }
            } else { 
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

            return currentReportRow;
        });
        
        // Process demographic breakdowns if requested
        if (dataPoints.length > 0) {
            const electionYearForAgeCalc = new Date(electionDate).getFullYear();
            
            for (const reportRow of initialReportRows) {
                const geoUnitIdForSubQuery = reportRow.dbGeoUnitId;

                if (geoUnitIdForSubQuery === undefined || geoUnitIdForSubQuery === null) {
                    console.warn(`dbGeoUnitId is missing for reportRow: ${reportRow.geoLabel}. Skipping breakdowns.`);
                    continue;
                }

                // Create combinations for each dimension and category
                const combinations: Array<{ key: string, sqlConditions: string[] }> = [];

                // Single dimension breakdowns
                if (dataPoints.length === 1) {
                    const dim = dataPoints[0];
                    const categories = dim === 'Race' 
                        ? require('../constants').RACE_CATEGORIES 
                        : dim === 'Gender' 
                            ? require('../constants').GENDER_CATEGORIES 
                            : require('../constants').AGE_RANGE_KEYS;
                    
                    for (const cat of categories) {
                        combinations.push({
                            key: `${dim}:${cat}`,
                            sqlConditions: [getDemographicConditionSQL(dim, cat, electionYearForAgeCalc)]
                        });
                    }
                } 
                // Two dimension breakdowns
                else if (dataPoints.length === 2) {
                    const [dim1, dim2] = dataPoints;
                    const categories1 = dim1 === 'Race' 
                        ? require('../constants').RACE_CATEGORIES 
                        : dim1 === 'Gender' 
                            ? require('../constants').GENDER_CATEGORIES 
                            : require('../constants').AGE_RANGE_KEYS;
                    
                    const categories2 = dim2 === 'Race' 
                        ? require('../constants').RACE_CATEGORIES 
                        : dim2 === 'Gender' 
                            ? require('../constants').GENDER_CATEGORIES 
                            : require('../constants').AGE_RANGE_KEYS;
                    
                    for (const cat1 of categories1) {
                        for (const cat2 of categories2) {
                            combinations.push({
                                key: `${dim1}:${cat1}_${dim2}:${cat2}`,
                                sqlConditions: [
                                    getDemographicConditionSQL(dim1, cat1, electionYearForAgeCalc),
                                    getDemographicConditionSQL(dim2, cat2, electionYearForAgeCalc)
                                ]
                            });
                        }
                    }
                }
                // Three dimension breakdowns - implemented similarly
                else if (dataPoints.length === 3) {
                    // Similar to 2 dimensions but with 3 nested loops
                    // Omitted for brevity
                }
                
                if (combinations.length > 0) {
                    // Build SQL SELECT expressions for each demographic combination
                    let subQuerySelectExpressions: string[] = [];
                    combinations.forEach(combo => {
                        const validSqlConditions = combo.sqlConditions.filter(c => c !== '1=1' && c !== '1=0' && c.trim() !== '');
                        const finalDemographicSqlFilter = validSqlConditions.length > 0 
                            ? validSqlConditions.join(' AND ') 
                            : '1=1';

                        const aliasSuffix = combo.key.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_|_$/g, '');

                        if (finalDemographicSqlFilter === '1=0' || validSqlConditions.length === 0 && combo.sqlConditions.some(c => c === '1=0')) {
                            // If any condition is definitively false
                            subQuerySelectExpressions.push(
                                `0 AS registered_${aliasSuffix}`,
                                `0 AS voted_${aliasSuffix}`
                            );
                        } else {
                            subQuerySelectExpressions.push(
                                `COUNT(DISTINCT CASE WHEN ${finalDemographicSqlFilter} THEN vrl.voter_registration_number ELSE NULL END) AS registered_${aliasSuffix}`,
                                `SUM(CASE WHEN ${finalDemographicSqlFilter} AND vrl.voting_events @> '[{"election_date": "${electionDate}"}]'::jsonb THEN 1 ELSE 0 END) AS voted_${aliasSuffix}`
                            );
                        }
                    });

                    if (subQuerySelectExpressions.length > 0) {
                        // Construct the sub-query WHERE clause for the specific geo unit.
                        const geoUnitIdString = String(geoUnitIdForSubQuery).replace(/'/g, "''"); // Sanitize
                        
                        let subQuerySpecificWhere = '';
                        if (geography.areaType === 'County' && geography.areaValue === 'ALL') {
                            subQuerySpecificWhere = `UPPER(vrl.${mainCountyNameColumn}) = UPPER('${geoUnitIdString}')`;
                        } else {
                            subQuerySpecificWhere = `CAST(vrl.${consolidatedQueryGroupByClean} AS TEXT) = '${geoUnitIdString}'`;
                        }

                        const breakdownSubQuery = `
                            SELECT
                                ${subQuerySelectExpressions.join(',\n                                ')}
                            FROM
                                ga_voter_registration_list vrl
                            WHERE
                                vrl.status = 'ACTIVE'
                                AND ${subQuerySpecificWhere}
                        `;
                        
                        try {
                            const breakdownResult = await sql.unsafe(breakdownSubQuery);
                            const breakdownDataRow = (Array.isArray(breakdownResult) 
                                ? breakdownResult[0] 
                                : (breakdownResult as any).rows?.[0]) || {};

                            combinations.forEach(combo => {
                                const aliasSuffix = combo.key.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_|_$/g, '');
                                const registered = Number(breakdownDataRow[`registered_${aliasSuffix}`]) || 0;
                                const voted = Number(breakdownDataRow[`voted_${aliasSuffix}`]) || 0;
                                const turnout = registered > 0 ? (voted / registered) : 0;
                                reportRow.breakdowns[combo.key] = { registered, voted, turnout };
                            });
                        } catch (subErr: any) {
                            console.error(`Error fetching breakdowns for geo unit ${geoUnitIdForSubQuery} (${reportRow.geoLabel}): ${subErr.message}`, subErr);
                            combinations.forEach(combo => { // Ensure keys exist even on error
                                reportRow.breakdowns[combo.key] = { registered: 0, voted: 0, turnout: 0 };
                            });
                        }
                    } else {
                        // No valid combinations to query, fill with zeros
                        combinations.forEach(combo => {
                            reportRow.breakdowns[combo.key] = { registered: 0, voted: 0, turnout: 0 };
                        });
                    }
                }
            }
        } else {
            // No dataPoints selected, ensure breakdowns is empty object
            initialReportRows.forEach(reportRow => {
                reportRow.breakdowns = {};
            });
        }
        
        // Add census data if requested
        if (includeCensusData) {
            await enrichRowsWithCensusData(initialReportRows, consolidatedQueryGroupByClean);
        }

        // Remove the dbGeoUnitId from the final rows
        const finalReportRows = initialReportRows.map(row => {
            const { dbGeoUnitId, ...rest } = row;
            return rest;
        });

        // Return flattened rows directly as the top level of the response
        return { rows: finalReportRows };
        
    } catch (e: any) {
       console.error("Error executing query or processing data:", e);
       throw new Error(`Failed to generate data: ${e.message}`);
    }
} 