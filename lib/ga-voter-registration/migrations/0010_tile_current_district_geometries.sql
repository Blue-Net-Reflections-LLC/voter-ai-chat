-- Migration: 0010_tile_current_district_geometries.sql
-- Purpose : Create subdivided ("tile") versions of the **current** district
--           layers to speed up spatial joins, while also exposing helper
--           views to reconstruct the original polygons for UI mapping.
--           Uses ST_Subdivide with a target max‑tile size of 256 px.  All
--           statements are idempotent – the script can be re‑run safely.
-- ---------------------------------------------------------------------------
-- NOTE: Assumes SRID of 4326 (WGS‑84) for all input geometries.
--       If your layers use a different SRID adapt the CREATE VIEW parts.
-- ---------------------------------------------------------------------------

-------------------------------------------------------------------------------
-- Helper function : create a tiled table for a given source table
-- We can't parametrize easily in plain SQL migrations, so we repeat the three
--      statements for Congress, Senate and House.
-------------------------------------------------------------------------------

------------------------------
-- 1. CONGRESSIONAL 2023
------------------------------
-- a) Table with tiles
CREATE TABLE IF NOT EXISTS public.ga_districts_cong_2023_tiles AS
SELECT src."DISTRICT"                        AS district_code,  -- adjust if name differs
       (ST_Dump(
           ST_Subdivide(src.geom, 256)        -- 256‑pixel target size
       )).geom                                AS geom
FROM   public.ga_districts_cong_2023 src;

-- b) Spatial index on tiles
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gist_ga_districts_cong_2023_tiles_geom
    ON public.ga_districts_cong_2023_tiles USING GIST (geom);

-- b2) Attribute index for fast filtering / grouping
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ga_districts_cong_2023_tiles_code
    ON public.ga_districts_cong_2023_tiles (district_code);

-- c) View to reconstruct polygons (UI friendly)
CREATE OR REPLACE VIEW public.ga_districts_cong_2023_reconstituted AS
SELECT district_code,
       ST_Union(geom) AS geom
FROM   public.ga_districts_cong_2023_tiles
GROUP  BY district_code;

------------------------------
-- 2. STATE SENATE 2023
------------------------------
CREATE TABLE IF NOT EXISTS public.ga_districts_senate_2023_tiles AS
SELECT src."DISTRICT" AS district_code,
       (ST_Dump(ST_Subdivide(src.geom, 256))).geom AS geom
FROM   public.ga_districts_senate_2023 src;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gist_ga_districts_senate_2023_tiles_geom
    ON public.ga_districts_senate_2023_tiles USING GIST (geom);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ga_districts_senate_2023_tiles_code
    ON public.ga_districts_senate_2023_tiles (district_code);

CREATE OR REPLACE VIEW public.ga_districts_senate_2023_reconstituted AS
SELECT district_code,
       ST_Union(geom) AS geom
FROM   public.ga_districts_senate_2023_tiles
GROUP  BY district_code;

------------------------------
-- 3. STATE HOUSE 2023
------------------------------
CREATE TABLE IF NOT EXISTS public.ga_districts_house_2023_tiles AS
SELECT src."DISTRICT" AS district_code,
       (ST_Dump(ST_Subdivide(src.geom, 256))).geom AS geom
FROM   public.ga_districts_house_2023 src;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gist_ga_districts_house_2023_tiles_geom
    ON public.ga_districts_house_2023_tiles USING GIST (geom);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ga_districts_house_2023_tiles_code
    ON public.ga_districts_house_2023_tiles (district_code);

CREATE OR REPLACE VIEW public.ga_districts_house_2023_reconstituted AS
SELECT district_code,
       ST_Union(geom) AS geom
FROM   public.ga_districts_house_2023_tiles
GROUP  BY district_code;

-------------------------------------------------------------------------------
-- 4. Statistics
-------------------------------------------------------------------------------
ANALYZE public.ga_districts_cong_2023_tiles;
ANALYZE public.ga_districts_senate_2023_tiles;
ANALYZE public.ga_districts_house_2023_tiles;

-- End of migration 0010 