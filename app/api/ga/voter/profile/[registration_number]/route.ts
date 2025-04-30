import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/voter/db'; // Assuming db setup exists

interface ProfileParams {
  params: {
    registration_number: string;
  }
}

export async function GET(request: NextRequest, { params }: ProfileParams) {
  const { registration_number } = params;

  if (!registration_number || registration_number.length !== 8) {
    return NextResponse.json({ error: 'Valid registration number (8 digits) is required' }, { status: 400 });
  }

  try {
    // Fetch core voter data
    const voterResult = await sql`
      SELECT
        -- Voter Info
        voter_registration_number, registration_date, status, status_reason,
        first_name, middle_name, last_name, suffix, birth_year, race, gender,
        last_modified_date, voter_created_date,
        -- Location
        county_code, county_name,
        residence_street_number, residence_pre_direction, residence_street_name,
        residence_street_type, residence_post_direction, residence_apt_unit_number,
        residence_city, residence_zipcode,
        mailing_street_number, mailing_street_name, mailing_apt_unit_number,
        mailing_city, mailing_zipcode, mailing_state, mailing_country,
        ST_X(geom) as longitude, ST_Y(geom) as latitude, -- For map/LegiEquity
        census_tract, -- For Census
        redistricting_cong_affected, redistricting_senate_affected, redistricting_house_affected,
        -- Precincts & Districts
        county_precinct, county_precinct_description, municipal_precinct,
        congressional_district, state_senate_district, state_house_district,
        judicial_district, municipality,
        -- Participation History
        voting_events
      FROM ga_voter_registration_list
      WHERE voter_registration_number = ${registration_number}
      LIMIT 1;
    `;

    if (voterResult.length === 0) {
      return NextResponse.json({ error: 'Voter not found' }, { status: 404 });
    }

    const voterData = voterResult[0];

    // Structure the data
    const voterInfo = {
      registrationNumber: voterData.voter_registration_number,
      registrationDate: voterData.registration_date,
      status: voterData.status,
      statusReason: voterData.status_reason,
      firstName: voterData.first_name,
      middleName: voterData.middle_name,
      lastName: voterData.last_name,
      suffix: voterData.suffix,
      birthYear: voterData.birth_year,
      race: voterData.race,
      gender: voterData.gender,
      lastModifiedDate: voterData.last_modified_date,
      creationDate: voterData.voter_created_date,
    };

    const location = {
      countyCode: voterData.county_code,
      countyName: voterData.county_name,
      residenceAddress: {
        streetNumber: voterData.residence_street_number,
        preDirection: voterData.residence_pre_direction,
        streetName: voterData.residence_street_name,
        streetType: voterData.residence_street_type,
        postDirection: voterData.residence_post_direction,
        aptUnitNumber: voterData.residence_apt_unit_number,
        city: voterData.residence_city,
        zipcode: voterData.residence_zipcode,
      },
      mailingAddress: {
        streetNumber: voterData.mailing_street_number,
        streetName: voterData.mailing_street_name,
        aptUnitNumber: voterData.mailing_apt_unit_number,
        city: voterData.mailing_city,
        zipcode: voterData.mailing_zipcode,
        state: voterData.mailing_state,
        country: voterData.mailing_country,
      },
      coordinates: {
        longitude: voterData.longitude,
        latitude: voterData.latitude,
      },
      censusTractId: voterData.census_tract,
      redistrictingAffected: {
        congressional: voterData.redistricting_cong_affected,
        senate: voterData.redistricting_senate_affected,
        house: voterData.redistricting_house_affected,
      },
      // TODO: Add other voters at address here later
    };

    const districts = {
      countyPrecinct: voterData.county_precinct,
      countyPrecinctDescription: voterData.county_precinct_description,
      municipalPrecinct: voterData.municipal_precinct,
      congressional: voterData.congressional_district,
      stateSenate: voterData.state_senate_district,
      stateHouse: voterData.state_house_district,
      judicial: voterData.judicial_district,
      municipality: voterData.municipality,
      // TODO: Add representative data here later
    };

    const participation = {
      history: voterData.voting_events || [], // Ensure it's an array
    };

    // TODO: Fetch other voters at address
    // TODO: Fetch representative data (async)
    // TODO: Fetch census data (async)

    // Placeholder response
    const voterProfileData = {
      voterInfo,
      location,
      districts,
      participation,
      // TODO: Add otherVoters, representatives, census sections later
    };

    return NextResponse.json(voterProfileData);

  } catch (error) {
    console.error(`Error fetching profile for voter ${registration_number}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
} 