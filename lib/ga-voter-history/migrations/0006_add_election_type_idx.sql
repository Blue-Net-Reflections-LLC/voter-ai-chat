-- Migration: 0006_add_election_type_idx.sql
-- Purpose: Add index to support efficient filtering by election type
--          within the voter list API's EXISTS subquery.

-- This index allows the database to quickly find history records for a specific
-- registration_number and then check the election_type, which is much faster
-- than scanning all records for a specific election_type first.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ga_voter_history_regnum_electype
    ON GA_VOTER_HISTORY (registration_number, election_type);

-- Optional: If case-insensitive searches on election_type are common and slow,
-- an index on the upper-cased value might help, but start with the one above.
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ga_voter_history_regnum_upper_electype
--    ON GA_VOTER_HISTORY (registration_number, UPPER(election_type)); 