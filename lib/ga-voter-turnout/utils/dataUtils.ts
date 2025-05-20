/**
 * Data processing utilities for Georgia Voter Turnout Analysis
 */

import { ProcessedReportRow } from '../types';

/**
 * Calculate aggregations based on report rows
 */
export function calculateAggregations(reportRows: ProcessedReportRow[]): Record<string, any> {
    let grandTotalRegisteredOverall = 0;
    let grandTotalVotedOverall = 0;
    const breakdownSums: Record<string, { sumRegistered: number; sumVoted: number }> = {};
    const censusSums: Record<string, { sumValue: number; count: number }> = {};
    const censusNonNumericKeys = ['distincttractidsingeography', 'censusdatasourcetyear']; // lowercase

    reportRows.forEach(row => {
        grandTotalRegisteredOverall += row.totalRegistered;
        grandTotalVotedOverall += row.totalVoted;

        Object.entries(row.breakdowns).forEach(([key, breakdown]) => {
            if (!breakdownSums[key]) {
                breakdownSums[key] = { sumRegistered: 0, sumVoted: 0 };
            }
            breakdownSums[key].sumRegistered += breakdown.registered;
            breakdownSums[key].sumVoted += breakdown.voted;
        });

        if (row.censusData) {
            Object.entries(row.censusData).forEach(([key, value]) => {
                const lowerKey = key.toLowerCase();
                if (!censusNonNumericKeys.includes(lowerKey)) {
                    const numValue = typeof value === 'string' ? parseFloat(value) : value as number;
                    if (typeof numValue === 'number' && !isNaN(numValue)) {
                        if (!censusSums[key]) {
                            censusSums[key] = { sumValue: 0, count: 0 };
                        }
                        censusSums[key].sumValue += numValue;
                        censusSums[key].count += 1;
                    }
                }
            });
        }
    });

    const aggregations: Record<string, any> = {
        grandTotalRegistered: grandTotalRegisteredOverall,
        grandTotalVoted: grandTotalVotedOverall,
        averageOverallTurnoutRate: grandTotalRegisteredOverall > 0 ? grandTotalVotedOverall / grandTotalRegisteredOverall : 0,
    };

    Object.entries(breakdownSums).forEach(([key, sums]) => {
        aggregations[`${key}_totalRegistered`] = sums.sumRegistered;
        aggregations[`${key}_totalVoted`] = sums.sumVoted;
        aggregations[`${key}_averageTurnoutRate`] = sums.sumRegistered > 0 ? sums.sumVoted / sums.sumRegistered : 0;
    });

    Object.entries(censusSums).forEach(([key, sums]) => {
        if (sums.count > 0) {
            // Always provide the average for numeric census fields
            aggregations[`avg_${key}`] = sums.sumValue / sums.count;

            // If the original key itself implies it's a sum (e.g., starts with "total", includes "pop", ends with "plus")
            // then also provide the grand total.
            const lowerKey = key.toLowerCase();
            if (lowerKey.startsWith('total') || lowerKey.includes('pop') || lowerKey.endsWith('plus')) {
                aggregations[`grandTotal_${key}`] = sums.sumValue;
            }
        }
    });

    return aggregations;
}

/**
 * Generates SQL expressions for demographic breakdowns based on dimensions and categories
 */
export function generateBreakdownExpressions(
    dimensions: Array<'Race' | 'Gender' | 'AgeRange'>,
    electionYearForAgeCalc: number,
    getDemographicConditionSQL: (dimension: string, category: string, electionYearForAgeCalc: number) => string
): { combinations: Array<{ key: string, sqlConditions: string[] }>, sqlExpressions: string[] } {
    const combinations: Array<{ key: string, sqlConditions: string[] }> = [];
    const sqlExpressions: string[] = [];
    
    const { 
        RACE_CATEGORIES, 
        GENDER_CATEGORIES, 
        AGE_RANGE_KEYS 
    } = require('../constants');

    // Generate combinations based on selected dimensions
    if (dimensions.length === 1) {
        const dim = dimensions[0];
        const categories = dim === 'Race' ? RACE_CATEGORIES : 
                           dim === 'Gender' ? GENDER_CATEGORIES : 
                           AGE_RANGE_KEYS;
        
        categories.forEach((cat: string) => {
            const key = `${dim}:${cat}`;
            const sqlCondition = getDemographicConditionSQL(dim, cat, electionYearForAgeCalc);
            combinations.push({
                key,
                sqlConditions: [sqlCondition]
            });
            
            const aliasSuffix = key.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_|_$/g, '');
            
            sqlExpressions.push(
                `COUNT(DISTINCT CASE WHEN ${sqlCondition} THEN vrl.voter_registration_number ELSE NULL END) AS registered_${aliasSuffix}`,
                `SUM(CASE WHEN ${sqlCondition} AND vrl.voting_events @> '[{"election_date": "#ELECTION_DATE#"}]'::jsonb THEN 1 ELSE 0 END) AS voted_${aliasSuffix}`
            );
        });
    } else if (dimensions.length === 2) {
        const [dim1, dim2] = dimensions;
        const categories1 = dim1 === 'Race' ? RACE_CATEGORIES : 
                            dim1 === 'Gender' ? GENDER_CATEGORIES : 
                            AGE_RANGE_KEYS;
        const categories2 = dim2 === 'Race' ? RACE_CATEGORIES : 
                            dim2 === 'Gender' ? GENDER_CATEGORIES : 
                            AGE_RANGE_KEYS;
        
        categories1.forEach((cat1: string) => {
            categories2.forEach((cat2: string) => {
                const key = `${dim1}:${cat1}_${dim2}:${cat2}`;
                const sqlCondition1 = getDemographicConditionSQL(dim1, cat1, electionYearForAgeCalc);
                const sqlCondition2 = getDemographicConditionSQL(dim2, cat2, electionYearForAgeCalc);
                
                combinations.push({
                    key,
                    sqlConditions: [sqlCondition1, sqlCondition2]
                });
                
                const aliasSuffix = key.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_|_$/g, '');
                const combinedCondition = `${sqlCondition1} AND ${sqlCondition2}`;
                
                sqlExpressions.push(
                    `COUNT(DISTINCT CASE WHEN ${combinedCondition} THEN vrl.voter_registration_number ELSE NULL END) AS registered_${aliasSuffix}`,
                    `SUM(CASE WHEN ${combinedCondition} AND vrl.voting_events @> '[{"election_date": "#ELECTION_DATE#"}]'::jsonb THEN 1 ELSE 0 END) AS voted_${aliasSuffix}`
                );
            });
        });
    } else if (dimensions.length === 3) {
        // Similar logic for 3 dimensions
        // Omitted for brevity, but would follow the same pattern
    }
    
    return { combinations, sqlExpressions };
} 