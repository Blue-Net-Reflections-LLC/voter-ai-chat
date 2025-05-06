-- Seed Script: 0017_seed_cobb_precinct_descriptions.sql
-- Purpose: Populate REFERENCE_DATA with GA Cobb County precinct descriptions
--          from existing data in GA_VOTER_REGISTRATION_LIST.
-- NOTE: This is a data seeding step placed in the migrations sequence for execution order.

-- Ensure this script is run AFTER migration 0016_create_reference_data_table.sql

INSERT INTO REFERENCE_DATA (
    lookup_type,
    state_code,
    county_code,
    lookup_key,
    lookup_value,
    lookup_meta -- Initially NULL, can be updated later with facility info
)
SELECT DISTINCT
    'GA_COUNTY_PRECINCT_DESC' AS lookup_type,
    'GA' AS state_code,
    '067' AS county_code, -- Cobb County FIPS code
    vr.county_precinct AS lookup_key,
    vr.county_precinct_description AS lookup_value,
    NULL::jsonb AS lookup_meta -- Cast NULL to jsonb
FROM
    GA_VOTER_REGISTRATION_LIST vr
WHERE
    vr.county_code = '067'
    AND vr.county_precinct IS NOT NULL
    AND TRIM(vr.county_precinct) <> ''
    AND vr.county_precinct_description IS NOT NULL
    AND TRIM(vr.county_precinct_description) <> ''
ON CONFLICT (lookup_type, state_code, county_code, lookup_key)
DO UPDATE SET
    lookup_value = EXCLUDED.lookup_value,
    lookup_meta = REFERENCE_DATA.lookup_meta, -- Keep existing meta if row updated
    updated_at = NOW() -- Update timestamp if description changes
RETURNING id; -- Optional: Return IDs of inserted/updated rows

-- Optional: Log the number of rows affected (requires psql features or similar)
-- \echo 'Finished seeding Cobb County precinct descriptions.'

-- Now seed Municipal Precinct descriptions for Cobb County

INSERT INTO REFERENCE_DATA (
    lookup_type,
    state_code,
    county_code,
    lookup_key,
    lookup_value,
    lookup_meta -- Initially NULL
)
SELECT DISTINCT
    'GA_MUNICIPAL_PRECINCT_DESC' AS lookup_type,
    'GA' AS state_code,
    '067' AS county_code, -- Cobb County FIPS code
    vr.municipal_precinct AS lookup_key,
    vr.municipal_precinct_description AS lookup_value,
    NULL::jsonb AS lookup_meta -- Cast NULL to jsonb
FROM
    GA_VOTER_REGISTRATION_LIST vr
WHERE
    vr.county_code = '067'
    AND vr.municipal_precinct IS NOT NULL
    AND TRIM(vr.municipal_precinct) <> ''
    AND vr.municipal_precinct_description IS NOT NULL
    AND TRIM(vr.municipal_precinct_description) <> ''
ON CONFLICT (lookup_type, state_code, county_code, lookup_key)
DO UPDATE SET
    lookup_value = EXCLUDED.lookup_value,
    lookup_meta = REFERENCE_DATA.lookup_meta,
    updated_at = NOW()
RETURNING id;

-- Optional: Log the number of rows affected (requires psql features or similar)
-- \echo 'Finished seeding Cobb County municipal precinct descriptions.' 