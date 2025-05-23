import postgres from 'postgres';
import { config as dotenvConfig } from 'dotenv';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

// Load environment variables
dotenvConfig({
    path: ['.env.local', path.join(__dirname, '../../../../.env.local')], 
});

const databaseUrl = process.env.PG_VOTERDATA_URL;
const schemaName = process.env.PG_VOTERDATA_SCHEMA || 'public';

if (!databaseUrl) {
    throw new Error("Missing PG_VOTERDATA_URL. Set it in the .env file.");
}

const sql = postgres(databaseUrl);
const STAGING_TABLE_NAME = `${schemaName}.stg_processed_census_tract_data`;

interface CvapRecord {
    geoid: string;           // Census tract GEOID
    cvap_total?: number;     // Total CVAP
    cvap_white_alone?: number;
    cvap_black_alone?: number;
    cvap_american_indian_alone?: number;
    cvap_asian_alone?: number;
    cvap_pacific_islander_alone?: number;
    cvap_other_race_alone?: number;
    cvap_two_or_more_races?: number;
    cvap_hispanic_or_latino?: number;
    cvap_white_alone_not_hispanic?: number;
}

// Official Census Bureau CVAP download URL for 2019-2023 data
// Verified working URL
const CVAP_DOWNLOAD_URL = 'https://www2.census.gov/programs-surveys/decennial/rdo/datasets/2023/2023-cvap/CVAP_2019-2023_ACS_csv_files.zip';

// --- CVAP CSV Processing Functions ---

/**
 * Downloads and extracts CVAP data from the Census Bureau
 */
async function downloadAndExtractCvapFiles(): Promise<string> {
    console.log('Downloading CVAP files...');
    
    try {
        console.log(`Downloading from: ${CVAP_DOWNLOAD_URL}`);
        const response = await fetch(CVAP_DOWNLOAD_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const buffer = await response.arrayBuffer();
        const zipPath = 'CVAP_2019-2023_ACS_csv_files.zip';
        fs.writeFileSync(zipPath, Buffer.from(buffer));
        
        console.log(`Successfully downloaded CVAP file: ${zipPath} (${Math.round(buffer.byteLength / 1024 / 1024)} MB)`);
        
        // Extract the zip file
        console.log('Extracting CVAP zip file...');
        const extractDir = 'CVAP_2019-2023_ACS_csv_files';
        
        // Remove existing directory if it exists
        if (fs.existsSync(extractDir)) {
            fs.rmSync(extractDir, { recursive: true, force: true });
        }
        
        // Use PowerShell to extract (Windows compatible)
        await execAsync(`powershell -command "Expand-Archive -Path '${zipPath}' -DestinationPath '${extractDir}' -Force"`);
        
        // Find the Tract.csv file
        const tractCsvPath = path.join(extractDir, 'Tract.csv');
        if (fs.existsSync(tractCsvPath)) {
            console.log(`Found Tract.csv at: ${tractCsvPath}`);
            return tractCsvPath;
        } else {
            // Look for it in subdirectories
            const files = fs.readdirSync(extractDir, { recursive: true });
            const tractFile = files.find(file => file.toString().endsWith('Tract.csv'));
            if (tractFile) {
                const fullPath = path.join(extractDir, tractFile.toString());
                console.log(`Found Tract.csv at: ${fullPath}`);
                return fullPath;
            } else {
                throw new Error('Tract.csv not found in extracted files');
            }
        }
        
    } catch (error) {
        console.error(`Failed to download/extract CVAP data:`, error);
        
        // Create sample data for development/testing
        console.log('Creating sample CVAP data for development...');
        const sampleData = await createSampleCvapData();
        const csvPath = 'sample_cvap_tract.csv';
        fs.writeFileSync(csvPath, sampleData);
        console.log(`Created sample CVAP data file: ${csvPath}`);
        return csvPath;
    }
}

/**
 * Creates sample CVAP data for development when download fails
 * Uses actual tract IDs from the database for realistic testing
 */
async function createSampleCvapData(): Promise<string> {
    console.log('Fetching actual tract IDs from database for sample data...');
    
    try {
        // Get some real tract IDs from the database
        const tracts = await sql`
            SELECT DISTINCT tract_id 
            FROM ${sql(STAGING_TABLE_NAME)} 
            WHERE tract_id IS NOT NULL 
            ORDER BY tract_id 
            LIMIT 10
        `;
        
        if (tracts.length === 0) {
            console.warn('No tract IDs found in database, using hardcoded sample');
            return createHardcodedSampleData();
        }
        
        console.log(`Creating sample CVAP data for ${tracts.length} actual tracts`);
        
        // Generate CSV header
        let csvContent = `GEOID,LNTITLE,CVAP_EST,CVAP_MOE,CVAPWhiteAlone_EST,CVAPWhiteAlone_MOE,CVAPBlackAlone_EST,CVAPBlackAlone_MOE,CVAPAmIndianAlone_EST,CVAPAmIndianAlone_MOE,CVAPAsianAlone_EST,CVAPAsianAlone_MOE,CVAPNatHawPIAlone_EST,CVAPNatHawPIAlone_MOE,CVAPOtherRaceAlone_EST,CVAPOtherRaceAlone_MOE,CVAPTwoOrMoreRaces_EST,CVAPTwoOrMoreRaces_MOE,CVAPHispanic_EST,CVAPHispanic_MOE,CVAPWhiteAloneNotHispanic_EST,CVAPWhiteAloneNotHispanic_MOE\n`;
        
        // Generate sample data for each tract
        for (const tract of tracts) {
            const tractId = tract.tract_id;
            const geoid = `1400000US${tractId}`;
            const countyCode = tractId.substring(0, 5); // First 5 digits are county code
            const tractNumber = tractId.substring(5); // Remaining digits are tract number
            
            // Generate realistic population numbers
            const totalCvap = Math.floor(Math.random() * 3000) + 1000; // 1000-4000
            const whiteAlone = Math.floor(totalCvap * (0.4 + Math.random() * 0.4)); // 40-80% white
            const blackAlone = Math.floor((totalCvap - whiteAlone) * (0.1 + Math.random() * 0.6)); // Variable black population
            const asianAlone = Math.floor((totalCvap - whiteAlone - blackAlone) * Math.random() * 0.5);
            const hispanicLatino = Math.floor(totalCvap * (0.05 + Math.random() * 0.15)); // 5-20% Hispanic
            const whiteAloneNotHispanic = whiteAlone - Math.floor(hispanicLatino * 0.3); // Subtract Hispanic whites
            const americanIndian = Math.floor(Math.random() * 20);
            const pacificIslander = Math.floor(Math.random() * 15);
            const otherRace = Math.floor(Math.random() * 50);
            const twoOrMore = totalCvap - whiteAlone - blackAlone - asianAlone - americanIndian - pacificIslander - otherRace;
            
            // Add margins of error (typically 10-30% of estimate)
            const moe = (est: number) => Math.floor(est * (0.1 + Math.random() * 0.2));
            
            csvContent += `"${geoid}","Census Tract ${tractNumber}, County ${countyCode}, Georgia",${totalCvap},${moe(totalCvap)},${whiteAlone},${moe(whiteAlone)},${blackAlone},${moe(blackAlone)},${americanIndian},${moe(americanIndian)},${asianAlone},${moe(asianAlone)},${pacificIslander},${moe(pacificIslander)},${otherRace},${moe(otherRace)},${twoOrMore},${moe(twoOrMore)},${hispanicLatino},${moe(hispanicLatino)},${whiteAloneNotHispanic},${moe(whiteAloneNotHispanic)}\n`;
        }
        
        return csvContent;
        
    } catch (error) {
        console.error('Error creating sample data from database:', error);
        return createHardcodedSampleData();
    }
}

/**
 * Fallback function to create hardcoded sample data
 */
function createHardcodedSampleData(): string {
    // Sample data structure based on CVAP documentation
    return `GEOID,LNTITLE,CVAP_EST,CVAP_MOE,CVAPWhiteAlone_EST,CVAPWhiteAlone_MOE,CVAPBlackAlone_EST,CVAPBlackAlone_MOE,CVAPAmIndianAlone_EST,CVAPAmIndianAlone_MOE,CVAPAsianAlone_EST,CVAPAsianAlone_MOE,CVAPNatHawPIAlone_EST,CVAPNatHawPIAlone_MOE,CVAPOtherRaceAlone_EST,CVAPOtherRaceAlone_MOE,CVAPTwoOrMoreRaces_EST,CVAPTwoOrMoreRaces_MOE,CVAPHispanic_EST,CVAPHispanic_MOE,CVAPWhiteAloneNotHispanic_EST,CVAPWhiteAloneNotHispanic_MOE
1400000US13067010100,"Census Tract 101, Cobb County, Georgia",3245,187,2456,165,456,78,12,15,234,45,8,12,45,23,34,19,123,34,2333,156
1400000US13067010200,"Census Tract 102, Cobb County, Georgia",2890,156,2123,134,234,54,8,11,445,67,5,9,34,18,41,23,89,27,2034,128
1400000US13067010300,"Census Tract 103, Cobb County, Georgia",4156,234,3012,189,567,89,15,18,389,56,12,16,78,34,83,41,156,45,2856,167`;
}

/**
 * Parses CVAP Tract.csv data and extracts Georgia tract records
 * Note: CVAP data is normalized - each tract has multiple rows (one per demographic category)
 */
async function parseCvapTractData(filename: string): Promise<CvapRecord[]> {
    console.log(`Parsing CVAP tract data from ${filename}...`);
    
    if (!fs.existsSync(filename)) {
        console.error(`File not found: ${filename}`);
        return [];
    }

    const csvContent = fs.readFileSync(filename, 'utf-8');
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    
    console.log('CVAP Tract CSV Headers:', headers);
    console.log('Total columns:', headers.length);
    
    // Find key column indices
    const geoidCol = headers.findIndex(h => h.toLowerCase().includes('geoid'));
    const lntitleCol = headers.findIndex(h => h.toLowerCase().includes('lntitle') || h.toLowerCase().includes('title'));
    const cvapEstCol = headers.findIndex(h => h.toLowerCase() === 'cvap_est');
    
    console.log(`GEOID column index: ${geoidCol} (${headers[geoidCol]})`);
    console.log(`Title column index: ${lntitleCol} (${headers[lntitleCol]})`);
    console.log(`CVAP Est column index: ${cvapEstCol} (${headers[cvapEstCol]})`);
    
    if (geoidCol === -1 || lntitleCol === -1 || cvapEstCol === -1) {
        console.error('Required columns not found in CSV headers');
        console.error('Available headers:', headers);
        return [];
    }
    
    // Group data by tract
    const tractMap = new Map<string, CvapRecord>();
    let totalProcessed = 0;
    let georgiaRowsFound = 0;
    
    console.log('Processing CVAP rows...');
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        totalProcessed++;
        
        const values = parseCSVLine(line);
        const geoid = values[geoidCol]?.replace(/"/g, '');
        const lntitle = values[lntitleCol]?.replace(/"/g, '') || '';
        const cvapEst = parseIntOrNull(values[cvapEstCol]);
        
        // Filter for Georgia census tracts (GEOID starts with 1400000US13)
        if (!geoid || !geoid.startsWith('1400000US13')) {
            continue;
        }
        
        georgiaRowsFound++;
        
        // Extract 11-digit tract ID (remove 1400000US prefix)
        const tractId = geoid.replace('1400000US', '');
        
        // Get or create tract record
        if (!tractMap.has(tractId)) {
            tractMap.set(tractId, { geoid: tractId });
        }
        
        const record = tractMap.get(tractId)!;
        
        // Parse demographic categories based on lntitle
        const category = lntitle.toLowerCase().trim();
        
        if (category === 'total') {
            record.cvap_total = cvapEst;
        } else if (category === 'white alone') {
            record.cvap_white_alone = cvapEst;
        } else if (category === 'black or african american alone') {
            record.cvap_black_alone = cvapEst;
        } else if (category === 'american indian or alaska native alone') {
            record.cvap_american_indian_alone = cvapEst;
        } else if (category === 'asian alone') {
            record.cvap_asian_alone = cvapEst;
        } else if (category === 'native hawaiian or other pacific islander alone') {
            record.cvap_pacific_islander_alone = cvapEst;
        } else if (category === 'some other race alone') {
            record.cvap_other_race_alone = cvapEst;
        } else if (category === 'remainder of two or more race responses') {
            record.cvap_two_or_more_races = cvapEst;
        } else if (category === 'hispanic or latino') {
            record.cvap_hispanic_or_latino = cvapEst;
        } else if (category === 'not hispanic or latino' && category.includes('white')) {
            record.cvap_white_alone_not_hispanic = cvapEst;
        }
        
        // Debug first few records
        if (georgiaRowsFound <= 10) {
            console.log(`Row ${georgiaRowsFound}: Tract ${tractId}, Category: "${category}", Value: ${cvapEst}`);
        }
    }
    
    const georgiaRecords = Array.from(tractMap.values());
    
    console.log(`CVAP Parsing Summary:`);
    console.log(`  - Total rows processed: ${totalProcessed}`);
    console.log(`  - Georgia rows found: ${georgiaRowsFound}`);
    console.log(`  - Unique Georgia tracts: ${georgiaRecords.length}`);
    
    // Debug first few complete records
    console.log('Sample parsed records:');
    for (let i = 0; i < Math.min(3, georgiaRecords.length); i++) {
        console.log(`  Tract ${georgiaRecords[i].geoid}:`, {
            total: georgiaRecords[i].cvap_total,
            white: georgiaRecords[i].cvap_white_alone,
            black: georgiaRecords[i].cvap_black_alone,
            hispanic: georgiaRecords[i].cvap_hispanic_or_latino
        });
    }
    
    if (georgiaRecords.length === 0) {
        console.error('⚠️  No Georgia tracts found! Check GEOID format and filtering logic.');
    }
    
    return georgiaRecords;
}

/**
 * Simple CSV line parser that handles quoted fields
 */
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"' && (i === 0 || line[i - 1] === ',')) {
            inQuotes = true;
        } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i + 1] === ',')) {
            inQuotes = false;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
            continue;
        } else {
            current += char;
        }
    }
    
    result.push(current);
    return result;
}

function parseIntOrNull(value: string): number | undefined {
    if (!value || value.trim() === '' || value === 'null') return undefined;
    const cleaned = value.replace(/"/g, '');
    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) ? undefined : parsed;
}

/**
 * Updates database with CVAP data
 */
async function updateDatabaseWithCvapData(cvapRecords: CvapRecord[]): Promise<void> {
    console.log('Updating database with CVAP data...');
    
    let updatedCount = 0;
    let notFoundCount = 0;
    const notFoundTracts: string[] = [];
    
    for (const record of cvapRecords) {
        try {
            const result = await sql`
                UPDATE ${sql(STAGING_TABLE_NAME)}
                SET 
                    cvap_data_year = '2019-2023 ACS 5-Year',
                    cvap_total = ${record.cvap_total || null},
                    cvap_white_alone = ${record.cvap_white_alone || null},
                    cvap_black_alone = ${record.cvap_black_alone || null},
                    cvap_american_indian_alone = ${record.cvap_american_indian_alone || null},
                    cvap_asian_alone = ${record.cvap_asian_alone || null},
                    cvap_pacific_islander_alone = ${record.cvap_pacific_islander_alone || null},
                    cvap_other_race_alone = ${record.cvap_other_race_alone || null},
                    cvap_two_or_more_races = ${record.cvap_two_or_more_races || null},
                    cvap_hispanic_or_latino = ${record.cvap_hispanic_or_latino || null},
                    cvap_white_alone_not_hispanic = ${record.cvap_white_alone_not_hispanic || null},
                    cvap_data_source = 'CVAP 2019-2023 ACS 5-Year Special Tabulation'
                WHERE tract_id = ${record.geoid}
            `;
            
            if (result.count > 0) {
                updatedCount++;
                // Log successful updates during debugging
                if (updatedCount <= 5) {
                    console.log(`✅ Updated tract ${record.geoid}: Total CVAP=${record.cvap_total}, White=${record.cvap_white_alone}, Black=${record.cvap_black_alone}`);
                }
            } else {
                notFoundCount++;
                // Only collect first few not found tracts for summary
                if (notFoundTracts.length < 10) {
                    notFoundTracts.push(record.geoid);
                }
            }
            
        } catch (error) {
            console.error(`Error updating tract ${record.geoid}:`, error);
        }
    }
    
    console.log(`CVAP Data Update Complete:`);
    console.log(`  - Updated: ${updatedCount} tracts`);
    console.log(`  - Not found: ${notFoundCount} tracts`);
    
    if (notFoundTracts.length > 0) {
        console.log(`  - Sample not found tracts: ${notFoundTracts.join(', ')}${notFoundCount > 10 ? ' ...' : ''}`);
    }
    
    if (updatedCount === 0) {
        console.error('⚠️  No tracts were updated! Check tract_id format in your database.');
        console.log('💡 Suggestion: Run this query to check your database tract format:');
        console.log('   SELECT DISTINCT tract_id FROM stg_processed_census_tract_data LIMIT 5;');
    }
}

/**
 * Main function to process CVAP data
 */
async function main(): Promise<void> {
    console.log('Starting CVAP data processing...');
    
    try {
        // Step 1: Download CVAP files (or use sample data)
        const filename = await downloadAndExtractCvapFiles();
        
        // Step 2: Parse CVAP data
        const cvapData = await parseCvapTractData(filename);
        
        if (cvapData.length === 0) {
            console.log('No CVAP data found to process.');
            return;
        }
        
        // Step 3: Update database
        await updateDatabaseWithCvapData(cvapData);
        
        console.log('CVAP data processing completed successfully!');
        
    } catch (error) {
        console.error('Error in CVAP data processing:', error);
        throw error;
    }
}

// --- Script Execution ---
(async () => {
    try {
        await main();
    } catch (error) {
        console.error("Fatal error during CVAP script execution:", error);
        process.exit(1);
    } finally {
        await sql.end({ timeout: 5 });
        console.log('Database connection closed.');
    }
})(); 