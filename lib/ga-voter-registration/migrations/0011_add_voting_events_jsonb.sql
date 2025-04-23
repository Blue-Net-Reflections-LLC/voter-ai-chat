-- Migration: 0011_add_voting_events_jsonb.sql
-- Purpose: Add a JSONB column for denormalized voting event history and index it for fast querying.

ALTER TABLE IF EXISTS GA_VOTER_REGISTRATION_LIST
ADD COLUMN IF NOT EXISTS voting_events JSONB NULL;

-- Populate existing rows with aggregated voting events from history
UPDATE GA_VOTER_REGISTRATION_LIST reg
SET voting_events = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'election_date', h.election_date,
      'election_type', UPPER(h.election_type),
      'party', UPPER(h.party),
      'ballot_style', h.ballot_style,
      'absentee', h.absentee,
      'provisional', h.provisional,
      'supplemental', h.supplemental
    ) ORDER BY h.election_date
  )
  FROM GA_VOTER_HISTORY h
  WHERE h.registration_number = reg.voter_registration_number
);

-- Create GIN index on JSONB column for fast containment queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gin_reg_list_voting_events
  ON GA_VOTER_REGISTRATION_LIST USING GIN (voting_events);

-- Update statistics
ANALYZE GA_VOTER_REGISTRATION_LIST; 