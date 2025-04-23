/*
Migration: 0002_add_idx_registration_number.sql
Purpose   : Improve "registered but never voted" anti‑join performance by
            adding a narrow, single‑column index on GA_VOTER_HISTORY.registration_number.
            The existing UNIQUE constraint covers (registration_number, election_date)
            but a skinnier index dramatically reduces I/O for look‑ups that don't need
            election_date.
*/

-- Create index concurrently to avoid locking writes for long periods.
-- IF NOT EXISTS prevents errors when the index (or one with the same name)
-- has already been created manually.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ga_voter_history_registration_number
    ON GA_VOTER_HISTORY (registration_number); 