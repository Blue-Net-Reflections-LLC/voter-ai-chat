-- Migration: 0023_update_schema_for_cvap_data.sql
-- Purpose: Update schema to use official CVAP (Citizen Voting Age Population) data instead of calculated ACS data
--          CVAP provides accurate, pre-calculated 18+ citizen population by race from Census Bureau

-- Add comments to clarify data sources and rename fields for clarity
COMMENT ON COLUMN public.stg_processed_census_tract_data.pop_18_plus IS 'REPLACED: Total population 18+ years (will be replaced with CVAP data - Citizens 18+ only)';
COMMENT ON COLUMN public.stg_processed_census_tract_data.pop_18_plus_white_alone IS 'REPLACED: Population 18+ White alone (will be replaced with CVAP data - Citizens 18+ only)';
COMMENT ON COLUMN public.stg_processed_census_tract_data.pop_18_plus_black_alone IS 'REPLACED: Population 18+ Black alone (will be replaced with CVAP data - Citizens 18+ only)';
COMMENT ON COLUMN public.stg_processed_census_tract_data.pop_18_plus_american_indian_alone IS 'REPLACED: Population 18+ American Indian alone (will be replaced with CVAP data - Citizens 18+ only)';
COMMENT ON COLUMN public.stg_processed_census_tract_data.pop_18_plus_asian_alone IS 'REPLACED: Population 18+ Asian alone (will be replaced with CVAP data - Citizens 18+ only)';
COMMENT ON COLUMN public.stg_processed_census_tract_data.pop_18_plus_pacific_islander_alone IS 'REPLACED: Population 18+ Pacific Islander alone (will be replaced with CVAP data - Citizens 18+ only)';
COMMENT ON COLUMN public.stg_processed_census_tract_data.pop_18_plus_other_race_alone IS 'REPLACED: Population 18+ Other race alone (will be replaced with CVAP data - Citizens 18+ only)';
COMMENT ON COLUMN public.stg_processed_census_tract_data.pop_18_plus_hispanic IS 'REPLACED: Population 18+ Hispanic (will be replaced with CVAP data - Citizens 18+ only)';

-- Add new CVAP-specific columns
ALTER TABLE public.stg_processed_census_tract_data
ADD COLUMN IF NOT EXISTS cvap_data_year TEXT,
ADD COLUMN IF NOT EXISTS cvap_total INTEGER,
ADD COLUMN IF NOT EXISTS cvap_white_alone INTEGER,
ADD COLUMN IF NOT EXISTS cvap_black_alone INTEGER,
ADD COLUMN IF NOT EXISTS cvap_american_indian_alone INTEGER,
ADD COLUMN IF NOT EXISTS cvap_asian_alone INTEGER,
ADD COLUMN IF NOT EXISTS cvap_pacific_islander_alone INTEGER,
ADD COLUMN IF NOT EXISTS cvap_other_race_alone INTEGER,
ADD COLUMN IF NOT EXISTS cvap_two_or_more_races INTEGER,
ADD COLUMN IF NOT EXISTS cvap_hispanic_or_latino INTEGER,
ADD COLUMN IF NOT EXISTS cvap_white_alone_not_hispanic INTEGER,
ADD COLUMN IF NOT EXISTS cvap_data_source TEXT DEFAULT 'CVAP 2019-2023 ACS 5-Year';

-- Add comments for new CVAP columns
COMMENT ON COLUMN public.stg_processed_census_tract_data.cvap_data_year IS 'Year/source of CVAP data (e.g., "2019-2023 ACS 5-Year")';
COMMENT ON COLUMN public.stg_processed_census_tract_data.cvap_total IS 'Total Citizen Voting Age Population (18+ citizens) from CVAP Special Tabulation';
COMMENT ON COLUMN public.stg_processed_census_tract_data.cvap_white_alone IS 'CVAP: White alone (non-Hispanic)';
COMMENT ON COLUMN public.stg_processed_census_tract_data.cvap_black_alone IS 'CVAP: Black or African American alone';
COMMENT ON COLUMN public.stg_processed_census_tract_data.cvap_american_indian_alone IS 'CVAP: American Indian and Alaska Native alone';
COMMENT ON COLUMN public.stg_processed_census_tract_data.cvap_asian_alone IS 'CVAP: Asian alone';
COMMENT ON COLUMN public.stg_processed_census_tract_data.cvap_pacific_islander_alone IS 'CVAP: Native Hawaiian and Other Pacific Islander alone';
COMMENT ON COLUMN public.stg_processed_census_tract_data.cvap_other_race_alone IS 'CVAP: Some other race alone';
COMMENT ON COLUMN public.stg_processed_census_tract_data.cvap_two_or_more_races IS 'CVAP: Two or more races';
COMMENT ON COLUMN public.stg_processed_census_tract_data.cvap_hispanic_or_latino IS 'CVAP: Hispanic or Latino (any race)';
COMMENT ON COLUMN public.stg_processed_census_tract_data.cvap_white_alone_not_hispanic IS 'CVAP: White alone, not Hispanic or Latino';
COMMENT ON COLUMN public.stg_processed_census_tract_data.cvap_data_source IS 'Source description of CVAP data';

-- Add indices for new CVAP columns for filtering performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stg_census_cvap_total 
    ON public.stg_processed_census_tract_data (cvap_total);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stg_census_cvap_race_data 
    ON public.stg_processed_census_tract_data (cvap_white_alone, cvap_black_alone, cvap_asian_alone, cvap_hispanic_or_latino); 