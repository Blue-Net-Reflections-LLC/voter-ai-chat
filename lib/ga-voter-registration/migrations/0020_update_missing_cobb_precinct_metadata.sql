-- Migration: 0020_update_missing_cobb_precinct_metadata.sql
-- Purpose: Update REFERENCE_DATA with metadata for previously added Cobb County precincts.
-- Data extracted from design/ga/ga-country-precincts.md

-- Ensure this script is run AFTER 0019_add_missing_cobb_precincts.sql has been executed.

-- Re-create the helper function for this migration scope
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
-- Precinct Metadata Updates
-- =============================================

-- NOTE: Precincts '0005C', '0021B', '88888' were not found in the source file and will retain NULL metadata.

-- == A ==
UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Northstar Church', '3413 Blue Springs Rd NW Kennesaw, GA 30144', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/AC1A Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'AC1A';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Acworth Community Center', '4361 Cherokee Street Acworth, GA 30101', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/AC1B Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'AC1B';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('North Cobb Senior Center', '3900 South Main Street Acworth, GA 30101', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/AC1C Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'AC1C';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Kulture Event Center', '2933 Canton Rd. Ste. 290 Marietta, GA 30060', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/AD01 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'AD01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Collar Park Community Center', '2625 Joe Jerkins Blvd Austell, GA 30106', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2025-03/AU1A Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'AU1A';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Love Bridge Church', '5991 Love Street Austell, GA 30168', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/AU1B Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'AU1B';

-- == B ==
UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Shiloh Hills Baptist Church', '75 Hawkins Store Rd Kennesaw, GA 30144', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/BF04 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'BF04';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Greers Chapel Baptist Church', '1848 Greers Chapel Rd. Kennesaw, GA 30144', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/BG01 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'BG01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Towne View Baptist Church', '950 Shiloh Rd NW Kennesaw, GA 30144', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/BG02 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'BG02';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Summit Baptist Church', '4310 Moon Station Lane Acworth, GA 30101', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/BK01 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'BK01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Gritters Library', '880 Shaw Park Rd. Marietta, GA 30066', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-10/BW01 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'BW01';

-- == C ==
UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('The Paces Foundation Inc.', '2730 Cumberland Blvd SE Smyrna, GA 30080', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/CA01 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'CA01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Mercy Hill Church', '287 Mt. Calvary Road Marietta, GA 30064', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/CH02 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'CH02';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Cheatham Hill Elementary School', '1350 John Ward Road Marietta, GA 30064', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/CH03 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'CH03';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Grace Church at Town Center', '3005 Ring Road NW Kennesaw, GA 30144', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2025-02/CK01 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'CK01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Spirit Life Church of God', '4889 Hill Road Powder Springs, GA 30127', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/CL02 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'CL02';

-- == D ==
UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Grace Resurrection Methodist Church', '1200 Indian Hills Pkwy Marietta, GA 30068', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/DC01 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'DC01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Windy Hill Community Center', '1885 Roswell Street SE Smyrna, GA 30080', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2025-02/DI01 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'DI01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Cobb County Adult Education Center', '1595 Hawthorne Avenue SE Smyrna, GA 30080', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/DI02 Public_0.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'DI02';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Macland Road Church of Christ', '2732 Macland Road Marietta, GA 30064', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/DL01 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'DL01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Durham Middle School', '2891 Mars Hill Road Acworth, GA 30101', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/DU01 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'DU01';

-- == E ==
UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Congregation ETZ Chaim', '1190 Indian Hills Parkway Marietta, GA 30068', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/EA01 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'EA01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Eastside Baptist Church', '2450 Lower Roswell Road NE Marietta, GA 30067', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/EA02 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'EA02';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Cobb EMC', '1000 EMC Parkway Marietta, GA 30060', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2025-02/EL01 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'EL01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Covenant Presbyterian Church', '2881 Canton Road Marietta, GA 30066', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/EL02 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'EL02';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Piedmont Road Church of Christ', '1630 Piedmont Road Marietta, GA 30066', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/EL03 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'EL03';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Gracelife Church', '1083 Allgood Road NE Marietta, GA 30062', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/EL04 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'EL04';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Sandy Plains Baptist Church', '2825 Sandy Plains Road Marietta, GA 30066', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/EL05 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'EL05';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Shady Grove Baptist Church', '1285 Cobb Pkwy North Marietta, GA 30062', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/EP01 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'EP01';

-- == F ==
UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Christ Anglican Church', '844 Smyrna Powder Springs Road Marietta, GA 30060', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-12/FO02 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'FO02';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Seven Springs Marietta', '511 Church Road Marietta, GA 30060', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2025-04/FO04 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'FO04';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Fullers Park Recreation Center', '3499 Robinson Road Marietta, GA 30068', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2025-02/FP01 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'FP01';

-- == G-H ==
UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Crossview Baptist Church', '1100 Piedmont Road NE Marietta, GA 30066', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2025-02/GT01 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'GT01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Harrison High School', '4500 Due West Road Kennesaw, GA 30152', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/HR01 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'HR01';

-- == K ==
UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Kennesaw United Methodist Church', '1801 Ben King Road Kennesaw, GA 30144', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2025-02/KE1A Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'KE1A';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('New Beginnings United Methodist Church', '2975 Cobb Parkway Kennesaw, GA 30152', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2025-02/KE2A Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'KE2A';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Ben Robertson Community Center', '2753 Watts Drive NW Kennesaw, GA 30144', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2025-01/KE3A Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'KE3A';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Kennesaw First Baptist Church', '2958 North Main Street Kennesaw, GA 30144', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/KE4A Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'KE4A';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Legacy Park Clubhouse', '4201 Legacy Park Circle Kennesaw, GA 30144', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/KE5A Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'KE5A';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Kell High School', '4770 Lee Waters Road Marietta, GA 30066', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/KL01 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'KL01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Due West United Methodist Church', '3956 Due West Road Marietta, GA 30064', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2025-02/KP01 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'KP01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('West Cobb Church', '1245 Villa Rica Road Marietta, GA 30064', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/KP02 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'KP02';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Burnt Hickory Baptist Church', '5145 Due West Road Powder Springs, GA 30127', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/KP03 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'KP03';

-- == L ==
UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Lost Mountain Middle School', '700 Old Mountain Road Kennesaw, GA 30152', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/LM02 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'LM02';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Boots Ward Recreation Center', '4845 Dallas Highway Powder Springs, GA 30127', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/LM03 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'LM03';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('McClure Middle School', '3660 Old Stilesboro Road Kennesaw, GA 30152', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/LM04 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'LM04';

-- == M ==
UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Trinity United Methodist Church', '821 South Gordon Road Austell, GA 30168', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/MA1A Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MA1A';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Riverside Epicenter', '135 Riverside Parkway Austell, GA 30168', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/MA1B Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MA1B';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Impact Worship Center', '6925 Mableton Pkwy Mableton, GA 30126', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/MA2A Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MA2A';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('City View Elementary School', '285 South Gordon Road Mableton, GA 30126', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/MA2B Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MA2B';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Mableton Banquet Hall', '6114 Mableton Parkway Mableton, GA 30126', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/MA3A Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MA3A';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('South Cobb Community Center', '620 Lions Club Drive Mableton, GA 30126', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/MA3B Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MA3B';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Lindley Middle School', '50 Veterans Memorial Hwy Mableton, GA 30126', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/MA3C Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MA3C';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Floyd Middle School', '4803 Floyd Road Mableton, GA 30126', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/MA4A Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MA4A';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('South Cobb Regional Library', '805 Clay Road Mableton, GA 30126', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/MA4B Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MA4B';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Thompson Community Center', '555 Nickajack Road Mableton, GA 30126', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/MA4C Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MA4C';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Calvary Baptist Church of Austell', '4780 Flint Hill Road Austell, GA 30106', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2025-02/MA5A Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MA5A';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Mableton Elementary School', '5220 Church Street SW Mableton, GA 30126', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/MA5B Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MA5B';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Floyd Road Baptist Church', '3996 Floyd Road Austell, GA 30106', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/MA6A Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MA6A';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('C. Freeman Poole Senior Center', '4025 S. Hurt Road SW Smyrna, GA 30082', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-12/MA6B Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MA6B';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Hope Presbyterian Church', '4101 Sandy Plains Road Marietta, GA 30066', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/MB01 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MB01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Atlanta Chinese Christian Church Northwest', '1837 Bill Murdock Road Marietta, GA 30062', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-12/MD01 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MD01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Worship with Wonders', '4665 Macland Road Powder Springs, GA 30127', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2025-01/ME01 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'ME01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Shallowford Free Will Baptist Church', '1686 Shallowford Road Marietta, GA 30066', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/MK01 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MK01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('McClure Middle School', '3660 Old Stilesboro Road Kennesaw, GA 30152', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/ML01 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'ML01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Bridge Pointe Church', '285 Victory Drive Marietta, GA 30060', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-12/MR1A Public_0.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MR1A';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Marietta High School', '1171 Whitlock Avenue Marietta, GA 30064', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2025-02/MR2A Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MR2A';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Senior Wellness Center', '1150 Powder Springs Street Marietta, GA 30064', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/MR2B Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MR2B';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Switzer Library', '266 Roswell Street, NE Marietta, GA 30060', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/MR3A Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MR3A';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Missionary Church Assembly of God', '1021 Oregon Trail SW Marietta 30008', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-12/MR3B Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MR3B';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Maple Ave United Methodist Church', '63 Maple Avenue Marietta, GA 30064', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/MR4A Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MR4A';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Liberty Church', '1285 Cobb Pkwy North Marietta, GA 30062', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/MR4B Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MR4B';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('New Salem Baptist Church', '836 New Salem Rd Kennesaw, GA 30152', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/MR4C Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MR4C';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Zion Baptist Church', '165 Lemon Street Marietta, GA 30060', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2025-01/MR5A Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MR5A';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Turner Chapel Cathedral', '492 North Marietta Parkway Marietta, GA 30060', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/MR5B Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MR5B';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Kenyan American Community Church', '771 Elberta Dr Marietta, GA 30066', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/MR6A Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MR6A';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Mt. Paran Church of God North', '1700 Allgood Road Marietta, GA 30062', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2025-03/MR6B Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MR6B';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Cobb County Civic Center', '548 South Marietta Pkwy Marietta, GA 30060', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/MR7A Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MR7A';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Northwest Christian Church', '3737 Dallas Acworth Highway, NW Acworth, GA 30101', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/MS01 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MS01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Living Hope Lutheran Church', '3450 Stilesboro Road Kennesaw, GA 30152', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/MS02 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MS02';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Johnson Ferry Baptist Church', '955 Johnson Ferry Road Marietta, GA 30068', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2025-02/MT01 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MT01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('East Cobb Government Service Center', '4400 Lower Roswell Road Marietta, GA 30068', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/MT03 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MT03';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Mt. Bethel United Methodist Church', '4385 Lower Roswell Road Marietta, GA 30068', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/MT04 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'MT04';

-- == N ==
UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Cobb Vineyard Christian Fellowship', '3206 Old Highway 41 Kennesaw, GA 30144', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/NC01 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'NC01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Nickajack Elementary School', '4555 Mavell Road Smyrna, GA 30082', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2025-01/NJ01 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'NJ01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Highpoint Christian Tabernacle', '3269 Old Concord Rd SE Smyrna, GA 30082', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/NP01 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'NP01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('East Cobb Baptist Church', '1940 Shallowford Road Marietta, GA 30066', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/NS01 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'NS01';

-- == O ==
UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('St Thomas Catholic Church', '4300 King Springs Road Smyrna, GA 30082-6298', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/OK01 Public_0.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'OK01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Gathering of Champions Church', '1994 Powder Springs Road SW Marietta, GA 30064', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2025-01/OR02 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'OR02';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Fair Oaks Rec Center', '1465 W Booth Rd Ext SW Marietta, GA 30008', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-12/OR03 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'OR03';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Trinity Fellowship', '2115 Pair Road SW Marietta, GA 30064', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/OR04 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'OR04';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Macland Community Church', '3615 Macland Road Powder Springs, GA 30127', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/OR05 Public_0.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'OR05';

-- == P ==
UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Burnt Hickory Church of Christ', '2330 Burnt Hickory Road Marietta, GA 30064', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/PM02 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'PM02';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Tim D. Lee Senior Center', '3332 Sandy Plains Road Marietta, GA 30066', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2025-02/PP01 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'PP01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Calvary Chapel Woodstock', '50 Shallowford Road Kennesaw, GA 30144', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/PR01 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'PR01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('The George E. Ford Center', '4181 Atlanta Street Powder Springs, GA 30127', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2025-02/PS1A Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'PS1A';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Ron Anderson Recreation Center', '3820 Macedonia Road Powder Springs, GA 30127', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/PS2A Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'PS2A';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('First Baptist Church Powder Springs', '4330 North Avenue Powder Springs, GA 30127', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2025-02/PS3A Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'PS3A';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Pitner Elementary School', '4575 Wade Green Road Acworth, GA 30102', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/PT01 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'PT01';

-- == R ==
UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Catholic Church of St. Ann', '4905 Roswell Road Marietta, GA 30062', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-06/RW01 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'RW01';

UPDATE REFERENCE_DATA SET
    lookup_meta = create_precinct_meta('Mt. Zion United Methodist Church', '1770 Johnson Ferry Road Marietta, Ga 30062', 'https://s3.amazonaws.com/cobbcounty.org.if-us-east-1/s3fs-public/2024-08/RW02 Public.pdf'),
    updated_at = NOW()
WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC' AND state_code = 'GA' AND county_code = '067' AND lookup_key = 'RW02';

-- Drop the helper function if no longer needed
DROP FUNCTION IF EXISTS create_precinct_meta(TEXT, TEXT, TEXT);

