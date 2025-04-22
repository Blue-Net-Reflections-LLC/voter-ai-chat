# Geocoding Voter Addresses using US Census Geocoder

This document outlines the plan to geocode voter residence addresses using the free US Census Geocoder API and store the results in the database.

## Goal

To obtain latitude/longitude coordinates, Census Tract, and Census Block information for each voter address in `ga_voter_registration_list`. This enables spatial analysis (like redistricting checks) and correlation with other Census data.

## API Endpoints

### Primary Method: Batch Geocoding
*   **Service:** US Census Geocoder - Geographies by Address Batch
*   **URL:** `https://geocoding.geo.census.gov/geocoder/geographies/addressbatch`
*   **Method:** POST (multipart/form-data)
*   **Key Parameters (Form Data):
    *   `addressFile`: CSV file containing addresses (up to 10,000 per file). Required Format: `Unique ID, Street Address, City, State, Zip`
    *   `benchmark`: Geocoding benchmark (e.g., `Public_AR_Current`)
    *   `vintage`: Data vintage (e.g., `Current_Current`)
*   **Response:** CSV data containing input ID, matched address, coordinates, match status, geography info, etc.
*   **Use Case:** Highly recommended for initial bulk geocoding and large updates due to efficiency.

### Secondary Method: Single Address Geocoding
*   **Service:** US Census Geocoder - Geographies by Address
*   **URL:** `https://geocoding.geo.census.gov/geocoder/geographies/address`
*   **Method:** GET
*   **Key Parameters (URL Query):
    *   `street`, `city`, `state`, `benchmark`, `vintage`, `format=json`
*   **Response:** JSON object with match details.
*   **Use Case:** Suitable for small updates, retrying specific failures, or real-time lookups (if needed, respecting rate limits).

## Rate Limiting / Performance

*   **Batch Endpoint:** Designed for bulk processing. While no hard limits are published, submitting excessively large numbers of batch files concurrently might still trigger blocking. Processing batches sequentially is safest.
*   **Single Endpoint:** Avoid using for bulk processing. Respectful delays (e.g., 100-500ms) between requests are necessary.

## Database Schema Changes

New columns will be added to `ga_voter_registration_list` (as defined in migration `0008_add_geocoding_cols.sql`):

*   `geom geometry(Point, 4326)`
*   `geocoded_at TIMESTAMP WITH TIME ZONE`
*   `census_tract VARCHAR`
*   `census_block VARCHAR`
*   `geocoding_source VARCHAR`
*   **Indexes:** GIST index on `geom`, B-tree index on `geocoded_at`.

## Implementation Plan

1.  **Create Migration:** Add the new columns and indexes (`0008_add_geocoding_cols.sql`).
2.  **Create/Modify Geocoding Script:** Adapt `lib/ga-voter-registration/import/geocode-addresses.ts` to primarily use the **batch endpoint**:
    *   Connect to the PostgreSQL database.
    *   Select batches of voters where `geom IS NULL` (or `geocoded_at IS NULL`), up to 10,000 records per batch.
    *   Format the selected records into a CSV string in the required format: `Unique ID, Street Address, City, State, Zip`. (Use `voter_registration_number` as the Unique ID).
    *   Use a library like `form-data` and `node-fetch` (or `axios`) to construct a `multipart/form-data` POST request.
    *   Include the CSV string as the `addressFile`, along with the `benchmark` and `vintage` parameters.
    *   Send the request to the batch endpoint URL.
    *   Handle potential API errors (timeouts, server errors).
    *   Receive the CSV response text.
    *   Parse the response CSV (e.g., using `csv-parse`). The response columns typically include Input_ID, Match_Status, Longitude, Latitude, Tract, Block, etc.
    *   For each row in the response CSV:
        *   Find the corresponding Input_ID (`voter_registration_number`).
        *   Check the Match_Status (e.g., 'Match', 'Non_Match', 'Tie').
        *   If a 'Match', extract coordinates (Longitude, Latitude), Tract, Block.
        *   Update the corresponding database row using `ST_SetSRID(ST_MakePoint(lon, lat), 4326)` and other extracted fields.
        *   Handle 'Non_Match' or 'Tie' appropriately (e.g., log, mark as failed, skip).
3.  **Provide Execution Instructions:** Document how to run the batch script.

## Future Considerations

*   Add more robust error handling (retries for network issues, logging failed addresses).
*   Potentially use the single-address endpoint to retry addresses that failed in the batch process.
*   Consider alternative geocoders if Census accuracy/coverage is insufficient. 