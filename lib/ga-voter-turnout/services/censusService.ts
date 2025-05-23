/**
 * Census data integration service for Georgia Voter Turnout Analysis
 * Updated to support CVAP (Citizen Voting Age Population) data
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
                        -- Basic ACS Economics and Education Data
                        AVG(median_household_income)::numeric AS "avgMedianHouseholdIncome",
                        (AVG(pct_bachelors_degree_only) / 100.0)::numeric AS "avgPctBachelorsDegreeOnly",
                        (AVG(pct_bachelors_degree_or_higher) / 100.0)::numeric AS "avgPctBachelorsOrHigher",
                        (AVG(labor_force_participation_rate) / 100.0)::numeric AS "avgLaborForceParticipationRate",
                        (AVG(unemployment_rate) / 100.0)::numeric AS "avgUnemploymentRate",
                        (AVG(employment_rate) / 100.0)::numeric AS "avgEmploymentRate",
                        SUM(education_total_pop_25_plus)::numeric AS "totalEducationPop25Plus",
                        
                        -- Total population and race data from 2020 Decennial Census
                        SUM(total_population)::numeric AS "totalPopulation",
                        SUM(pop_white_alone)::numeric AS "totalPopWhiteAlone",
                        SUM(pop_black_alone)::numeric AS "totalPopBlackAlone",
                        SUM(pop_american_indian_alone)::numeric AS "totalPopAmericanIndianAlone",
                        SUM(pop_asian_alone)::numeric AS "totalPopAsianAlone",
                        SUM(pop_pacific_islander_alone)::numeric AS "totalPopPacificIslanderAlone",
                        SUM(pop_other_race_alone)::numeric AS "totalPopOtherRaceAlone",
                        
                        -- Calculate race percentages of total population
                        CASE 
                            WHEN SUM(total_population) > 0 THEN 
                                (SUM(pop_white_alone)::numeric / SUM(total_population)::numeric)
                            ELSE NULL 
                        END AS "pctPopWhiteAlone",
                        CASE 
                            WHEN SUM(total_population) > 0 THEN 
                                (SUM(pop_black_alone)::numeric / SUM(total_population)::numeric)
                            ELSE NULL 
                        END AS "pctPopBlackAlone",
                        CASE 
                            WHEN SUM(total_population) > 0 THEN 
                                (SUM(pop_asian_alone)::numeric / SUM(total_population)::numeric)
                            ELSE NULL 
                        END AS "pctPopAsianAlone",
                        CASE 
                            WHEN SUM(total_population) > 0 THEN 
                                ((SUM(pop_american_indian_alone) + SUM(pop_pacific_islander_alone) + SUM(pop_other_race_alone))::numeric / SUM(total_population)::numeric)
                            ELSE NULL 
                        END AS "pctPopOtherRaceAlone",
                        
                        -- CVAP (Citizen Voting Age Population) data - OFFICIAL Census Bureau data
                        SUM(cvap_total)::numeric AS "totalCvap",
                        SUM(cvap_white_alone)::numeric AS "totalCvapWhiteAlone",
                        SUM(cvap_black_alone)::numeric AS "totalCvapBlackAlone",
                        SUM(cvap_american_indian_alone)::numeric AS "totalCvapAmericanIndianAlone",
                        SUM(cvap_asian_alone)::numeric AS "totalCvapAsianAlone",
                        SUM(cvap_pacific_islander_alone)::numeric AS "totalCvapPacificIslanderAlone",
                        SUM(cvap_other_race_alone)::numeric AS "totalCvapOtherRaceAlone",
                        SUM(cvap_two_or_more_races)::numeric AS "totalCvapTwoOrMoreRaces",
                        SUM(cvap_hispanic_or_latino)::numeric AS "totalCvapHispanicOrLatino",
                        SUM(cvap_white_alone_not_hispanic)::numeric AS "totalCvapWhiteAloneNotHispanic",
                        
                        -- Calculate CVAP race percentages (Citizen Voting Age Population)
                        CASE 
                            WHEN SUM(cvap_total) > 0 THEN 
                                (SUM(cvap_white_alone)::numeric / SUM(cvap_total)::numeric)
                            ELSE NULL 
                        END AS "pctCvapWhiteAlone",
                        CASE 
                            WHEN SUM(cvap_total) > 0 THEN 
                                (SUM(cvap_black_alone)::numeric / SUM(cvap_total)::numeric)
                            ELSE NULL 
                        END AS "pctCvapBlackAlone",
                        CASE 
                            WHEN SUM(cvap_total) > 0 THEN 
                                (SUM(cvap_asian_alone)::numeric / SUM(cvap_total)::numeric)
                            ELSE NULL 
                        END AS "pctCvapAsianAlone",
                        CASE 
                            WHEN SUM(cvap_total) > 0 THEN 
                                (SUM(cvap_hispanic_or_latino)::numeric / SUM(cvap_total)::numeric)
                            ELSE NULL 
                        END AS "pctCvapHispanicOrLatino",
                        CASE 
                            WHEN SUM(cvap_total) > 0 THEN 
                                (SUM(cvap_white_alone_not_hispanic)::numeric / SUM(cvap_total)::numeric)
                            ELSE NULL 
                        END AS "pctCvapWhiteAloneNotHispanic",
                        CASE 
                            WHEN SUM(cvap_total) > 0 THEN 
                                ((SUM(cvap_american_indian_alone) + SUM(cvap_pacific_islander_alone) + SUM(cvap_other_race_alone) + SUM(cvap_two_or_more_races))::numeric / SUM(cvap_total)::numeric)
                            ELSE NULL 
                        END AS "pctCvapOtherRacesCombined",
                        
                        -- Data source tracking
                        STRING_AGG(DISTINCT tract_id, ', ' ORDER BY tract_id) AS "distinctTractIdsInGeography",
                        MAX(census_data_year) AS "censusDataSourceYear",
                        MAX(decennial_data_year) AS "decennialDataSourceYear",
                        MAX(cvap_data_year) AS "cvapDataSourceYear",
                        MAX(cvap_data_source) AS "cvapDataSource"
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