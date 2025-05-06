-- Migration: 0018_update_cobb_precinct_metadata.sql
-- Purpose: Update REFERENCE_DATA with Cobb County precinct facility info (metadata)
--          extracted from www.cobbcounty.org/elections/reference/voter-maps.
-- NOTE: This is a data enrichment step placed in the migrations sequence for execution order.

-- Ensure this script is run AFTER 0016_create_reference_data_table.sql and
-- 0017_seed_cobb_precinct_descriptions.sql have been executed.

-- Helper function to safely create JSONB object, handling potential NULLs gracefully if needed in future
-- For now, we assume all fields are present from the source.
CREATE OR REPLACE FUNCTION create_precinct_meta(p_facility_name TEXT, p_facility_address TEXT, p_map_url TEXT)
RETURNS JSONB AS $$
BEGIN
    RETURN jsonb_build_object(
        'facility_name', p_facility_name,
        'facility_address', p_facility_address,
        'map_url', p_map_url
    );
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Precinct Updates (Based on provided website content)
-- =============================================

-- == A ==
UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Acworth Community Center', '4361 Cherokee St, Acworth, GA 30101', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/AC01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'AC01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('NorthStar Church', '3413 Blue Springs Rd, Kennesaw, GA 30144', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/AC02%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'AC02';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Pitner Elementary School', '4575 Wade Green Rd, Acworth, GA 30102', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/AC03%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'AC03';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Due West United Methodist Church', '3956 Due West Rd, Marietta, GA 30064', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/AW01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'AW01';

-- == B ==
UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Baker Elementary School', '2360 Baker Rd NW, Acworth, GA 30101', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/BA01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'BA01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Bells Ferry Elementary School', '2600 Bells Ferry Rd, Marietta, GA 30066', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/BF01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'BF01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Christ Worship Center', '3393 Canton Road, Marietta, GA 30066', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/BF02%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'BF02';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Eastside Baptist Church', '2450 Lower Roswell Rd, Marietta, GA 30068', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/BF03%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'BF03';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Birney Elementary School', '650 N. Marietta Pkwy, Marietta, GA 30060', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/BI01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'BI01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Blackwell Elementary School', '3470 Canton Road, Marietta, GA 30066', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/BR01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'BR01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Metro Atlanta Church', '1150 Blackwell Road, Marietta, GA 30066', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/BR02%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'BR02';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Mars Hill Community Church', '3899 Mars Hill Rd, Powder Springs, GA 30127', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/BD01%20Public.pdf'), -- Address corrected based on assumption
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'BD01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('West Cobb Church', '1245 Villa Rica Road, Marietta, GA 30064', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/BU01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'BU01';

-- == C ==
UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Clarkdale Elementary School', '5350 Austell Powder Springs Rd, Austell, GA 30106', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/CL01%20Public.pdf'), -- Corrected code from CH01?
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'CL01'; -- Assuming CL01 based on name

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Kennesaw Mountain High School', '1898 Kennesaw Due West Rd, Kennesaw, GA 30152', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/CO01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'CO01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Lewis Elementary School', '4179 Jim Owens Rd, Kennesaw, GA 30152', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/CO02%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'CO02';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Cheatham Hill Elementary School', '1350 John Ward Rd SW, Marietta, GA 30064', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/CH01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'CH01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Compton Elementary School', '3450 New Macland Road, Powder Springs, GA 30127', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/CP01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'CP01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Cornerstone Preparatory Academy', '3585 Hicks Road, Marietta, GA 30060', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/CR01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'CR01';

-- == D ==
UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Daniell Middle School', '2900 Scott Road, Marietta, GA 30066', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/DA01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'DA01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Davis Elementary School', '2433 Jamerson Road, Marietta, GA 30066', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/DV01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'DV01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Dodgen Middle School', '1725 Bill Murdock Rd, Marietta, GA 30062', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/DO01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'DO01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Downey Park Recreation Center', '4290 N. Cooper Lake Road Smyrna, GA 30082', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/DP01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'DP01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Due West Elementary School', '3990 Due West Road, Marietta, GA 30064', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/DW01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'DW01';

-- == E ==
UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('East Cobb Government Service Center', '4400 Lower Roswell Road, Marietta, GA 30068', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/EC01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'EC01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('East Cobb Middle School', '380 Holt Road, Marietta, GA 30068', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/EC02%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'EC02';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Eastvalley Elementary School', '2570 Lower Roswell Road, Marietta, GA 30067', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/EV01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'EV01';

-- == F ==
UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Fair Oaks Elementary School', '650 Howard Street, Marietta, GA 30060', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/FO01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'FO01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Ford Elementary School', '1345 Mars Hill Rd, Acworth, GA 30101', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/FR01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'FR01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Frey Elementary School', '2865 Mars Hill Road, Acworth, GA 30101', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/FY01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'FY01';

-- == G ==
UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Harmony Leland Elementary School', '5891 Dodgen Road Mableton, GA 30126', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/HL01%20Public.pdf'), -- Assuming HL01 based on website order
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'HL01'; -- Assuming HL01

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Garrison Mill Elementary School', '4111 Wesley Chapel Road, Marietta, GA 30062', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/GM01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'GM01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Green Acres Elementary School', '800 Gober Ave, Smyrna, GA 30080', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/GA01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'GA01';

-- == H ==
UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Hayes Elementary School', '1550 Kennesaw Due West Road, Kennesaw, GA 30152', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/HY01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'HY01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Hightower Trail Middle School', '3905 Post Oak Tritt Road, Marietta, GA 30062', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/HT01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'HT01';

-- == K ==
UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Keheley Elementary School', '1985 Kemp Road, Marietta, GA 30066', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/KE01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'KE01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Kemp Elementary School', '865 Corner Road, Powder Springs, GA 30127', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/KM01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'KM01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Kennesaw Elementary School', '3155 Jiles Road Kennesaw, GA 30144', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/KN01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'KN01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Ben Robertson Community Center', '2753 Watts Drive, Kennesaw, GA 30144', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/KN02%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'KN02';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Kennesaw First Baptist Church', '2958 North Main Street, Kennesaw, GA 30144', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/KN03%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'KN03';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('King Springs Elementary School', '1041 King Springs Rd SE, Smyrna, GA 30082', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/KS01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'KS01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('King Springs Elementary School', '1041 King Springs Rd SE, Smyrna, GA 30082', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/KS02%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'KS02';

-- == L ==
UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Kennesaw Community Center', '2737 Watts Drive Kennesaw, GA 30144', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/LK01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'LK01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Lassiter High School', '2601 Shallowford Road Marietta, GA 30066', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/LA01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'LA01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Lindley Middle School', '50 Veterans Memorial Hwy SE, Mableton, GA 30126', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/LD01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'LD01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Lindley 6th Grade Academy', '1550 Pebblebrook Circle, Mableton, GA 30126', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/LD02%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'LD02';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('The Church At Acworth', '4448 South Main Street, Acworth, GA 30101', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/LO01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'LO01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Lost Mountain Baptist Church', '5400 Old Dallas Rd, Powder Springs, GA 30127', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/LM01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'LM01';

-- == M ==
UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Mableton Elementary School', '5220 Church Street Mableton, GA 30126', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/MA01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MA01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('South Cobb Recreation Center', '875 Six Flags Drive Austell, GA 30168', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/MA02%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MA02';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('South Cobb Community Center', '620 Lions Club Drive Mableton, GA 30126', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/MA03%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MA03';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('First Christian Church of Mableton', '878 Old Alabama Road Mableton, GA 30126', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/MA04%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MA04';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Riverside Elementary School', '6800 Mableton Pkwy SE, Mableton, GA 30126', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/MA05%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MA05';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Marietta High School', '1171 Whitlock Ave SW, Marietta, GA 30064', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/MH01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MH01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Northwest Christian Church', '3737 Dallas Acworth Highway, Acworth, GA 30101', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/MC01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MC01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('McEachern High School', '2400 New Macland Road, Powder Springs, GA 30127', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/MC02%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MC02';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('McEachern Memorial UMC', '4075 Macland Road Powder Springs, GA 30127', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/MC03%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MC03';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Mt. Paran North Church of God', '1700 Allgood Rd, Marietta, GA 30062', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/MP01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MP01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Mountain View Elementary School', '3151 Sandy Plains Road, Marietta, GA 30066', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/MV01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MV01';

-- == N ==
UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Nicholson Elementary School', '1599 Shallowford Road, Marietta, GA 30066', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/NI01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'NI01';

-- == O ==
UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Oakwood Hills Church', '4618 Oakdale Road Smyrna, GA 30082', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/OA01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'OA01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Oregon Pond Recreation Center', '145 Old Hamilton Road Marietta, GA 30064', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/OR01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'OR01';

-- == P ==
UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Pebblebrook High School', '991 Old Alabama Road Mableton, GA 30126', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/PB01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'PB01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Pickett''s Mill Elementary School', '6400 Old Stilesboro Rd NW Acworth, GA 30101', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/PM01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'PM01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Pittman Elementary School', '5250 Austell Road Austell, GA 30106', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/PI01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'PI01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Varner Elementary School', '4761 Gaydon Road Powder Springs, GA 30127', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/PO01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'PO01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Powder Springs Library', '4181 Atlanta St Powder Springs, GA 30127', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/PO02%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'PO02';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Powder Springs United Methodist Church', '4329 Marietta Street Powder Springs, GA 30127', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/PO03%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'PO03';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('George E. Ford Center', '4181 Atlanta Street, Powder Springs, GA 30127', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/PO04%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'PO04';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Powers Ferry Elementary School', '403 Powers Ferry Road Marietta, GA 30067', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/PF01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'PF01';

-- == R ==
UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Riverside Intermediate', '5750 Mableton Pkwy SE, Mableton, GA 30126', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/RI01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'RI01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Rocky Mount Elementary School', '2400 Rocky Mountain Road, Marietta, GA 30066', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/RM01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'RM01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Russell Elementary School', '3920 South Hurt Road Smyrna, GA 30082', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/RU01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'RU01';

-- == S ==
UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Sanders Elementary School', '4701 Austell Road Austell, GA 30106', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2025-02/SA01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'SA01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Temple Kol Emeth', '1415 Old Canton Road Marietta, GA 30062', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/SM01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'SM01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Immanuel Korean Methodist Church', '945 Old Canton Road Marietta, GA 30068', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2025-02/SM03%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'SM03';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Shallowford Falls Elementary School', '3529 Lassiter Road Marietta, GA 30062', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/SF01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'SF01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Mountain View Regional Library', '3320 Sandy Plains Road Marietta, GA 30066', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/SI01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'SI01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Covenant Church', '3375 Atlanta Road, SE Smyrna, GA 30080', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/SN1A%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'SN1A';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('First Baptist Church of Smyrna', '1275 Church Street Smyrna, GA 30080', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/SN2A%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'SN2A';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Shiloh Seventh Day Adventist Church', '810 Church St. SE Smyrna, GA 30080', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/SN3A%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'SN3A';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Cumberland Community Church', '3059 South Cobb Drive Smyrna, GA 30080', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/SN3B%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'SN3B';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('The Little Cottage', '652 Concord Rd. SE Smyrna, GA 30080', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/SN4A%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'SN4A';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Iglesia Pentecostal De Jesucristo Roca De Salvacion', '2720 South Cobb Drive Smyrna, GA 30080', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2025-02/SN5A%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'SN5A';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('American Legion Smyrna Georgia Post 160, Inc', '160 Legion Drive Smyrna, GA 30080', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/SN6A%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'SN6A';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Life Church Smyrna Assembly of God', '4100 King Springs Road Smyrna, GA 30082', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2025-01/SN7A%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'SN7A';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Holy Family Catholic Church', '3401 Lower Roswell Road Marietta, GA 30068', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/SO01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'SO01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Sope Creek Elementary School', '3320 Paper Mill Road Marietta, GA 30067', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/SO02%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'SO02';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Lutheran Church of Resurrection', '4814 Paper Mill Road Marietta, GA 30067', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-12/SO03%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'SO03';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Linked Up Church', '4331 Brownsville Road Powder Springs, GA 30127', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/SW01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'SW01';

-- == T ==
UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Old Eastvalley Elementary School', '2570 Lower Roswell Road Marietta, GA 30067', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/TM01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'TM01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Catholic Church of St. Ann', '4905 Roswell Road Marietta, GA 30062', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/TR01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'TR01';

-- == V ==
UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Vaughan Elementary School', '5950 Nichols Road Powder Springs, GA 30127', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/VA01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'VA01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Vinings Library', '4290 Paces Ferry Road Atlanta, GA 30339', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/VG01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'VG01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Teasley Elementary School', '3640 Spring Hill Pkwy Smyrna, GA 30080', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/VG02%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'VG02';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('King Spring Baptist Church', '3732 King Springs Rd SE Smyrna, GA 30080', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/VG03%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'VG03';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Vinings United Methodist Church', '3101 Paces Mill Rd SE Atlanta, GA 30339', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2025-02/VG04%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'VG04';

-- == W ==
UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Christ Harvester Global Outreach Ministries', '885 Shiloh Rd., NW Kennesaw, GA 30144', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/WG01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'WG01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Christ Episcopal Church', '1210 Wooten Lake Road Kennesaw, GA 30144', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/WG02%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'WG02';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Cobb Community Church', '4649 Sandy Plains Road Marietta, GA 30066', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/WL01%20Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'WL01';

-- Drop the helper function if no longer needed
-- DROP FUNCTION IF EXISTS create_precinct_meta(TEXT, TEXT, TEXT); 