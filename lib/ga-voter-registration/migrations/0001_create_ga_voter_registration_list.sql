-- Migration script to create the GA_VOTER_REGISTRATION_LIST table.
-- This table stores voter registration information for Georgia voters.

-- Ensure the function to update the updated_at timestamp exists.
-- This might already exist from other migrations; include IF NOT EXISTS for safety.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create GA_VOTER_REGISTRATION_LIST table
CREATE TABLE IF NOT EXISTS GA_VOTER_REGISTRATION_LIST (
    id SERIAL PRIMARY KEY,                           -- Unique identifier for the registration record.
    county_name VARCHAR,                             -- Name of the county as it appears in the source CSV file.
    county_code VARCHAR(3),                          -- Standard 3-digit Georgia county FIPS code, derived from county_name.
    voter_registration_number VARCHAR(8) NOT NULL,   -- Voter's unique registration number (natural key).
    status VARCHAR,                                  -- Voter status (e.g., ACTIVE, INACTIVE).
    status_reason VARCHAR,                           -- Reason for the current status, if applicable.
    last_name VARCHAR,                               -- Voter's last name.
    first_name VARCHAR,                              -- Voter's first name.
    middle_name VARCHAR,                             -- Voter's middle name.
    suffix VARCHAR,                                  -- Voter's name suffix (e.g., Jr, Sr, III).
    birth_year INTEGER,                              -- Voter's year of birth.
    residence_street_number VARCHAR,                 -- Residence address: Street number.
    residence_pre_direction VARCHAR,                 -- Residence address: Pre-directional (e.g., N, S).
    residence_street_name VARCHAR,                   -- Residence address: Street name.
    residence_street_type VARCHAR,                   -- Residence address: Street type (e.g., RD, LN, ST).
    residence_post_direction VARCHAR,                -- Residence address: Post-directional.
    residence_apt_unit_number VARCHAR,               -- Residence address: Apartment or unit number.
    residence_city VARCHAR,                          -- Residence address: City.
    residence_zipcode VARCHAR(5),                    -- Residence address: Zip code (normalized to 5 digits).
    county_precinct VARCHAR,                         -- County election precinct code.
    county_precinct_description VARCHAR,             -- Description of the county precinct.
    municipal_precinct VARCHAR,                      -- Municipal election precinct code, if applicable.
    municipal_precinct_description VARCHAR,          -- Description of the municipal precinct.
    congressional_district VARCHAR(4),               -- Normalized US Congressional District number (State FIPS + 2-digit CD).
    state_senate_district VARCHAR(5),                -- Normalized State Senate District number (State FIPS + 3-digit SLDU).
    state_house_district VARCHAR(5),                 -- Normalized State House District number (State FIPS + 3-digit SLDL).
    judicial_district VARCHAR,                       -- Judicial District name or number (not normalized).
    county_commission_district VARCHAR(3),           -- Normalized County Commission District number (3-digit padded).
    school_board_district VARCHAR(3),                -- Normalized School Board District number (3-digit padded, local identifier).
    city_council_district VARCHAR,                   -- City Council District number, if applicable (not normalized).
    municipal_school_board_district VARCHAR,         -- Municipal School Board District, if applicable (not normalized).
    water_board_district VARCHAR,                    -- Water Board District, if applicable.
    super_council_district VARCHAR,                  -- Super Council District, if applicable.
    super_commissioner_district VARCHAR,             -- Super Commissioner District, if applicable.
    super_school_board_district VARCHAR,             -- Super School Board District, if applicable.
    fire_district VARCHAR,                           -- Fire District, if applicable.
    municipality VARCHAR,                            -- Name of the municipality, if applicable.
    combo VARCHAR,                                   -- Combined precinct/district code used by the state.
    land_lot VARCHAR,                                -- Land Lot identifier.
    land_district VARCHAR,                           -- Land District identifier.
    registration_date DATE,                          -- Date the voter registered (YYYY-MM-DD).
    race VARCHAR,                                    -- Voter's race/ethnicity.
    gender VARCHAR,                                  -- Voter's gender.
    last_modified_date DATE,                         -- Date the voter record was last modified by the state (YYYY-MM-DD).
    date_of_last_contact DATE,                       -- Date of last contact with the voter (YYYY-MM-DD).
    last_party_voted VARCHAR,                        -- Party ballot chosen in the last primary election voted.
    last_vote_date DATE,                             -- Date the voter last cast a ballot (YYYY-MM-DD).
    voter_created_date DATE,                         -- Date the voter record was initially created (YYYY-MM-DD).
    mailing_street_number VARCHAR,                   -- Mailing address: Street number.
    mailing_street_name VARCHAR,                     -- Mailing address: Street name.
    mailing_apt_unit_number VARCHAR,                 -- Mailing address: Apartment or unit number.
    mailing_city VARCHAR,                            -- Mailing address: City.
    mailing_zipcode VARCHAR(5),                      -- Mailing address: Zip code (normalized to 5 digits).
    mailing_state VARCHAR,                           -- Mailing address: State.
    mailing_country VARCHAR,                         -- Mailing address: Country.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL, -- Timestamp when the record was inserted into this database.
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL, -- Timestamp when the record was last updated in this database.

    -- Unique constraint: A voter registration number must be unique within the list.
    CONSTRAINT ga_voter_reg_list_number_unique UNIQUE (voter_registration_number)
);

-- Add comments to the table and columns for clarity and potential AI use
COMMENT ON TABLE GA_VOTER_REGISTRATION_LIST IS 'Stores voter registration details for Georgia voters, including demographics, address, precinct/district assignments, and limited voting activity indicators.';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.id IS 'Unique identifier for the registration record.';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.county_name IS 'Name of the county as it appears in the source CSV file.';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.county_code IS 'Standard 3-digit Georgia county FIPS code, derived from county_name via lookup.';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.voter_registration_number IS 'Voter''s unique registration number (natural key). Should be unique across all records.';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.status IS 'Voter status (e.g., ACTIVE, INACTIVE).';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.status_reason IS 'Reason for the current status, if applicable (e.g., NCOA - National Change of Address).';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.last_name IS 'Voter''s last name.';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.first_name IS 'Voter''s first name.';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.middle_name IS 'Voter''s middle name.';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.suffix IS 'Voter''s name suffix (e.g., Jr, Sr, III).';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.birth_year IS 'Voter''s year of birth.';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.residence_street_number IS 'Residence address: Street number.';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.residence_pre_direction IS 'Residence address: Pre-directional (e.g., N, S, E, W).';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.residence_street_name IS 'Residence address: Street name.';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.residence_street_type IS 'Residence address: Street type abbreviation (e.g., RD, LN, ST, CIR).';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.residence_post_direction IS 'Residence address: Post-directional (e.g., NW, SE).';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.residence_apt_unit_number IS 'Residence address: Apartment, suite, or unit number.';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.residence_city IS 'Residence address: City.';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.residence_zipcode IS 'Residence address: Zip code (normalized to 5 digits).';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.county_precinct IS 'County election precinct code assigned to the voter.';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.county_precinct_description IS 'Text description of the county precinct.';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.municipal_precinct IS 'Municipal election precinct code, if the voter resides within a municipality.';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.municipal_precinct_description IS 'Text description of the municipal precinct.';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.congressional_district IS 'Normalized US Congressional District GEOID (State FIPS + 2-digit CD).';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.state_senate_district IS 'Normalized State Senate District GEOID (State FIPS + 3-digit SLDU).';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.state_house_district IS 'Normalized State House District GEOID (State FIPS + 3-digit SLDL).';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.judicial_district IS 'Judicial District name or number assigned to the voter (not normalized).';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.county_commission_district IS 'Normalized County Commission District number (3-digit padded).';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.school_board_district IS 'Normalized School Board District number (3-digit padded, local identifier).';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.city_council_district IS 'City Council District number, if applicable (not normalized).';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.municipal_school_board_district IS 'Municipal School Board District, if applicable (not normalized).';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.water_board_district IS 'Water Board District, if applicable.';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.super_council_district IS 'Super Council District, if applicable.';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.super_commissioner_district IS 'Super Commissioner District, if applicable.';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.super_school_board_district IS 'Super School Board District, if applicable.';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.fire_district IS 'Fire District, if applicable.';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.municipality IS 'Name of the municipality where the voter resides, if applicable.';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.combo IS 'Combined precinct/district code used by the state for ballot assignment.';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.land_lot IS 'Land Lot identifier for the voter''s residence location.';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.land_district IS 'Land District identifier for the voter''s residence location.';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.registration_date IS 'Date the voter registered (YYYY-MM-DD).';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.race IS 'Voter''s self-reported race/ethnicity.';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.gender IS 'Voter''s self-reported gender.';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.last_modified_date IS 'Date the voter record was last modified by the election authority (YYYY-MM-DD).';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.date_of_last_contact IS 'Date of the last contact made with the voter by the election authority (YYYY-MM-DD).';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.last_party_voted IS 'Political party ballot chosen by the voter in the last partisan primary election they participated in.';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.last_vote_date IS 'Date the voter last cast a ballot in any election (YYYY-MM-DD).';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.voter_created_date IS 'Date the voter record was initially created in the state system (YYYY-MM-DD).';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.mailing_street_number IS 'Mailing address: Street number (if different from residence).';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.mailing_street_name IS 'Mailing address: Street name (if different from residence).';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.mailing_apt_unit_number IS 'Mailing address: Apartment or unit number (if different from residence).';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.mailing_city IS 'Mailing address: City (if different from residence).';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.mailing_zipcode IS 'Mailing address: Zip code (normalized to 5 digits, if different from residence).';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.mailing_state IS 'Mailing address: State (if different from residence).';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.mailing_country IS 'Mailing address: Country (if different from residence).';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.created_at IS 'Timestamp indicating when this registration record was first added to this database.';
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.updated_at IS 'Timestamp indicating the last time this registration record was modified in this database.';

-- Trigger to automatically update updated_at timestamp on row update
-- Ensure the trigger name is unique if the function is shared across tables
CREATE TRIGGER update_ga_voter_reg_list_updated_at
BEFORE UPDATE ON GA_VOTER_REGISTRATION_LIST
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 