-- Migration: 0021_add_precinct_indexes.sql
-- Purpose: Add indexes for precinct columns to optimize queries filtering by precinct

-- =============================================
-- Indexes for GA_VOTER_REGISTRATION_LIST table
-- =============================================

-- Add index for county_precinct
CREATE INDEX IF NOT EXISTS idx_ga_voter_reg_list_county_precinct
ON public.ga_voter_registration_list USING btree (county_precinct);

-- Add index for municipal_precinct
CREATE INDEX IF NOT EXISTS idx_ga_voter_reg_list_municipal_precinct
ON public.ga_voter_registration_list USING btree (municipal_precinct);

-- Add index for county_precinct_description
CREATE INDEX IF NOT EXISTS idx_ga_voter_reg_list_county_precinct_desc
ON public.ga_voter_registration_list USING btree (county_precinct_description);

-- Add a composite index for county_code + county_precinct
-- This will help with queries that filter by both county and precinct
CREATE INDEX IF NOT EXISTS idx_ga_voter_reg_list_county_code_precinct
ON public.ga_voter_registration_list USING btree (county_code, county_precinct);

-- =============================================
-- Indexes for REFERENCE_DATA table
-- =============================================

-- Add index for lookup_meta (gin index for JSONB)
CREATE INDEX IF NOT EXISTS idx_reference_data_lookup_meta
ON public.REFERENCE_DATA USING gin (lookup_meta);

-- Add index for lookup_key to speed up direct code lookups
CREATE INDEX IF NOT EXISTS idx_reference_data_lookup_key
ON public.REFERENCE_DATA USING btree (lookup_key);

-- Add composite index for the common lookup pattern we use for precincts
CREATE INDEX IF NOT EXISTS idx_reference_data_precinct_lookup
ON public.REFERENCE_DATA USING btree (lookup_type, state_code, county_code, lookup_key)
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC';

-- Log completion
COMMENT ON INDEX idx_ga_voter_reg_list_county_precinct IS 'Added in migration 0021 to optimize precinct filtering';
COMMENT ON INDEX idx_ga_voter_reg_list_municipal_precinct IS 'Added in migration 0021 to optimize precinct filtering';
COMMENT ON INDEX idx_ga_voter_reg_list_county_precinct_desc IS 'Added in migration 0021 to optimize precinct filtering';
COMMENT ON INDEX idx_ga_voter_reg_list_county_code_precinct IS 'Added in migration 0021 to optimize county+precinct filtering';
COMMENT ON INDEX idx_reference_data_lookup_meta IS 'Added in migration 0021 to optimize JSONB queries on facility data';
COMMENT ON INDEX idx_reference_data_lookup_key IS 'Added in migration 0021 to optimize direct code lookups';
COMMENT ON INDEX idx_reference_data_precinct_lookup IS 'Added in migration 0021 to optimize precinct lookups using composite keys'; 