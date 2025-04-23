-- Migration: 0009_add_redistricting_cols_and_indexes.sql
-- Purpose: Add redistricting‐related boolean columns to the voter table and
--          ensure requisite indexes (including GiST on district layers)
--          to support fast spatial joins/filters.
-- ---------------------------------------------------------------------------
-- NOTE: All statements use IF NOT EXISTS and CONCURRENTLY whenever possible so
--       the migration can be run safely multiple times.
-- ---------------------------------------------------------------------------

------------------------------------------------------------------------------
-- 1. Add columns to public.ga_voter_registration_list
------------------------------------------------------------------------------

ALTER TABLE public.ga_voter_registration_list
    ADD COLUMN IF NOT EXISTS redistricting_cong_affected   BOOLEAN,
    ADD COLUMN IF NOT EXISTS redistricting_senate_affected BOOLEAN,
    ADD COLUMN IF NOT EXISTS redistricting_house_affected  BOOLEAN,
    ADD COLUMN IF NOT EXISTS redistricting_affected        BOOLEAN;

-- Comments for clarity
COMMENT ON COLUMN public.ga_voter_registration_list.redistricting_cong_affected
    IS 'TRUE if voter''s Congressional district changed between last two redistricting cycles';
COMMENT ON COLUMN public.ga_voter_registration_list.redistricting_senate_affected
    IS 'TRUE if voter''s State Senate district changed between last two redistricting cycles';
COMMENT ON COLUMN public.ga_voter_registration_list.redistricting_house_affected
    IS 'TRUE if voter''s State House district changed between last two redistricting cycles';
COMMENT ON COLUMN public.ga_voter_registration_list.redistricting_affected
    IS 'Derived TRUE if any of the chamber‑specific redistricting flags are TRUE';

------------------------------------------------------------------------------
-- 2. Create indexes on the new boolean columns (cheap‑to‑maintain b‑tree)
------------------------------------------------------------------------------

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reg_list_redistricting_cong
    ON public.ga_voter_registration_list (redistricting_cong_affected);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reg_list_redistricting_senate
    ON public.ga_voter_registration_list (redistricting_senate_affected);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reg_list_redistricting_house
    ON public.ga_voter_registration_list (redistricting_house_affected);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reg_list_redistricting_any
    ON public.ga_voter_registration_list (redistricting_affected);

------------------------------------------------------------------------------
-- 3. Ensure GiST spatial indexes exist on district geometry columns
--    (required for performant ST_Contains joins during the offline analysis)
------------------------------------------------------------------------------

-- Congressional
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gist_ga_districts_cong_2023_geom
    ON public.ga_districts_cong_2023 USING GIST (geom);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gist_ga_districts_cong_2021_geom
    ON public.ga_districts_cong_2021 USING GIST (geom);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gist_ga_districts_cong_2012_geom
    ON public.ga_districts_cong_2012 USING GIST (geom);

-- State Senate
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gist_ga_districts_senate_2023_geom
    ON public.ga_districts_senate_2023 USING GIST (geom);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gist_ga_districts_senate_2021_geom
    ON public.ga_districts_senate_2021 USING GIST (geom);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gist_ga_districts_senate_2014_geom
    ON public.ga_districts_senate_2014 USING GIST (geom);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gist_ga_districts_senate_2012_geom
    ON public.ga_districts_senate_2012 USING GIST (geom);

-- State House
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gist_ga_districts_house_2023_geom
    ON public.ga_districts_house_2023 USING GIST (geom);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gist_ga_districts_house_2021_geom
    ON public.ga_districts_house_2021 USING GIST (geom);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gist_ga_districts_house_2015_geom
    ON public.ga_districts_house_2015 USING GIST (geom);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gist_ga_districts_house_2012_geom
    ON public.ga_districts_house_2012 USING GIST (geom);

------------------------------------------------------------------------------
-- 4. (Optional) Analyse the modified tables to refresh planner stats
------------------------------------------------------------------------------

-- Run ANALYZE to update statistics – not CONCURRENTLY supported but quick.
ANALYZE public.ga_voter_registration_list;

-- End of migration 0009 