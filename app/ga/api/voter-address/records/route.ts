import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

// List of all address fields we might filter by or return
const ADDRESS_FIELDS = [
  'residence_street_number',
  'residence_pre_direction',
  'residence_street_name',
  'residence_street_type',
  'residence_post_direction',
  'residence_apt_unit_number',
  'residence_zipcode',
  'residence_city',
];

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    console.log("[/ga/api/voter-address/records] Received request:", url.search);

    // Build filters from query params
    const filters: string[] = [];
    const values: any[] = [];
    let autocompleteField: string | null = null;
    let autocompleteValue: string | null = null;

    // Identify the field being autocompleted based on its presence as a query param
    // This assumes the frontend sends the inputValue as the value for the specific fieldKey
    for (const field of ADDRESS_FIELDS) {
        const value = url.searchParams.get(field);
        if (value !== null) { // If the param exists (even if empty string from typing)
            autocompleteField = field;
            autocompleteValue = value; 
            break; // Assume only one field is actively being typed into
        }
    }

    // Build WHERE clause conditions
    url.searchParams.forEach((value, key) => {
      if (ADDRESS_FIELDS.includes(key)) {
          if (value !== null && value !== '') {
              if (key === autocompleteField) {
                  // Use ILIKE with wildcard for the field being typed into
                  filters.push(`${key} ILIKE $${filters.length + 1}`);
                  values.push(`${value}%`); // Append wildcard here
              } else {
                  // Use exact ILIKE (or =) for other filters that are already set
                  filters.push(`${key} ILIKE $${filters.length + 1}`);
                  values.push(value); // No wildcard for exact match filters
              }
          }
      } // Ignore other params like 'id' if present
    });

    // Build SQL query to select distinct address records
    // Select all relevant address fields
    const selectClause = ADDRESS_FIELDS.join(', ');
    let sqlQuery = `SELECT DISTINCT ${selectClause} FROM GA_VOTER_REGISTRATION_LIST`;
    if (filters.length > 0) {
      sqlQuery += ' WHERE ' + filters.join(' AND ');
    }
    // Limit the number of returned records for performance
    sqlQuery += ` LIMIT 100`; 

    console.log('Voter Address Records API SQL:', sqlQuery, values);

    // Connect to Postgres
    const connectionString = process.env.PG_VOTERDATA_URL;
    if (!connectionString) {
      console.error("PG_VOTERDATA_URL environment variable is not set.");
      return NextResponse.json({ error: 'Database configuration error.' }, { status: 500 });
    }
    const sql = postgres(connectionString, { max: 1 });

    // Execute query
    const records = await sql.unsafe(sqlQuery, values);
    await sql.end();

    // Return the array of matching address records
    // Ensure values are consistently cased if needed (e.g., uppercase)
    const processedRecords = records.map(record => {
      const processed: any = {};
      ADDRESS_FIELDS.forEach(field => {
        processed[field] = record[field] ? String(record[field]).toUpperCase() : null;
      });
      return processed;
    });

    console.log("[/ga/api/voter-address/records] Returning records:", processedRecords.length);
    return NextResponse.json({ records: processedRecords });

  } catch (error) {
    console.error('Error in /ga/api/voter-address/records:', error);
    // Provide a more generic error message to the client
    return NextResponse.json({ error: 'Failed to fetch address records.' }, { status: 500 });
  }
} 