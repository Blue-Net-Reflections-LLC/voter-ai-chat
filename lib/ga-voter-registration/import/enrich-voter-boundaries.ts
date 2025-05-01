import postgres from 'postgres';
import { config } from 'dotenv';
import * as path from 'node:path';

// Load environment variables from the root .env.local
config({
    path: [path.join(__dirname, '../../../../.env.local'), '.env.local'],
});

const databaseUrl = process.env.PG_VOTERDATA_URL;
const schemaName = process.env.PG_VOTERDATA_SCHEMA;

if (!databaseUrl || !schemaName) {
    throw new Error("Missing PG_VOTERDATA_URL or PG_VOTERDATA_SCHEMA. Set them in the .env file.");
}

// Use default connection options or specify only valid ones if needed
// const sql = postgres(databaseUrl, {
//     // Increase statement timeout for potentially long-running updates -- INVALID OPTION HERE
//     // statement_timeout: 300000, // 5 minutes, adjust as needed 
//     // max: 1, // Use a single connection for sequential updates -- UNNECESSARY due to await
// });
const sql = postgres(databaseUrl); // Use default options

const VOTER_TABLE = `${schemaName}.ga_voter_registration_list`;
const COUNTY_TABLE = `public.tl_2024_us_county`; // Assuming public schema
const PLACE_TABLE = `public.tl_2024_13_place`;    // Assuming public schema
const ZCTA_TABLE = `public.tl_2024_us_zcta520`;   // Assuming public schema

async function enrichVoterBoundaries() {
    console.log('Starting geographic boundary enrichment process...');

    try {
        // --- Enrich County Info --- //
        console.log('Updating County information...');
        const countyUpdateResult = await sql`
            UPDATE ${sql(VOTER_TABLE)} voter
            SET
                county_fips = county."GEOID",
                county_name = county."NAME"
            FROM ${sql(COUNTY_TABLE)} county
            WHERE
                ST_Within(voter.geom, county.geom)
                AND voter.county_fips IS NULL -- Only update rows that haven't been processed
                AND county."STATEFP" = '13'; -- Ensure we only match GA counties
        `;
        console.log(`${countyUpdateResult.count} voters updated with County info.`);

        // --- Enrich Place (City) Info --- //
        console.log('Updating Place (City) information...');
        const placeUpdateResult = await sql`
            UPDATE ${sql(VOTER_TABLE)} voter
            SET
                place_name = place."NAME"
            FROM ${sql(PLACE_TABLE)} place
            WHERE
                ST_Within(voter.geom, place.geom)
                AND voter.place_name IS NULL;
        `;
        console.log(`${placeUpdateResult.count} voters updated with Place (City) info.`);

        // --- Enrich ZCTA (Zip Code) Info --- //
        console.log('Updating ZCTA (Zip Code) information...');
        const zctaUpdateResult = await sql`
            UPDATE ${sql(VOTER_TABLE)} voter
            SET
                zcta = zcta."ZCTA5CE20"
            FROM ${sql(ZCTA_TABLE)} zcta
            WHERE
                ST_Within(voter.geom, zcta.geom)
                AND voter.zcta IS NULL;
        `;
        console.log(`${zctaUpdateResult.count} voters updated with ZCTA (Zip Code) info.`);

        // TODO: Add similar blocks for other districts (State House, Senate, etc.)
        // if you load those boundary tables later.
        // Example for State House (assuming table 'public.ga_state_house_districts' with 'geom' and 'district_num'):
        /*
        console.log('Updating State House District information...');
        const shdUpdateResult = await sql`
            UPDATE ${sql(VOTER_TABLE)} voter
            SET
                state_house_district = dist.district_num -- Adjust column name
            FROM public.ga_state_house_districts dist
            WHERE
                ST_Within(voter.geom, dist.geom)
                AND voter.state_house_district IS NULL; -- Assuming you add this column
        `;
        console.log(`${shdUpdateResult.count} voters updated with State House District info.`);
        */

        console.log('Geographic boundary enrichment complete.');

    } catch (error) {
        console.error('Error during boundary enrichment:', error);
        process.exit(1); // Exit with error code
    } finally {
        await sql.end(); // Ensure the connection is closed
        console.log('Database connection closed.');
    }
}

// Execute the function
enrichVoterBoundaries(); 