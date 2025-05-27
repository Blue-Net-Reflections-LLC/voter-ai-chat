// Campaign tables are managed through PostgreSQL migrations in lib/ga-voter-registration/migrations/
// See migration 0024_create_campaign_tables.sql for the actual table definitions
// 
// These tables integrate with the existing Georgia voter database:
// - campaigns
// - campaign_filter_results  
// - campaign_voter_assignments
// - voter_contacts
// - contact_attempts
// - generated_scripts
//
// All tables reference GA_VOTER_REGISTRATION_LIST.voter_registration_number
// for integration with existing voter data.

export {}; // Empty export to make this a valid module 