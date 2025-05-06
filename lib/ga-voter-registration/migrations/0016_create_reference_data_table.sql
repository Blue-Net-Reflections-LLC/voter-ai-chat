-- Migration: 0016_create_reference_data_table.sql
-- Purpose: Create a generic table to store lookup/reference data, initially for precinct descriptions.

-- Ensure the function to update the updated_at timestamp exists.
-- This might already exist from other migrations; include IF NOT EXISTS for safety.
CREATE OR REPLACE FUNCTION trigger_set_reference_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create REFERENCE_DATA table
CREATE TABLE IF NOT EXISTS REFERENCE_DATA (
    id SERIAL PRIMARY KEY,                           -- Unique identifier for the lookup record.
    lookup_type VARCHAR(100) NOT NULL,               -- Discriminator column (e.g., 'GA_COUNTY_PRECINCT_DESC', 'PARTY_NAME').
    state_code VARCHAR(2) NULL,                      -- Optional: State code associated with the lookup (e.g., 'GA').
    county_code VARCHAR(3) NULL,                     -- Optional: County FIPS code associated with the lookup (e.g., '067' for Cobb).
    lookup_key VARCHAR(255) NOT NULL,                -- The key or code being looked up (e.g., precinct code 'BF02').
    lookup_value TEXT NOT NULL,                      -- The display value or description (e.g., precinct description 'Bells Ferry 02').
    lookup_meta JSONB NULL,                          -- Optional: Extra metadata (e.g., facility address for precincts).
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL, -- Timestamp when the record was inserted into this database.
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL, -- Timestamp when the record was last updated in this database.

    -- Index for efficient lookups by type, state, county, and key
    CONSTRAINT uq_reference_data UNIQUE (lookup_type, state_code, county_code, lookup_key) -- Ensure uniqueness for a given type/scope/key combo
);

-- Add comments for clarity
COMMENT ON TABLE REFERENCE_DATA IS 'Stores generic lookup/reference data keyed by type, state, county, and key.';
COMMENT ON COLUMN REFERENCE_DATA.lookup_type IS 'Discriminator for the type of lookup data (e.g., GA_COUNTY_PRECINCT_DESC).';
COMMENT ON COLUMN REFERENCE_DATA.state_code IS 'Optional 2-letter state code (e.g., GA).';
COMMENT ON COLUMN REFERENCE_DATA.county_code IS 'Optional 3-digit FIPS county code (e.g., 067 for Cobb).';
COMMENT ON COLUMN REFERENCE_DATA.lookup_key IS 'The code or key identifier for the lookup value (e.g., precinct code).';
COMMENT ON COLUMN REFERENCE_DATA.lookup_value IS 'The description or display value associated with the key.';
COMMENT ON COLUMN REFERENCE_DATA.lookup_meta IS 'Optional JSONB field for storing additional metadata related to the lookup item.';
COMMENT ON COLUMN REFERENCE_DATA.created_at IS 'Timestamp when the record was inserted into this database.';
COMMENT ON COLUMN REFERENCE_DATA.updated_at IS 'Timestamp when the record was last updated in this database.';
COMMENT ON CONSTRAINT uq_reference_data ON REFERENCE_DATA IS 'Ensures uniqueness for a lookup type within a specific state/county scope based on its key.';

-- Trigger to automatically update updated_at timestamp on row update
CREATE TRIGGER update_reference_data_updated_at
BEFORE UPDATE ON REFERENCE_DATA
FOR EACH ROW
EXECUTE FUNCTION trigger_set_reference_data_updated_at();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_reference_data_type_state_county_key ON REFERENCE_DATA (lookup_type, state_code, county_code, lookup_key);
CREATE INDEX IF NOT EXISTS idx_reference_data_type_key ON REFERENCE_DATA (lookup_type, lookup_key); -- For lookups not specific to state/county 