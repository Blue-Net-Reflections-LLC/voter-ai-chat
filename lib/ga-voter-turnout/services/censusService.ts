/**
 * Census data integration service for Georgia Voter Turnout Analysis
 */

import { sql } from '@/lib/voter/db';
import { ProcessedReportRow } from '../types';

/**
 * Fetches and integrates census data for the provided report rows
 */
export async function enrichRowsWithCensusData(
    reportRows: Array<ProcessedReportRow & { dbGeoUnitId: string | number }>,
    geoLinkColumnInVRL: string
): Promise<void> {
    for (const reportRow of reportRows) {
        try {
            const geoUnitIdStringForCensus = String(reportRow.dbGeoUnitId).replace(/'/g, "''");
            const censusQuerySpecificWhere = `CAST(vrl.${geoLinkColumnInVRL} AS TEXT) = '${geoUnitIdStringForCensus}'`;

            const tractsQuery = `
                SELECT DISTINCT vrl.census_tract
                FROM ga_voter_registration_list vrl
                WHERE ${censusQuerySpecificWhere}
                  AND vrl.census_tract IS NOT NULL
                  AND TRIM(vrl.census_tract) <> '';
            `;

            const tractResult = await sql.unsafe(tractsQuery);
            const tractRows: { census_tract: string }[] = Array.isArray(tractResult) 
                ? tractResult 
                : (tractResult && 'rows' in tractResult ? (tractResult as any).rows : []);
            
            const tractIds = tractRows.map(r => r.census_tract).filter(t => t);

            if (tractIds.length > 0) {
                const censusDataQuery = `
                    SELECT
                        AVG(median_household_income)::numeric AS "avgMedianHouseholdIncome",
                        (AVG(pct_bachelors_degree_only) / 100.0)::numeric AS "avgPctBachelorsDegreeOnly",
                        (AVG(pct_bachelors_degree_or_higher) / 100.0)::numeric AS "avgPctBachelorsOrHigher",
                        (AVG(labor_force_participation_rate) / 100.0)::numeric AS "avgLaborForceParticipationRate",
                        (AVG(unemployment_rate) / 100.0)::numeric AS "avgUnemploymentRate",
                        (AVG(employment_rate) / 100.0)::numeric AS "avgEmploymentRate",
                        SUM(education_total_pop_25_plus)::numeric AS "totalEducationPop25Plus",
                        STRING_AGG(DISTINCT tract_id, ', ' ORDER BY tract_id) AS "distinctTractIdsInGeography",
                        MAX(census_data_year) AS "censusDataSourceYear"
                    FROM stg_processed_census_tract_data
                    WHERE tract_id IN (${tractIds.map(id => `'${id.replace(/'/g, "''")}'`).join(',')});
                `;
                
                const censusResult = await sql.unsafe(censusDataQuery);
                const censusData = (Array.isArray(censusResult) 
                    ? censusResult[0] 
                    : (censusResult as any).rows?.[0]) || {};
                
                reportRow.censusData = censusData;
            } else {
                console.log(`No census tracts found for ${reportRow.geoLabel}`);
                reportRow.censusData = {};
            }
        } catch (censusErr: any) {
            console.error(`Error fetching census data for ${reportRow.geoLabel}: ${censusErr.message}`, censusErr);
            reportRow.censusData = {}; // Ensure censusData key exists even on error
        }
    }
} 