import { sql } from '@/lib/voter/db';

export async function getDistricts(registration_number: string) {
  const result = await sql`
    SELECT
      county_precinct, county_precinct_description, municipal_precinct,
      congressional_district, state_senate_district, state_house_district,
      judicial_district, municipality
    FROM ga_voter_registration_list
    WHERE voter_registration_number = ${registration_number}
    LIMIT 1;
  `;

  if (result.length === 0) {
    throw new Error('Voter not found');
  }

  const d = result[0];
  return {
    countyPrecinct: d.county_precinct,
    countyPrecinctDescription: d.county_precinct_description,
    municipalPrecinct: d.municipal_precinct,
    congressional: d.congressional_district,
    stateSenate: d.state_senate_district,
    stateHouse: d.state_house_district,
    judicial: d.judicial_district,
    municipality: d.municipality,
  };
} 