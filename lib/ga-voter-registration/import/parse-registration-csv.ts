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
const TARGET_TABLE = `${schemaName}.GA_VOTER_REGISTRATION_LIST`;
const BATCH_SIZE = 500;
const DATA_DIRECTORY = path.join(__dirname, '../data');

const GA_STATE_FIPS = '13'; // FIPS code for Georgia

// --- County Code Lookup (Handles spaces and case) --- //
const countyNameMap: { [key: string]: string } = {};
for (const codeStr in gaCountyCodeToNameMap) {
	const codeNum = parseInt(codeStr, 10);
	if (!isNaN(codeNum)) {
		const countyName = gaCountyCodeToNameMap[codeNum as keyof typeof gaCountyCodeToNameMap];
		if (countyName) {
			const mapKey = countyName.toUpperCase().replace(/\s+/g, '');
			countyNameMap[mapKey] = codeStr.padStart(3, '0');
		}
	}
}

const getCountyCode = (name: string): string | undefined => {
	if (!name) return undefined;
	const lookupKey = name.toUpperCase().replace(/\s+/g, '');
	return countyNameMap[lookupKey];
};

// --- Utility Functions --- //

/**
 * Parses a date string (MM/DD/YYYY) into YYYY-MM-DD format.
 * Returns null if the input is invalid or empty.
 */
function parseDate(dateStr: string | null | undefined): string | null {
	if (!dateStr) return null;
	try {
		const parsedDate = moment(dateStr.trim(), 'MM/DD/YYYY');
		return parsedDate.isValid() ? parsedDate.format('YYYY-MM-DD') : null;
	} catch (e) {
		console.warn(`Date parsing error for input: ${dateStr}`, e);
		return null;
	}
}

/**
 * Normalizes a zip code string to its first 5 digits.
 * Returns null if the input is invalid, empty, or results in less than 5 digits.
 */
function normalizeZipCode(zipStr: string | null | undefined): string | null {
	if (!zipStr) return null;
	const normalized = zipStr.trim().slice(0, 5);
	// Basic validation: check length and ensure it contains only digits (optional)
	if (normalized.length === 5 && /^\d+$/.test(normalized)) {
		return normalized;
	}
	// Log potentially problematic zip codes but don't stop the import for this
	if (normalized.length > 0) { // Log only if there was *something* to normalize
	    console.warn(`Potentially invalid zip format after normalization: '${zipStr}' -> '${normalized}'. Storing as NULL.`);
	}
	return null; // Return null if not a valid 5-digit zip after normalization
}

/** Converts empty strings or specific placeholders to null */
function nullify<T>(value: T): T | null {
    return value === '' || value === null || value === undefined ? null : value;
}

/** Pads a number string with leading zeros */
function padNumber(numStr: string | null | undefined, length: number): string | null {
    if (!numStr) return null;
    const trimmed = numStr.trim();
    if (!trimmed || !/^\d+$/.test(trimmed)) return null; // Return null if not purely numeric
    return trimmed.padStart(length, '0');
}

// --- CSV Row Processing --- //
// Interface matching the CSV headers (adjust if headers differ)
interface CsvRow {
	County: string;
	'Voter Registration Number': string;
	Status: string;
	'Status Reason': string;
	'Last Name': string;
	'First Name': string;
	'Middle Name': string;
	Suffix: string;
	'Birth Year': string; // Read as string initially
	'Residence Street Number': string;
	'Residence Pre Direction': string;
	'Residence Street Name': string;
	'Residence Street Type': string;
	'Residence Post Direction': string;
	'Residence Apt Unit Number': string;
	'Residence City': string;
	'Residence Zipcode': string;
	'County Precinct': string;
	'County Precinct Description': string;
	'Municipal Precinct': string;
	'Municipal Precinct Description': string;
	'Congressional District': string;
	'State Senate District': string;
	'State House District': string;
	'Judicial District': string;
	'County Commission District': string;
	'School Board District': string;
	'City Council District': string;
	'Municipal School Board District': string;
	'Water Board District': string;
	'Super Council District': string;
	'Super Commissioner District': string;
	'Super School Board District': string;
	'Fire District': string;
	Municipality: string;
	Combo: string;
	'Land Lot': string;
	'Land District': string;
	'Registration Date': string;
	Race: string;
	Gender: string;
	'Last Modified Date': string;
	'Date of Last Contact': string;
	'Last Party Voted': string;
	'Last Vote Date': string;
	'Voter Created Date': string;
	'Mailing Street Number': string;
	'Mailing Street Name': string;
	'Mailing Apt Unit Number': string;
	'Mailing City': string;
	'Mailing Zipcode': string;
	'Mailing State': string;
	'Mailing Country': string;
}

// Interface matching the database table columns (snake_case)
interface DbRow {
	county_name: string;
	county_code: string | undefined;
	voter_registration_number: string; // Crucial field
	status: string | null;
	status_reason: string | null;
	last_name: string | null;
	first_name: string | null;
	middle_name: string | null;
	suffix: string | null;
	birth_year: number | null;
	residence_street_number: string | null;
	residence_pre_direction: string | null;
	residence_street_name: string | null;
	residence_street_type: string | null;
	residence_post_direction: string | null;
	residence_apt_unit_number: string | null;
	residence_city: string | null;
	residence_zipcode: string | null; // Normalized 5 digits
	county_precinct: string | null;
	county_precinct_description: string | null;
	municipal_precinct: string | null;
	municipal_precinct_description: string | null;
	congressional_district: string | null;
	state_senate_district: string | null;
	state_house_district: string | null;
	judicial_district: string | null;
	county_commission_district: string | null;
	school_board_district: string | null;
	city_council_district: string | null;
	municipal_school_board_district: string | null;
	water_board_district: string | null;
	super_council_district: string | null;
	super_commissioner_district: string | null;
	super_school_board_district: string | null;
	fire_district: string | null;
	municipality: string | null;
	combo: string | null;
	land_lot: string | null;
	land_district: string | null;
	registration_date: string | null; // YYYY-MM-DD
	race: string | null;
	gender: string | null;
	last_modified_date: string | null; // YYYY-MM-DD
	date_of_last_contact: string | null; // YYYY-MM-DD
	last_party_voted: string | null;
	last_vote_date: string | null; // YYYY-MM-DD
	voter_created_date: string | null; // YYYY-MM-DD
	mailing_street_number: string | null;
	mailing_street_name: string | null;
	mailing_apt_unit_number: string | null;
	mailing_city: string | null;
	mailing_zipcode: string | null; // Normalized 5 digits
	mailing_state: string | null;
	mailing_country: string | null;
}

// Mapping from CSV Header to DB Column (snake_case)
const columnMapping: { [K in keyof CsvRow]: keyof DbRow } = {
	'County': 'county_name',
	'Voter Registration Number': 'voter_registration_number',
	'Status': 'status',
	'Status Reason': 'status_reason',
	'Last Name': 'last_name',
	'First Name': 'first_name',
	'Middle Name': 'middle_name',
	'Suffix': 'suffix',
	'Birth Year': 'birth_year',
	'Residence Street Number': 'residence_street_number',
	'Residence Pre Direction': 'residence_pre_direction',
	'Residence Street Name': 'residence_street_name',
	'Residence Street Type': 'residence_street_type',
	'Residence Post Direction': 'residence_post_direction',
	'Residence Apt Unit Number': 'residence_apt_unit_number',
	'Residence City': 'residence_city',
	'Residence Zipcode': 'residence_zipcode',
	'County Precinct': 'county_precinct',
	'County Precinct Description': 'county_precinct_description',
	'Municipal Precinct': 'municipal_precinct',
	'Municipal Precinct Description': 'municipal_precinct_description',
	'Congressional District': 'congressional_district',
	'State Senate District': 'state_senate_district',
	'State House District': 'state_house_district',
	'Judicial District': 'judicial_district',
	'County Commission District': 'county_commission_district',
	'School Board District': 'school_board_district',
	'City Council District': 'city_council_district',
	'Municipal School Board District': 'municipal_school_board_district',
	'Water Board District': 'water_board_district',
	'Super Council District': 'super_council_district',
	'Super Commissioner District': 'super_commissioner_district',
	'Super School Board District': 'super_school_board_district',
	'Fire District': 'fire_district',
	'Municipality': 'municipality',
	'Combo': 'combo',
	'Land Lot': 'land_lot',
	'Land District': 'land_district',
	'Registration Date': 'registration_date',
	'Race': 'race',
	'Gender': 'gender',
	'Last Modified Date': 'last_modified_date',
	'Date of Last Contact': 'date_of_last_contact',
	'Last Party Voted': 'last_party_voted',
	'Last Vote Date': 'last_vote_date',
	'Voter Created Date': 'voter_created_date',
	'Mailing Street Number': 'mailing_street_number',
	'Mailing Street Name': 'mailing_street_name',
	'Mailing Apt Unit Number': 'mailing_apt_unit_number',
	'Mailing City': 'mailing_city',
	'Mailing Zipcode': 'mailing_zipcode',
	'Mailing State': 'mailing_state',
	'Mailing Country': 'mailing_country'
};

function transformRow(row: CsvRow): DbRow | null {
	const registrationNumber = row['Voter Registration Number'];
	const countyName = row.County;

	if (!registrationNumber) {
		console.warn('Skipping row due to missing Voter Registration Number:', JSON.stringify(row).substring(0, 200));
		return null;
	}
	if (!countyName) {
	    console.warn(`Skipping row for Reg# ${registrationNumber} due to missing County Name.`);
	    return null;
	}

	const countyCode = getCountyCode(countyName);
	if (!countyCode) {
		console.warn(`Skipping row for Reg# ${registrationNumber} due to missing county code for county: ${countyName}`);
		return null;
	}

	// Attempt to parse birth year, handle errors gracefully
	let birthYear: number | null = null;
	try {
	    const yearStr = nullify(row['Birth Year']);
	    if (yearStr) {
            const parsed = parseInt(yearStr, 10);
            if (!isNaN(parsed) && parsed > 1800 && parsed < new Date().getFullYear() + 1) { // Basic sanity check
                 birthYear = parsed;
            } else {
                console.warn(`Invalid Birth Year format/value for Reg# ${registrationNumber}: ${row['Birth Year']}. Storing as NULL.`);
            }
	    }
	} catch (e) {
	    console.warn(`Error parsing Birth Year for Reg# ${registrationNumber}: ${row['Birth Year']}. Storing as NULL.`, e);
	}

	const dbRow: Partial<DbRow> = {
	    county_name: countyName,
	    county_code: countyCode,
        voter_registration_number: registrationNumber,
        birth_year: birthYear,
	    // Parse dates
	    registration_date: parseDate(row['Registration Date']),
	    last_modified_date: parseDate(row['Last Modified Date']),
	    date_of_last_contact: parseDate(row['Date of Last Contact']),
	    last_vote_date: parseDate(row['Last Vote Date']),
	    voter_created_date: parseDate(row['Voter Created Date']),
	    // Normalize zip codes
	    residence_zipcode: normalizeZipCode(row['Residence Zipcode']),
	    mailing_zipcode: normalizeZipCode(row['Mailing Zipcode']),
	    // Pad *some* districts (others handled below with validation)
	    // county_commission_district: padNumber(row['County Commission District'], 3), // Moved below
	    // school_board_district: padNumber(row['School Board District'], 3), // Moved below
	};

    // --- Congressional District Normalization (VARCHAR(4) -> '13' + 2 digits) --- > Revise logic
    let congressionalDistrictValue: string | null = null;
    const rawCD = nullify(row['Congressional District']);
    if (rawCD && /^\d+$/.test(rawCD)) {
        try {
            const cdNum = parseInt(rawCD.trim(), 10);
            // Check if parsing was successful and the number is positive (basic validation)
            if (!isNaN(cdNum) && cdNum > 0) {
                // Convert the *parsed integer* back to string and pad to 2 digits
                const paddedNum = cdNum.toString().padStart(2, '0');
                // Ensure the result still fits (e.g. parsed number isn't > 99)
                if (paddedNum.length === 2) { 
                    congressionalDistrictValue = `${GA_STATE_FIPS}${paddedNum}`;
                } else {
                     console.warn(`Parsed Congressional District number too large for Reg# ${registrationNumber}: ${rawCD} -> ${cdNum}. Storing as NULL.`);
                }
            } else {
                 console.warn(`Invalid Congressional District number for Reg# ${registrationNumber}: ${rawCD}. Storing as NULL.`);
            }
        } catch (e) {
            console.warn(`Error parsing Congressional District for Reg# ${registrationNumber}: ${rawCD}. Storing as NULL.`, e);
        }
    } // Non-numeric rawCDs are already handled as null
    dbRow.congressional_district = congressionalDistrictValue;
    // --- < Congressional District Normalization ---

    // --- State Senate District Normalization (VARCHAR(5) -> '13' + 3 digits) --- >
    let stateSenateDistrictValue: string | null = null;
    const rawSD = nullify(row['State Senate District']);
    if (rawSD && /^\d+$/.test(rawSD)) {
        const numStr = rawSD.trim();
        if (numStr.length > 0 && numStr.length <= 3) { // Validate length 1-3 digits
            stateSenateDistrictValue = `${GA_STATE_FIPS}${numStr.padStart(3, '0')}`;
        } else {
            console.warn(`Unexpected State Senate District format/length for Reg# ${registrationNumber}: ${rawSD}. Storing as NULL.`);
        }
    }
    dbRow.state_senate_district = stateSenateDistrictValue;
    // --- < State Senate District Normalization ---

    // --- State House District Normalization (VARCHAR(5) -> '13' + 3 digits) --- >
    let stateHouseDistrictValue: string | null = null;
    const rawHD = nullify(row['State House District']);
    if (rawHD && /^\d+$/.test(rawHD)) {
        const numStr = rawHD.trim();
        if (numStr.length > 0 && numStr.length <= 3) { // Validate length 1-3 digits
            stateHouseDistrictValue = `${GA_STATE_FIPS}${numStr.padStart(3, '0')}`;
        } else {
            console.warn(`Unexpected State House District format/length for Reg# ${registrationNumber}: ${rawHD}. Storing as NULL.`);
        }
    }
    dbRow.state_house_district = stateHouseDistrictValue;
    // --- < State House District Normalization ---

    // --- County Commission District Normalization (VARCHAR(3) -> 3 digits) --- >
    let countyCommissionDistrictValue: string | null = null;
    const rawCCD = nullify(row['County Commission District']);
    if (rawCCD && /^\d+$/.test(rawCCD)) {
        const numStr = rawCCD.trim();
        if (numStr.length > 0 && numStr.length <= 3) { // Validate length 1-3 digits
            countyCommissionDistrictValue = numStr.padStart(3, '0');
        } else {
            console.warn(`Unexpected County Commission District format/length for Reg# ${registrationNumber}: ${rawCCD}. Storing as NULL.`);
        }
    }
    dbRow.county_commission_district = countyCommissionDistrictValue;
    // --- < County Commission District Normalization ---

    // --- School Board District Normalization (VARCHAR(3) -> 3 digits) --- >
    let schoolBoardDistrictValue: string | null = null;
    const rawSBD = nullify(row['School Board District']);
    if (rawSBD && /^\d+$/.test(rawSBD)) {
        const numStr = rawSBD.trim();
        if (numStr.length > 0 && numStr.length <= 3) { // Validate length 1-3 digits
            schoolBoardDistrictValue = numStr.padStart(3, '0');
        } else {
            console.warn(`Unexpected School Board District format/length for Reg# ${registrationNumber}: ${rawSBD}. Storing as NULL.`);
        }
    }
    dbRow.school_board_district = schoolBoardDistrictValue;
    // --- < School Board District Normalization ---

    // Map remaining fields, converting empty strings to null
	for (const csvHeader in columnMapping) {
	    const dbColumn = columnMapping[csvHeader as keyof CsvRow];
        // Skip fields already handled (county, reg num, dates, zips, birth year, normalized districts)
        const handledColumns: Array<keyof DbRow> = [
            'county_name', 'county_code', 'voter_registration_number', 'birth_year',
            'registration_date', 'last_modified_date', 'date_of_last_contact', 'last_vote_date', 'voter_created_date',
            'residence_zipcode', 'mailing_zipcode',
            'congressional_district', 'state_senate_district', 'state_house_district',
            'county_commission_district', 'school_board_district'
        ];
        if (!handledColumns.includes(dbColumn)) {
            // Use 'as any' to bypass TS index signature type checking issues with Partial<DbRow>
            (dbRow as any)[dbColumn] = nullify(row[csvHeader as keyof CsvRow]);
        }
	}

	return dbRow as DbRow;
}

// --- Database Upsert --- //
async function upsertBatch(batch: DbRow[]): Promise<void> {
	if (batch.length === 0) return;

	// Get all DbRow keys dynamically to handle all columns
    const columns = Object.keys(batch[0]) as Array<keyof DbRow>;

    // Filter out potential undefined keys if DbRow interface changes
    // KEEP county_name for insert/update
    const validColumns = columns.filter(col => batch[0][col] !== undefined);

    // Construct VALUE placeholders: ($1, $2, ...), ($N+1, $N+2, ...), ...
    const valuesPlaceholders = batch.map((_, rowIndex) =>
        `(${validColumns.map((_, colIndex) => `$${rowIndex * validColumns.length + colIndex + 1}`).join(', ')})`
    ).join(', ');

    // Construct SET clause for DO UPDATE
    // Exclude primary key 'id' and unique key 'voter_registration_number' from update set
    // Also exclude created_at
    const updateColumns = validColumns.filter(col => !['id', 'voter_registration_number', 'created_at'].includes(col));
    const updateSetClause = updateColumns.map(col => `${col} = EXCLUDED.${col}`).join(', ');

    // Flatten the batch data, converting undefined to null for DB compatibility
    const flattenedValues = batch.flatMap(row =>
        validColumns.map(col => {
            const value = row[col];
            return value === undefined ? null : value;
        })
    );

    const query = `
        INSERT INTO ${TARGET_TABLE} (${validColumns.join(', ')})
        VALUES ${valuesPlaceholders}
        ON CONFLICT (voter_registration_number) -- Conflict on the unique registration number
        DO UPDATE SET
            ${updateSetClause},
            updated_at = NOW() -- Always update timestamp
        WHERE ${TARGET_TABLE}.voter_registration_number = EXCLUDED.voter_registration_number;
    `;

	try {
		await sql.unsafe(query, flattenedValues);
	} catch (error) {
		console.error('Error during batch upsert:', error);
		console.error('Failed batch sample (first 2 rows):', JSON.stringify(batch.slice(0, 2)));
		throw error; // Re-throw to potentially stop the process
	}
}

// --- Main Processing Logic --- //
async function processCSVFiles(directoryPath: string): Promise<void> {
	const files = fs.readdirSync(directoryPath)
        .filter(file => file.toLowerCase().endsWith('.csv'));
	console.log(`Found ${files.length} CSV files in ${directoryPath}`);

	for (const file of files) {
		const filePath = path.join(directoryPath, file);
		console.log(`\n--- Processing file: ${filePath} ---`);

		const inputStream = fs.createReadStream(filePath, 'utf8');
		const csvStream = inputStream.pipe(new CsvReadableStream({ 
            parseNumbers: false, 
            parseBooleans: false, 
            asObject: true, 
            trim: true, 
            delimiter: ',', 
            skipHeader: true // Skip the header row
        }));

		let currentBatch: DbRow[] = [];
		let processedRowCount = 0;
		let fileTotalRowCount = 0;
		let skippedRowCount = 0;

		try {
			for await (const row of csvStream) {
				fileTotalRowCount++;
                // Ensure row conforms to CsvRow structure before transforming
				const transformedRow = transformRow(row as CsvRow);

				if (transformedRow) {
					currentBatch.push(transformedRow);
					processedRowCount++;
				} else {
					skippedRowCount++;
				}

				if (currentBatch.length >= BATCH_SIZE) {
					await upsertBatch(currentBatch);
					process.stdout.write(`.`); // Progress indicator
					currentBatch = []; // Clear batch
				}
			}

			// Process remaining batch
			if (currentBatch.length > 0) {
				await upsertBatch(currentBatch);
				process.stdout.write(`.`);
			}

			console.log(`\nFinished processing ${file}. Total Rows: ${fileTotalRowCount}, Processed: ${processedRowCount}, Skipped: ${skippedRowCount}`);

		} catch (error) {
			console.error(`\nError processing file ${filePath}:`, error);
            // Decide whether to continue with next file or stop. Currently continues.
		} finally {
			inputStream.close();
		}
	}
	console.log('\n--- All files processed --- \n');
}

// --- Script Execution --- //
(async () => {
	try {
		console.log(`Starting GA Voter Registration import from ${DATA_DIRECTORY}...`);
		await processCSVFiles(DATA_DIRECTORY);
		console.log('Import completed successfully.');
	} catch (error) {
		console.error("Fatal error during import process:", error);
		process.exit(1);
	} finally {
		await sql.end({ timeout: 5 });
		console.log('Database connection closed.');
	}
})(); 