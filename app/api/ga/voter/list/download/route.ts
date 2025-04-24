import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/voter/db';
import { PassThrough } from 'node:stream';
import { stringify } from 'csv-stringify';
import { buildVoterListWhereClause } from '@/lib/voter/build-where-clause'; // Import shared function

// Define the fields to include in the CSV export
// Omitted: geom (replaced by lat/lon), geocoded_at, geocoding_source
const CSV_FIELDS = [
  'county_name',
  'county_code',
  'voter_registration_number',
  'status',
  'status_reason',
  'last_name',
  'first_name',
  'middle_name',
  'suffix',
  'birth_year',
  'residence_street_number',
  'residence_pre_direction',
  'residence_street_name',
  'residence_street_type',
  'residence_post_direction',
  'residence_apt_unit_number',
  'residence_city',
  'residence_zipcode',
  'county_precinct',
  'county_precinct_description',
  'municipal_precinct',
  'municipal_precinct_description',
  'congressional_district',
  'state_senate_district',
  'state_house_district',
  'judicial_district',
  'county_commission_district',
  'school_board_district',
  'city_council_district',
  'municipal_school_board_district',
  'water_board_district',
  'super_council_district',
  'super_commissioner_district',
  'super_school_board_district',
  'fire_district',
  'municipality',
  'combo',
  'land_lot',
  'land_district',
  'registration_date',
  'race',
  'gender',
  'last_modified_date',
  'date_of_last_contact',
  'mailing_street_number',
  'mailing_street_name',
  'mailing_apt_unit_number',
  'mailing_city',
  'mailing_zipcode',
  'mailing_state',
  'mailing_country',
  'derived_last_vote_date',
  // Add lat/lon derived from geom
  'latitude',
  'longitude',
  'census_tract',
  'census_block',
  'redistricting_cong_affected',
  'redistricting_senate_affected',
  'redistricting_house_affected',
  'redistricting_affected',
  'participated_election_years'
];

// Function to convert snake_case to Title Case
function toTitleCase(str: string): string {
  if (!str) return '';
  return str.replace(/_/g, ' ')
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
}

// Create CSV headers
const CSV_HEADERS = CSV_FIELDS.map(field => {
  if (field === 'voter_registration_number') return 'Registration ID';
  if (field === 'latitude') return 'Latitude';
  if (field === 'longitude') return 'Longitude';
  return toTitleCase(field);
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // *** Use shared function to build the WHERE clause ***
    const whereClause = buildVoterListWhereClause(searchParams);

    // Select specific fields for CSV, extract lat/lon from geom
    const selectFields = CSV_FIELDS.map(field => {
      if (field === 'latitude') {
        return 'ST_Y(geom) as latitude'; // Extract Latitude
      }
      if (field === 'longitude') {
        return 'ST_X(geom) as longitude'; // Extract Longitude
      }
      if (field === 'participated_election_years') {
         return `array_to_string(${field}, ',') as ${field}`;
      }
      // Ensure original field names are used in SELECT if they aren't derived
      return field;
    }).join(', ');

    const query = `
      SELECT ${selectFields}
      FROM GA_VOTER_REGISTRATION_LIST
      ${whereClause}
      ORDER BY voter_registration_number; -- Consistent ordering
    `;

    // --- Start: Streaming Logic (Improved) ---

    // Create a PassThrough stream which is both Readable and Writable
    // This simplifies piping and error handling
    const responseStream = new PassThrough();

    // Set headers for file download immediately
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `voter_list_${timestamp}.csv`;
    const headers = new Headers({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'X-Content-Type-Options': 'nosniff'
    });

    // Use csv-stringify to format data into CSV rows
    // Pipe stringifier output directly to the response stream
    const stringifier = stringify({ header: true, columns: CSV_HEADERS });
    stringifier.pipe(responseStream);

    // Handle errors during stringification
    stringifier.on('error', (err) => {
      console.error('Error during CSV stringification:', err);
      responseStream.destroy(err); // Destroy the response stream on error
    });

    // Execute the query using a cursor and pipe results to stringifier
    sql.unsafe(query).cursor(async (rows: any[]) => {
      // Process each batch of rows from the cursor
      for (const row of rows) {
        // Access fields directly by their names (or aliases) from CSV_FIELDS
        const processedRow = CSV_FIELDS.map(field => {
            let value = row[field];
            if (value instanceof Date) {
                return value.toISOString().split('T')[0];
            }
            if (typeof value === 'boolean') {
                return value ? 'TRUE' : 'FALSE';
            }
            if (typeof value === 'number') { // Ensure lat/lon are formatted as strings
                 return value.toString();
            }
            return value === null || value === undefined ? '' : value;
        });
        // Write the processed row to the stringifier
        // Handle backpressure from the stringifier
        if (!stringifier.write(processedRow)) {
          await new Promise(resolve => stringifier.once('drain', resolve));
        }
      }
    })
    .then(() => {
      console.log('Database cursor finished.');
      stringifier.end(); // Signal end of data to the stringifier when cursor is done
    })
    .catch((dbError: Error) => {
      console.error('Error executing database cursor query:', dbError);
      // Ensure stringifier/stream are properly destroyed on DB error
      if (!stringifier.destroyed) {
        stringifier.destroy(dbError);
      }
      if (!responseStream.destroyed) {
        responseStream.destroy(dbError);
      }
    });

    // Return the response stream
    // Use Readable.toWeb() to convert Node stream to Web Stream if needed by NextResponse
    // Although NextResponse often handles Node streams directly.
    // Let's keep it simple first.
    return new NextResponse(responseStream as any, { status: 200, headers });
    // If the above fails, try: return new NextResponse(Readable.toWeb(responseStream), { status: 200, headers });

    // --- End: Streaming Logic ---

  } catch (error) {
    console.error('Error in voter download API:', error);
    return NextResponse.json(
      { error: 'Failed to generate voter CSV data' },
      { status: 500 }
    );
  }
} 