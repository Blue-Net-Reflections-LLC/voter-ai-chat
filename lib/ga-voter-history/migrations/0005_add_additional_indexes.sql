/*
Migration: 0005_add_additional_indexes.sql
Purpose   : Add supporting indexes to GA_VOTER_HISTORY to improve
            join/filter performance on common columns used by reports.
*/

-- 1. Case‑insensitive party look‑ups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ga_voter_history_upper_party
    ON GA_VOTER_HISTORY (UPPER(party));

-- 2. ballot_style (exact match)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ga_voter_history_ballot_style
    ON GA_VOTER_HISTORY (ballot_style); 