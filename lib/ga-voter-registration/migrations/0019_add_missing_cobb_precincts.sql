-- Migration: 0019_add_missing_cobb_precincts.sql
-- Purpose: Add missing Cobb County precincts to REFERENCE_DATA table
-- This migration adds the precinct codes that were missing from previous migrations

-- Ensure this script is run AFTER 0018_update_cobb_precinct_metadata.sql has been executed.

-- Helper function to create a basic precinct entry with minimal metadata
CREATE OR REPLACE FUNCTION create_basic_precinct_meta()
RETURNS JSONB AS $$
BEGIN
    RETURN jsonb_build_object(
        'facility_name', NULL,
        'facility_address', NULL,
        'map_url', NULL
    );
END;
$$ LANGUAGE plpgsql;

-- Insert missing precincts with basic metadata
-- These can be updated later with full facility information

-- Paulding and special precincts
INSERT INTO REFERENCE_DATA (lookup_type, state_code, county_code, lookup_key, lookup_value, lookup_meta, created_at, updated_at)
VALUES
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', '0005C', 'PAULDING SENIOR CENTER', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', '0021B', 'TABERNACLE BAPTIST CHURCH', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', '88888', '88888', create_basic_precinct_meta(), NOW(), NOW());

-- Acworth precincts
INSERT INTO REFERENCE_DATA (lookup_type, state_code, county_code, lookup_key, lookup_value, lookup_meta, created_at, updated_at)
VALUES
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'AC1A', 'ACWORTH 1A', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'AC1B', 'ACWORTH 1B', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'AC1C', 'ACWORTH 1C', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'AD01', 'ADDISON 01', create_basic_precinct_meta(), NOW(), NOW());

-- Austell precincts
INSERT INTO REFERENCE_DATA (lookup_type, state_code, county_code, lookup_key, lookup_value, lookup_meta, created_at, updated_at)
VALUES
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'AU1A', 'AUSTELL 1A', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'AU1B', 'AUSTELL 1B', create_basic_precinct_meta(), NOW(), NOW());

-- B precincts
INSERT INTO REFERENCE_DATA (lookup_type, state_code, county_code, lookup_key, lookup_value, lookup_meta, created_at, updated_at)
VALUES
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'BF04', 'BELLS FERRY 04', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'BG01', 'BIG SHANTY 01', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'BG02', 'BIG SHANTY 02', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'BK01', 'BAKER 01', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'BW01', 'BLACKWELL 01', create_basic_precinct_meta(), NOW(), NOW());

-- C precincts
INSERT INTO REFERENCE_DATA (lookup_type, state_code, county_code, lookup_key, lookup_value, lookup_meta, created_at, updated_at)
VALUES
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'CA01', 'CHATTAHOOCHEE 01', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'CH02', 'CHEATHAM HILL 02', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'CH03', 'CHEATHAM HILL 03', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'CK01', 'CHALKER 01', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'CL02', 'CLARKDALE 02', create_basic_precinct_meta(), NOW(), NOW());

-- D precincts
INSERT INTO REFERENCE_DATA (lookup_type, state_code, county_code, lookup_key, lookup_value, lookup_meta, created_at, updated_at)
VALUES
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'DC01', 'DICKERSON 01', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'DI01', 'DOBBINS 01', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'DI02', 'DOBBINS 02', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'DL01', 'DOWELL 01', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'DU01', 'DURHAM 01', create_basic_precinct_meta(), NOW(), NOW());

-- E precincts
INSERT INTO REFERENCE_DATA (lookup_type, state_code, county_code, lookup_key, lookup_value, lookup_meta, created_at, updated_at)
VALUES
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'EA01', 'EASTSIDE 01', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'EA02', 'EASTSIDE 02', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'EL01', 'ELIZABETH 01', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'EL02', 'ELIZABETH 02', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'EL03', 'ELIZABETH 03', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'EL04', 'ELIZABETH 04', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'EL05', 'ELIZABETH 05', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'EP01', 'EAST PIEDMONT 01', create_basic_precinct_meta(), NOW(), NOW());

-- F precincts
INSERT INTO REFERENCE_DATA (lookup_type, state_code, county_code, lookup_key, lookup_value, lookup_meta, created_at, updated_at)
VALUES
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'FO02', 'FAIR OAKS 02', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'FO04', 'FAIR OAKS 04', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'FP01', 'FULLERS PARK 01', create_basic_precinct_meta(), NOW(), NOW());

-- G-H precincts
INSERT INTO REFERENCE_DATA (lookup_type, state_code, county_code, lookup_key, lookup_value, lookup_meta, created_at, updated_at)
VALUES
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'GT01', 'GRITTERS 01', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'HR01', 'HARRISON 01', create_basic_precinct_meta(), NOW(), NOW());

-- Kennesaw precincts
INSERT INTO REFERENCE_DATA (lookup_type, state_code, county_code, lookup_key, lookup_value, lookup_meta, created_at, updated_at)
VALUES
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'KE1A', 'KENNESAW 1A', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'KE2A', 'KENNESAW 2A', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'KE3A', 'KENNESAW 3A', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'KE4A', 'KENNESAW 4A', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'KE5A', 'KENNESAW 5A', create_basic_precinct_meta(), NOW(), NOW());

-- K precincts
INSERT INTO REFERENCE_DATA (lookup_type, state_code, county_code, lookup_key, lookup_value, lookup_meta, created_at, updated_at)
VALUES
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'KL01', 'KELL 01', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'KP01', 'KEMP 01', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'KP02', 'KEMP 02', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'KP03', 'KEMP 03', create_basic_precinct_meta(), NOW(), NOW());

-- Lost Mountain precincts
INSERT INTO REFERENCE_DATA (lookup_type, state_code, county_code, lookup_key, lookup_value, lookup_meta, created_at, updated_at)
VALUES
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'LM02', 'LOST MOUNTAIN 02', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'LM03', 'LOST MOUNTAIN 03', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'LM04', 'LOST MOUNTAIN 04', create_basic_precinct_meta(), NOW(), NOW());

-- Mableton precincts
INSERT INTO REFERENCE_DATA (lookup_type, state_code, county_code, lookup_key, lookup_value, lookup_meta, created_at, updated_at)
VALUES
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'MA1A', 'MABLETON 1A', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'MA1B', 'MABLETON 1B', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'MA2A', 'MABLETON 2A', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'MA2B', 'MABLETON 2B', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'MA3A', 'MABLETON 3A', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'MA3B', 'MABLETON 3B', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'MA3C', 'MABLETON 3C', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'MA4A', 'MABLETON 4A', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'MA4B', 'MABLETON 4B', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'MA4C', 'MABLETON 4C', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'MA5A', 'MABLETON 5A', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'MA5B', 'MABLETON 5B', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'MA6A', 'MABLETON 6A', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'MA6B', 'MABLETON 6B', create_basic_precinct_meta(), NOW(), NOW());

-- M precincts
INSERT INTO REFERENCE_DATA (lookup_type, state_code, county_code, lookup_key, lookup_value, lookup_meta, created_at, updated_at)
VALUES
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'MB01', 'MABRY 01', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'MD01', 'MURDOCK 01', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'ME01', 'MCEACHERN 01', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'MK01', 'MCCLESKEY 01', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'ML01', 'MCCLURE 01', create_basic_precinct_meta(), NOW(), NOW());

-- Marietta precincts
INSERT INTO REFERENCE_DATA (lookup_type, state_code, county_code, lookup_key, lookup_value, lookup_meta, created_at, updated_at)
VALUES
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'MR1A', 'MARIETTA 1A', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'MR2A', 'MARIETTA 2A', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'MR2B', 'MARIETTA 2B', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'MR3A', 'MARIETTA 3A', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'MR3B', 'MARIETTA 3B', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'MR4A', 'MARIETTA 4A', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'MR4B', 'MARIETTA 4B', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'MR4C', 'MARIETTA 4C', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'MR5A', 'MARIETTA 5A', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'MR5B', 'MARIETTA 5B', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'MR6A', 'MARIETTA 6A', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'MR6B', 'MARIETTA 6B', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'MR7A', 'MARIETTA 7A', create_basic_precinct_meta(), NOW(), NOW());

-- Mars Hill and Mt Bethel precincts
INSERT INTO REFERENCE_DATA (lookup_type, state_code, county_code, lookup_key, lookup_value, lookup_meta, created_at, updated_at)
VALUES
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'MS01', 'MARS HILL 01', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'MS02', 'MARS HILL 02', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'MT01', 'MT BETHEL 01', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'MT03', 'MT BETHEL 03', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'MT04', 'MT BETHEL 04', create_basic_precinct_meta(), NOW(), NOW());

-- N precincts
INSERT INTO REFERENCE_DATA (lookup_type, state_code, county_code, lookup_key, lookup_value, lookup_meta, created_at, updated_at)
VALUES
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'NC01', 'NORTH COBB 01', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'NJ01', 'NICKAJACK 01', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'NP01', 'NORTON PARK 01', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'NS01', 'NICHOLSON 01', create_basic_precinct_meta(), NOW(), NOW());

-- O precincts
INSERT INTO REFERENCE_DATA (lookup_type, state_code, county_code, lookup_key, lookup_value, lookup_meta, created_at, updated_at)
VALUES
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'OK01', 'OAKDALE 01', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'OR02', 'OREGON 02', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'OR03', 'OREGON 03', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'OR04', 'OREGON 04', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'OR05', 'OREGON 05', create_basic_precinct_meta(), NOW(), NOW());

-- P precincts
INSERT INTO REFERENCE_DATA (lookup_type, state_code, county_code, lookup_key, lookup_value, lookup_meta, created_at, updated_at)
VALUES
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'PM02', 'PINE MOUNTAIN 02', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'PP01', 'POPE 01', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'PR01', 'PALMER 01', create_basic_precinct_meta(), NOW(), NOW());

-- Powder Springs precincts
INSERT INTO REFERENCE_DATA (lookup_type, state_code, county_code, lookup_key, lookup_value, lookup_meta, created_at, updated_at)
VALUES
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'PS1A', 'POWDER SPRINGS 1A', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'PS2A', 'POWDER SPRINGS 2A', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'PS3A', 'POWDER SPRINGS 3A', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'PT01', 'PITNER 01', create_basic_precinct_meta(), NOW(), NOW());

-- R precincts
INSERT INTO REFERENCE_DATA (lookup_type, state_code, county_code, lookup_key, lookup_value, lookup_meta, created_at, updated_at)
VALUES
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'RW01', 'ROSWELL 01', create_basic_precinct_meta(), NOW(), NOW()),
('GA_COUNTY_PRECINCT_DESC', 'GA', '067', 'RW02', 'ROSWELL 02', create_basic_precinct_meta(), NOW(), NOW());

-- Drop the helper function if no longer needed
DROP FUNCTION IF EXISTS create_basic_precinct_meta(); 