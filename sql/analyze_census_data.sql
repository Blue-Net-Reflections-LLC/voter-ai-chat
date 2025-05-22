-- SQL query to analyze education and unemployment data in census tracts
-- This will help determine realistic bracket ranges for filters

-- 1. Get min, max, avg, and percentiles for Bachelor's degree rate
SELECT 
    'Bachelor''s Degree Rate' AS metric,
    MIN(pct_bachelors_degree_or_higher) AS min_value,
    MAX(pct_bachelors_degree_or_higher) AS max_value,
    AVG(pct_bachelors_degree_or_higher) AS avg_value,
    PERCENTILE_CONT(0.10) WITHIN GROUP (ORDER BY pct_bachelors_degree_or_higher) AS p10,
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY pct_bachelors_degree_or_higher) AS p25,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY pct_bachelors_degree_or_higher) AS p50_median,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY pct_bachelors_degree_or_higher) AS p75,
    PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY pct_bachelors_degree_or_higher) AS p90
FROM stg_processed_census_tract_data
WHERE pct_bachelors_degree_or_higher IS NOT NULL;

-- 2. Get frequency distribution for Bachelor's degree rate (bucketed into 5% ranges)
SELECT 
    FLOOR(pct_bachelors_degree_or_higher / 5) * 5 AS range_start,
    FLOOR(pct_bachelors_degree_or_higher / 5) * 5 + 5 AS range_end,
    COUNT(*) AS tract_count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM stg_processed_census_tract_data WHERE pct_bachelors_degree_or_higher IS NOT NULL), 2) AS percentage
FROM stg_processed_census_tract_data
WHERE pct_bachelors_degree_or_higher IS NOT NULL
GROUP BY FLOOR(pct_bachelors_degree_or_higher / 5)
ORDER BY range_start;

-- 3. Get min, max, avg, and percentiles for Unemployment rate
SELECT 
    'Unemployment Rate' AS metric,
    MIN(unemployment_rate) AS min_value,
    MAX(unemployment_rate) AS max_value,
    AVG(unemployment_rate) AS avg_value,
    PERCENTILE_CONT(0.10) WITHIN GROUP (ORDER BY unemployment_rate) AS p10,
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY unemployment_rate) AS p25,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY unemployment_rate) AS p50_median,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY unemployment_rate) AS p75,
    PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY unemployment_rate) AS p90
FROM stg_processed_census_tract_data
WHERE unemployment_rate IS NOT NULL;

-- 4. Get frequency distribution for Unemployment rate (bucketed into 1% ranges)
SELECT 
    FLOOR(unemployment_rate) AS range_start,
    FLOOR(unemployment_rate) + 1 AS range_end,
    COUNT(*) AS tract_count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM stg_processed_census_tract_data WHERE unemployment_rate IS NOT NULL), 2) AS percentage
FROM stg_processed_census_tract_data
WHERE unemployment_rate IS NOT NULL
GROUP BY FLOOR(unemployment_rate)
ORDER BY range_start;

-- 5. Get min, max, avg, and percentiles for Median Household Income
SELECT 
    'Median Household Income' AS metric,
    MIN(median_household_income) AS min_value,
    MAX(median_household_income) AS max_value,
    AVG(median_household_income) AS avg_value,
    PERCENTILE_CONT(0.10) WITHIN GROUP (ORDER BY median_household_income) AS p10,
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY median_household_income) AS p25,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY median_household_income) AS p50_median,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY median_household_income) AS p75,
    PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY median_household_income) AS p90
FROM stg_processed_census_tract_data
WHERE median_household_income IS NOT NULL;

-- 6. Get sample census tract data to verify the distributions
SELECT 
    tract_id,
    pct_bachelors_degree_or_higher,
    unemployment_rate,
    median_household_income
FROM stg_processed_census_tract_data
ORDER BY RANDOM()
LIMIT 20; 