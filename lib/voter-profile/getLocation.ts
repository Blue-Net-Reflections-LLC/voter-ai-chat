import { sql } from '@/lib/voter/db';

export async function getLocation(registration_number: string) {
  const result = await sql`
    SELECT
      county_code, county_name,
      residence_street_number, residence_pre_direction, residence_street_name,
      residence_street_type, residence_post_direction, residence_apt_unit_number,
      residence_city, residence_zipcode,
      mailing_street_number, mailing_street_name, mailing_apt_unit_number,
      mailing_city, mailing_zipcode, mailing_state, mailing_country,
      ST_X(geom) as longitude, ST_Y(geom) as latitude,
      census_tract, 
      redistricting_cong_affected, redistricting_senate_affected, redistricting_house_affected
    FROM ga_voter_registration_list
    WHERE voter_registration_number = ${registration_number}
    LIMIT 1;
  `;

  if (result.length === 0) {
    throw new Error('Voter not found');
  }

  const v = result[0];
  return {
    countyCode: v.county_code,
    countyName: v.county_name,
    residenceAddress: {
      streetNumber: v.residence_street_number,
      preDirection: v.residence_pre_direction,
      streetName: v.residence_street_name,
      streetType: v.residence_street_type,
      postDirection: v.residence_post_direction,
      aptUnitNumber: v.residence_apt_unit_number,
      city: v.residence_city,
      zipcode: v.residence_zipcode,
    },
    mailingAddress: {
      streetNumber: v.mailing_street_number,
      streetName: v.mailing_street_name,
      aptUnitNumber: v.mailing_apt_unit_number,
      city: v.mailing_city,
      zipcode: v.mailing_zipcode,
      state: v.mailing_state,
      country: v.mailing_country,
    },
    coordinates: {
      longitude: v.longitude,
      latitude: v.latitude,
    },
    censusTractId: v.census_tract,
    redistrictingAffected: {
      congressional: v.redistricting_cong_affected,
      senate: v.redistricting_senate_affected,
      house: v.redistricting_house_affected,
    },
  };
} 