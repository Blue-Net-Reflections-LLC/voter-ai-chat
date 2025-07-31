-- Migration: Add contact fields to GA_VOTER_REGISTRATION_LIST for field data capture
-- Date: December 2024
-- Purpose: Allow canvassers to add/edit phone and email contact information

-- Add contact fields to main voter table (denormalized for performance)
ALTER TABLE GA_VOTER_REGISTRATION_LIST 
ADD COLUMN IF NOT EXISTS home_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS work_phone VARCHAR(20), 
ADD COLUMN IF NOT EXISTS mobile_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS email_address VARCHAR(255),
ADD COLUMN IF NOT EXISTS contact_updated_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS contact_updated_by VARCHAR(100);

-- Add indexes for contact fields
CREATE INDEX IF NOT EXISTS idx_ga_voter_mobile_phone ON GA_VOTER_REGISTRATION_LIST(mobile_phone);
CREATE INDEX IF NOT EXISTS idx_ga_voter_email ON GA_VOTER_REGISTRATION_LIST(email_address);
CREATE INDEX IF NOT EXISTS idx_ga_voter_contact_updated ON GA_VOTER_REGISTRATION_LIST(contact_updated_date);

-- Add some sample contact data for prototype demonstration
UPDATE GA_VOTER_REGISTRATION_LIST 
SET 
  mobile_phone = CASE 
    WHEN RIGHT(voter_registration_number, 1) IN ('1', '3', '5') THEN '(404) 555-01' || RIGHT(voter_registration_number, 2)
    WHEN RIGHT(voter_registration_number, 1) IN ('2', '4', '6') THEN '(770) 555-01' || RIGHT(voter_registration_number, 2)
    WHEN RIGHT(voter_registration_number, 1) IN ('7', '9') THEN '(678) 555-01' || RIGHT(voter_registration_number, 2)
    ELSE NULL
  END,
  email_address = CASE
    WHEN RIGHT(voter_registration_number, 1) IN ('1', '4', '7') THEN LOWER(first_name || '.' || last_name || '@gmail.com')
    WHEN RIGHT(voter_registration_number, 1) IN ('2', '5', '8') THEN LOWER(first_name || last_name || '@yahoo.com')
    WHEN RIGHT(voter_registration_number, 1) IN ('3', '6', '9') THEN LOWER(LEFT(first_name, 1) || last_name || '@hotmail.com')
    ELSE NULL
  END,
  home_phone = CASE
    WHEN RIGHT(voter_registration_number, 1) IN ('0', '5') THEN '(470) 555-' || LPAD(RIGHT(voter_registration_number, 4), 4, '0')
    ELSE NULL
  END,
  contact_updated_date = CASE
    WHEN RIGHT(voter_registration_number, 1) IN ('1', '3', '5', '7', '9') THEN CURRENT_TIMESTAMP - INTERVAL '5 days'
    WHEN RIGHT(voter_registration_number, 1) IN ('2', '4', '6', '8') THEN CURRENT_TIMESTAMP - INTERVAL '12 days'
    ELSE NULL
  END,
  contact_updated_by = CASE
    WHEN RIGHT(voter_registration_number, 1) IN ('0', '1', '2', '3', '4', '5', '6', '7', '8', '9') THEN 'canvasser_demo'
    ELSE NULL
  END
WHERE LENGTH(voter_registration_number) = 8 -- Only update 8-character registration numbers
  AND ctid IN (
    SELECT ctid 
    FROM GA_VOTER_REGISTRATION_LIST 
    WHERE LENGTH(voter_registration_number) = 8 
    LIMIT 500
  ); -- Limit to first 500 rows for demo

-- PROTOTYPE ONLY: This migration adds contact fields for demonstration
-- Production implementation should:
-- 1. Add proper data validation constraints
-- 2. Add audit logging for contact updates  
-- 3. Implement proper user authentication for contact_updated_by
-- 4. Consider phone number formatting standardization 