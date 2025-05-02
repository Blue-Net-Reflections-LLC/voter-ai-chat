ALTER TABLE ga_voter_registration_list ADD COLUMN participation_score NUMERIC(3, 1);

-- Optional: Add an index if you anticipate querying/sorting directly on this score often
CREATE INDEX IF NOT EXISTS idx_participation_score ON ga_voter_registration_list (participation_score DESC NULLS LAST); 