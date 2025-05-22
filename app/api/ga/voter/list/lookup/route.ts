import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/voter/db';

// Configure caching for 1 week using Next.js revalidate
// export const revalidate = 60 * 60 * 24 * 7; // 604800 seconds - REMOVED

// In-memory cache shared across requests
const lookupCache: Record<string, any> = {};

// Define fields that we want to provide metadata for
// These are typically smaller, enumerable fields with finite values
const LOOKUP_FIELDS = [
  // Address fields
  { name: 'residence_pre_direction', limit: 100, category: 'address' },
  { name: 'residence_post_direction', limit: 100, category: 'address' },
  { name: 'residence_street_type', limit: 200, category: 'address' },
  { name: 'residence_city', limit: 1000, category: 'address' },
  { name: 'residence_zipcode', limit: 1000, category: 'address' },
  
  // District fields
  { name: 'county_code', limit: 500, category: 'district' },
  { name: 'congressional_district', limit: 50, category: 'district' },
  { name: 'state_senate_district', limit: 100, category: 'district' },
  { name: 'state_house_district', limit: 200, category: 'district' },
  // county_precinct and municipal_precinct handled separately
  
  // Demographic fields
  { name: 'gender', limit: 10, category: 'demographic' },
  { name: 'race', limit: 50, category: 'demographic' },
  
  // Registration fields
  { name: 'status', limit: 20, category: 'registration' },
  { name: 'status_reason', limit: 20, category: 'registration' },
  { name: 'last_party_voted', limit: 50, category: 'registration' },
  // Voter events dates
  { name: 'election_date', limit: 1000, category: 'voter_events' },
];

// Define categories and corresponding fields
// Note: Precincts are handled as special categories now
const CATEGORIES: Record<string, { displayName: string; fields: string[] }> = {
  district: {
    displayName: "District Information",
    fields: [
      'county_code',
      'congressional_district',
      'state_senate_district',
      'state_house_district',
      // Add other district-related fields if needed
    ]
  },
  registration: {
    displayName: "Registration Details",
    fields: [
      'status',
      'status_reason',
      'last_party_voted'
      // Add other registration-related fields like 'registration_date'? 
    ]
  },
  demographic: {
    displayName: "Demographics",
    fields: [
      'race',
      'gender'
      // Add other demographic fields like 'birth_year'?
    ]
  },
  voter_events: {
    displayName: "Voter Events",
    fields: [
      'election_date',
      'election_type', // Add from voting_events
      'party',         // Add from voting_events
      'ballot_style'   // Add from voting_events
    ]
  },
  address: { // Add address category if needed for specific fields
    displayName: "Address Components",
    fields: [
      'residence_city',
      'residence_zipcode',
      'residence_street_type', // Example
      'residence_pre_direction',
      'residence_post_direction'
    ]
  }
};

interface PrecinctValue {
  code: string;
  description: string | null;
  meta?: Record<string, any> | null;
}

async function fetchCountyPrecincts(countyCode?: string | null): Promise<PrecinctValue[]> {
  let query = `
    SELECT DISTINCT
      v.county_precinct AS code,
      rd.lookup_value AS description,
      rd.lookup_meta AS meta
    FROM ga_voter_registration_list v
    LEFT JOIN reference_data rd ON rd.lookup_key = v.county_precinct
      AND rd.lookup_type = 'GA_COUNTY_PRECINCT_DESC'
      AND rd.state_code = 'GA'
      ${countyCode ? `AND rd.county_code = '${countyCode}'` : ''}
    WHERE v.county_precinct IS NOT NULL AND TRIM(v.county_precinct) != ''
  `;
  if (countyCode) {
    query += ` AND v.county_code = '${countyCode}'`;
  }
  query += ` ORDER BY description, code;`;

  try {
    const result = await sql.unsafe(query);
    return result.map((row: any) => ({ 
        code: row.code, 
        description: row.description || row.code, 
        meta: row.meta || null
    }));
  } catch (error) {
    console.error("Error fetching county precincts:", error);
    return [];
  }
}

async function fetchMunicipalPrecincts(countyCode?: string | null): Promise<PrecinctValue[]> {
  let query = `
    SELECT DISTINCT
      municipal_precinct AS code,
      municipal_precinct_description AS description
    FROM ga_voter_registration_list
    WHERE municipal_precinct IS NOT NULL AND TRIM(municipal_precinct) != ''
      AND municipal_precinct_description IS NOT NULL AND TRIM(municipal_precinct_description) != ''
  `;
  if (countyCode) {
    query += ` AND county_code = '${countyCode}'`;
  }
  query += ` ORDER BY description, code;`;

  try {
    const result = await sql.unsafe(query);
    return result.map((row: any) => ({ code: row.code, description: row.description }));
  } catch (error) {
    console.error("Error fetching municipal precincts:", error);
    return [];
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    console.log("[/api/ga/voter/list/lookup] Received request:", url.search);
    
    const requestedField = url.searchParams.get('field');
    const requestedCategory = url.searchParams.get('category');
    const countyCodeParam = url.searchParams.get('countyCode'); // For precinct filtering
    
    const cacheKey = requestedCategory 
      ? `category:${requestedCategory}${countyCodeParam ? `:county:${countyCodeParam}` : ''}` 
      : requestedField 
      ? `field:${requestedField}` 
      : 'all';

    // Check cache
    if (lookupCache[cacheKey]) {
      console.log(`[/api/ga/voter/list/lookup] Cache hit for key: ${cacheKey}`);
      return NextResponse.json(lookupCache[cacheKey]);
    }
    
    console.log(`[/api/ga/voter/list/lookup] Cache miss for key: ${cacheKey}. Fetching from DB.`);

    // --- Handle Special Categories: Precincts ---
    if (requestedCategory === 'countyPrecinct' || requestedCategory === 'municipalPrecinct') {
      let precinctValues: PrecinctValue[] = [];
      let displayName = '';
      
      if (requestedCategory === 'countyPrecinct') {
        displayName = 'County Precinct';
        precinctValues = await fetchCountyPrecincts(countyCodeParam);
      } else { // municipalPrecinct
        displayName = 'Municipal Precinct';
        precinctValues = await fetchMunicipalPrecincts(countyCodeParam);
      }

      const metadata = {
        fields: [
          {
            name: requestedCategory,
            displayName: displayName,
            category: 'district', // Assigning to district category for consistency
            values: precinctValues, // Now contains { code, description, meta? }
            count: precinctValues.length
          }
        ],
        timestamp: new Date().toISOString()
      };

      lookupCache[cacheKey] = metadata;
      console.log(`[/api/ga/voter/list/lookup] Stored precinct result in cache for key: ${cacheKey}`);
      return NextResponse.json(metadata);
    }

    // --- Handle Regular Field/Category Lookups (Existing Logic) ---
    const results: Record<string, string[]> = {};
    let fieldsToFetch = [...LOOKUP_FIELDS];
    
    if (requestedField) {
      fieldsToFetch = fieldsToFetch.filter(f => f.name === requestedField);
    }
    if (requestedCategory) {
      fieldsToFetch = fieldsToFetch.filter(f => f.category === requestedCategory);
    }
    
    if (fieldsToFetch.length === 0) {
      return NextResponse.json({ fields: [], timestamp: new Date().toISOString() });
    }
    
    const queries = fieldsToFetch.map(async (fieldInfo) => {
      const sourceTable = 'GA_VOTER_REGISTRATION_LIST';
      let queryString: string;
      if (fieldInfo.name === 'election_date') {
        // Extract distinct event dates from JSONB and order reverse chronologic
        queryString = `
          SELECT DISTINCT jsonb_array_elements(voting_events)->>'election_date' AS election_date
          FROM ${sourceTable}
          WHERE voting_events IS NOT NULL
          ORDER BY election_date DESC
          LIMIT ${fieldInfo.limit}
        `;
      } else {
        queryString = `
          SELECT DISTINCT ${fieldInfo.name}
          FROM ${sourceTable}
          WHERE ${fieldInfo.name} IS NOT NULL AND TRIM(${fieldInfo.name}) != ''
          ORDER BY ${fieldInfo.name}
          LIMIT ${fieldInfo.limit}
        `;
      }
      
      try {
        const fieldResult = await sql.unsafe(queryString);
        
        // Extract values and clean them
        results[fieldInfo.name] = Array.from(new Set(
          fieldResult
            .map(row => row[fieldInfo.name])
            .filter(Boolean)
            .map(val => String(val).trim().toUpperCase())
        ));
      } catch (error) {
        console.error(`Error fetching field ${fieldInfo.name}:`, error);
        results[fieldInfo.name] = [];
      }
    });
    
    await Promise.all(queries);
    
    const metadata = {
      fields: Object.entries(results).map(([name, values]) => {
        const fieldInfo = LOOKUP_FIELDS.find(f => f.name === name);
        return {
          name,
          displayName: formatFieldName(name),
          category: fieldInfo?.category || 'other',
          values,
          count: values.length
        };
      }),
      timestamp: new Date().toISOString()
    };
    
    lookupCache[cacheKey] = metadata;
    console.log(`[/api/ga/voter/list/lookup] Stored regular result in cache for key: ${cacheKey}`);
    return NextResponse.json(metadata);

  } catch (error) {
    console.error('Error in /api/ga/voter/list/lookup:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lookup values.' },
      { status: 500 }
    );
  }
}

// Helper function to format field names for display
function formatFieldName(dbFieldName: string): string {
  return dbFieldName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
} 