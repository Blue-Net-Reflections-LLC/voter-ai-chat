import postgres from 'postgres';
import { config } from 'dotenv';
import * as path from 'node:path';
import * as fs from 'node:fs'; // Import fs for file system operations
import fetch from 'node-fetch';
import { stringify } from 'csv-stringify/sync'; // Use sync version for direct string output
import { parse } from 'csv-parse/sync';       // Use sync version for direct array output
import FormData from 'form-data';           // For multipart/form-data POST

// --- Configuration --- //
config({
  path: ['.env.local', path.join(__dirname, '../../../../.env.local')],
});

const databaseUrl = process.env.PG_VOTERDATA_URL;
const schemaName = process.env.PG_VOTERDATA_SCHEMA || 'public';

if (!databaseUrl) {
  throw new Error("Missing PG_VOTERDATA_URL. Set it in the .env file.");
}

const sql = postgres(databaseUrl, { max: 1 });
const REGISTRATION_TABLE = sql`${sql(schemaName)}.ga_voter_registration_list`;

// --- Constants --- //
// Census batch allows up to 10,000, but smaller batches might be more manageable
const BATCH_SIZE = 5000;
const GEOCODING_SOURCE = 'census_batch';
const CENSUS_BATCH_API_URL = 'https://geocoding.geo.census.gov/geocoder/geographies/addressbatch';
const CENSUS_BENCHMARK = 'Public_AR_Current'; // Or choose another benchmark
const CENSUS_VINTAGE = 'Current_Current';   // Or choose another vintage

// Records flagged with this source are considered terminal (we won't retry in this script)
const TERMINAL_TIE_SOURCE = 'census_batch_tie';

// --- Helper Functions --- //

// Simple delay function (might not be needed for batch if run sequentially)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Type for voter record fetched from DB
interface VoterRecord {
  voter_registration_number: string;
  residence_street_number?: string | null;
  residence_pre_direction?: string | null;
  residence_street_name?: string | null;
  residence_street_type?: string | null;
  residence_post_direction?: string | null;
  residence_city?: string | null;
  residence_zipcode?: string | null;
}

// Type for the row structure in the Census Batch API *response* CSV
// Adjusted based on observed API output (12 columns)
interface CensusBatchResponseRow {
  Input_UniqueID: string;
  Input_Address: string; // Column 2 seems to be the input address string or matched string
  Match_Status: 'Match' | 'Non_Match' | 'Tie';
  Match_Type: string;
  Output_MatchedAddress: string;
  Output_LongitudeLatitude: string; // Comma-separated "Lon,Lat"
  Output_TigerLineID: string;
  Output_Side: string;
  Output_StateFIPS: string;
  Output_CountyFIPS: string;
  Output_TractCode: string;
  Output_BlockCode: string;
}

// --- Logging Setup --- //
const logFilePath = path.join(__dirname, 'geocoding_log.txt');
// Ensure log directory exists (optional, __dirname should exist)
// fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
let logStream: fs.WriteStream | null = null; // Initialize later

const logToFile = (level: 'INFO' | 'WARN' | 'ERROR', message: string) => {
  if (logStream) {
    logStream.write(`[${new Date().toISOString()}] [${level}] ${message}\n`);
  }
  // Optionally, still log errors/warnings to console for immediate visibility
  if (level === 'ERROR' || level === 'WARN') {
    console[level.toLowerCase() as 'warn' | 'error'](message);
  }
};

// --- Main Batch Geocoding Logic --- //

async function geocodeBatchViaAPI(records: VoterRecord[]) {
  let successCount = 0;
  let failCount = 0;
  let noMatchCount = 0;
  let tieCount = 0;

  // 1. Format records into CSV string for the API request
  // Format: Unique ID, Street Address, City, State, Zip
  const csvInputData = records.map(r => {
    // Construct street address carefully including directionals and type
    const parts = [
        r.residence_street_number,
        r.residence_pre_direction,
        r.residence_street_name,
        r.residence_street_type,
        r.residence_post_direction
    ];
    const street = parts.filter(Boolean).join(' ').trim();

    return {
        id: r.voter_registration_number,
        street: street,
        city: r.residence_city || '',
        state: 'GA',
        zip: r.residence_zipcode || ''
    }
  });

  // Filter out rows with missing essential parts *before* stringifying
  const validCsvInputData = csvInputData.filter(r => r.street && r.city);
  const skippedCount = records.length - validCsvInputData.length;
  if (skippedCount > 0) {
      const skipMsg = `Skipped ${skippedCount} records due to missing street/city before sending batch.`;
      logToFile('WARN', skipMsg);
      // Keep console warn for visibility during run
      // console.warn(skipMsg);
      failCount += skippedCount; // Count these as failures for the batch
  }

  if (validCsvInputData.length === 0) {
      logToFile('WARN', "Batch is empty after filtering invalid records. Skipping API call.");
      // console.warn("Batch is empty after filtering invalid records. Skipping API call.");
      return { successCount, failCount, noMatchCount, tieCount };
  }

  const csvString = stringify(validCsvInputData, { header: false }); // No header row

  // 2. Prepare multipart/form-data for POST request
  const formData = new FormData();
  formData.append('addressFile', Buffer.from(csvString), { filename: 'addresses.csv', contentType: 'text/csv' });
  formData.append('benchmark', CENSUS_BENCHMARK);
  formData.append('vintage', CENSUS_VINTAGE);

  try {
    console.log(`Sending batch of ${validCsvInputData.length} addresses to Census API...`); // Keep console for progress
    // 3. Make the POST request
    const response = await fetch(CENSUS_BATCH_API_URL, {
      method: 'POST',
      body: formData,
      // Headers are set automatically by node-fetch for FormData
    });

    if (!response.ok) {
      const errorMsg = `Census Batch API Error ${response.status}: ${await response.text()}`;
      logToFile('ERROR', errorMsg);
      // Keep console error for immediate visibility
      // console.error(errorMsg);
      failCount += validCsvInputData.length;
      return { successCount, failCount, noMatchCount, tieCount };
    }

    // 4. Get the response CSV text
    const responseCsvText = await response.text();

    // 5. Parse the response CSV
    const responseRecords: CensusBatchResponseRow[] = parse(responseCsvText, {
      columns: [ // Define columns based on observed Census output order (12 columns)
        'Input_UniqueID',
        'Input_Address', // Placeholder name for the second column
        'Match_Status',
        'Match_Type',
        'Output_MatchedAddress',
        'Output_LongitudeLatitude',
        'Output_TigerLineID',
        'Output_Side',
        'Output_StateFIPS',
        'Output_CountyFIPS',
        'Output_TractCode',
        'Output_BlockCode'
      ],
      skip_empty_lines: true,
      relax_column_count: true // Allow rows for Tie/NoMatch to have fewer columns
    });

    console.log(`Received ${responseRecords.length} results from Census API.`); // Keep console for progress

    // 6. Process results and update DB
    await sql.begin(async (transaction) => {
      for (const res of responseRecords) {
        const uniqueId = res.Input_UniqueID;
        if (res.Match_Status === 'Match') {
          const coords = res.Output_LongitudeLatitude?.split(',');
          const lonStr = coords?.[0];
          const latStr = coords?.[1];
          const lon = lonStr ? parseFloat(lonStr) : null;
          const lat = latStr ? parseFloat(latStr) : null;
          const tract = res.Output_StateFIPS && res.Output_CountyFIPS && res.Output_TractCode ? `${res.Output_StateFIPS}${res.Output_CountyFIPS}${res.Output_TractCode}` : null;
          const block = tract && res.Output_BlockCode ? `${tract}${res.Output_BlockCode}` : null;

          if (lon !== null && lat !== null) {
            try {
              await transaction`
                UPDATE ${REGISTRATION_TABLE}
                SET
                  geom = ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326),
                  geocoded_at = NOW(),
                  census_tract = ${tract},
                  census_block = ${block},
                  geocoding_source = ${GEOCODING_SOURCE}
                WHERE
                  voter_registration_number = ${uniqueId};
              `;
              successCount++;
              // Optionally log success to file
              // logToFile('INFO', `[${uniqueId}] Successfully geocoded.`);
            } catch (dbError) {
              const dbErrorMsg = `[${uniqueId}] DB Update Error: ${dbError instanceof Error ? dbError.message : dbError}`;
              logToFile('ERROR', dbErrorMsg);
              failCount++;
            }
          } else {
            const coordWarnMsg = `[${uniqueId}] Matched but coordinates missing/invalid: ${res.Output_LongitudeLatitude}`;
            logToFile('WARN', coordWarnMsg);
            failCount++; // Count as failure if coords are bad
          }
        } else if (res.Match_Status === 'Non_Match') {
          noMatchCount++;
          logToFile('INFO', `[${uniqueId}] Geocoding Non_Match for address: ${res.Input_Address}`);
          // Optionally update DB to mark as non-match
          // await transaction`UPDATE ${REGISTRATION_TABLE} SET geocoded_at = NOW(), geocoding_source = 'census_batch_no_match' WHERE voter_registration_number = ${uniqueId};`
        } else if (res.Match_Status === 'Tie') {
          tieCount++;
          const tieMsg = `[${uniqueId}] Geocoding Tie for address: ${res.Input_Address}`;
          logToFile('WARN', tieMsg);
          // Attempt to update DB to mark as tie and record the attempt time
          try {
            logToFile('INFO', `[${uniqueId}] Attempting to mark as Tie in DB...`);
            await transaction`UPDATE ${REGISTRATION_TABLE} SET geocoded_at = NOW(), geocoding_source = 'census_batch_tie' WHERE voter_registration_number = ${uniqueId};`
            logToFile('INFO', `[${uniqueId}] Successfully marked as Tie in DB.`);
          } catch (tieDbError) {
             const tieDbErrorMsg = `[${uniqueId}] DB Update Error attempting to mark Tie: ${tieDbError instanceof Error ? tieDbError.message : tieDbError}`;
             logToFile('ERROR', tieDbErrorMsg);
             // Note: This error might cause the whole transaction to fail later.
          }
        }
      }
    }); // End transaction

  } catch (error) {
    const batchErrorMsg = `Error processing batch with Census API: ${error instanceof Error ? error.message : error}`;
    logToFile('ERROR', batchErrorMsg);
    // console.error('Error processing batch with Census API:', error);
    failCount += validCsvInputData.length;
  }

  return { successCount, failCount, noMatchCount, tieCount };
}

async function runGeocoding() {
  logStream = fs.createWriteStream(logFilePath, { flags: 'a' }); // Open stream in append mode
  logToFile('INFO', `Starting BATCH geocoding process against ${schemaName}...`);
  console.log(`Starting BATCH geocoding process against ${schemaName}... Log file: ${logFilePath}`);
  let totalProcessed = 0;
  let totalSuccess = 0;
  let totalFailed = 0;
  let totalNoMatch = 0;
  let totalTies = 0;

  try {
    while (true) {
      console.log(`Fetching next batch (up to ${BATCH_SIZE} records where geom IS NULL)...`);
      logToFile('INFO', `Attempting to fetch next batch with LIMIT ${BATCH_SIZE}`);

      const recordsToGeocode: VoterRecord[] = await sql`
        SELECT
          voter_registration_number,
          residence_street_number,
          residence_pre_direction,
          residence_street_name,
          residence_street_type,
          residence_post_direction,
          residence_city,
          residence_zipcode
        FROM ${REGISTRATION_TABLE}
        WHERE geom IS NULL -- Target records not yet geocoded
          AND (geocoding_source IS NULL OR geocoding_source <> ${TERMINAL_TIE_SOURCE})
        ORDER BY voter_registration_number -- NEED consistent order for OFFSET
        LIMIT ${BATCH_SIZE};
      `;

      logToFile('INFO', `Query returned ${recordsToGeocode.length} records.`);

      if (recordsToGeocode.length === 0) {
        console.log("No more records to geocode based on offset.");
        logToFile('INFO', "Query returned 0 records. Exiting loop.");
        break; // Exit loop
      }

      logToFile('INFO', `Processing batch of ${recordsToGeocode.length} addresses...`);
      // Keep console log for high-level progress
      console.log(`Processing batch of ${recordsToGeocode.length} addresses via Census Batch API...`);
      const batchResult = await geocodeBatchViaAPI(recordsToGeocode);

      totalProcessed += recordsToGeocode.length; // Count records fetched
      totalSuccess += batchResult.successCount;
      totalFailed += batchResult.failCount;
      totalNoMatch += batchResult.noMatchCount;
      totalTies += batchResult.tieCount;

      // Keep console logs for summary
      console.log(`Batch complete. Success: ${batchResult.successCount}, No Match: ${batchResult.noMatchCount}, Tie: ${batchResult.tieCount}, Failed (incl. skipped): ${batchResult.failCount}`);
      console.log(`TOTALS - Processed (Fetched): ${totalProcessed}, Success: ${totalSuccess}, No Match: ${totalNoMatch}, Tie: ${totalTies}, Failed: ${totalFailed}`);
      // Log summary to file as well
      logToFile('INFO', `Batch complete. Success: ${batchResult.successCount}, No Match: ${batchResult.noMatchCount}, Tie: ${batchResult.tieCount}, Failed (incl. skipped): ${batchResult.failCount}`);
      logToFile('INFO', `TOTALS - Processed (Fetched): ${totalProcessed}, Success: ${totalSuccess}, No Match: ${totalNoMatch}, Tie: ${totalTies}, Failed: ${totalFailed}`);

      // Optional small delay between submitting batches if needed
      await delay(500);
    }
  } catch (error) {
    const fatalErrorMsg = `Fatal error during geocoding loop: ${error instanceof Error ? error.message : error}`;
    logToFile('ERROR', fatalErrorMsg);
    console.error(fatalErrorMsg);
  } finally {
    logToFile('INFO', "Geocoding process finished.");
    console.log('Database connection closed.');
    if (logStream) {
      logStream.end(); // Close the file stream
    }
    await sql.end({ timeout: 5 });
  }

  console.log(`Batch geocoding script finished. Check ${logFilePath} for details.`);
}

// --- Script Execution --- //
runGeocoding(); 