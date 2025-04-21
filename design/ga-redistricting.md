# Redistricting Affected Filter Implementation Plan

This document outlines the steps required to implement a filter that identifies voters whose legislative districts (Congressional, State Senate, State House) changed between the previous redistricting cycle (e.g., post-2010 census) and the current cycle (e.g., post-2020 census).

## Goal

Provide a boolean filter in the Voter List UI ("Redistricting Affected") that, when enabled, shows only voters whose assigned district(s) differ between the two most recent redistricting cycles.

## Core Concept: Pre-calculation

Due to the computational cost of real-time spatial analysis on millions of voters against multiple district layers, the determination of whether a voter was affected by redistricting **must be pre-calculated** and stored as a simple flag on the main voter registration table.

## Requirements

1.  **PostgreSQL Database:** The existing `voterdata` database (or whichever schema you use).
2.  **PostGIS Extension:** The PostGIS extension must be installed and enabled in the database to handle spatial data types and functions.
3.  **District Shapefiles:** Digital boundary files (`.shp` format + associated files like `.dbf`, `.shx`, `.prj`) for:
    *   **Current** boundaries (post-2020) for:
        *   US Congressional Districts
        *   GA State Senate Districts
        *   GA State House Districts
    *   **Previous** boundaries (post-2010) for:
        *   US Congressional Districts
        *   GA State Senate Districts
        *   GA State House Districts
    *   **Source:** GA Legislative Reapportionment Office (`https://www.legis.ga.gov/joint-office/reapportionment`), US Census Bureau (TIGER/Line).
4.  **Voter Coordinates:** Accurate Latitude and Longitude coordinates for the residence address of each voter in the `ga_voter_registration_list` table. This typically requires **geocoding** the addresses.

## Tools

*   **QGIS (Recommended):** Free, open-source Desktop GIS software. Used for easily importing shapefiles into the PostGIS database, especially when `shp2pgsql` is not available locally.
*   **pgAdmin / psql:** For running SQL queries to manage the database, add columns/indexes, and perform the analysis.
*   **(Alternative to QGIS) `shp2pgsql`:** Command-line tool bundled with PostGIS (requires local installation) for converting shapefiles to SQL.

## Implementation Steps

### 1. Prepare the Database

*   **Install/Enable PostGIS:** Verify PostGIS is active using `SELECT postgis_version();`. If not, install it using `CREATE EXTENSION postgis;` (if available) or by installing OS packages and then running `CREATE EXTENSION`.

### 2. Download and Import Shapefiles

*   Download all six sets of shapefiles (current/previous for Congress, Senate, House) from the official sources. Store them locally (e.g., in `lib/ga-voter-registration/redistrict-imports`).
*   **Using QGIS (Recommended):**
    *   Connect QGIS to the remote DigitalOcean PostgreSQL database.
    *   Use the **Database -> DB Manager -> Import Layer/File...** tool.
    *   For each shapefile:
        *   Select the `.shp` file as **Input**.
        *   Set **Schema** to `public` (or your specific schema like `voterdata`).
        *   Assign a clear **Table** name (e.g., `ga_cong_districts_current`, `ga_senate_districts_previous`). Use consistent naming.
        *   Verify/Set **Source SRID** (e.g., `4269` for NAD83, `4326` for WGS84 - check `.prj` file). Use the EPSG code.
        *   Set **Target SRID** to `4326` (WGS 84) for consistency.
        *   Check **`Create spatial index`**.
        *   Uncheck `Primary key` unless you are certain of a unique ID column in the shapefile.
        *   Click OK.
*   **Verify Imports:** Use pgAdmin or QGIS to confirm tables exist (e.g., `public.ga_cong_districts_current`), have a `geom` column, the correct SRID (4326), a spatial index (`gist(geom)`), and expected attribute columns (like the district identifier).

### 3. Obtain and Store Voter Coordinates

*   **Geocode Addresses:** Convert the `residence_` address fields from `ga_voter_registration_list` into latitude/longitude coordinates. This may require external services (Census Geocoder, commercial APIs).
*   **Add Geometry Column:** Add a point geometry column to the voter table (ensure SRID matches district tables, e.g., 4326):
    ```sql
    ALTER TABLE public.ga_voter_registration_list -- Use your schema
    ADD COLUMN IF NOT EXISTS geom geometry(Point, 4326);
    ```
*   **Populate Geometry Column:** Update the table using the obtained coordinates (replace `res_longitude`, `res_latitude` with actual column names):
    ```sql
    UPDATE public.ga_voter_registration_list -- Use your schema
    SET geom = ST_SetSRID(ST_MakePoint(res_longitude, res_latitude), 4326)
    WHERE res_longitude IS NOT NULL AND res_latitude IS NOT NULL
      AND geom IS NULL; -- Avoid re-processing if run again
    ```
*   **Create Spatial Index:** Index the voter geometry column for fast spatial joins:
    ```sql
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gist_reg_list_geom
        ON public.ga_voter_registration_list USING GIST (geom); -- Use your schema
    ```

### 4. Pre-calculate Redistricting Affected Flag (Offline Analysis)

*   **Add Flag Column:** Add a boolean column to the voter table:
    ```sql
    -- Ensure your schema is correct (e.g., public or voterdata)
    ALTER TABLE public.ga_voter_registration_list
    ADD COLUMN IF NOT EXISTS redistricting_affected BOOLEAN;
    ```
*   **Perform Spatial Joins and Update Flag:** Run this SQL query **as a batch process offline**, after data loads/updates. Adjust table and *district ID column* names (e.g., `"DISTRICT"`, `"DistrictNum"`, etc.) as needed based on your imported shapefile attributes.
    ```sql
    WITH VoterDistricts AS (
      SELECT
        v.voter_registration_number,
        -- Find CURRENT districts (using ~2021/2023 tables)
        -- !!! IMPORTANT: Verify the actual DISTRICT IDENTIFIER column name in each table !!!
        curr_cong."DISTRICT" AS current_cong_district,   -- From ga_districts_cong_2021 or 2023
        curr_senate."DISTRICT" AS current_senate_district, -- From ga_districts_senate_2021 or 2023
        curr_house."DISTRICT" AS current_house_district,  -- From ga_districts_house_2021 or 2023
        -- Find PREVIOUS districts (using ~2012/2014/2015 tables)
        -- !!! IMPORTANT: Verify the actual DISTRICT IDENTIFIER column name in each table !!!
        prev_cong."DISTRICT" AS previous_cong_district,   -- From ga_districts_cong_2012
        prev_senate."DISTRICT" AS previous_senate_district, -- From ga_districts_senate_2012 or 2014
        prev_house."DISTRICT" AS previous_house_district  -- From ga_districts_house_2012 or 2015
      FROM
        public.ga_voter_registration_list v -- Use your schema
      -- Joins to find containing district based on voter point (v.geom)
      -- Join CURRENT district tables (Use the most recent valid set, e.g., 2021 or 2023)
      LEFT JOIN public.ga_districts_cong_2023 curr_cong ON ST_Contains(curr_cong.geom, v.geom)
      LEFT JOIN public.ga_districts_senate_2023 curr_senate ON ST_Contains(curr_senate.geom, v.geom)
      LEFT JOIN public.ga_districts_house_2023 curr_house ON ST_Contains(curr_house.geom, v.geom)
      -- Join PREVIOUS district tables (Use the set valid before the current ones, e.g., 2012/2014/2015)
      LEFT JOIN public.ga_districts_cong_2012 prev_cong ON ST_Contains(prev_cong.geom, v.geom)
      LEFT JOIN public.ga_districts_senate_2014 prev_senate ON ST_Contains(prev_senate.geom, v.geom) -- Or 2012 if more appropriate
      LEFT JOIN public.ga_districts_house_2015 prev_house ON ST_Contains(prev_house.geom, v.geom) -- Or 2012 if more appropriate
      WHERE v.geom IS NOT NULL -- Only process voters with coordinates
    )
    UPDATE public.ga_voter_registration_list reg -- Use your schema
    SET redistricting_affected = TRUE
    FROM VoterDistricts vd
    WHERE reg.voter_registration_number = vd.voter_registration_number
      AND (
           -- Check if any district assignment changed (IS DISTINCT FROM handles NULLs correctly)
           vd.current_cong_district IS DISTINCT FROM vd.previous_cong_district
        OR vd.current_senate_district IS DISTINCT FROM vd.previous_senate_district
        OR vd.current_house_district IS DISTINCT FROM vd.previous_house_district
      );

    -- Set flag to FALSE for voters not affected or without coordinates
    UPDATE public.ga_voter_registration_list -- Use your schema
    SET redistricting_affected = FALSE
    WHERE redistricting_affected IS NULL;
    ```
*   **Index the Flag:** Create a standard index for fast API filtering:
    ```sql
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reg_list_redistricting_affected
        ON public.ga_voter_registration_list (redistricting_affected); -- Use your schema
    ```
*   **Analyze Table:** Update statistics after the changes:
    ```sql
    ANALYZE public.ga_voter_registration_list; -- Use your schema
    ```

### 5. Implement API and UI Filter

*   **Add State/Props:** Add `redistrictingAffected: boolean` to `FilterState` (`types.ts`), handle it in `useVoterList.ts` (initial state, URL params, `buildQueryParams`, `hasActiveFilters`), and add the checkbox to `FilterPanel.tsx` calling `updateFilter`.
*   **Update API Route (`route.ts`):** Parse the `redistrictingAffected` URL parameter and add the simple condition to the SQL query:
    ```typescript
    // Inside the GET function in app/api/ga/voter/list/route.ts
    const redistrictingAffected = searchParams.get('redistrictingAffected') === 'true';
    // ... inside condition building ...
    if (redistrictingAffected) {
      conditions.push(`redistricting_affected = TRUE`);
    }
    ```

This approach moves the heavy lifting (spatial joins) offline, resulting in a very fast user experience for the filter itself.
