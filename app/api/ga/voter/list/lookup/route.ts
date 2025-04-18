import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.PG_VOTERDATA_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
});

// Define fields that we want to provide metadata for
// These are typically smaller, enumerable fields with finite values
const LOOKUP_FIELDS = [
  // Address fields
  { name: 'residence_pre_direction', limit: 100, category: 'address' },
  { name: 'residence_post_direction', limit: 100, category: 'address' },
  { name: 'residence_street_suffix', limit: 200, category: 'address' },
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
  { name: 'last_party_voted', limit: 50, category: 'registration' },
];

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    console.log("[/api/ga/voter/list/lookup] Received request:", url.search);
    
    // Allow filtering by category or field name
    const requestedField = url.searchParams.get('field');
    const requestedCategory = url.searchParams.get('category');
    
    // Get a client from the pool
    const client = await pool.connect();
    
    try {
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
        const query = `
          SELECT DISTINCT ${fieldInfo.name}
          FROM GA_VOTER_REGISTRATION_LIST
          WHERE ${fieldInfo.name} IS NOT NULL AND TRIM(${fieldInfo.name}) != ''
          ORDER BY ${fieldInfo.name}
          LIMIT $1
        `;
        
        const fieldResult = await client.query(query, [fieldInfo.limit]);
        
        // Extract values and clean them
        results[fieldInfo.name] = fieldResult.rows
          .map(row => row[fieldInfo.name])
          .filter(Boolean)
          .map(val => String(val).trim().toUpperCase());
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
      
      return NextResponse.json(metadata);
    } finally {
      client.release();
    }
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