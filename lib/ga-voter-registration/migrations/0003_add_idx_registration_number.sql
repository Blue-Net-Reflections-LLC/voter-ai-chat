/*
Migration: 0002_add_idx_registration_list_number.sql
Purpose   : Complementary narrow index on GA_VOTER_REGISTRATION_LIST.voter_registration_number.
            This speeds joins or sub‑queries that match registration_list to
            GA_VOTER_HISTORY via registration numbers.
*/

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ga_voter_reg_list_registration_number
    ON GA_VOTER_REGISTRATION_LIST (voter_registration_number); 