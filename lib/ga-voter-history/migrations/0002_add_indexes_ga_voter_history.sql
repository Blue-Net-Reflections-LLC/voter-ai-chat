-- Migration script to add indexes to the GA_VOTER_HISTORY table.

-- Add indexes for common query patterns
-- Index on county_code for efficient filtering by county.
CREATE INDEX IF NOT EXISTS idx_ga_voter_history_county_code ON GA_VOTER_HISTORY (county_code);

-- Index on election_date for efficient filtering by election date.
CREATE INDEX IF NOT EXISTS idx_ga_voter_history_election_date ON GA_VOTER_HISTORY (election_date);

-- Composite index on county_code and election_date for queries filtering by both.
CREATE INDEX IF NOT EXISTS idx_ga_voter_history_county_election ON GA_VOTER_HISTORY (county_code, election_date); 