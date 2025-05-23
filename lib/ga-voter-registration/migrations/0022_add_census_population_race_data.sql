-- Migration: 0022_add_census_population_race_data.sql
-- Purpose: Add population total and 18+ breakdown columns to stg_processed_census_tract_data
--          Also add indices for filtering performance

-- Add new columns for total population and race data from 2020 Decennial Census P1 table
ALTER TABLE public.stg_processed_census_tract_data
ADD COLUMN IF NOT EXISTS total_population INTEGER,
ADD COLUMN IF NOT EXISTS pop_white_alone INTEGER,
ADD COLUMN IF NOT EXISTS pop_black_alone INTEGER,
ADD COLUMN IF NOT EXISTS pop_american_indian_alone INTEGER,
ADD COLUMN IF NOT EXISTS pop_asian_alone INTEGER,
ADD COLUMN IF NOT EXISTS pop_pacific_islander_alone INTEGER,
ADD COLUMN IF NOT EXISTS pop_other_race_alone INTEGER,
ADD COLUMN IF NOT EXISTS decennial_data_year TEXT,
-- Add columns for population 18+ and race data from ACS B01001A-I tables
ADD COLUMN IF NOT EXISTS pop_18_plus INTEGER,
ADD COLUMN IF NOT EXISTS pop_18_plus_white_alone INTEGER,
ADD COLUMN IF NOT EXISTS pop_18_plus_black_alone INTEGER,
ADD COLUMN IF NOT EXISTS pop_18_plus_american_indian_alone INTEGER,
ADD COLUMN IF NOT EXISTS pop_18_plus_asian_alone INTEGER,
ADD COLUMN IF NOT EXISTS pop_18_plus_pacific_islander_alone INTEGER,
ADD COLUMN IF NOT EXISTS pop_18_plus_other_race_alone INTEGER,
ADD COLUMN IF NOT EXISTS pop_18_plus_hispanic INTEGER;

-- Add indices for filtering performance on commonly filtered columns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stg_census_median_income 
    ON public.stg_processed_census_tract_data (median_household_income);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stg_census_bachelors_degree 
    ON public.stg_processed_census_tract_data (pct_bachelors_degree_or_higher);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stg_census_unemployment 
    ON public.stg_processed_census_tract_data (unemployment_rate);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stg_census_total_population 
    ON public.stg_processed_census_tract_data (total_population);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stg_census_pop_18_plus 
    ON public.stg_processed_census_tract_data (pop_18_plus);

-- Composite index for race data queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stg_census_race_data 
    ON public.stg_processed_census_tract_data (pop_white_alone, pop_black_alone, pop_asian_alone);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stg_census_race_18_plus_data 
    ON public.stg_processed_census_tract_data (pop_18_plus_white_alone, pop_18_plus_black_alone, pop_18_plus_asian_alone);

-- Add comments for the new columns
COMMENT ON COLUMN public.stg_processed_census_tract_data.total_population IS 'Total population from 2020 Decennial Census P1 table.';
COMMENT ON COLUMN public.stg_processed_census_tract_data.pop_white_alone IS 'Population: White alone from 2020 Decennial Census.';
COMMENT ON COLUMN public.stg_processed_census_tract_data.pop_black_alone IS 'Population: Black or African American alone from 2020 Decennial Census.';
COMMENT ON COLUMN public.stg_processed_census_tract_data.pop_american_indian_alone IS 'Population: American Indian and Alaska Native alone from 2020 Decennial Census.';
COMMENT ON COLUMN public.stg_processed_census_tract_data.pop_asian_alone IS 'Population: Asian alone from 2020 Decennial Census.';
COMMENT ON COLUMN public.stg_processed_census_tract_data.pop_pacific_islander_alone IS 'Population: Native Hawaiian and Other Pacific Islander alone from 2020 Decennial Census.';
COMMENT ON COLUMN public.stg_processed_census_tract_data.pop_other_race_alone IS 'Population: Some other race alone from 2020 Decennial Census.';
COMMENT ON COLUMN public.stg_processed_census_tract_data.decennial_data_year IS 'Year/source of the Decennial Census data (e.g., "2020 Decennial").';
COMMENT ON COLUMN public.stg_processed_census_tract_data.pop_18_plus IS 'Total population 18 years and over from ACS B01001 table.';
COMMENT ON COLUMN public.stg_processed_census_tract_data.pop_18_plus_white_alone IS 'Population 18+: White alone from ACS B01001A table.';
COMMENT ON COLUMN public.stg_processed_census_tract_data.pop_18_plus_black_alone IS 'Population 18+: Black or African American alone from ACS B01001B table.';
COMMENT ON COLUMN public.stg_processed_census_tract_data.pop_18_plus_american_indian_alone IS 'Population 18+: American Indian and Alaska Native alone from ACS B01001C table.';
COMMENT ON COLUMN public.stg_processed_census_tract_data.pop_18_plus_asian_alone IS 'Population 18+: Asian alone from ACS B01001D table.';
COMMENT ON COLUMN public.stg_processed_census_tract_data.pop_18_plus_pacific_islander_alone IS 'Population 18+: Native Hawaiian and Other Pacific Islander alone from ACS B01001E table.';
COMMENT ON COLUMN public.stg_processed_census_tract_data.pop_18_plus_other_race_alone IS 'Population 18+: Some other race alone from ACS B01001F table.';
COMMENT ON COLUMN public.stg_processed_census_tract_data.pop_18_plus_hispanic IS 'Population 18+: Hispanic or Latino from ACS B01001I table.'; 