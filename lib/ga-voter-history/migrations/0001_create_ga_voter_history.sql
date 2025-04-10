-- Migration script to create the GA_VOTER_HISTORY table for Georgia voter participation data.

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create GA_VOTER_HISTORY table
-- This table stores historical voting records for individual voters in Georgia.
CREATE TABLE IF NOT EXISTS GA_VOTER_HISTORY (
    id SERIAL PRIMARY KEY, -- Unique identifier for the voter history record.
    county_name VARCHAR, -- Name of the county as it appears in the source CSV file.
    county_code VARCHAR(3), -- Standard 3-digit Georgia county code, derived from county_name via lookup.
    registration_number VARCHAR(8) NOT NULL, -- Voter's unique registration number.
    election_date DATE NOT NULL, -- Date the election was held (YYYY-MM-DD format).
    election_type VARCHAR, -- The type of election held (e.g., GENERAL PRIMARY, SPECIAL ELECTION RUNOFF).
    party VARCHAR, -- Political party ballot chosen by the voter in partisan primaries, otherwise empty or NON-PARTISAN.
    ballot_style VARCHAR, -- The method or style of ballot cast (e.g., REGULAR, ABSENTEE BY MAIL, ADVANCE VOTING).
    absentee VARCHAR(1), -- Indicates if the vote was cast via absentee ballot ('Y' for Yes, 'N' for No).
    provisional VARCHAR(1), -- Indicates if the vote was cast provisionally ('Y' for Yes, 'N' for No).
    supplemental VARCHAR(1), -- Indicates if the vote is supplemental ('Y' for Yes, 'N' for No). Exact meaning may vary.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL, -- Timestamp indicating when this specific voting record was first added to the database.
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL, -- Timestamp indicating the last time this specific voting record was modified in the database.

    -- Unique constraint: A voter can only vote once per election date.
    CONSTRAINT ga_voter_history_voter_election_unique UNIQUE (registration_number, election_date)
);

-- Add comments to columns for clarity and AI understanding
COMMENT ON TABLE GA_VOTER_HISTORY IS 'Stores historical voting records for individual voters in Georgia, including election details and voting method.';
COMMENT ON COLUMN GA_VOTER_HISTORY.id IS 'Unique identifier for the voter history record.';
COMMENT ON COLUMN GA_VOTER_HISTORY.county_name IS 'Name of the county as it appears in the source CSV file.';
COMMENT ON COLUMN GA_VOTER_HISTORY.county_code IS 'Standard 3-digit Georgia county code, derived from county_name via lookup.';
COMMENT ON COLUMN GA_VOTER_HISTORY.registration_number IS 'Voter''s unique registration number.';
COMMENT ON COLUMN GA_VOTER_HISTORY.election_date IS 'Date the election was held (YYYY-MM-DD format).';
COMMENT ON COLUMN GA_VOTER_HISTORY.election_type IS 'The type of election held (e.g., GENERAL PRIMARY, SPECIAL ELECTION RUNOFF).';
COMMENT ON COLUMN GA_VOTER_HISTORY.party IS 'Political party ballot chosen by the voter in partisan primaries, otherwise empty or NON-PARTISAN.';
COMMENT ON COLUMN GA_VOTER_HISTORY.ballot_style IS 'The method or style of ballot cast (e.g., REGULAR, ABSENTEE BY MAIL, ADVANCE VOTING).';
COMMENT ON COLUMN GA_VOTER_HISTORY.absentee IS 'Indicates if the vote was cast via absentee ballot (''Y'' for Yes, ''N'' for No).';
COMMENT ON COLUMN GA_VOTER_HISTORY.provisional IS 'Indicates if the vote was cast provisionally (''Y'' for Yes, ''N'' for No).';
COMMENT ON COLUMN GA_VOTER_HISTORY.supplemental IS 'Indicates if the vote is supplemental (''Y'' for Yes, ''N'' for No). Exact meaning may vary.';
COMMENT ON COLUMN GA_VOTER_HISTORY.created_at IS 'Timestamp indicating when this specific voting record was first added to the database.';
COMMENT ON COLUMN GA_VOTER_HISTORY.updated_at IS 'Timestamp indicating the last time this specific voting record was modified in the database.';

-- Trigger to automatically update updated_at timestamp on row update
CREATE TRIGGER update_ga_voter_history_updated_at
BEFORE UPDATE ON GA_VOTER_HISTORY
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 