import * as fs from 'node:fs';
import * as path from 'node:path';
import CsvReadableStream from 'csv-reader';
import postgres from 'postgres';
import { config } from 'dotenv';
import { gaCountyCodeToNameMap } from '@/lib/data/ga_county_codes';
import moment from 'moment';

// Load environment variables
config({
	path: ['.env.local', path.join(__dirname, '../../../../.env.local')], // Adjust path as needed
});

const databaseUrl = process.env.PG_VOTERDATA_URL;
const schemaName = process.env.PG_VOTERDATA_SCHEMA;

if (!databaseUrl || !schemaName) {
	throw new Error("Missing PG_VOTERDATA_URL or PG_VOTERDATA_SCHEMA. Set them in the .env file.");
}

const sql = postgres(databaseUrl);
const TARGET_TABLE = `${schemaName}.GA_VOTER_HISTORY`;
const BATCH_SIZE = 500;
const DATA_DIRECTORY = path.join(__dirname, '../data');

// --- County Code Lookup --- //
const countyNameMap: { [key: string]: string } = {};
for (const code in gaCountyCodeToNameMap) {
	// Convert string key 'code' to number for indexing
	const numericCode = parseInt(code, 10); 
	// Use numericCode for lookup, but keep the original string 'code' for padding
	const countyName = gaCountyCodeToNameMap[numericCode as keyof typeof gaCountyCodeToNameMap]; 
	if (countyName) {
		const mapKey = countyName.toUpperCase().replace(/\s+/g, '');
		// Use the original string 'code' for padding
		countyNameMap[mapKey] = code.padStart(3, '0'); 
	}
}

const getCountyCode = (name: string): string | undefined => {
	if (!name) return undefined;
	// Convert input name to uppercase and remove spaces for lookup
	const lookupKey = name.toUpperCase().replace(/\s+/g, '');
	return countyNameMap[lookupKey];
};

// --- CSV Row Processing --- //
interface CsvRow {
	'County Name': string;
	'Voter Registration Number': string;
	'Election Date': string;
	'Election Type': string;
	Party: string;
	'Ballot Style': string;
	Absentee: string;
	Provisional: string;
	Supplemental: string;
}

interface DbRow {
	county_name: string;
	county_code: string | undefined;
	registration_number: string;
	election_date: string | null; // YYYY-MM-DD format for DATE type
	election_type: string;
	party: string;
	ballot_style: string;
	absentee: string;
	provisional: string;
	supplemental: string;
}

function transformRow(row: CsvRow): DbRow | null {
	const countyName = row['County Name'];
	const registrationNumber = row['Voter Registration Number'];
	const electionDateRaw = row['Election Date'];

	if (!countyName || !registrationNumber || !electionDateRaw) {
		console.warn('Skipping row due to missing required fields:', row);
		return null;
	}

	// Parse date (MM/DD/YYYY) -> YYYY-MM-DD
	let electionDateFormatted: string | null = null;
	try {
		const parsedDate = moment(electionDateRaw, 'MM/DD/YYYY');
		if (parsedDate.isValid()) {
			electionDateFormatted = parsedDate.format('YYYY-MM-DD');
		} else {
			console.warn(`Skipping row due to invalid date format: ${electionDateRaw}`, row);
			return null;
		}
	} catch (e) {
		console.warn(`Skipping row due to date parsing error: ${electionDateRaw}`, e);
		return null;
	}

	const countyCode = getCountyCode(countyName);
	if (!countyCode) {
		console.warn(`Skipping row due to missing county code for county: ${countyName}`);
		return null;
	}

	return {
		county_name: countyName,
		county_code: countyCode,
		registration_number: registrationNumber,
		election_date: electionDateFormatted,
		election_type: row['Election Type'] || '',
		party: row.Party || '',
		ballot_style: row['Ballot Style'] || '',
		absentee: row.Absentee === 'Y' ? 'Y' : 'N', // Ensure only Y/N
		provisional: row.Provisional === 'Y' ? 'Y' : 'N', // Ensure only Y/N
		supplemental: row.Supplemental === 'Y' ? 'Y' : 'N', // Ensure only Y/N
	};
}

// --- Database Upsert --- //
async function upsertBatch(batch: DbRow[]): Promise<void> {
	if (batch.length === 0) return;

	// --- De-duplication within the batch ---
	// Create a Map to store the latest record for each unique key combination.
	// The key will be registration_number + election_date.
	const uniqueRecords = new Map<string, DbRow>();
	for (const row of batch) {
		// Only process rows with valid registration number and election date
		if (row.registration_number && row.election_date) {
			const key = `${row.registration_number}|${row.election_date}`;
			// Overwrite existing entry if found, effectively keeping the last one in the batch
			uniqueRecords.set(key, row);
		}
	}
	// Convert the Map values back to an array for processing
	const deduplicatedBatch = Array.from(uniqueRecords.values());

	if (deduplicatedBatch.length === 0) {
		console.warn("Batch became empty after removing rows with missing keys or de-duplication.");
		return; // Nothing to insert
	}
	// --- End De-duplication ---

	// Define columns for insertion AND update
	const columns = [
		'county_name', 'county_code', 'registration_number', 'election_date',
		'election_type', 'party', 'ballot_style', 'absentee', 'provisional', 'supplemental'
	];

	// Construct VALUE placeholders string for the DE-DUPLICATED batch:
	// e.g., ($1, $2, ..., $10), ($11, $12, ..., $20), ...
	const valuesPlaceholders = deduplicatedBatch.map((_, rowIndex) =>
		`(${columns.map((_, colIndex) => `$${rowIndex * columns.length + colIndex + 1}`).join(', ')})`
	).join(', ');

	// Construct SET clause for DO UPDATE, referencing EXCLUDED pseudo-table
	const updateSetClause = columns.map(col => `${col} = EXCLUDED.${col}`).join(', ');

	// Flatten the DE-DUPLICATED batch data into a single array matching the placeholders
	// Ensure only primitive types acceptable by the DB driver (string, number, boolean, Date, null) are passed.
	const flattenedValues = deduplicatedBatch.flatMap(row => [
		row.county_name ?? '',
		row.county_code ?? '', // Should be string due to upstream filter
		row.registration_number ?? '',
		row.election_date ?? null, // Pass null if date is null (should be 'YYYY-MM-DD' string here)
		row.election_type ?? '',
		row.party ?? '',
		row.ballot_style ?? '',
		row.absentee ?? 'N', // Default to 'N' if somehow null/undefined
		row.provisional ?? 'N',
		row.supplemental ?? 'N',
	]);

	// Construct the full query string
	// NOTE: TARGET_TABLE already includes the schema name
	const query = `
        INSERT INTO ${TARGET_TABLE} (${columns.join(', ')})
        VALUES ${valuesPlaceholders} 
        ON CONFLICT (registration_number, election_date)
        DO UPDATE SET
            ${updateSetClause},
            updated_at = NOW();
    `;

	try {
		// Execute the raw query with flattened values
		await sql.unsafe(query, flattenedValues);
	} catch (error) {
		console.error('Error during batch upsert:', error);
		// Log the *deduplicated* batch sample on error for better debugging
		console.error('Failed deduplicated batch sample:', JSON.stringify(deduplicatedBatch.slice(0, 2)));
		throw error; // Re-throw to stop the process on error
	}
}

// --- Main Processing Logic --- //
async function processCSVFiles(directoryPath: string): Promise<void> {
	const files = fs.readdirSync(directoryPath).filter(file => file.endsWith('.csv') || file.endsWith('.CSV'));
	console.log(`Found ${files.length} CSV files in ${directoryPath}`);

	for (const file of files) {
		const filePath = path.join(directoryPath, file);
		console.log(`\n--- Processing file: ${filePath} ---`);

		const inputStream = fs.createReadStream(filePath, 'utf8');
		// Important: Use comma delimiter, skip header via asObject:true
		const csvStream = inputStream.pipe(new CsvReadableStream({ parseNumbers: false, parseBooleans: false, asObject: true, trim: true, delimiter: ',', skipHeader: true }));

		let currentBatch: DbRow[] = [];
		let processedRowCount = 0;
		let fileTotalRowCount = 0;
		let skippedRowCount = 0;

		try {
			for await (const row of csvStream) {
				fileTotalRowCount++;
				const transformedRow = transformRow(row as CsvRow);

				if (transformedRow) {
					currentBatch.push(transformedRow);
					processedRowCount++;
				} else {
					skippedRowCount++;
				}

				// Process batch when size is reached
				if (currentBatch.length >= BATCH_SIZE) {
					await upsertBatch(currentBatch);
					process.stdout.write(`.`); // Progress indicator
					currentBatch = []; // Clear the batch
				}
			}

			// Process any remaining batch
			if (currentBatch.length > 0) {
				await upsertBatch(currentBatch);
				process.stdout.write(`.`);
			}

			console.log(`\nFinished processing ${file}. Total Rows: ${fileTotalRowCount}, Processed: ${processedRowCount}, Skipped: ${skippedRowCount}`);

		} catch (error) {
			console.error(`\nError processing file ${filePath}:`, error);
			// Continue to the next file or stop? For now, we continue.
		} finally {
			inputStream.close(); // Ensure stream is closed
		}
	}
	console.log('\n--- All files processed --- \n');
}

// --- Function to Update Derived Last Vote Date --- //
async function updateDerivedLastVoteDate(): Promise<void> {
	console.log('\n--- Updating derived_last_vote_date in registration table ---');
	const startTime = Date.now();

	// Get the schema name safely for interpolation
	const registrationTable = sql`${sql(schemaName!)}.ga_voter_registration_list`;
	const historyTable = sql`${sql(schemaName!)}.ga_voter_history`;

	try {
		// Query 1: Update based on MAX(election_date) from history
		console.log('Step 1: Calculating and updating latest vote dates from history...');
		const updateFromHistory = sql`
			WITH "LastVotePerVoter" AS (
					SELECT
							registration_number,
							MAX(election_date) AS max_election_date
					FROM
							${historyTable}
					GROUP BY
							registration_number
			)
			UPDATE
					${registrationTable} reg
			SET
					derived_last_vote_date = lv.max_election_date
			FROM
					"LastVotePerVoter" lv
			WHERE
					reg.voter_registration_number = lv.registration_number
					AND reg.derived_last_vote_date IS DISTINCT FROM lv.max_election_date;
		`;
		const result1 = await updateFromHistory;
		console.log(`  Updated ${result1.count} rows with latest vote date from history.`);

		// Query 2: Set NULL for voters with no history records
		console.log('Step 2: Setting derived_last_vote_date to NULL for voters with no history...');
		const updateNulls = sql`
			UPDATE
					${registrationTable} reg
			SET
					derived_last_vote_date = NULL
			WHERE
					reg.derived_last_vote_date IS NOT NULL
					AND NOT EXISTS (
							SELECT 1
							FROM ${historyTable} h
							WHERE h.registration_number = reg.voter_registration_number
					);
		`;
		const result2 = await updateNulls;
		console.log(`  Updated ${result2.count} rows to NULL (voters with no history).`);

		// Query 3: Analyze the table
		console.log('Step 3: Analyzing registration table for updated statistics...');
		await sql.unsafe(`ANALYZE ${registrationTable}`); // Use unsafe for ANALYZE
		console.log('  Analysis complete.');

		const endTime = Date.now();
		console.log(`--- Finished updating derived_last_vote_date. Duration: ${(endTime - startTime) / 1000} seconds ---`);

	} catch (error) {
		console.error('Error updating derived_last_vote_date:', error);
		// Decide if this should be a fatal error for the import
		throw error; // Re-throw to indicate failure
	}
}

// --- Function to Update Participated Election Types Array --- //
async function updateParticipatedElectionTypes(): Promise<void> {
	console.log('\n--- Updating participated_election_types in registration table ---');
	const startTime = Date.now();

	const registrationTable = sql`${sql(schemaName!)}.ga_voter_registration_list`;
	const historyTable = sql`${sql(schemaName!)}.ga_voter_history`;

	try {
		// Query 1: Aggregate distinct election types and update the array
		console.log('Step 1: Aggregating and updating election type arrays...');
		const updateTypes = sql`
			WITH "ElectionTypesPerVoter" AS (
					SELECT
							registration_number,
							array_agg(DISTINCT UPPER(election_type)) FILTER (WHERE election_type IS NOT NULL AND TRIM(election_type) <> '') AS types_array
					FROM
							${historyTable}
					GROUP BY
							registration_number
			)
			UPDATE
					${registrationTable} reg
			SET
					participated_election_types = et.types_array
			FROM
					"ElectionTypesPerVoter" et
			WHERE
					reg.voter_registration_number = et.registration_number
					AND reg.participated_election_types IS DISTINCT FROM et.types_array;
		`;
		const result1 = await updateTypes;
		console.log(`  Updated ${result1.count} voters with new election type arrays.`);

		// Query 2: Set to NULL for voters with no history
		console.log('Step 2: Setting election types to NULL for voters with no history...');
		const updateNulls = sql`
			UPDATE
					${registrationTable} reg
			SET
					participated_election_types = NULL
			WHERE
					reg.participated_election_types IS NOT NULL
					AND NOT EXISTS (
							SELECT 1
							FROM ${historyTable} h
							WHERE h.registration_number = reg.voter_registration_number
					);
		`;
		const result2 = await updateNulls;
		console.log(`  Updated ${result2.count} voters with NULL election types (no history).`);

		// Re-Analyze after potentially significant updates
		console.log('Step 3: Re-analyzing registration table...');
		await sql.unsafe(`ANALYZE ${registrationTable}`);
		console.log('  Analysis complete.');

		const endTime = Date.now();
		console.log(`--- Finished updating participated_election_types. Duration: ${(endTime - startTime) / 1000} seconds ---`);

	} catch (error) {
		console.error('Error updating participated_election_types:', error);
		throw error; // Propagate error
	}
}

// --- Script Execution --- //
(async () => {
	try {
		console.log(`Starting GA Voter History import from ${DATA_DIRECTORY}...`);
		await processCSVFiles(DATA_DIRECTORY);

		// After processing all CSVs, update the derived columns
		await updateDerivedLastVoteDate();
		await updateParticipatedElectionTypes();

		console.log('Import completed successfully.');
	} catch (error) {
		console.error("Fatal error during import process:", error);
		process.exit(1);
	} finally {
		await sql.end({ timeout: 5 });
		console.log('Database connection closed.');
	}
})(); 