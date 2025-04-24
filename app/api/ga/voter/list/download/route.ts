import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/voter/db';
import { PassThrough } from 'node:stream';
import { stringify } from 'csv-stringify';
import { buildVoterListWhereClause } from '@/lib/voter/build-where-clause'; // Import shared function

// Suggest a longer execution time for platforms like Vercel (Pro/Enterprise plan may be required for > 60s)
// Timeout behaviour ultimately depends on the deployment environment.
export const maxDuration = 300; // 5 minutes

const DOWNLOAD_BATCH_SIZE = 5000; // Define the batch size for fetching

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

    const baseQuery = `
      SELECT ${selectFields}
      FROM GA_VOTER_REGISTRATION_LIST
      ${whereClause}
      ORDER BY voter_registration_number -- ORDER BY is important for stable pagination
    `;

    // --- Start: Streaming Logic with Manual Pagination ---
    const responseStream = new PassThrough();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `voter_list_${timestamp}.csv`;
    const headers = new Headers({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'X-Content-Type-Options': 'nosniff'
    });

    // Initialize CSV stringifier and pipe to response stream immediately
    const stringifier = stringify({ header: true, columns: CSV_HEADERS });
    stringifier.pipe(responseStream);

    // Handle stringifier errors
    stringifier.on('error', (err) => {
      console.error('Error during CSV stringification:', err);
      if (!responseStream.destroyed) {
        responseStream.destroy(err);
      }
    });

    // Function to process a batch of rows
    const processBatch = async (rows: any[]) => {
      for (const row of rows) {
        const processedRow = CSV_FIELDS.map(field => {
          let value = row[field];
          if (value instanceof Date) return value.toISOString().split('T')[0];
          if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
          if (typeof value === 'number') return value.toString();
          return value === null || value === undefined ? '' : value;
        });
        if (!stringifier.write(processedRow)) {
          // Handle backpressure
          await new Promise(resolve => stringifier.once('drain', resolve));
        }
      }
    };

    // Start pagination loop
    (async () => {
      let offset = 0;
      let continueFetching = true;
      try {
        while (continueFetching) {
          console.log(`Fetching batch: LIMIT ${DOWNLOAD_BATCH_SIZE} OFFSET ${offset}`);
          const batchQuery = `${baseQuery} LIMIT ${DOWNLOAD_BATCH_SIZE} OFFSET ${offset}`;
          const rows = await sql.unsafe(batchQuery);

          if (rows.length > 0) {
            await processBatch(rows);
          } else {
            // No more rows left
            continueFetching = false;
          }

          // If fewer rows than batch size were returned, it's the last batch
          if (rows.length < DOWNLOAD_BATCH_SIZE) {
            continueFetching = false;
          }

          offset += DOWNLOAD_BATCH_SIZE;
        }
        console.log('Finished fetching all batches.');
        stringifier.end(); // Signal end of data to stringifier
      } catch (dbError) {
        console.error('Error during database query pagination:', dbError);
        if (!stringifier.destroyed) {
           stringifier.destroy(dbError instanceof Error ? dbError : new Error(String(dbError)));
        }
        if (!responseStream.destroyed) {
           responseStream.destroy(dbError instanceof Error ? dbError : new Error(String(dbError)));
        }
      }
    })(); // Immediately invoke the async loop function

    // Return the stream immediately - the loop above will feed it data
    return new NextResponse(responseStream as any, { status: 200, headers });
    // --- End: Streaming Logic ---

  } catch (error) {
    console.error('Error setting up voter download API:', error);
    return NextResponse.json(
      { error: 'Failed to generate voter CSV data' },
      { status: 500 }
    );
  }
} 