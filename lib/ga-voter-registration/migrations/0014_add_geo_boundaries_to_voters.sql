-- Add columns to store denormalized geographic boundary information

ALTER TABLE public.ga_voter_registration_list
ADD COLUMN IF NOT EXISTS county_fips VARCHAR(5),
ADD COLUMN IF NOT EXISTS county_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS place_name VARCHAR(100), -- For incorporated city/place
ADD COLUMN IF NOT EXISTS zcta VARCHAR(5); -- 5-digit ZCTA

-- Optional: Add indexes on these new columns if you plan to filter by them frequently
CREATE INDEX IF NOT EXISTS idx_ga_voter_registration_list_county_fips ON public.ga_voter_registration_list(county_fips);
CREATE INDEX IF NOT EXISTS idx_ga_voter_registration_list_place_name ON public.ga_voter_registration_list(place_name);
CREATE INDEX IF NOT EXISTS idx_ga_voter_registration_list_zcta ON public.ga_voter_registration_list(zcta);

-- Note: No DOWN migration provided. If needed, add ALTER TABLE ... DROP COLUMN ... statements. 