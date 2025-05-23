-- Migration: 0022_add_census_population_race_data.sql
-- Purpose: Add population total and race breakdown columns to stg_processed_census_tract_data
--          Also add indices for filtering performance

-- Add new columns for population and race data from 2020 Decennial Census P1 table
ALTER TABLE public.stg_processed_census_tract_data
ADD COLUMN IF NOT EXISTS total_population INTEGER,
ADD COLUMN IF NOT EXISTS pop_white_alone INTEGER,
ADD COLUMN IF NOT EXISTS pop_black_alone INTEGER,
ADD COLUMN IF NOT EXISTS pop_american_indian_alone INTEGER,
ADD COLUMN IF NOT EXISTS pop_asian_alone INTEGER,
ADD COLUMN IF NOT EXISTS pop_pacific_islander_alone INTEGER,
ADD COLUMN IF NOT EXISTS pop_other_race_alone INTEGER,
ADD COLUMN IF NOT EXISTS decennial_data_year TEXT;

-- Add indices for filtering performance on commonly filtered columns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stg_census_median_income 
    ON public.stg_processed_census_tract_data (median_household_income);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stg_census_bachelors_degree 
    ON public.stg_processed_census_tract_data (pct_bachelors_degree_or_higher);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stg_census_unemployment 
    ON public.stg_processed_census_tract_data (unemployment_rate);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stg_census_total_population 
    ON public.stg_processed_census_tract_data (total_population);

-- Composite index for race data queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stg_census_race_data 
    ON public.stg_processed_census_tract_data (pop_white_alone, pop_black_alone, pop_asian_alone);

-- Add comments for the new columns
COMMENT ON COLUMN public.stg_processed_census_tract_data.total_population IS 'Total population from 2020 Decennial Census P1 table.';
COMMENT ON COLUMN public.stg_processed_census_tract_data.pop_white_alone IS 'Population: White alone from 2020 Decennial Census.';
COMMENT ON COLUMN public.stg_processed_census_tract_data.pop_black_alone IS 'Population: Black or African American alone from 2020 Decennial Census.';
COMMENT ON COLUMN public.stg_processed_census_tract_data.pop_american_indian_alone IS 'Population: American Indian and Alaska Native alone from 2020 Decennial Census.';
COMMENT ON COLUMN public.stg_processed_census_tract_data.pop_asian_alone IS 'Population: Asian alone from 2020 Decennial Census.';
COMMENT ON COLUMN public.stg_processed_census_tract_data.pop_pacific_islander_alone IS 'Population: Native Hawaiian and Other Pacific Islander alone from 2020 Decennial Census.';
COMMENT ON COLUMN public.stg_processed_census_tract_data.pop_other_race_alone IS 'Population: Some other race alone from 2020 Decennial Census.';
COMMENT ON COLUMN public.stg_processed_census_tract_data.decennial_data_year IS 'Year/source of the Decennial Census data (e.g., "2020 Decennial").'; 