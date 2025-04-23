-- Migration: 0012_remove_election_types_array.sql
-- Purpose: Remove deprecated participated_election_types array and its GIN index now replaced by voting_events JSONB

ALTER TABLE IF EXISTS GA_VOTER_REGISTRATION_LIST
  DROP COLUMN IF EXISTS participated_election_types;

DROP INDEX CONCURRENTLY IF EXISTS idx_gin_reg_list_election_types; 