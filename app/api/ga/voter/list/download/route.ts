import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/voter/db';
import { PassThrough } from 'node:stream';
import { stringify } from 'csv-stringify';
import { buildVoterListWhereClause } from '@/lib/voter/build-where-clause'; // Import shared function
// Import from shared constants file
import { SCORE_RANGES } from '@/lib/participation-score/constants';

// --- Participation Score Logic --- 
// Remove local definitions - Now imported
/*
interface ScoreRange {
  min: number;
  max: number;
  label: string;
}
const SCORE_RANGES: ScoreRange[] = [
  { min: 1.0, max: 2.9, label: 'Needs Attention' },
  { min: 3.0, max: 4.9, label: 'Needs Review' },
  { min: 5.0, max: 6.4, label: 'Participates' },
  { min: 6.5, max: 9.9, label: 'Power Voter' },
  { min: 10.0, max: 10.0, label: 'Super Power Voter' },
];
*/
// Keep the helper function, it now uses the imported SCORE_RANGES
const getScoreLabel = (score: number | null): string => {
  if (score === null || isNaN(score)) {
    return 'N/A';
  }
  const clampedScore = Math.max(1.0, Math.min(score, 10.0));
  const range = SCORE_RANGES.find(r => clampedScore >= r.min && clampedScore <= r.max);
  return range ? range.label : 'Unknown';
};
// --- End Participation Score Logic ---

// Suggest a longer execution time for platforms like Vercel (Pro/Enterprise plan may be required for > 60s)
// Timeout behaviour ultimately depends on the deployment environment.
export const maxDuration = 300; // 5 minutes

const DOWNLOAD_BATCH_SIZE = 5000; // Define the batch size for fetching

// Define the fields to include in the CSV export in the desired order
const CSV_FIELDS = [
  'county_name',
  'county_code',
  'voter_registration_number',
  'status',
  'status_reason',
  'participation_score', 
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
  'county_precinct_facility_name',  // Added new field for facility name
  'county_precinct_facility_address',  // Added new field for facility address
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
  'latitude',
  'longitude',
  'census_tract',
  'census_block',
  'redistricting_cong_affected',
  'redistricting_senate_affected',
  'redistricting_house_affected',
  'redistricting_affected',
  'participated_election_years',
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

// Create CSV headers dynamically based on the reordered CSV_FIELDS
const CSV_HEADERS = (() => {
    const headers: string[] = [];
    CSV_FIELDS.forEach(field => {
        let header = '';
        if (field === 'voter_registration_number') header = 'Registration ID';
        else if (field === 'latitude') header = 'Latitude';
        else if (field === 'longitude') header = 'Longitude';
        else if (field === 'participation_score') header = 'Participation Score';
        else if (field === 'county_precinct_facility_name') header = 'County Precinct Facility'; 
        else if (field === 'county_precinct_facility_address') header = 'County Precinct Location';
        else header = toTitleCase(field);
        headers.push(header);

        // Insert 'Participation Label' header immediately after 'Participation Score' header
        if (field === 'participation_score') {
            headers.push('Participation Label');
        }
    });
    return headers;
})();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // *** Use shared function to build the WHERE clause ***
    // Pass 'v' as the table alias to qualify all column references
    const whereClause = buildVoterListWhereClause(searchParams, 'v');

    // Select specific fields for CSV, extract lat/lon from geom
    const selectFields = CSV_FIELDS
      .filter(field => !field.includes('facility')) // Skip the facility fields as they'll be handled by the JOIN
      .map(field => {
        if (field === 'latitude') {
          return 'ST_Y(v.geom) as latitude'; // Extract Latitude
        }
        if (field === 'longitude') {
          return 'ST_X(v.geom) as longitude'; // Extract Longitude
        }
        if (field === 'participated_election_years') {
           return `array_to_string(v.${field}, ',') as ${field}`;
        }
        if (field === 'participation_score') {
          // Skip participation_score here; it will be handled during processing
          return `v.${field}`; 
        }
        // Add table alias prefix to ALL fields to avoid ambiguity
        return `v.${field}`;
      }).join(', ');

    // Modified query to include a LEFT JOIN with REFERENCE_DATA for facility information
    const baseQuery = `
      SELECT 
        ${selectFields},
        rd.lookup_meta->>'facility_name' as county_precinct_facility_name,
        rd.lookup_meta->>'facility_address' as county_precinct_facility_address
      FROM GA_VOTER_REGISTRATION_LIST v
      LEFT JOIN REFERENCE_DATA rd ON 
        rd.lookup_type = 'GA_COUNTY_PRECINCT_DESC' 
        AND rd.state_code = 'GA' 
        AND rd.county_code = v.county_code 
        AND rd.lookup_key = v.county_precinct
      ${whereClause}
      ORDER BY v.voter_registration_number -- ORDER BY is important for stable pagination
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
        let participationScore: number | null = null;
        if (typeof row.participation_score === 'number') {
            participationScore = row.participation_score;
        } else if (typeof row.participation_score === 'string' && !isNaN(parseFloat(row.participation_score))) {
            participationScore = parseFloat(row.participation_score);
        }
        const participationLabel = getScoreLabel(participationScore);
        
        // Build the row array according to the new header order
        const processedRow: string[] = [];
        CSV_FIELDS.forEach(field => {
            let value = row[field];
            let formattedValue = '';

            if (field === 'participation_score') {
                formattedValue = participationScore !== null ? participationScore.toFixed(1) : '';
            } else if (value instanceof Date) {
                formattedValue = value.toISOString().split('T')[0];
            } else if (typeof value === 'boolean') {
                formattedValue = value ? 'TRUE' : 'FALSE';
            } else if (typeof value === 'number') {
                formattedValue = value.toString();
            } else {
                formattedValue = value === null || value === undefined ? '' : String(value); // Ensure string conversion
            }
            processedRow.push(formattedValue);

            // Insert the label immediately after the score value
            if (field === 'participation_score') {
                processedRow.push(participationLabel);
            }
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

          // Always advance the offset, even if this batch was empty
          offset += DOWNLOAD_BATCH_SIZE;
        }
      } catch (error) {
        console.error('Error fetching data batches:', error);
        // Attempt to write error to stream
        stringifier.write(['Error occurred during export. Some data may be missing.']);
      } finally {
        // End the CSV stream when we're done, whether successful or not
        stringifier.end();
      }
    })();

    // Return initial streaming response immediately without waiting for data to be fully processed
    return new NextResponse(responseStream as any, { status: 200, headers });
  } catch (error) {
    console.error('Error in CSV download route handler:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSV file', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 