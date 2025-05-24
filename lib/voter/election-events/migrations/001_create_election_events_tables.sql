-- =====================================================
-- Election Events Migration Script
-- File: 001_create_election_events_tables.sql
-- Description: Creates tables for election event registration system
-- Run this script manually in pgAdmin
-- =====================================================

-- Create election_events table
CREATE TABLE IF NOT EXISTS election_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(2048),
    event_date TIMESTAMP NOT NULL,
    status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'cancelled')) DEFAULT 'inactive',
    max_capacity INTEGER DEFAULT NULL, -- NULL = unlimited
    qr_code_data TEXT, -- Base64 encoded QR code or URL
    qr_code_url TEXT, -- Direct URL to QR code image
    seo_slug VARCHAR(255), -- SEO-friendly URL slug
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create event_registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES election_events(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(512) NOT NULL,
    mobile_number VARCHAR(25) NOT NULL, -- stored as formatted string (xxx) xxx-xxxx
    county_code VARCHAR(10), -- GA FIPS code
    county_name VARCHAR(100),
    is_voter_registered CHAR(1) CHECK (is_voter_registered IN ('Y', 'N', 'U')),
    registration_ip INET,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(event_id, email) -- Prevent duplicate registrations
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_email ON event_registrations(email);
CREATE INDEX IF NOT EXISTS idx_event_registrations_created_at ON event_registrations(created_at);
CREATE INDEX IF NOT EXISTS idx_election_events_status ON election_events(status);
CREATE INDEX IF NOT EXISTS idx_election_events_event_date ON election_events(event_date);
CREATE INDEX IF NOT EXISTS idx_election_events_seo_slug ON election_events(seo_slug);

-- Insert the first event: Georgia PSC Primary Forum
INSERT INTO election_events (title, description, location, event_date, status, seo_slug) 
VALUES (
    'Georgia PSC Primary Forum Registration',
    'Join us for an important forum discussing the Georgia Public Service Commission Primary. This event will cover key issues affecting Georgia''s energy future, utility regulations, and consumer protection. Come prepared to learn about the candidates and their positions on critical energy policy matters.',
    'TBD - Location to be determined',
    '2025-05-27 17:00:00'::timestamp, -- Update with actual date
    'active',
    'georgia-psc-primary-forum'
) ON CONFLICT DO NOTHING;
 