-- Migration script to add indexes to the GA_VOTER_REGISTRATION_LIST table.

-- Indexes are added separately from table creation for clarity and flexibility.
-- Using IF NOT EXISTS ensures the script is idempotent.

-- Index on county_code for filtering/joining by county.
CREATE INDEX IF NOT EXISTS idx_ga_voter_reg_list_county_code ON GA_VOTER_REGISTRATION_LIST (county_code);

-- Index on status for filtering voters by registration status (e.g., ACTIVE).
CREATE INDEX IF NOT EXISTS idx_ga_voter_reg_list_status ON GA_VOTER_REGISTRATION_LIST (status);

-- Index on last_name for searching/sorting by last name.
-- Consider potential performance implications on large tables for string indexes if searches are complex.
CREATE INDEX IF NOT EXISTS idx_ga_voter_reg_list_last_name ON GA_VOTER_REGISTRATION_LIST (last_name);

-- Index on residence_zipcode (normalized 5-digit) for geographic filtering/analysis.
CREATE INDEX IF NOT EXISTS idx_ga_voter_reg_list_residence_zipcode ON GA_VOTER_REGISTRATION_LIST (residence_zipcode);

-- Indexes on key district columns for political/geographic analysis.
CREATE INDEX IF NOT EXISTS idx_ga_voter_reg_list_congressional_district ON GA_VOTER_REGISTRATION_LIST (congressional_district);
CREATE INDEX IF NOT EXISTS idx_ga_voter_reg_list_state_senate_district ON GA_VOTER_REGISTRATION_LIST (state_senate_district);
CREATE INDEX IF NOT EXISTS idx_ga_voter_reg_list_state_house_district ON GA_VOTER_REGISTRATION_LIST (state_house_district);

-- Optional: Consider a composite index if queries frequently filter on multiple specific columns simultaneously,
-- e.g., (county_code, status) or (last_name, first_name).
-- Example: CREATE INDEX IF NOT EXISTS idx_ga_voter_reg_list_county_status ON GA_VOTER_REGISTRATION_LIST (county_code, status); 