import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/voter/db';
import { buildVoterListWhereClause } from '@/lib/voter/build-where-clause';

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
    
    // *** Use shared function to build the WHERE clause ***
    const whereClause = buildVoterListWhereClause(searchParams);

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
        date_of_last_contact as last_contact_date,
        participation_score
      FROM GA_VOTER_REGISTRATION_LIST
      ${whereClause}
      ORDER BY ${dbSortField} ${dbSortDirection}, last_name ASC
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    // Execute data query
    const dataResult = await sql.unsafe(dataQueryStr);
    
    // Transform data
    const currentYear = new Date().getFullYear();
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
      age: row.birth_year ? currentYear - parseInt(row.birth_year) : null,
      registrationDate: row.registration_date,
      lastVoteDate: row.last_vote_date,
      county: row.county,
      participationScore: typeof row.participation_score === 'number' 
                          ? row.participation_score 
                          : (typeof row.participation_score === 'string' && !isNaN(parseFloat(row.participation_score)) 
                              ? parseFloat(row.participation_score) 
                              : null),
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