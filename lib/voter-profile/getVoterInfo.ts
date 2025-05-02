import { sql } from '@/lib/voter/db';

export async function getVoterInfo(registration_number: string) {
  const result = await sql`
    SELECT
      voter_registration_number, registration_date, status, status_reason,
      first_name, middle_name, last_name, suffix, birth_year, race, gender,
      last_modified_date, voter_created_date,
      participation_score
    FROM ga_voter_registration_list
    WHERE voter_registration_number = ${registration_number}
    LIMIT 1;
  `;

  if (result.length === 0) {
    throw new Error('Voter not found');
  }

  const v = result[0];
  // Calculate age from birth year
  const currentYear = new Date().getFullYear();
  const age = v.birth_year ? currentYear - v.birth_year : null;
  
  return {
    registrationNumber: v.voter_registration_number,
    registrationDate: v.registration_date,
    status: v.status,
    statusReason: v.status_reason,
    firstName: v.first_name,
    middleName: v.middle_name,
    lastName: v.last_name,
    suffix: v.suffix,
    birthYear: v.birth_year,
    age: age,
    race: v.race,
    gender: v.gender,
    lastModifiedDate: v.last_modified_date,
    creationDate: v.voter_created_date,
    participationScore: typeof v.participation_score === 'number' 
                        ? v.participation_score 
                        : (typeof v.participation_score === 'string' && !isNaN(parseFloat(v.participation_score)) 
                            ? parseFloat(v.participation_score) 
                            : null),
  };
} 