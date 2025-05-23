/**
 * Shared utility function to build the WHERE clause for the voter list API
 * based on URL search parameters.
 */
import { SCORE_RANGES } from "@/lib/participation-score/constants"; // Import score range definitions
import { INCOME_BRACKETS, EDUCATION_BRACKETS, UNEMPLOYMENT_BRACKETS } from '@/lib/census/constants';

export function buildVoterListWhereClause(searchParams: URLSearchParams, tableAlias?: string): string {
  // Add a prefix to column names if tableAlias is provided
  const col = (name: string) => tableAlias ? `${tableAlias}.${name}` : name;

  // --- Start: Filter parameter extraction ---
  const registrationNumber = searchParams.get('registrationNumber');
  const congressionalDistricts = searchParams.getAll('congressionalDistricts');
  const stateSenateDistricts = searchParams.getAll('stateSenateDistricts');
  const stateHouseDistricts = searchParams.getAll('stateHouseDistricts');
  const scoreRangeKeys = searchParams.getAll('scoreRanges'); // Get selected score range labels
  const statusValues = searchParams.getAll('status');
  const statusReasonParams = searchParams.getAll('statusReason');
  const partyValues = searchParams.getAll('party');
  const countyPrecincts = searchParams.getAll('countyPrecinct');
  const municipalPrecincts = searchParams.getAll('municipalPrecinct');
  const redistrictingAffectedTypes = searchParams.getAll('redistrictingAffectedTypes');
  const ballotStyles = searchParams.getAll('ballotStyle');
  const eventParties = searchParams.getAll('eventParty');
  const voterEventMethod = searchParams.get('voterEventMethod');

  // Voter details filters
  const firstName = searchParams.get('firstName');
  const lastName = searchParams.get('lastName');
  const ageMin = searchParams.get('ageMin');
  const ageMax = searchParams.get('ageMax');
  const ageRanges = searchParams.getAll('ageRange');
  const genderValues = searchParams.getAll('gender');
  const raceValues = searchParams.getAll('race');
  const notVotedSinceYear = searchParams.get('notVotedSinceYear');
  const electionTypes = searchParams.getAll('electionType');
  const electionYears = searchParams.getAll('electionYear');
  const electionDates = searchParams.getAll('electionDate');

  // Residence address filters (composite only)
  const residenceStreetNumbers: string[] = [];
  const residencePreDirections: string[] = [];
  const residenceStreetNames: string[] = [];
  const residenceStreetSuffixes: string[] = [];
  const residencePostDirections: string[] = [];
  const residenceAptUnitNumbers: string[] = [];
  const residenceCities: string[] = [];
  const residenceZipcodes: string[] = [];
  const residentAddresses = searchParams.getAll('resident_address');

  // Radius filter (geographic proximity search)
  const radiusFilter = searchParams.get('radiusFilter');

  residentAddresses.forEach(addr => {
    const parts = addr.split(',');
    if (parts.length === 8) {
      const [num, pre, name, type, post, apt, city, zip] = parts;
      if (num) residenceStreetNumbers.push(num);
      if (pre) residencePreDirections.push(pre);
      if (name) residenceStreetNames.push(name);
      if (type) residenceStreetSuffixes.push(type);
      if (post) residencePostDirections.push(post);
      if (apt) residenceAptUnitNumbers.push(apt);
      if (city) residenceCities.push(city);
      if (zip) residenceZipcodes.push(zip);
    }
  });
  // --- End: Filter parameter extraction ---

  // --- Start: Build SQL conditions ---
  const conditions = [];

  // --- Handle Registration Number exclusively ---
  if (registrationNumber && registrationNumber.trim() !== '') {
    // Basic validation/sanitization might be needed depending on input source
    // Assuming registrationNumber is reasonably safe here
    conditions.push(`${col('voter_registration_number')} = '${registrationNumber.trim()}'`);
    // If registrationNumber is provided, return ONLY this condition
    return `WHERE ${conditions[0]}`;
  }

  // --- If no registrationNumber, proceed with other filters ---
  // County Filter - Handle multiple counties
  const counties = searchParams.getAll('county');
  if (counties.length > 0) {
    const countyPlaceholders = counties.map(c => `'${c}'`);
    conditions.push(`${col('county_code')} IN (${countyPlaceholders.join(', ')})`);
  }

  // Participation Score Range Filter
  if (scoreRangeKeys.length > 0) {
    const scoreConditions: string[] = [];
    scoreRangeKeys.forEach(selectedLabel => { // Iterate through selected labels
      // Find the range object by label instead of key
      const range = SCORE_RANGES.find(r => r.label === selectedLabel); 
      if (range) {
         // Use min/max for condition
         // Handle the exact 10.0 case distinctly if needed, otherwise range works
        if (range.min === 10.0 && range.max === 10.0) { 
             scoreConditions.push(`${col('participation_score')} = ${range.min}`);
        } else {
             scoreConditions.push(`(${col('participation_score')} >= ${range.min} AND ${col('participation_score')} <= ${range.max})`);
         }
      }
    });
    if (scoreConditions.length > 0) {
      conditions.push(`(${scoreConditions.join(' OR ')})`);
    }
  }

  // Status Filter (Corrected Logic)
  if (statusValues.length > 0) {
    if (statusValues.length === 1) {
      // If only one status value, use equals comparison
      conditions.push(`UPPER(${col('status')}) = UPPER('${statusValues[0]}')`);
    } else {
      // If multiple status values, use IN clause
      const upperStatusValues = statusValues.map(s => `UPPER('${s}')`);
      conditions.push(`UPPER(${col('status')}) IN (${upperStatusValues.join(', ')})`);
    }
  }

  // Add Status Reason Filter
  if (statusReasonParams.length > 0) {
    // Assuming status reasons might need case-insensitive matching and are single words or phrases
    const reasonPlaceholders = statusReasonParams.map(r => `'${r.toUpperCase()}'`); // Basic upper-casing and quoting
    conditions.push(`UPPER(${col('status_reason')}) IN (${reasonPlaceholders.join(', ')})`);
  }

  // Congressional District Filter (Example)
  if (congressionalDistricts.length > 0) {
    const placeholders = congressionalDistricts.map(district => `'${district}'`);
    conditions.push(`${col('congressional_district')} IN (${placeholders.join(', ')})`);
  }
  if (stateSenateDistricts.length > 0) {
      const placeholders = stateSenateDistricts.map(district => `'${district}'`);
      conditions.push(`${col('state_senate_district')} IN (${placeholders.join(', ')})`);
  }
  if (stateHouseDistricts.length > 0) {
      const placeholders = stateHouseDistricts.map(district => `'${district}'`);
      conditions.push(`${col('state_house_district')} IN (${placeholders.join(', ')})`);
  }
  if (countyPrecincts.length > 0) {
      const placeholders = countyPrecincts.map(precinct => `'${precinct.toUpperCase()}'`);
      conditions.push(`${col('county_precinct')} IN (${placeholders.join(', ')})`);
  }
  if (municipalPrecincts.length > 0) {
      const placeholders = municipalPrecincts.map(precinct => `'${precinct.toUpperCase()}'`);
      conditions.push(`${col('municipal_precinct')} IN (${placeholders.join(', ')})`);
  }
  if (partyValues.length > 0) {
      const partyConditions = partyValues.map(p => `UPPER(${col('last_party_voted')}) = UPPER('${p}')`).join(' OR ');
      conditions.push(`(${partyConditions})`);
  }
  if (firstName) {
    conditions.push(`UPPER(${col('first_name')}) LIKE UPPER('${firstName}%')`);
  }
  if (lastName) {
    conditions.push(`UPPER(${col('last_name')}) LIKE UPPER('${lastName}%')`);
  }

  const currentYear = new Date().getFullYear();
  if (ageRanges && ageRanges.length > 0) {
    const ageConditions: string[] = [];
    ageRanges.forEach(range => {
      // Expanded age range logic
      if (range === '18-23') ageConditions.push(`(${col('birth_year')} <= '${currentYear - 18}' AND ${col('birth_year')} >= '${currentYear - 23}')`);
      else if (range === '25-44') ageConditions.push(`(${col('birth_year')} <= '${currentYear - 25}' AND ${col('birth_year')} >= '${currentYear - 44}')`);
      else if (range === '45-64') ageConditions.push(`(${col('birth_year')} <= '${currentYear - 45}' AND ${col('birth_year')} >= '${currentYear - 64}')`);
      else if (range === '65-74') ageConditions.push(`(${col('birth_year')} <= '${currentYear - 65}' AND ${col('birth_year')} >= '${currentYear - 74}')`);
      else if (range === '75+') ageConditions.push(`${col('birth_year')} <= '${currentYear - 75}'`);
    });
    if (ageConditions.length > 0) conditions.push(`(${ageConditions.join(' OR ')})`);
  } else {
    if (ageMin) conditions.push(`${col('birth_year')} <= '${currentYear - parseInt(ageMin)}'`);
    if (ageMax) conditions.push(`${col('birth_year')} >= '${currentYear - parseInt(ageMax)}'`);
  }

  if (genderValues.length > 0) {
      const genderConditions = genderValues.map(g => `UPPER(${col('gender')}) = UPPER('${g}')`).join(' OR ');
      conditions.push(`(${genderConditions})`);
  }
  if (raceValues.length > 0) {
      const raceConditions = raceValues.map(r => `UPPER(${col('race')}) = UPPER('${r}')`).join(' OR ');
      conditions.push(`(${raceConditions})`);
  }

  // Census Data Filters
  const incomeValues = searchParams.getAll('income');
  const educationValues = searchParams.getAll('education');
  const unemploymentValues = searchParams.getAll('unemployment');

  // Handle Income Brackets filter (using census tract data)
  if (incomeValues.length > 0) {
    const incomeClauses: string[] = [];
    
    incomeValues.forEach(incomeValue => {
      const bracket = INCOME_BRACKETS.find(b => b.value === incomeValue);
      if (bracket) {
        if (bracket.max === null) {
          // For "over X" brackets
          incomeClauses.push(`${col('census_tract')} IN (
            SELECT tract_id 
            FROM stg_processed_census_tract_data 
            WHERE median_household_income >= ${bracket.min}
          )`);
        } else {
          // For range brackets
          incomeClauses.push(`${col('census_tract')} IN (
            SELECT tract_id 
            FROM stg_processed_census_tract_data 
            WHERE median_household_income >= ${bracket.min} AND median_household_income < ${bracket.max}
          )`);
        }
      }
    });
    
    if (incomeClauses.length > 0) {
      conditions.push(`(${incomeClauses.join(' OR ')})`);
    }
  }

  // Handle Education Attainment filter
  if (educationValues.length > 0) {
    const educationClauses: string[] = [];
    
    educationValues.forEach(educationValue => {
      const bracket = EDUCATION_BRACKETS.find(b => b.value === educationValue);
      if (bracket) {
        educationClauses.push(`${col('census_tract')} IN (
          SELECT tract_id 
          FROM stg_processed_census_tract_data 
          WHERE pct_bachelors_degree_or_higher >= ${bracket.min} AND pct_bachelors_degree_or_higher < ${bracket.max}
        )`);
      }
    });
    
    if (educationClauses.length > 0) {
      conditions.push(`(${educationClauses.join(' OR ')})`);
    }
  }

  // Handle Unemployment Rate filter
  if (unemploymentValues.length > 0) {
    const unemploymentClauses: string[] = [];
    
    unemploymentValues.forEach(unemploymentValue => {
      const bracket = UNEMPLOYMENT_BRACKETS.find(b => b.value === unemploymentValue);
      if (bracket) {
        unemploymentClauses.push(`${col('census_tract')} IN (
          SELECT tract_id 
          FROM stg_processed_census_tract_data 
          WHERE unemployment_rate >= ${bracket.min} AND unemployment_rate < ${bracket.max}
        )`);
      }
    });
    
    if (unemploymentClauses.length > 0) {
      conditions.push(`(${unemploymentClauses.join(' OR ')})`);
    }
  }

  const neverVoted = searchParams.get('neverVoted') === 'true';
  if (neverVoted) {
    conditions.push(`${col('derived_last_vote_date')} IS NULL`);
  }
  if (notVotedSinceYear) {
    const cutoffStart = `${notVotedSinceYear}-01-01`;
    conditions.push(`(${col('derived_last_vote_date')} IS NULL OR ${col('derived_last_vote_date')} < '${cutoffStart}')`);
  }

  // Election Type filter via voting_events JSONB (Assuming participated_election_types isn't ready/used)
  if (electionTypes.length > 0) {
      const clauses = electionTypes.map(et => `${col('voting_events')} @> '[{"election_type":"${et.toUpperCase()}"}]'`).join(' OR ');
      conditions.push(`(${clauses})`);
  }
  // Election Year filter using generated column
  if (electionYears.length > 0) {
    const yearIntegers = electionYears.map(y => parseInt(y, 10)).filter(y => !isNaN(y));
    if (yearIntegers.length > 0) {
        conditions.push(`${col('participated_election_years')} && ARRAY[${yearIntegers.join(',')}]::int[]`);
    }
  }
  // Election Date filter via voting_events JSONB
  if (electionDates.length > 0) {
    const electionParticipation = searchParams.get('electionParticipation') || 'turnedOut';
    
    if (electionParticipation === 'turnedOut') {
      // Find voters who turned out (participated)
      const dateClauses = electionDates.map(date => `${col('voting_events')} @> '[{"election_date":"${date}"}]'`).join(' OR ');
      conditions.push(`(${dateClauses})`);
    } else {
      // Find voters who sat out (did not participate)
      const notDateClauses = electionDates.map(date => `NOT (${col('voting_events')} @> '[{"election_date":"${date}"}]')`).join(' AND ');
      conditions.push(`(${notDateClauses})`);
    }
  }

  // Voter Events filters via JSONB voting_events
  if (ballotStyles.length > 0) {
      const clauses = ballotStyles.map(bs => `${col('voting_events')} @> '[{"ballot_style":"${bs}"}]'`).join(' OR ');
      conditions.push(`(${clauses})`);
  }
  if (eventParties.length > 0) {
      const clauses = eventParties.map(p => `${col('voting_events')} @> '[{"party":"${p}"}]'`).join(' OR ');
      conditions.push(`(${clauses})`);
  }
  if (voterEventMethod) {
      switch (voterEventMethod.toLowerCase()) {
          case 'absentee': conditions.push(`${col('voting_events')} @> '[{"absentee":"Y"}]'`); break;
          case 'provisional': conditions.push(`${col('voting_events')} @> '[{"provisional":"Y"}]'`); break;
          case 'supplemental': conditions.push(`${col('voting_events')} @> '[{"supplemental":"Y"}]'`); break;
      }
  }

  // Composite address OR block
  if (residentAddresses.length > 0) {
    const compositeClauses: string[] = [];
    residentAddresses.forEach(addr => {
      const parts = addr.split(',');
      if (parts.length === 8) {
        const [num, pre, name, type, post, apt, city, zip] = parts;
        const sub: string[] = [];
        if (num) sub.push(`${col('residence_street_number')} = '${num}'`);
        if (pre) sub.push(`UPPER(${col('residence_pre_direction')}) = UPPER('${pre}')`);
        if (name) sub.push(`UPPER(${col('residence_street_name')}) LIKE UPPER('${name}%')`);
        if (type) sub.push(`UPPER(${col('residence_street_type')}) = UPPER('${type}')`);
        if (post) sub.push(`UPPER(${col('residence_post_direction')}) = UPPER('${post}')`);
        if (apt) sub.push(`UPPER(${col('residence_apt_unit_number')}) = UPPER('${apt}')`);
        if (city) sub.push(`UPPER(${col('residence_city')}) = UPPER('${city}')`);
        if (zip) sub.push(`${col('residence_zipcode')} = '${zip}'`);
        if (sub.length > 0) compositeClauses.push(`(${sub.join(' AND ')})`);
      }
    });
    if (compositeClauses.length > 0) conditions.push(`(${compositeClauses.join(' OR ')})`);
  }

  // Radius filter (geographic proximity search using PostGIS)
  if (radiusFilter && radiusFilter.trim() !== '') {
    const parts = radiusFilter.split(',');
    if (parts.length === 3) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      const radiusMiles = parseFloat(parts[2]);
      
      // Validate the parsed values
      if (!isNaN(lat) && !isNaN(lng) && !isNaN(radiusMiles) && 
          lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && radiusMiles > 0) {
        
        // Convert miles to meters (PostGIS geography uses meters)
        const radiusMeters = radiusMiles * 1609.344;
        
        // Debug logging
        console.log(`Radius filter: lat=${lat}, lng=${lng}, radiusMiles=${radiusMiles}, radiusMeters=${radiusMeters}`);
        
        // Use optimized two-step approach: bounding box filter + precise distance
        // This approach is 3,600x faster than direct ST_Distance (0.9ms vs 3,363ms)
        // Step 1: Fast spatial index lookup with bounding box
        const bboxCondition = `ST_Intersects(${col('geom')}, ST_Buffer(ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${radiusMeters})::geometry)`;
        
        // Step 2: Precise distance calculation (only applied to bbox-filtered results)
        const distanceCondition = `ST_Distance(${col('geom')}::geography, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography) <= ${radiusMeters}`;
        
        console.log(`Generated optimized spatial conditions: ${bboxCondition} AND ${distanceCondition}`);
        
        // Add all conditions: bbox filter, precise distance, and geom null check
        conditions.push(bboxCondition);
        conditions.push(distanceCondition);
        conditions.push(`${col('geom')} IS NOT NULL`);
      }
    }
  }

  if (redistrictingAffectedTypes.length > 0) {
    if (redistrictingAffectedTypes.map(t => t.toLowerCase()).includes('any')) {
      conditions.push(`(${col('redistricting_cong_affected')} = TRUE OR ${col('redistricting_senate_affected')} = TRUE OR ${col('redistricting_house_affected')} = TRUE)`);
    } else {
      const clauses: string[] = [];
      if (redistrictingAffectedTypes.map(t => t.toLowerCase()).includes('congressional')) {
        clauses.push(`${col('redistricting_cong_affected')} = TRUE`);
      }
      if (redistrictingAffectedTypes.map(t => t.toLowerCase()).includes('senate')) {
        clauses.push(`${col('redistricting_senate_affected')} = TRUE`);
      }
      if (redistrictingAffectedTypes.map(t => t.toLowerCase()).includes('house')) {
        clauses.push(`${col('redistricting_house_affected')} = TRUE`);
      }
      if (clauses.length > 0) conditions.push(`(${clauses.join(' OR ')})`);
    }
  }
  // --- End: Build SQL conditions ---

  return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
} 