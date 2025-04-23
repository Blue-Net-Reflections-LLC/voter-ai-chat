/*
Migration: 0005_add_additional_indexes.sql
Purpose   : Add expression, pattern‑matching, and numeric indexes most
            frequently used by the voter‑list API to speed up filtering.
            All indexes are created CONCURRENTLY and IF NOT EXISTS so the
            script is safe to run in production and idempotent.
*/

-- 1. Case‑insensitive equality on county_name (UPPER(county_name) = UPPER($x))
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ga_voter_reg_list_upper_county_name
    ON GA_VOTER_REGISTRATION_LIST (UPPER(county_name));

-- 2. Case‑insensitive equality on last_party_voted
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ga_voter_reg_list_upper_last_party
    ON GA_VOTER_REGISTRATION_LIST (UPPER(last_party_voted));

-- 3. Prefix search on first_name: LIKE 'ABC%'.
--    `varchar_pattern_ops` makes the b‑tree usable for prefix LIKE searches
--    without disabling other index types.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ga_voter_reg_list_first_name_like
    ON GA_VOTER_REGISTRATION_LIST (first_name varchar_pattern_ops);

-- 4. Range queries on birth_year (for age filtering)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ga_voter_reg_list_birth_year
    ON GA_VOTER_REGISTRATION_LIST (birth_year);

-- 5. Composite address index used when both street name (prefix) and
--    street number are supplied together.  The pattern_ops operator class
--    enables prefix LIKE on the first column while keeping equality on the
--    second.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ga_voter_reg_list_street_name_number
    ON GA_VOTER_REGISTRATION_LIST (
        residence_street_name varchar_pattern_ops,
        residence_street_number
    ); 