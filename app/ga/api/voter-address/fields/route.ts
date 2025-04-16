import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

// List of allowed address fields for filtering and selection
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
    const field = url.searchParams.get('field');
    if (!field || !ADDRESS_FIELDS.includes(field)) {
      return NextResponse.json({ error: 'Missing or invalid field parameter.' }, { status: 400 });
    }

    // Build filters from query params
    const filters: string[] = [];
    const values: any[] = [];
    ADDRESS_FIELDS.forEach((f) => {
      if (f !== field) {
        const v = url.searchParams.get(f);
        if (v) {
          filters.push(`${f} = $${filters.length + 1}`);
          values.push(v.toUpperCase());
        }
      }
    });

    // Build SQL query
    let sqlQuery = `SELECT DISTINCT ${field} FROM GA_VOTER_REGISTRATION_LIST`;
    if (filters.length > 0) {
      sqlQuery += ' WHERE ' + filters.join(' AND ');
    }
    sqlQuery += ` LIMIT 50`;

    // Connect to Postgres
    const connectionString = process.env.PG_VOTERDATA_URL;
    if (!connectionString) {
      return NextResponse.json({ error: 'PG_VOTERDATA_URL environment variable is not set.' }, { status: 500 });
    }
    const sql = postgres(connectionString, { max: 1 });

    // Execute query
    const rows = await sql.unsafe(sqlQuery, values);
    await sql.end();

    // Extract and uppercase values, filter out null/empty
    const resultValues = rows
      .map((row: any) => (row[field] ? String(row[field]).toUpperCase() : null))
      .filter((v: string | null) => v && v.length > 0);

    return NextResponse.json({ field, values: resultValues });
  } catch (error) {
    console.error('Error in /ga/api/voter-address/fields:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
} 