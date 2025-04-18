import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/voter/db';

// Define the fields that have indexes
const INDEXED_FIELDS = [
  'county_name',
  'county_code',
  'status',
  'last_name',
  'first_name',
  'birth_year',
  'gender',
  'race',
  'last_party_voted',
  'residence_city',
  'residence_zipcode',
  'congressional_district',
  'state_senate_district',
  'state_house_district',
  'residence_street_name', // Part of composite index with street_number
  'residence_street_number', // Part of composite index with street_name
];

// Define fields that can benefit from wildcards in searches
const TEXT_SEARCH_FIELDS = [
  'first_name',
  'last_name',
  'residence_street_name',
  'residence_city',
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '25');
    
    // Sorting parameters
    const sortField = searchParams.get('sortField') || 'last_name';
    const sortDirection = searchParams.get('sortDirection') || 'asc';
    
    // Map front-end sort fields to database columns
    const sortFieldMapping: Record<string, string> = {
      'name': 'last_name', // Default sort by last name
      'id': 'voter_registration_number',
      'county': 'county_name',
      'status': 'status',
      'address': 'residence_street_name'
    };
    
    // Use mapped field or default to last_name
    const dbSortField = sortFieldMapping[sortField] || 'last_name';
    const dbSortDirection = sortDirection === 'desc' ? 'DESC' : 'ASC';
    
    // Filter parameters
    const county = searchParams.get('county');
    const congressionalDistricts = searchParams.getAll('congressionalDistricts');
    const stateSenateDistricts = searchParams.getAll('stateSenateDistricts');
    const stateHouseDistricts = searchParams.getAll('stateHouseDistricts');
    const statusValues = searchParams.getAll('status');
    const partyValues = searchParams.getAll('party');
    
    // Voter details filters
    const firstName = searchParams.get('firstName');
    const lastName = searchParams.get('lastName');
    const ageMin = searchParams.get('ageMin');
    const ageMax = searchParams.get('ageMax');
    const ageRanges = searchParams.getAll('ageRange');
    const genderValues = searchParams.getAll('gender');
    const raceValues = searchParams.getAll('race');
    
    // Residence address filters
    const residenceStreetNames = searchParams.getAll('residenceStreetName');
    const residenceStreetNumbers = searchParams.getAll('residenceStreetNumber');
    const residenceCities = searchParams.getAll('residenceCity');
    const residenceZipcodes = searchParams.getAll('residenceZipcode');
    const residencePreDirections = searchParams.getAll('residencePreDirection');
    const residencePostDirections = searchParams.getAll('residencePostDirection');
    const residenceStreetSuffixes = searchParams.getAll('residenceStreetSuffix');
    const residenceAptUnitNumbers = searchParams.getAll('residenceAptUnitNumber');

    // Extract resident_address parameters (new composite format)
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

    // For backward compatibility
    const singleResidenceStreetName = searchParams.get('residenceStreetName');
    const singleResidenceStreetNumber = searchParams.get('residenceStreetNumber');
    const singleResidenceCity = searchParams.get('residenceCity');
    const singleResidenceZipcode = searchParams.get('residenceZipcode');
    const singleResidencePreDirection = searchParams.get('residencePreDirection');
    const singleResidencePostDirection = searchParams.get('residencePostDirection');
    const singleResidenceStreetSuffix = searchParams.get('residenceStreetSuffix');
    const singleResidenceAptUnitNumber = searchParams.get('residenceAptUnitNumber');

    // Merge single values with arrays if they exist
    if (singleResidenceStreetName && !residenceStreetNames.includes(singleResidenceStreetName)) {
      residenceStreetNames.push(singleResidenceStreetName);
    }
    if (singleResidenceStreetNumber && !residenceStreetNumbers.includes(singleResidenceStreetNumber)) {
      residenceStreetNumbers.push(singleResidenceStreetNumber);
    }
    if (singleResidenceCity && !residenceCities.includes(singleResidenceCity)) {
      residenceCities.push(singleResidenceCity);
    }
    if (singleResidenceZipcode && !residenceZipcodes.includes(singleResidenceZipcode)) {
      residenceZipcodes.push(singleResidenceZipcode);
    }
    if (singleResidencePreDirection && !residencePreDirections.includes(singleResidencePreDirection)) {
      residencePreDirections.push(singleResidencePreDirection);
    }
    if (singleResidencePostDirection && !residencePostDirections.includes(singleResidencePostDirection)) {
      residencePostDirections.push(singleResidencePostDirection);
    }
    if (singleResidenceStreetSuffix && !residenceStreetSuffixes.includes(singleResidenceStreetSuffix)) {
      residenceStreetSuffixes.push(singleResidenceStreetSuffix);
    }
    if (singleResidenceAptUnitNumber && !residenceAptUnitNumbers.includes(singleResidenceAptUnitNumber)) {
      residenceAptUnitNumbers.push(singleResidenceAptUnitNumber);
    }

    // Build SQL conditions
    const conditions = [];
    
    // Optimize common field combinations when possible
    // For example, if filtering by both county and status, 
    // we can hint to use the composite index
    const hasCounty = !!county;
    const hasStatus = statusValues.length > 0;

    // Check if we're filtering by both county and status
    if (hasCounty && hasStatus) {
      // For county + status, use a common pattern that optimizers recognize
      if (statusValues.length === 1) {
        conditions.push(`(UPPER(county_name) = UPPER('${county}') AND UPPER(status) = UPPER('${statusValues[0]}'))`);
      } else {
        // Handle multiple status values with county
        const statusConditions = statusValues.map(s => `UPPER(status) = UPPER('${s}')`).join(' OR ');
        conditions.push(`(UPPER(county_name) = UPPER('${county}') AND (${statusConditions}))`);
      }
    } else {
      // Otherwise handle them individually
      if (hasCounty) {
        conditions.push(`UPPER(county_name) = UPPER('${county}')`);
      }

      if (hasStatus) {
        if (statusValues.length === 1) {
          conditions.push(`UPPER(status) = UPPER('${statusValues[0]}')`);
        } else {
          // Handle multiple status values
          const statusConditions = statusValues.map(s => `UPPER(status) = UPPER('${s}')`).join(' OR ');
          conditions.push(`(${statusConditions})`);
        }
      }
    }

    // Handle congressional districts efficiently
    if (congressionalDistricts && congressionalDistricts.length > 0) {
      // If there's just one, use an equality comparison for better index usage
      if (congressionalDistricts.length === 1) {
        conditions.push(`congressional_district = '${congressionalDistricts[0]}'`);
      } else {
        // Otherwise use IN which can still use indexes
        const placeholders = congressionalDistricts.map(district => `'${district}'`);
        conditions.push(`congressional_district IN (${placeholders.join(', ')})`);
      }
    }

    // Handle state senate districts efficiently
    if (stateSenateDistricts && stateSenateDistricts.length > 0) {
      if (stateSenateDistricts.length === 1) {
        conditions.push(`state_senate_district = '${stateSenateDistricts[0]}'`);
      } else {
        const placeholders = stateSenateDistricts.map(district => `'${district}'`);
        conditions.push(`state_senate_district IN (${placeholders.join(', ')})`);
      }
    }

    // Handle state house districts efficiently
    if (stateHouseDistricts && stateHouseDistricts.length > 0) {
      if (stateHouseDistricts.length === 1) {
        conditions.push(`state_house_district = '${stateHouseDistricts[0]}'`);
      } else {
        const placeholders = stateHouseDistricts.map(district => `'${district}'`);
        conditions.push(`state_house_district IN (${placeholders.join(', ')})`);
      }
    }

    if (partyValues.length > 0) {
      if (partyValues.length === 1) {
        conditions.push(`UPPER(last_party_voted) = UPPER('${partyValues[0]}')`);
      } else {
        // Handle multiple party values
        const partyConditions = partyValues.map(p => `UPPER(last_party_voted) = UPPER('${p}')`).join(' OR ');
        conditions.push(`(${partyConditions})`);
      }
    }

    // Name searches - use LIKE for better searching
    if (firstName) {
      conditions.push(`UPPER(first_name) LIKE UPPER('${firstName}%')`);  // Use prefix match for better index utilization
    }

    if (lastName) {
      conditions.push(`UPPER(last_name) LIKE UPPER('${lastName}%')`);  // Use prefix match for better index utilization
    }

    // Age range - we use birth_year for this which is indexed
    const currentYear = new Date().getFullYear();
    
    if (ageRanges && ageRanges.length > 0) {
      const ageConditions: string[] = [];
      
      ageRanges.forEach(range => {
        if (range === '18-23') {
          ageConditions.push(`(birth_year <= '${(currentYear - 18).toString()}' AND birth_year >= '${(currentYear - 23).toString()}')`);
        } else if (range === '25-44') {
          ageConditions.push(`(birth_year <= '${(currentYear - 25).toString()}' AND birth_year >= '${(currentYear - 44).toString()}')`);
        } else if (range === '45-64') {
          ageConditions.push(`(birth_year <= '${(currentYear - 45).toString()}' AND birth_year >= '${(currentYear - 64).toString()}')`);
        } else if (range === '65-74') {
          ageConditions.push(`(birth_year <= '${(currentYear - 65).toString()}' AND birth_year >= '${(currentYear - 74).toString()}')`);
        } else if (range === '75+') {
          // 75 and over (no upper bound)
          ageConditions.push(`birth_year <= '${(currentYear - 75).toString()}'`);
        }
      });
      
      if (ageConditions.length > 0) {
        conditions.push(`(${ageConditions.join(' OR ')})`);
      }
    } else {
      // Use the explicit min/max age filters if provided
      if (ageMin) {
        const birthYearMax = currentYear - parseInt(ageMin);
        conditions.push(`birth_year <= '${birthYearMax.toString()}'`);
      }

      if (ageMax) {
        const birthYearMin = currentYear - parseInt(ageMax);
        conditions.push(`birth_year >= '${birthYearMin.toString()}'`);
      }
    }

    if (genderValues.length > 0) {
      if (genderValues.length === 1) {
        conditions.push(`UPPER(gender) = UPPER('${genderValues[0]}')`);
      } else {
        // Handle multiple gender values
        const genderConditions = genderValues.map(g => `UPPER(gender) = UPPER('${g}')`).join(' OR ');
        conditions.push(`(${genderConditions})`);
      }
    }

    if (raceValues.length > 0) {
      if (raceValues.length === 1) {
        conditions.push(`UPPER(race) = UPPER('${raceValues[0]}')`);
      } else {
        // Handle multiple race values
        const raceConditions = raceValues.map(r => `UPPER(race) = UPPER('${r}')`).join(' OR ');
        conditions.push(`(${raceConditions})`);
      }
    }

    // Address conditions - street_name and street_number can use a composite index
    if (residenceStreetNames.length > 0 && residenceStreetNumbers.length > 0) {
      // Combined filter can use the composite index
      const placeholders = residenceStreetNames.map((name, index) => `(UPPER(residence_street_name) LIKE UPPER('${name}%') AND residence_street_number = '${residenceStreetNumbers[index]}')`);
      conditions.push(`(${placeholders.join(' OR ')})`);
    } else {
      // Individual filters
      if (residenceStreetNames.length > 0) {
        const placeholders = residenceStreetNames.map(name => `UPPER(residence_street_name) LIKE UPPER('${name}%')`);
        conditions.push(`(${placeholders.join(' OR ')})`);
      }

      if (residenceStreetNumbers.length > 0) {
        const placeholders = residenceStreetNumbers.map(number => `residence_street_number = '${number}'`);
        conditions.push(`(${placeholders.join(' OR ')})`);
      }
    }

    if (residenceCities.length > 0) {
      const placeholders = residenceCities.map(city => `UPPER(residence_city) = UPPER('${city}')`);
      conditions.push(`(${placeholders.join(' OR ')})`);
    }

    if (residenceZipcodes.length > 0) {
      const placeholders = residenceZipcodes.map(zipcode => `residence_zipcode = '${zipcode}'`);
      conditions.push(`(${placeholders.join(' OR ')})`);
    }

    if (residencePreDirections.length > 0) {
      const placeholders = residencePreDirections.map(direction => `UPPER(residence_pre_direction) = UPPER('${direction}')`);
      conditions.push(`(${placeholders.join(' OR ')})`);
    }

    if (residencePostDirections.length > 0) {
      const placeholders = residencePostDirections.map(direction => `UPPER(residence_post_direction) = UPPER('${direction}')`);
      conditions.push(`(${placeholders.join(' OR ')})`);
    }

    if (residenceStreetSuffixes.length > 0) {
      const placeholders = residenceStreetSuffixes.map(suffix => `UPPER(residence_street_type) = UPPER('${suffix}')`);
      conditions.push(`(${placeholders.join(' OR ')})`);
    }

    if (residenceAptUnitNumbers.length > 0) {
      const placeholders = residenceAptUnitNumbers.map(apt => `UPPER(residence_apt_unit_number) = UPPER('${apt}')`);
      conditions.push(`(${placeholders.join(' OR ')})`);
    }

    // Construct the WHERE clause
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Calculate offset for pagination
    const offset = (page - 1) * pageSize;

    // Execute count query to get total items
    const countQueryStr = `
      SELECT COUNT(*) as total
      FROM GA_VOTER_REGISTRATION_LIST
      ${whereClause}
    `;
    
    const countResult = await sql.unsafe(countQueryStr);
    const totalItems = parseInt(countResult[0].total);

    // Data query with pagination and sorting
    const dataQueryStr = `
      SELECT
        voter_registration_number as id,
        first_name,
        middle_name,
        last_name,
        suffix,
        status,
        gender,
        race,
        birth_year,
        registration_date,
        last_vote_date,
        county_name as county,
        residence_street_number,
        residence_street_name,
        residence_street_type,
        residence_pre_direction,
        residence_post_direction,
        residence_apt_unit_number,
        residence_city,
        residence_zipcode,
        mailing_street_number,
        mailing_street_name,
        mailing_apt_unit_number,
        mailing_city,
        mailing_state,
        mailing_zipcode,
        mailing_country,
        congressional_district,
        state_senate_district,
        state_house_district,
        date_of_last_contact as last_contact_date
      FROM GA_VOTER_REGISTRATION_LIST
      ${whereClause}
      ORDER BY ${dbSortField} ${dbSortDirection}, last_name ASC
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    // Execute data query
    const dataResult = await sql.unsafe(dataQueryStr);
    
    // Transform data
    const voters = dataResult.map(row => ({
      id: row.id,
      name: `${row.first_name} ${row.last_name}${row.suffix ? ' ' + row.suffix : ''}`,
      firstName: row.first_name,
      middleName: row.middle_name,
      lastName: row.last_name,
      nameSuffix: row.suffix,
      status: row.status,
      gender: row.gender,
      race: row.race,
      birthYear: row.birth_year,
      age: currentYear - parseInt(row.birth_year),
      registrationDate: row.registration_date,
      lastVoteDate: row.last_vote_date,
      county: row.county,
      address: {
        streetNumber: row.residence_street_number,
        streetName: row.residence_street_name,
        streetSuffix: row.residence_street_type,
        preDirection: row.residence_pre_direction,
        postDirection: row.residence_post_direction,
        unitNumber: row.residence_apt_unit_number,
        city: row.residence_city,
        zipcode: row.residence_zipcode,
        fullAddress: [
          row.residence_street_number,
          row.residence_pre_direction,
          row.residence_street_name,
          row.residence_street_type,
          row.residence_post_direction,
          row.residence_apt_unit_number
        ].filter(Boolean).join(' ')
      },
      mailingAddress: {
        streetNumber: row.mailing_street_number,
        streetName: row.mailing_street_name,
        unitNumber: row.mailing_apt_unit_number,
        city: row.mailing_city,
        state: row.mailing_state,
        zipcode: row.mailing_zipcode,
        country: row.mailing_country
      },
      districts: {
        congressional: row.congressional_district,
        stateSenate: row.state_senate_district,
        stateHouse: row.state_house_district
      },
      lastContactDate: row.last_contact_date
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalItems / pageSize);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      voters,
      pagination: {
        currentPage: page,
        pageSize,
        totalItems,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Error in voter list API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voter data' },
      { status: 500 }
    );
  }
} 