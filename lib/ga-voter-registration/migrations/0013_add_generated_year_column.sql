-- Migration: 0013_add_generated_year_column.sql
-- Purpose: Add a generated column to store distinct election years derived from voting_events JSONB,
--          and index it for faster year-based filtering.
-- Requires: PostgreSQL 12+

-- Step 1: Create an IMMUTABLE function to extract distinct years from the JSONB array
CREATE OR REPLACE FUNCTION get_voter_event_years(events jsonb)
RETURNS int[]
LANGUAGE sql
IMMUTABLE PARALLEL SAFE
AS $$
  SELECT ARRAY(
    SELECT DISTINCT date_part('year', (elem->>'election_date')::date)::int
    FROM jsonb_array_elements(events) elem
    WHERE elem->>'election_date' IS NOT NULL -- Ensure date exists
      AND elem->>'election_date' ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' -- Basic validation
  )
$$;

-- Step 2: Add the generated column using the function
ALTER TABLE IF EXISTS GA_VOTER_REGISTRATION_LIST
ADD COLUMN IF NOT EXISTS participated_election_years INT[]
GENERATED ALWAYS AS (get_voter_event_years(voting_events)) STORED;

COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.participated_election_years
    IS 'Array of distinct years derived automatically via get_voter_event_years() from the voting_events JSONB column.';

-- Step 3: Add a GIN index on the generated column for fast array operations (e.g., && overlap)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gin_generated_event_years
    ON GA_VOTER_REGISTRATION_LIST USING GIN (participated_election_years); 