import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/voter/db';

// Configure caching for 1 week using Next.js revalidate
export const revalidate = 60 * 60 * 24 * 7; // 604800 seconds

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
  { name: 'county_name', limit: 500, category: 'district' },
  { name: 'congressional_district', limit: 50, category: 'district' },
  { name: 'state_senate_district', limit: 100, category: 'district' },
  { name: 'state_house_district', limit: 200, category: 'district' },
  
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
const CATEGORIES: Record<string, { displayName: string; fields: string[] }> = {
  district: {
    displayName: "District Information",
    fields: [
      'county_name',
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

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    console.log("[/api/ga/voter/list/lookup] Received request:", url.search);
    
    // Allow filtering by category or field name
    const requestedField = url.searchParams.get('field');
    const requestedCategory = url.searchParams.get('category');
    
    const results: Record<string, string[]> = {};
    
    // Filter fields based on request
    let fieldsToFetch = [...LOOKUP_FIELDS];
    
    // Filter by specific field if requested
    if (requestedField) {
      fieldsToFetch = fieldsToFetch.filter(f => f.name === requestedField);
    }
    
    // Filter by category if requested
    if (requestedCategory) {
      fieldsToFetch = fieldsToFetch.filter(f => f.category === requestedCategory);
    }
    
    // If no fields match the criteria, return empty result
    if (fieldsToFetch.length === 0) {
      return NextResponse.json({
        fields: [],
        timestamp: new Date().toISOString()
      });
    }
    
    // Fetch values for each requested field
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
        results[fieldInfo.name] = fieldResult
          .map(row => row[fieldInfo.name])
          .filter(Boolean)
          .map(val => String(val).trim().toUpperCase());
      } catch (error) {
        console.error(`Error fetching field ${fieldInfo.name}:`, error);
        results[fieldInfo.name] = [];
      }
    });
    
    // Wait for all queries to complete
    await Promise.all(queries);
    
    // Structure the response with additional metadata
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
    
    // Return response - Next.js will handle caching based on 'revalidate' export
    return NextResponse.json(metadata); // No need to pass headers here for revalidate
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