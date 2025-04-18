import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.PG_VOTERDATA_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
});

// List of all address fields we might filter by or return
const ADDRESS_FIELDS = [
  'residence_street_number',
  'residence_pre_direction',
  'residence_street_name',
  'residence_street_suffix', // Changed from 'residence_street_type' to match db column name
  'residence_post_direction',
  'residence_unit_number', // Changed from 'residence_apt_unit_number' to match db column name
  'residence_zipcode',
  'residence_city',
];

// Fields that should always use wildcard searches
const TEXT_FIELDS = [
  'residence_street_name',
  'residence_pre_direction',
  'residence_post_direction',
  'residence_street_suffix', // Updated to match db column name
  'residence_city'
];

// Fields that have indexes we can utilize
const INDEXED_FIELDS = [
  'residence_street_name', // Part of composite index with street_number
  'residence_street_number', // Part of composite index with street_name
  'residence_zipcode',
  'residence_city',
];

// Mapping for search fields to actual db columns
const SEARCH_FIELD_MAPPING: Record<string, string> = {
  'residence_street_name_search': 'residence_street_name',
  'residence_street_number_search': 'residence_street_number',
  'residence_pre_direction_search': 'residence_pre_direction',
  'residence_post_direction_search': 'residence_post_direction',
  'residence_street_suffix_search': 'residence_street_suffix',
  'residence_city_search': 'residence_city',
  'residence_zipcode_search': 'residence_zipcode',
  'residence_unit_number_search': 'residence_unit_number',
};

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    console.log("[/ga/api/voter-address/records] Received request:", url.search);

    // Build filters from query params
    const filters: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Check for search parameters (e.g., residence_street_name_search)
    // These are optimized for searching while typing
    url.searchParams.forEach((value, key) => {
      // Check if this is a search parameter and map to the correct field
      if (key.endsWith('_search') && SEARCH_FIELD_MAPPING[key] && value) {
        const dbField = SEARCH_FIELD_MAPPING[key];
        
        // Check if this field is indexed
        const isIndexed = INDEXED_FIELDS.includes(dbField);
        const isTextField = TEXT_FIELDS.includes(dbField);
        
        if (isIndexed) {
          // For indexed text fields with wildcards
          if (isTextField) {
            // ILIKE is not case-sensitive but can still use indexes when pattern starts with a constant
            filters.push(`${dbField} ILIKE $${paramIndex}`);
            values.push(`${value}%`); // Use prefix match for better index utilization
          } 
          // For indexed non-text fields, use equality for index efficiency
          else {
            filters.push(`${dbField} = $${paramIndex}`);
            values.push(value);
          }
        } 
        // For non-indexed fields, still use ILIKE but know it might be slower
        else if (isTextField) {
          filters.push(`${dbField} ILIKE $${paramIndex}`);
          values.push(`${value}%`);
        } else {
          filters.push(`${dbField} = $${paramIndex}`);
          values.push(value);
        }
        
        paramIndex++;
      }
      // Regular field filters for exact matches
      else if (ADDRESS_FIELDS.includes(key) && value) {
        filters.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    // Create optimized query to select distinct address records
    // Use DISTINCT ON to ensure we get unique addresses
    const selectClause = ADDRESS_FIELDS.join(', ');
    
    // Start with a query that should utilize our indexes
    let sqlQuery = `
      SELECT DISTINCT ${selectClause}
      FROM GA_VOTER_REGISTRATION_LIST
    `;
    
    // Add WHERE clause if we have filters
    if (filters.length > 0) {
      sqlQuery += ` WHERE ${filters.join(' AND ')}`;
    }
    
    // Use ORDER BY to prioritize results when using street name index
    // This helps ensure relevant results appear first
    if (url.searchParams.has('residence_street_name_search')) {
      sqlQuery += ` ORDER BY residence_street_name`;
    } else if (url.searchParams.has('residence_city_search')) {
      sqlQuery += ` ORDER BY residence_city`;
    } else if (url.searchParams.has('residence_zipcode_search')) {
      sqlQuery += ` ORDER BY residence_zipcode`;
    }
    
    // Always limit records for performance
    sqlQuery += ` LIMIT 100`;

    console.log('Voter Address Records API SQL:', sqlQuery, values);

    // Use the pool to get a client
    const client = await pool.connect();
    try {
      // Execute the query with prepared statement
      const result = await client.query(sqlQuery, values);
      
      // Process the records - uppercase all values for consistency
      const processedRecords = result.rows.map(record => {
        const processed: Record<string, string | null> = {};
        ADDRESS_FIELDS.forEach(field => {
          processed[field] = record[field] ? String(record[field]).toUpperCase() : null;
        });
        return processed;
      });
      
      console.log("[/ga/api/voter-address/records] Returning records:", processedRecords.length);
      return NextResponse.json({ records: processedRecords });
    } finally {
      // Always release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error('Error in /ga/api/voter-address/records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch address records.' },
      { status: 500 }
    );
  }
} 