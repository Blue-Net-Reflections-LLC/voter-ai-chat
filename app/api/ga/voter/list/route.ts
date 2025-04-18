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
    const party = searchParams.get('party');
    
    // Voter details filters
    const firstName = searchParams.get('firstName');
    const lastName = searchParams.get('lastName');
    const ageMin = searchParams.get('ageMin');
    const ageMax = searchParams.get('ageMax');
    const gender = searchParams.get('gender');
    const race = searchParams.get('race');
    
    // Residence address filters
    const residenceStreetName = searchParams.get('residenceStreetName');
    const residenceStreetNumber = searchParams.get('residenceStreetNumber');
    const residenceCity = searchParams.get('residenceCity');
    const residenceZipcode = searchParams.get('residenceZipcode');
    const residencePreDirection = searchParams.get('residencePreDirection');
    const residencePostDirection = searchParams.get('residencePostDirection');
    const residenceStreetSuffix = searchParams.get('residenceStreetSuffix');

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

    if (party) {
      conditions.push(`UPPER(last_party_voted) = UPPER('${party}')`);
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
    
    if (ageMin) {
      const birthYearMax = currentYear - parseInt(ageMin);
      conditions.push(`birth_year <= '${birthYearMax.toString()}'`);
    }

    if (ageMax) {
      const birthYearMin = currentYear - parseInt(ageMax);
      conditions.push(`birth_year >= '${birthYearMin.toString()}'`);
    }

    if (gender) {
      conditions.push(`UPPER(gender) = UPPER('${gender}')`);
    }

    if (race) {
      conditions.push(`UPPER(race) = UPPER('${race}')`);
    }

    // Address conditions - street_name and street_number can use a composite index
    if (residenceStreetName && residenceStreetNumber) {
      // Combined filter can use the composite index
      conditions.push(`(UPPER(residence_street_name) LIKE UPPER('${residenceStreetName}%') AND residence_street_number = '${residenceStreetNumber}')`);
    } else {
      // Individual filters
      if (residenceStreetName) {
        conditions.push(`UPPER(residence_street_name) LIKE UPPER('${residenceStreetName}%')`);
      }

      if (residenceStreetNumber) {
        conditions.push(`residence_street_number = '${residenceStreetNumber}'`);
      }
    }

    if (residenceCity) {
      conditions.push(`UPPER(residence_city) = UPPER('${residenceCity}')`);
    }

    if (residenceZipcode) {
      conditions.push(`residence_zipcode = '${residenceZipcode}'`);
    }

    if (residencePreDirection) {
      conditions.push(`UPPER(residence_pre_direction) = UPPER('${residencePreDirection}')`);
    }

    if (residencePostDirection) {
      conditions.push(`UPPER(residence_post_direction) = UPPER('${residencePostDirection}')`);
    }

    if (residenceStreetSuffix) {
      conditions.push(`UPPER(residence_street_suffix) = UPPER('${residenceStreetSuffix}')`);
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