-- Migration: 0008_add_geocoding_cols.sql
-- Purpose: Add columns for storing geocoding results and census geographies.

-- Add Point geometry column (SRID 4326 for WGS 84)
ALTER TABLE public.ga_voter_registration_list -- Use your schema
ADD COLUMN IF NOT EXISTS geom geometry(Point, 4326) NULL;

-- Add timestamp for tracking when geocoding occurred
ALTER TABLE public.ga_voter_registration_list -- Use your schema
ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMPTZ NULL;

-- Add columns for Census Tract and Block identifiers (GEOIDs)
ALTER TABLE public.ga_voter_registration_list -- Use your schema
ADD COLUMN IF NOT EXISTS census_tract VARCHAR NULL;

ALTER TABLE public.ga_voter_registration_list -- Use your schema
ADD COLUMN IF NOT EXISTS census_block VARCHAR NULL;

-- Add column to track the source of the geocoding
ALTER TABLE public.ga_voter_registration_list -- Use your schema
ADD COLUMN IF NOT EXISTS geocoding_source VARCHAR(50) NULL;

-- Create spatial index on the geometry column for fast spatial queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gist_reg_list_geom
    ON public.ga_voter_registration_list USING GIST (geom); -- Use your schema

-- Optional: Index on geocoded_at to quickly find non-geocoded records
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reg_list_geocoded_at
    ON public.ga_voter_registration_list (geocoded_at);

-- Add comments for clarity
COMMENT ON COLUMN public.ga_voter_registration_list.geom IS 'Point geometry representing the geocoded residence address (SRID 4326).';
COMMENT ON COLUMN public.ga_voter_registration_list.geocoded_at IS 'Timestamp when the address was last successfully geocoded.';
COMMENT ON COLUMN public.ga_voter_registration_list.census_tract IS 'Full Census Tract GEOID returned by the geocoder.';
COMMENT ON COLUMN public.ga_voter_registration_list.census_block IS 'Full Census Block GEOID returned by the geocoder.';
COMMENT ON COLUMN public.ga_voter_registration_list.geocoding_source IS 'Source used for geocoding (e.g., census, mapbox).'; 