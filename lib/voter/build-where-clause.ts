/**
 * Shared utility function to build the WHERE clause for the voter list API
 * based on URL search parameters.
 */
import { SCORE_RANGES } from "@/lib/participation-score/constants"; // Import score range definitions

export function buildVoterListWhereClause(searchParams: URLSearchParams): string {
  // --- Start: Filter parameter extraction ---
  const registrationNumber = searchParams.get('registrationNumber');
  const county = searchParams.get('county');
  const congressionalDistricts = searchParams.getAll('congressionalDistricts');
  const stateSenateDistricts = searchParams.getAll('stateSenateDistricts');
  const stateHouseDistricts = searchParams.getAll('stateHouseDistricts');
  const scoreRangeKeys = searchParams.getAll('scoreRanges'); // Get selected score range keys
  const statusValues = searchParams.getAll('status');
  const statusReasonParams = searchParams.getAll('statusReason');
  const partyValues = searchParams.getAll('party');
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
    conditions.push(`voter_registration_number = '${registrationNumber.trim()}'`);
    // If registrationNumber is provided, return ONLY this condition
    return `WHERE ${conditions[0]}`;
  }

  // --- If no registrationNumber, proceed with other filters ---
  // County Filter (Example)
  if (county) {
    conditions.push(`UPPER(county_name) = UPPER('${county}')`);
  }

  // Participation Score Range Filter
  if (scoreRangeKeys.length > 0) {
    const scoreConditions: string[] = [];
    scoreRangeKeys.forEach(key => {
      const range = SCORE_RANGES.find(r => r.key === key);
      if (range) {
        if (range.key === 'super') {
          // Special case for exact 10.0
          scoreConditions.push(`participation_score = 10.0`);
        } else {
          // Use BETWEEN for other ranges
          scoreConditions.push(`participation_score BETWEEN ${range.min} AND ${range.max}`);
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
      conditions.push(`UPPER(status) = UPPER('${statusValues[0]}')`);
    } else {
      // If multiple status values, use IN clause
      const upperStatusValues = statusValues.map(s => `UPPER('${s}')`);
      conditions.push(`UPPER(status) IN (${upperStatusValues.join(', ')})`);
    }
  }

  // Add Status Reason Filter
  if (statusReasonParams.length > 0) {
    // Assuming status reasons might need case-insensitive matching and are single words or phrases
    const reasonPlaceholders = statusReasonParams.map(r => `'${r.toUpperCase()}'`); // Basic upper-casing and quoting
    conditions.push(`UPPER(status_reason) IN (${reasonPlaceholders.join(', ')})`);
  }

  // Congressional District Filter (Example)
  if (congressionalDistricts.length > 0) {
    const placeholders = congressionalDistricts.map(district => `'${district}'`);
    conditions.push(`congressional_district IN (${placeholders.join(', ')})`);
  }
  if (stateSenateDistricts.length > 0) {
      const placeholders = stateSenateDistricts.map(district => `'${district}'`);
      conditions.push(`state_senate_district IN (${placeholders.join(', ')})`);
  }
  if (stateHouseDistricts.length > 0) {
      const placeholders = stateHouseDistricts.map(district => `'${district}'`);
      conditions.push(`state_house_district IN (${placeholders.join(', ')})`);
  }
  if (partyValues.length > 0) {
      const partyConditions = partyValues.map(p => `UPPER(last_party_voted) = UPPER('${p}')`).join(' OR ');
      conditions.push(`(${partyConditions})`);
  }
  if (firstName) {
    conditions.push(`UPPER(first_name) LIKE UPPER('${firstName}%')`);
  }
  if (lastName) {
    conditions.push(`UPPER(last_name) LIKE UPPER('${lastName}%')`);
  }

  const currentYear = new Date().getFullYear();
  if (ageRanges && ageRanges.length > 0) {
    const ageConditions: string[] = [];
    ageRanges.forEach(range => {
      // Simplified age range logic as example
      if (range === '18-23') ageConditions.push(`(birth_year <= '${currentYear - 18}' AND birth_year >= '${currentYear - 23}')`);
      else if (range === '25-44') ageConditions.push(`(birth_year <= '${currentYear - 25}' AND birth_year >= '${currentYear - 44}')`);
      // Add other ranges similarly
      else if (range === '75+') ageConditions.push(`birth_year <= '${currentYear - 75}'`);
    });
    if (ageConditions.length > 0) conditions.push(`(${ageConditions.join(' OR ')})`);
  } else {
    if (ageMin) conditions.push(`birth_year <= '${currentYear - parseInt(ageMin)}'`);
    if (ageMax) conditions.push(`birth_year >= '${currentYear - parseInt(ageMax)}'`);
  }

  if (genderValues.length > 0) {
      const genderConditions = genderValues.map(g => `UPPER(gender) = UPPER('${g}')`).join(' OR ');
      conditions.push(`(${genderConditions})`);
  }
  if (raceValues.length > 0) {
      const raceConditions = raceValues.map(r => `UPPER(race) = UPPER('${r}')`).join(' OR ');
      conditions.push(`(${raceConditions})`);
  }

  const neverVoted = searchParams.get('neverVoted') === 'true';
  if (neverVoted) {
    conditions.push(`derived_last_vote_date IS NULL`);
  }
  if (notVotedSinceYear) {
    const cutoffStart = `${notVotedSinceYear}-01-01`;
    conditions.push(`(derived_last_vote_date IS NULL OR derived_last_vote_date < '${cutoffStart}')`);
  }

  // Election Type filter via voting_events JSONB (Assuming participated_election_types isn't ready/used)
  if (electionTypes.length > 0) {
      const clauses = electionTypes.map(et => `voting_events @> '[{"election_type":"${et.toUpperCase()}"}]'`).join(' OR ');
      conditions.push(`(${clauses})`);
  }
  // Election Year filter using generated column
  if (electionYears.length > 0) {
    const yearIntegers = electionYears.map(y => parseInt(y, 10)).filter(y => !isNaN(y));
    if (yearIntegers.length > 0) {
        conditions.push(`participated_election_years && ARRAY[${yearIntegers.join(',')}]::int[]`);
    }
  }
  // Election Date filter via voting_events JSONB
  if (electionDates.length > 0) {
      const dateClauses = electionDates.map(date => `voting_events @> '[{"election_date":"${date}"}]'`).join(' OR ');
      conditions.push(`(${dateClauses})`);
  }

  // Voter Events filters via JSONB voting_events
  if (ballotStyles.length > 0) {
      const clauses = ballotStyles.map(bs => `voting_events @> '[{"ballot_style":"${bs}"}]'`).join(' OR ');
      conditions.push(`(${clauses})`);
  }
  if (eventParties.length > 0) {
      const clauses = eventParties.map(p => `voting_events @> '[{"party":"${p}"}]'`).join(' OR ');
      conditions.push(`(${clauses})`);
  }
  if (voterEventMethod) {
      switch (voterEventMethod.toLowerCase()) {
          case 'absentee': conditions.push(`voting_events @> '[{"absentee":"Y"}]'`); break;
          case 'provisional': conditions.push(`voting_events @> '[{"provisional":"Y"}]'`); break;
          case 'supplemental': conditions.push(`voting_events @> '[{"supplemental":"Y"}]'`); break;
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
        if (num) sub.push(`residence_street_number = '${num}'`);
        if (pre) sub.push(`UPPER(residence_pre_direction) = UPPER('${pre}')`);
        if (name) sub.push(`UPPER(residence_street_name) LIKE UPPER('${name}%')`);
        if (type) sub.push(`UPPER(residence_street_type) = UPPER('${type}')`);
        if (post) sub.push(`UPPER(residence_post_direction) = UPPER('${post}')`);
        if (apt) sub.push(`UPPER(residence_apt_unit_number) = UPPER('${apt}')`);
        if (city) sub.push(`UPPER(residence_city) = UPPER('${city}')`);
        if (zip) sub.push(`residence_zipcode = '${zip}'`);
        if (sub.length > 0) compositeClauses.push(`(${sub.join(' AND ')})`);
      }
    });
    if (compositeClauses.length > 0) conditions.push(`(${compositeClauses.join(' OR ')})`);
  }

  if (redistrictingAffectedTypes.length > 0) {
    if (redistrictingAffectedTypes.map(t => t.toLowerCase()).includes('any')) {
      conditions.push('(redistricting_cong_affected = TRUE OR redistricting_senate_affected = TRUE OR redistricting_house_affected = TRUE)');
    } else {
      const redistrictingConditions: string[] = [];
      redistrictingAffectedTypes.forEach(type => {
        switch (type.toLowerCase()) {
          case 'congress': redistrictingConditions.push('redistricting_cong_affected = TRUE'); break;
          case 'senate': redistrictingConditions.push('redistricting_senate_affected = TRUE'); break;
          case 'house': redistrictingConditions.push('redistricting_house_affected = TRUE'); break;
        }
      });
      if (redistrictingConditions.length > 0) conditions.push(`(${redistrictingConditions.join(' OR ')})`);
    }
  }

  return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  // --- End: Build SQL conditions ---
} 