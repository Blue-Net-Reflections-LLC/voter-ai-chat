import { sql } from '@/lib/voter/db';

export async function getOtherVoters(registration_number: string) {
  try {
    console.log(`[getOtherVoters] Starting query for registration ${registration_number}`);
    
    // First, fetch ALL address details of the target voter
    const voterResult = await sql`
      SELECT 
        residence_street_number, 
        residence_pre_direction, 
        residence_street_name,
        residence_street_type, 
        residence_post_direction, 
        residence_apt_unit_number,
        residence_city, 
        residence_zipcode
      FROM ga_voter_registration_list
      WHERE voter_registration_number = ${registration_number}
      LIMIT 1;
    `;

    if (voterResult.length === 0) {
      console.log(`[getOtherVoters] Voter ${registration_number} not found`);
      throw new Error('Voter not found');
    }

    const voter = voterResult[0];
    
    // Log address components to identify potential issues
    console.log(`[getOtherVoters] Voter address details:`, {
      street_number: voter.residence_street_number,
      pre_direction: voter.residence_pre_direction,
      street_name: voter.residence_street_name,
      street_type: voter.residence_street_type,
      post_direction: voter.residence_post_direction,
      apt_unit: voter.residence_apt_unit_number,
      city: voter.residence_city,
      zipcode: voter.residence_zipcode
    });

    // Building a more careful query with proper handling of null values
    // Note: For each component, we need to consider that if the value is null in our source voter,
    // we need to match with other voters where that value is also null

    // For each address component, construct a matching condition
    const streetNumberCondition = voter.residence_street_number === null
      ? sql`residence_street_number IS NULL`
      : sql`residence_street_number = ${voter.residence_street_number}`;
      
    const preDirectionCondition = voter.residence_pre_direction === null
      ? sql`residence_pre_direction IS NULL`
      : sql`residence_pre_direction = ${voter.residence_pre_direction}`;
      
    const streetNameCondition = sql`residence_street_name = ${voter.residence_street_name}`;
    
    const streetTypeCondition = voter.residence_street_type === null
      ? sql`residence_street_type IS NULL`
      : sql`residence_street_type = ${voter.residence_street_type}`;
      
    const postDirectionCondition = voter.residence_post_direction === null
      ? sql`residence_post_direction IS NULL`
      : sql`residence_post_direction = ${voter.residence_post_direction}`;
      
    const aptUnitCondition = voter.residence_apt_unit_number === null
      ? sql`residence_apt_unit_number IS NULL`
      : sql`residence_apt_unit_number = ${voter.residence_apt_unit_number}`;
    
    const cityCondition = sql`residence_city = ${voter.residence_city}`;
    
    const zipcodeCondition = sql`residence_zipcode = ${voter.residence_zipcode}`;
    
    // Combine all conditions into one query with expanded fields
    console.log('[getOtherVoters] Executing query with ALL address components');
    const otherVotersResult = await sql`
      SELECT 
        voter_registration_number,
        first_name,
        middle_name,
        last_name,
        suffix,
        status,
        gender,
        birth_year,
        EXTRACT(YEAR FROM CURRENT_DATE) - birth_year AS age
      FROM ga_voter_registration_list
      WHERE 
        voter_registration_number <> ${registration_number}
        AND ${streetNumberCondition}
        AND ${preDirectionCondition}
        AND ${streetNameCondition}
        AND ${streetTypeCondition}
        AND ${postDirectionCondition}
        AND ${aptUnitCondition}
        AND ${cityCondition}
        AND ${zipcodeCondition}
      ORDER BY last_name, first_name;
    `;
    
    console.log(`[getOtherVoters] Found ${otherVotersResult.length} other voters at the same address`);
    
    // Get the current year for age calculation
    const currentYear = new Date().getFullYear();
    
    // Return the list of other voters at the same address with enhanced information
    return { 
      otherVoters: otherVotersResult.map(v => ({
        registrationNumber: v.voter_registration_number,
        firstName: v.first_name,
        middleName: v.middle_name,
        lastName: v.last_name,
        suffix: v.suffix,
        fullName: [v.first_name, v.middle_name, v.last_name, v.suffix]
          .filter(Boolean)
          .join(' '),
        status: v.status,
        gender: v.gender,
        birthYear: v.birth_year,
        age: v.age || (v.birth_year ? currentYear - v.birth_year : null)
      }))
    };
    
  } catch (error) {
    // Log the full error details for debugging
    console.error('[getOtherVoters] ERROR:', error);
    console.error('[getOtherVoters] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Rethrow with clear message
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error fetching other voters at address');
  }
} 