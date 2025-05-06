import { sql } from '@/lib/voter/db';

export async function getDistricts(registration_number: string) {
  // First get basic district info from voter registration
  const voterResult = await sql`
    SELECT
      county_precinct, county_precinct_description, municipal_precinct,
      congressional_district, state_senate_district, state_house_district,
      judicial_district, municipality
    FROM ga_voter_registration_list
    WHERE voter_registration_number = ${registration_number}
    LIMIT 1;
  `;

  if (voterResult.length === 0) {
    throw new Error('Voter not found');
  }

  const voter = voterResult[0];
  
  // Get precinct facility information from REFERENCE_DATA table
  let facilityInfo = null;
  if (voter.county_precinct) {
    const facilityResult = await sql`
      SELECT lookup_meta
      FROM REFERENCE_DATA
      WHERE lookup_type = 'GA_COUNTY_PRECINCT_DESC'
      AND state_code = 'GA'
      AND county_code = '067'
      AND lookup_key = ${voter.county_precinct}
      LIMIT 1;
    `;
    
    if (facilityResult.length > 0 && facilityResult[0].lookup_meta) {
      facilityInfo = facilityResult[0].lookup_meta;
    }
  }

  return {
    countyPrecinct: voter.county_precinct,
    countyPrecinctDescription: voter.county_precinct_description,
    municipalPrecinct: voter.municipal_precinct,
    congressional: voter.congressional_district,
    stateSenate: voter.state_senate_district,
    stateHouse: voter.state_house_district,
    judicial: voter.judicial_district,
    municipality: voter.municipality,
    facility: facilityInfo ? {
      facilityName: facilityInfo.facility_name,
      facilityAddress: facilityInfo.facility_address,
      mapUrl: facilityInfo.map_url
    } : null
  };
} 