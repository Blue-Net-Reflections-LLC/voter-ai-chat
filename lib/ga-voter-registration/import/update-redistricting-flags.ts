/*
This script updates the redistricting affected flags (`redistricting_affected`,
`redistricting_cong_affected`, `redistricting_senate_affected`,
`redistricting_house_affected`) on the `ga_voter_registration_list` table.

It compares district assignments between the 2021 maps and the 2023 maps
(using the pre-calculated 2023 tile tables for performance) and sets the
flags to TRUE for voters whose districts changed.

Prerequisites:
- PostgreSQL database with PostGIS extension.
- Geocoded voter data in `ga_voter_registration_list` with a `geom` column.
- Imported shapefiles for 2021 districts (e.g., `ga_districts_cong_2021`, etc.).
- Imported and tiled shapefiles for 2023 districts (e.g., `ga_districts_cong_2023_tiles`, etc.).
- Environment variable `DATABASE_URL` pointing to your PostgreSQL database.
- Dependencies: `pg`, `dotenv`, `tsx` (or compile TS and use `node`).
  Install using: pnpm add pg dotenv @types/pg
             pnpm add -D tsx

Usage:
1. **VERY IMPORTANT:** Review the SQL queries below and replace placeholder column
   names (like `curr_dist_col`, `prev_dist_col`, `"DISTRICT"`, `"SLDUST"`, `"SLDLST"`)
   with the actual column names from your specific district tables.
2. Run the script using: pnpm run script lib/ga-voter-registration/import/update-redistricting-flags.ts
   (Or define an npm script like `"update-redistricting": "tsx lib/ga-voter-registration/import/update-redistricting-flags.ts"`
   and run `pnpm run update-redistricting`)
*/
import postgres from 'postgres';
import { config } from 'dotenv';
import * as path from 'node:path';

// Load environment variables from .env.local file, like geocode-addresses.ts
config({
  path: ['.env.local', path.join(__dirname, '../../../../.env.local')],
});

// --- !!! IMPORTANT: VERIFY AND REPLACE PLACEHOLDER COLUMN NAMES BELOW !!! ---
// Examples:
// const cong2023TileCol = 'district_code'; // Or potentially 'DISTRICT' depending on tile creation
// const cong2021DistCol = '"DISTRICT"';    // Use quotes if the column name is case-sensitive or a reserved word
// const senate2023TileCol = 'district_code'; // Or potentially 'SLDUST'?
// const senate2021DistCol = '"SLDUST"';
// const house2023TileCol = 'district_code'; // Or potentially 'SLDLST'?
// const house2021DistCol = '"SLDLST"';

// Replace these placeholders with your actual column names
const cong2023TileCol = 'district_code'; // <<< REPLACE IF NEEDED
const cong2021DistCol = '"DISTRICT"';    // <<< Seems Correct

const senate2023TileCol = 'district_code'; // <<< REPLACE IF NEEDED
const senate2021DistCol = '"DISTRICT"';   // <<< UPDATED from "SLDUST"

const house2023TileCol = 'district_code'; // <<< REPLACE IF NEEDED
const house2021DistCol = '"DISTRICT"';   // <<< UPDATED from "SLDLST"

// --- SQL Queries ---

const sqlSetParallel = `SET max_parallel_workers_per_gather = 4;`;
const sqlSetWorkMem = `SET work_mem = '1GB';`; // Adjust based on available memory

const sqlInitializeFlags = `
UPDATE public.ga_voter_registration_list
SET
    redistricting_cong_affected = FALSE,
    redistricting_senate_affected = FALSE,
    redistricting_house_affected = FALSE,
    redistricting_affected = FALSE
WHERE geom IS NOT NULL; -- Ensure we reset only voters that will be re-evaluated
`;

const sqlUpdateCongFlag = `
WITH VoterDistricts AS MATERIALIZED (
    SELECT
        v.voter_registration_number,
        t.${cong2023TileCol} AS current_district,
        prev.${cong2021DistCol} AS previous_district -- Get previous district in CTE
    FROM
        public.ga_voter_registration_list v
    JOIN -- Use INNER JOIN for current tile match (required)
        public.ga_districts_cong_2023_tiles t ON ST_Intersects(v.geom, t.geom)
    LEFT JOIN -- Use LEFT JOIN for previous district (may not exist)
        public.ga_districts_cong_2021 prev ON ST_Contains(prev.geom, v.geom) -- Join based on original voter geom
    WHERE v.geom IS NOT NULL
)
UPDATE public.ga_voter_registration_list reg
SET redistricting_cong_affected = TRUE
FROM VoterDistricts vd
WHERE
    reg.voter_registration_number = vd.voter_registration_number
    -- Compare districts fetched in CTE
    AND vd.current_district IS DISTINCT FROM vd.previous_district;
`;

const sqlUpdateSenateFlag = `
WITH VoterDistricts AS MATERIALIZED (
    SELECT
        v.voter_registration_number,
        t.${senate2023TileCol} AS current_district,
        prev.${senate2021DistCol} AS previous_district -- Get previous district in CTE
    FROM
        public.ga_voter_registration_list v
    JOIN
        public.ga_districts_senate_2023_tiles t ON ST_Intersects(v.geom, t.geom)
    LEFT JOIN
        public.ga_districts_senate_2021 prev ON ST_Contains(prev.geom, v.geom)
    WHERE v.geom IS NOT NULL
)
UPDATE public.ga_voter_registration_list reg
SET redistricting_senate_affected = TRUE
FROM VoterDistricts vd
WHERE
    reg.voter_registration_number = vd.voter_registration_number
    AND vd.current_district IS DISTINCT FROM vd.previous_district;
`;

const sqlUpdateHouseFlag = `
WITH VoterDistricts AS MATERIALIZED (
    SELECT
        v.voter_registration_number,
        t.${house2023TileCol} AS current_district,
        prev.${house2021DistCol} AS previous_district -- Get previous district in CTE
    FROM
        public.ga_voter_registration_list v
    JOIN
        public.ga_districts_house_2023_tiles t ON ST_Intersects(v.geom, t.geom)
    LEFT JOIN
        public.ga_districts_house_2021 prev ON ST_Contains(prev.geom, v.geom)
    WHERE v.geom IS NOT NULL
)
UPDATE public.ga_voter_registration_list reg
SET redistricting_house_affected = TRUE
FROM VoterDistricts vd
WHERE
    reg.voter_registration_number = vd.voter_registration_number
    AND vd.current_district IS DISTINCT FROM vd.previous_district;
`;

const sqlUpdateCombinedFlag = `
UPDATE public.ga_voter_registration_list
SET redistricting_affected = TRUE
WHERE
    redistricting_cong_affected = TRUE
    OR redistricting_senate_affected = TRUE
    OR redistricting_house_affected = TRUE;
`;

const sqlAnalyze = `ANALYZE public.ga_voter_registration_list;`;

// Helper to execute queries and log time
async function executeQuery(
    // Accept both the main sql instance and a transaction instance
    sqlClient: postgres.Sql | postgres.TransactionSql<Record<string, postgres.PostgresType>>,
    description: string,
    query: string | postgres.PendingQuery<postgres.Row[]>
) {
    console.log(`Executing: ${description}...`);
    const startTime = Date.now();
    let result;
    let rowCount: number | string = 'N/A';

    try {
        if (typeof query === 'string') {
            // Use .unsafe() for raw SQL strings (like SET, ANALYZE, or fixed UPDATEs)
            result = await sqlClient.unsafe(query);
            // For arrays, use length; otherwise try to get a count safely
            if (Array.isArray(result)) {
                // postgres.js attaches .count to the returned array for non-RETURNING updates
                rowCount = (result as unknown as { count?: number }).count ?? result.length;
            } else if (result && typeof result === 'object') {
                // Use type assertion to tell TypeScript this object might have a count property
                const resultWithCount = result as { count?: number | null };
                rowCount = resultWithCount.count !== null && resultWithCount.count !== undefined ? resultWithCount.count : 'N/A';
            } else {
                rowCount = 'N/A';
            }
        } else {
            // For PendingQuery from template literals (sql`...`), await it directly
            result = await query;
            // For arrays, use length; otherwise try to get a count safely
            if (Array.isArray(result)) {
                // postgres.js attaches .count to the returned array for non-RETURNING updates
                rowCount = (result as unknown as { count?: number }).count ?? result.length;
            } else if (result && typeof result === 'object') {
                // Use type assertion to tell TypeScript this object might have a count property
                const resultWithCount = result as { count?: number | null };
                rowCount = resultWithCount.count !== null && resultWithCount.count !== undefined ? resultWithCount.count : 'N/A';
            } else {
                rowCount = 'N/A';
            }
        }
        const duration = (Date.now() - startTime) / 1000;
        console.log(` -> Done in ${duration.toFixed(2)}s. Rows affected: ${rowCount}`);
        return result;
    } catch (error) {
        const duration = (Date.now() - startTime) / 1000;
        console.error(` -> FAILED after ${duration.toFixed(2)}s: ${description}`, error);
        throw error; // Re-throw to allow the main try/catch to handle transaction rollback etc.
    }
}

async function main() {
  // Use PG_VOTERDATA_URL like geocode-addresses.ts
  const databaseUrl = process.env.PG_VOTERDATA_URL;
  if (!databaseUrl) {
    console.error('Error: PG_VOTERDATA_URL environment variable is not set.');
    process.exit(1);
  }

  // Use postgres library connection
  const sql = postgres(databaseUrl, {
      max: 1, // Keep single connection like the original script intent
      idle_timeout: 10, // Optional: time in seconds to close idle connection
      connect_timeout: 30, // Optional: time in seconds to wait for connection
  });

  try {
    console.log('Checking database connection...');
    // Test connection with a simple query
    await sql`SELECT 1`;
    console.log('Connected successfully.');

    console.log('Starting redistricting flag update process...');

    // Execute performance settings
    await executeQuery(sql, 'Setting parallel workers', sqlSetParallel);
    await executeQuery(sql, 'Setting work memory', sqlSetWorkMem);

    // Use sql.begin for transaction block
    await sql.begin(async (transactionSql) => {
        console.log('Starting transaction...');

        await executeQuery(transactionSql, 'Step 1: Initializing flags to FALSE', transactionSql.unsafe(sqlInitializeFlags)); // Use unsafe for non-parameterized UPDATE
        await executeQuery(transactionSql, 'Analyzing table after init', transactionSql.unsafe(sqlAnalyze));

        await executeQuery(transactionSql, 'Step 2: Updating Congressional affected flag', transactionSql.unsafe(sqlUpdateCongFlag));
        await executeQuery(transactionSql, 'Analyzing table after cong update', transactionSql.unsafe(sqlAnalyze));

        await executeQuery(transactionSql, 'Step 3: Updating Senate affected flag', transactionSql.unsafe(sqlUpdateSenateFlag));
        await executeQuery(transactionSql, 'Analyzing table after senate update', transactionSql.unsafe(sqlAnalyze));

        await executeQuery(transactionSql, 'Step 4: Updating House affected flag', transactionSql.unsafe(sqlUpdateHouseFlag));
        await executeQuery(transactionSql, 'Analyzing table after house update', transactionSql.unsafe(sqlAnalyze));

        await executeQuery(transactionSql, 'Step 5: Updating combined affected flag', transactionSql.unsafe(sqlUpdateCombinedFlag));
        await executeQuery(transactionSql, 'Final table analysis', transactionSql.unsafe(sqlAnalyze));

        console.log('Transaction block complete.');
    }); // Transaction automatically committed here if no errors

    console.log('Transaction committed successfully.');

  } catch (err) {
    console.error('Error during database operation:', err);
    // No explicit rollback needed with sql.begin block, it handles it
    process.exit(1); // Exit with error code
  } finally {
    console.log('Closing database connection...');
    // Ensure connection is closed
    await sql.end({ timeout: 5 }); // Give 5 seconds for queries to finish
    console.log('Connection closed.');
  }
}

main().catch((err) => {
  console.error('Unhandled error in main function:', err);
  process.exit(1);
}); 