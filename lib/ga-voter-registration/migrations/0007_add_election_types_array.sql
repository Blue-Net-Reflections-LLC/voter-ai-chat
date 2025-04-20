-- Migration: 0007_add_election_types_array.sql
-- Purpose: Add denormalized array of election types participated in,
--          with a GIN index for fast filtering.

ALTER TABLE GA_VOTER_REGISTRATION_LIST
ADD COLUMN IF NOT EXISTS participated_election_types TEXT[] NULL;

-- Create a GIN index for fast array containment/overlap checks (@>, &&)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gin_reg_list_election_types
    ON GA_VOTER_REGISTRATION_LIST USING GIN (participated_election_types);

COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.participated_election_types
    IS 'Array of distinct UPPERCASE election types the voter participated in, derived from GA_VOTER_HISTORY.'; 