-- Campaign System Database Migration - PROTOTYPE ONLY
-- 
-- ⚠️  WARNING: THIS IS A PROTOTYPE MIGRATION FOR STAKEHOLDER DEMONSTRATION
-- ⚠️  NOT INTENDED FOR PRODUCTION USE
-- 
-- Purpose: Create campaign tables for interactive prototype to demonstrate
--          voter sentiment tracking system features to stakeholders
-- 
-- This migration includes:
-- - Basic table structure for campaign management
-- - Sample data for realistic prototype demonstrations
-- - Simplified schema that may need refinement for production
-- 
-- TODO for Production Implementation:
-- - Review and optimize table structure
-- - Add proper authentication/authorization columns
-- - Implement audit trails and logging
-- - Add data validation constraints
-- - Review indexing strategy for scale
-- - Add proper backup/recovery considerations
-- 
-- Run this in pgAdmin to create all campaign-related tables
-- Date: May 27th 2025
-- Version: 1.0-PROTOTYPE
-- Migration: 0024_create_campaign_tables.sql

-- Create enums first
CREATE TYPE campaign_type AS ENUM (
  'PHONE_BANK',
  'CANVASSING', 
  'GOTV',
  'MAIL',
  'DIGITAL'
);

CREATE TYPE campaign_status AS ENUM (
  'DRAFT',
  'ACTIVE',
  'PAUSED', 
  'COMPLETED',
  'ARCHIVED'
);

CREATE TYPE contact_method AS ENUM (
  'PHONE_CALL',
  'TEXT_MESSAGE',
  'EMAIL',
  'DOOR_VISIT',
  'EVENT',
  'MAIL'
);

CREATE TYPE contact_outcome AS ENUM (
  'SUCCESSFUL_CONVERSATION',
  'NO_ANSWER',
  'WRONG_NUMBER',
  'HOSTILE_RESPONSE',
  'SUPPORTIVE_RESPONSE',
  'CALLBACK_REQUESTED',
  'DO_NOT_CONTACT',
  'MOVED_AWAY',
  'DECEASED'
);

CREATE TYPE sentiment AS ENUM (
  'VERY_NEGATIVE',
  'NEGATIVE',
  'NEUTRAL',
  'POSITIVE',
  'VERY_POSITIVE'
);

CREATE TYPE voting_likelihood AS ENUM (
  'VERY_UNLIKELY',
  'UNLIKELY',
  'UNDECIDED',
  'LIKELY',
  'VERY_LIKELY'
);

-- Create campaigns table
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type campaign_type NOT NULL,
  status campaign_status NOT NULL DEFAULT 'DRAFT',
  
  -- Goals and metrics
  target_contacts INTEGER,
  target_response_rate DECIMAL(5,2),
  target_volunteer_hours INTEGER,
  
  -- Timeline
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  
  -- Settings
  max_contacts_per_voter INTEGER DEFAULT 3,
  days_between_attempts INTEGER DEFAULT 7,
  
  -- Metadata
  created_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create campaign_filter_results table
CREATE TABLE campaign_filter_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  
  -- Filter configuration (stored as JSON)
  filter_config JSONB NOT NULL,
  filter_description VARCHAR(500),
  
  -- Results
  voter_count INTEGER NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create campaign_voter_assignments table
CREATE TABLE campaign_voter_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  filter_result_id UUID REFERENCES campaign_filter_results(id) ON DELETE CASCADE,
  
  -- Voter info (references existing GA_VOTER_REGISTRATION_LIST)
  voter_registration_number VARCHAR(8) NOT NULL,
  
  -- Assignment info
  assigned_to VARCHAR(255),
  assigned_at TIMESTAMP WITH TIME ZONE,
  priority INTEGER DEFAULT 3, -- 1=High, 3=Medium, 5=Low
  
  -- Status
  contact_status VARCHAR(50) DEFAULT 'NOT_CONTACTED',
  last_contact_attempt TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Foreign key constraint to existing voter registration table
  CONSTRAINT fk_voter_registration 
    FOREIGN KEY (voter_registration_number) 
    REFERENCES GA_VOTER_REGISTRATION_LIST(voter_registration_number)
);

-- Create voter_contacts table
CREATE TABLE voter_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES campaign_voter_assignments(id) ON DELETE CASCADE,
  
  -- Voter info
  voter_registration_number VARCHAR(8) NOT NULL,
  
  -- Contact details
  contact_method contact_method NOT NULL,
  contacted_by VARCHAR(255) NOT NULL,
  contact_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER,
  
  -- Outcome
  outcome contact_outcome NOT NULL,
  sentiment sentiment,
  voting_likelihood voting_likelihood,
  
  -- Content
  notes TEXT,
  issues JSONB, -- Array of issue tags
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date TIMESTAMP WITH TIME ZONE,
  
  -- Contact info updates
  updated_phone VARCHAR(20),
  updated_email VARCHAR(255),
  updated_address TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Foreign key constraint to existing voter registration table
  CONSTRAINT fk_voter_contacts_registration 
    FOREIGN KEY (voter_registration_number) 
    REFERENCES GA_VOTER_REGISTRATION_LIST(voter_registration_number)
);

-- Create contact_attempts table
CREATE TABLE contact_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES voter_contacts(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  
  -- Attempt details
  attempt_date TIMESTAMP WITH TIME ZONE NOT NULL,
  contact_method contact_method NOT NULL,
  attempted_by VARCHAR(255) NOT NULL,
  
  -- Result
  successful BOOLEAN NOT NULL,
  failure_reason VARCHAR(255),
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create generated_scripts table
CREATE TABLE generated_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  voter_registration_number VARCHAR(8),
  
  -- Script details
  contact_method contact_method NOT NULL,
  tone VARCHAR(50) DEFAULT 'FRIENDLY',
  
  -- Content
  greeting TEXT,
  talking_points JSONB,
  closing_message TEXT,
  full_script TEXT,
  
  -- Performance tracking
  times_used INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2),
  
  -- Metadata
  generated_by VARCHAR(255),
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Foreign key constraint to existing voter registration table (nullable)
  CONSTRAINT fk_generated_scripts_registration 
    FOREIGN KEY (voter_registration_number) 
    REFERENCES GA_VOTER_REGISTRATION_LIST(voter_registration_number)
);

-- Create indexes for performance
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_type ON campaigns(type);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at);

CREATE INDEX idx_campaign_filter_results_campaign_id ON campaign_filter_results(campaign_id);

CREATE INDEX idx_campaign_voter_assignments_campaign_id ON campaign_voter_assignments(campaign_id);
CREATE INDEX idx_campaign_voter_assignments_voter_reg_num ON campaign_voter_assignments(voter_registration_number);
CREATE INDEX idx_campaign_voter_assignments_assigned_to ON campaign_voter_assignments(assigned_to);
CREATE INDEX idx_campaign_voter_assignments_contact_status ON campaign_voter_assignments(contact_status);

CREATE INDEX idx_voter_contacts_campaign_id ON voter_contacts(campaign_id);
CREATE INDEX idx_voter_contacts_voter_reg_num ON voter_contacts(voter_registration_number);
CREATE INDEX idx_voter_contacts_contact_date ON voter_contacts(contact_date);
CREATE INDEX idx_voter_contacts_contacted_by ON voter_contacts(contacted_by);
CREATE INDEX idx_voter_contacts_outcome ON voter_contacts(outcome);

CREATE INDEX idx_contact_attempts_campaign_id ON contact_attempts(campaign_id);
CREATE INDEX idx_contact_attempts_contact_id ON contact_attempts(contact_id);
CREATE INDEX idx_contact_attempts_attempt_date ON contact_attempts(attempt_date);

CREATE INDEX idx_generated_scripts_campaign_id ON generated_scripts(campaign_id);
CREATE INDEX idx_generated_scripts_voter_reg_num ON generated_scripts(voter_registration_number);
CREATE INDEX idx_generated_scripts_contact_method ON generated_scripts(contact_method);

-- Add comments for documentation
COMMENT ON TABLE campaigns IS 'Main campaign management table for voter outreach campaigns';
COMMENT ON TABLE campaign_filter_results IS 'Tracks which voter filter results are used in each campaign';
COMMENT ON TABLE campaign_voter_assignments IS 'Assigns specific voters to volunteers within campaigns';
COMMENT ON TABLE voter_contacts IS 'Records all voter contact attempts and outcomes';
COMMENT ON TABLE contact_attempts IS 'Detailed logging of each contact attempt';
COMMENT ON TABLE generated_scripts IS 'AI-generated conversation scripts for voter contacts';

-- Insert sample data for PROTOTYPE DEMONSTRATION ONLY
-- This data is for stakeholder demos and should be replaced with real data in production
INSERT INTO campaigns (name, description, type, status, target_contacts, start_date, end_date, created_by) VALUES
('GOTV Drive 2024', 'Get out the vote campaign for November 2024 election', 'GOTV', 'ACTIVE', 2500, '2024-10-01', '2024-11-05', 'Campaign Manager'),
('Phone Bank October', 'Phone banking campaign to reach undecided voters', 'PHONE_BANK', 'ACTIVE', 1500, '2024-10-15', '2024-10-31', 'Volunteer Coordinator'),
('Canvassing Cobb County', 'Door-to-door canvassing in Cobb County neighborhoods', 'CANVASSING', 'DRAFT', 800, '2024-11-01', '2024-11-04', 'Field Director');

-- Sample filter results for PROTOTYPE DEMONSTRATION ONLY
INSERT INTO campaign_filter_results (campaign_id, filter_config, filter_description, voter_count) 
SELECT 
  c.id,
  '{"counties": ["Cobb"], "ageRange": [18, 35]}',
  'Young voters in Cobb County',
  2847
FROM campaigns c WHERE c.name = 'GOTV Drive 2024';

INSERT INTO campaign_filter_results (campaign_id, filter_config, filter_description, voter_count)
SELECT 
  c.id,
  '{"counties": ["Fulton"], "voterStatus": ["ACTIVE"], "neverVoted": true}',
  'Never voted active voters in Fulton County', 
  1456
FROM campaigns c WHERE c.name = 'GOTV Drive 2024';

COMMIT; 