/*
Migration: 0006_add_derived_vote_info.sql
Purpose: Add column to store reliable last vote date derived
         from GA_VOTER_HISTORY, enabling faster counts for
         "not voted since year" filters.
*/

-- Add column to store the latest election_date found in history for each voter.
-- It's nullable because voters might truly have no history (never voted).
ALTER TABLE GA_VOTER_REGISTRATION_LIST
ADD COLUMN IF NOT EXISTS derived_last_vote_date DATE NULL;

-- Add index for efficient filtering/counting based on derived date.
-- NULLS LAST can be beneficial if querying for non-null dates is common,
-- but a standard index works well too.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ga_voter_reg_list_derived_last_vote
    ON GA_VOTER_REGISTRATION_LIST (derived_last_vote_date);

-- Add comment for clarity
COMMENT ON COLUMN GA_VOTER_REGISTRATION_LIST.derived_last_vote_date
    IS 'The date of the latest election found for this voter in GA_VOTER_HISTORY, updated via post-import script.'; 