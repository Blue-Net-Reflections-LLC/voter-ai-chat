# Voter Sentiment Tracking System - Technical Solution

## Overview

This document outlines the technical implementation approach for extending our existing voter profile system with comprehensive contact tracking, sentiment analysis, and AI-powered predictive capabilities. The solution builds on our current Next.js/React frontend, PostgreSQL database with Drizzle ORM, and existing AI infrastructure.

## System Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (Next.js)     │◄──►│   (Next.js API) │◄──►│   (PostgreSQL)  │
│                 │    │                 │    │                 │
│ - Voter Profiles│    │ - Contact APIs  │    │ - Voter Data    │
│ - Contact Forms │    │ - Script Gen    │    │ - Contact Logs  │
│ - Analytics UI  │    │ - Analytics     │    │ - Campaigns     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐
                       │   AI Services   │
                       │                 │
                       │ - Script Gen    │
                       │ - Sentiment AI  │
                       │ - Predictions   │
                       └─────────────────┘
```

### Technology Stack
- **Frontend**: Next.js 15, React 19, TypeScript, ShadCN UI, TailwindCSS
- **Backend**: Next.js API Routes, Drizzle ORM
- **Database**: PostgreSQL with existing voter tables
- **AI/ML**: OpenAI GPT-4, Anthropic Claude, existing AI infrastructure
- **Authentication**: NextAuth.js (existing)
- **Deployment**: Vercel (existing)

## Database Design

### New Tables Required

#### 1. Campaigns Table
```sql
CREATE TABLE campaigns (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    campaign_type VARCHAR NOT NULL, -- 'GOTV', 'PHONEBANK', 'CANVASSING', 'MAIL', 'DIGITAL'
    description TEXT,
    start_date DATE,
    end_date DATE,
    target_demographics JSONB, -- Flexible demographic targeting
    assigned_users JSONB, -- Array of user IDs
    status VARCHAR DEFAULT 'ACTIVE', -- 'ACTIVE', 'PAUSED', 'COMPLETED'
    created_by INTEGER, -- Will reference users table when auth system is extended
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. Voter Contacts Table
```sql
CREATE TABLE voter_contacts (
    id SERIAL PRIMARY KEY,
    voter_registration_number VARCHAR(8) REFERENCES ga_voter_registration_list(voter_registration_number),
    campaign_id INTEGER REFERENCES campaigns(id),
    contact_type VARCHAR NOT NULL, -- 'PHONE', 'DOOR', 'EMAIL', 'TEXT', 'EVENT', 'MAIL'
    contact_method_details JSONB, -- Phone number used, email, etc.
    contact_date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    contacted_by INTEGER, -- Will reference users table when auth system is extended
    contact_status VARCHAR NOT NULL, -- 'ATTEMPTED', 'SUCCESSFUL', 'FAILED', 'NO_RESPONSE'
    contact_duration INTEGER, -- Duration in seconds for calls
    outcome VARCHAR, -- 'CONNECTED', 'NO_ANSWER', 'BUSY', 'WRONG_NUMBER', 'HOSTILE', 'SUPPORTIVE'
    sentiment_score INTEGER CHECK (sentiment_score >= -2 AND sentiment_score <= 2), -- -2 to 2 scale
    voting_likelihood INTEGER CHECK (voting_likelihood >= 1 AND voting_likelihood <= 10), -- 1-10 scale
    issues_discussed JSONB, -- Array of issue topics
    voter_concerns TEXT,
    conversation_notes TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    script_used_id INTEGER, -- Reference to generated script
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. Contact Attempts Table
```sql
CREATE TABLE contact_attempts (
    id SERIAL PRIMARY KEY,
    contact_id INTEGER REFERENCES voter_contacts(id),
    attempt_date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    attempt_type VARCHAR NOT NULL, -- 'INITIAL', 'FOLLOW_UP', 'CALLBACK'
    outcome VARCHAR NOT NULL, -- 'CONNECTED', 'NO_ANSWER', 'BUSY', 'WRONG_NUMBER', 'DISCONNECTED', 'HOSTILE'
    notes TEXT,
    next_action VARCHAR, -- 'RETRY', 'DIFFERENT_METHOD', 'DO_NOT_CONTACT', 'FOLLOW_UP'
    created_by INTEGER, -- Will reference users table when auth system is extended
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### 4. Non-Voter Contacts Table
```sql
CREATE TABLE non_voter_contacts (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR,
    last_name VARCHAR,
    phone_number VARCHAR,
    email VARCHAR,
    address_line1 VARCHAR,
    address_line2 VARCHAR,
    city VARCHAR,
    zipcode VARCHAR(5),
    estimated_age_range VARCHAR, -- '18-25', '26-35', etc.
    likely_voter_status VARCHAR, -- 'UNREGISTERED', 'MOVED', 'DECEASED'
    household_connection VARCHAR, -- 'SPOUSE_OF', 'CHILD_OF', 'PARENT_OF'
    connected_voter_id VARCHAR(8), -- Reference to voter registration number
    registration_potential VARCHAR DEFAULT 'UNKNOWN', -- 'HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'
    contact_history JSONB, -- Array of contact attempts
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### 5. Generated Scripts Table
```sql
CREATE TABLE generated_scripts (
    id SERIAL PRIMARY KEY,
    voter_registration_number VARCHAR(8) REFERENCES ga_voter_registration_list(voter_registration_number),
    script_type VARCHAR NOT NULL, -- 'PHONE', 'DOOR', 'EMAIL', 'TEXT'
    script_content TEXT NOT NULL,
    personalization_data JSONB, -- Data used to generate the script
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    used_count INTEGER DEFAULT 0,
    effectiveness_score DECIMAL(3,2), -- Calculated based on outcomes
    ai_model_used VARCHAR, -- 'GPT-4', 'CLAUDE', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Database Indexes
```sql
-- Performance indexes for common queries
CREATE INDEX idx_voter_contacts_voter_id ON voter_contacts(voter_registration_number);
CREATE INDEX idx_voter_contacts_campaign_id ON voter_contacts(campaign_id);
CREATE INDEX idx_voter_contacts_date ON voter_contacts(contact_date_time);
CREATE INDEX idx_voter_contacts_contacted_by ON voter_contacts(contacted_by);
CREATE INDEX idx_voter_contacts_sentiment ON voter_contacts(sentiment_score);
CREATE INDEX idx_contact_attempts_contact_id ON contact_attempts(contact_id);
CREATE INDEX idx_generated_scripts_voter_id ON generated_scripts(voter_registration_number);
CREATE INDEX idx_campaigns_status ON campaigns(status);
```

## API Design

### Core API Endpoints

#### Campaign Management
```typescript
// Campaign CRUD operations
GET    /api/campaigns                    // List campaigns
POST   /api/campaigns                    // Create campaign
GET    /api/campaigns/[id]               // Get campaign details
PUT    /api/campaigns/[id]               // Update campaign
DELETE /api/campaigns/[id]               // Delete campaign

// Campaign voter lists
GET    /api/campaigns/[id]/voters        // Get campaign voter list
POST   /api/campaigns/[id]/voters        // Add voters to campaign
DELETE /api/campaigns/[id]/voters/[voterId] // Remove voter from campaign
```

#### Contact Management
```typescript
// Contact logging and retrieval
GET    /api/contacts                     // List contacts (with filters)
POST   /api/contacts                     // Log new contact
GET    /api/contacts/[id]                // Get contact details
PUT    /api/contacts/[id]                // Update contact
DELETE /api/contacts/[id]                // Delete contact

// Voter-specific contacts
GET    /api/voters/[voterId]/contacts    // Get all contacts for a voter
POST   /api/voters/[voterId]/contacts    // Log contact for specific voter

// Contact attempts
POST   /api/contacts/[id]/attempts       // Log contact attempt
GET    /api/contacts/[id]/attempts       // Get contact attempt history
```

#### AI Script Generation
```typescript
// Script generation
POST   /api/scripts/generate             // Generate script for voter
GET    /api/scripts/[voterId]            // Get existing scripts for voter
POST   /api/scripts/[id]/feedback        // Provide feedback on script effectiveness

// Script templates and management
GET    /api/scripts/templates            // Get script templates
POST   /api/scripts/templates            // Create script template
```

#### Analytics and Reporting
```typescript
// Campaign analytics
GET    /api/analytics/campaigns/[id]     // Campaign performance metrics
GET    /api/analytics/contacts           // Contact performance analytics
GET    /api/analytics/sentiment          // Sentiment analysis reports
GET    /api/analytics/predictions        // AI predictions and forecasts

// Volunteer performance
GET    /api/analytics/volunteers         // Volunteer productivity metrics
GET    /api/analytics/volunteers/[id]    // Individual volunteer performance
```

#### Predictive Analytics
```typescript
// AI-powered predictions
POST   /api/predictions/voting-likelihood // Predict voter turnout likelihood
POST   /api/predictions/persuadability    // Calculate persuadability scores
POST   /api/predictions/optimal-contact   // Predict best contact method/timing
GET    /api/predictions/campaign-forecast // Campaign outcome predictions
```

## Frontend Implementation

### Enhanced Voter Profile Pages
- Extend existing `/ga/voter/profile/[registration_number]/page.tsx`
- Add new sections to the existing profile structure:
  - **Contact History Section**: Timeline of all voter interactions with filtering and search
  - **AI Scripts Section**: Generated scripts for different contact types with effectiveness tracking
  - **Sentiment Tracking Section**: Visual sentiment trends over time with conversation insights
  - **Predictive Analytics Section**: Voting likelihood, persuadability scores, and AI recommendations
  - **Contact Preferences Section**: Do-not-contact flags, preferred contact methods, and scheduling
- Update navigation to include new sections in the sticky nav bar
- Integrate with existing `useVoterProfileSection` hook pattern for consistent data fetching

### New Pages Required
```
/ga/campaigns/                          // Campaign list page
/ga/campaigns/[id]/                     // Campaign detail page
/ga/campaigns/[id]/contacts/            // Campaign contact management
/ga/campaigns/new/                      // Create new campaign
/ga/contacts/                           // Global contact management
/ga/contacts/log/                       // Quick contact logging
/ga/analytics/                          // Analytics dashboard
/ga/analytics/predictions/              // AI predictions dashboard
```

### Component Architecture
```typescript
// Campaign Management Components
- CampaignList
- CampaignCard
- CampaignForm
- CampaignVoterList
- CampaignProgress

// Contact Management Components
- ContactForm
- ContactHistory
- ContactAttemptLog
- ContactOutcomeSelector
- SentimentCapture

// AI Components
- ScriptGenerator
- ScriptDisplay
- SentimentAnalyzer
- PredictionDashboard
- VotingLikelihoodMeter

// Analytics Components
- ContactPerformanceChart
- SentimentTrendChart
- VolunteerProductivityTable
- CampaignForecastChart
- PredictiveInsightsPanel
```

## AI Integration

> **Note**: For detailed technical analysis of the AI scoring systems (sentiment, persuadability, and voting likelihood), see the companion document: [`ai-scoring-systems.md`](./ai-scoring-systems.md)

### Script Generation Service
```typescript
interface ScriptGenerationRequest {
  voterRegistrationNumber: string;
  contactType: 'PHONE' | 'DOOR' | 'EMAIL' | 'TEXT';
  campaignContext?: string;
  previousContacts?: ContactHistory[];
}

interface ScriptGenerationResponse {
  script: string;
  personalizationFactors: string[];
  suggestedTone: string;
  keyTalkingPoints: string[];
  issuesOfInterest: string[];
}
```

### Sentiment Analysis Service
```typescript
interface SentimentAnalysisRequest {
  conversationNotes: string;
  voterResponse: string;
  contextualFactors: {
    voterDemographics: VoterProfile;
    previousSentiment?: number;
    issuesDiscussed: string[];
  };
}

interface SentimentAnalysisResponse {
  sentimentScore: number; // -2 to 2
  confidence: number; // 0 to 1
  emotionalIndicators: string[];
  suggestedFollowUp: string;
  riskFactors: string[];
}
```

### Predictive Analytics Service
```typescript
interface VotingLikelihoodRequest {
  voterProfile: VoterProfile;
  contactHistory: ContactHistory[];
  campaignContext: CampaignContext;
}

interface VotingLikelihoodResponse {
  likelihood: number; // 1-10 scale
  confidence: number; // 0-1
  influencingFactors: string[];
  recommendedActions: string[];
  optimalContactTiming: Date;
}
```

## Implementation Phases

### Phase 1: Core Contact Tracking (4-6 weeks)
**Database Setup:**
- Create migration files following existing pattern:
  - `lib/canvassing-tracking/migrations/001_create_campaigns_table.sql`
  - `lib/canvassing-tracking/migrations/002_create_voter_contacts_table.sql`
  - `lib/canvassing-tracking/migrations/003_create_contact_attempts_table.sql`
  - `lib/canvassing-tracking/migrations/004_create_non_voter_contacts_table.sql`
  - `lib/canvassing-tracking/migrations/005_create_generated_scripts_table.sql`
  - `lib/canvassing-tracking/migrations/006_add_indexes.sql`
- Establish foreign key relationships with existing voter tables
- Add trigger functions for automatic timestamp updates

**Basic Contact Management:**
- Extend `/api/ga/voter/profile/[registration_number]` with contact sections
- Create new API endpoints for contact CRUD operations
- Build contact logging form components using existing UI patterns
- Add contact history section to voter profile pages
- Basic campaign creation and management interface

**Deliverables:**
- Database schema with all core tables
- Contact logging functionality integrated into voter profiles
- Enhanced voter profile pages with contact history section
- Basic campaign management interface

### Phase 2: AI Script Generation & Analytics (6-8 weeks)
**AI Integration:**
- Script generation service using existing AI infrastructure
- Basic sentiment analysis from contact notes
- Integration with OpenAI/Anthropic APIs

**Analytics Foundation:**
- Contact performance reporting
- Basic sentiment tracking
- Volunteer productivity metrics

**Deliverables:**
- AI-generated personalized scripts
- Contact performance analytics
- Sentiment tracking capabilities

### Phase 3: Advanced Predictive Analytics (8-10 weeks)
**Predictive Modeling:**
- Voting likelihood prediction algorithms
- Persuadability scoring system
- Campaign outcome forecasting
- Optimal contact timing predictions

**Advanced Analytics:**
- Real-time sentiment analysis
- Predictive dashboards
- AI-powered recommendations
- Advanced reporting and insights

**Deliverables:**
- Full predictive analytics suite
- AI-powered campaign optimization
- Advanced reporting and forecasting

## Security and Privacy Considerations

### Data Protection
- Encrypt sensitive voter contact information
- Implement role-based access controls
- Audit logging for all data access
- Secure API endpoints with authentication

### Compliance
- TCPA compliance for text messaging
- Do-not-call list management
- GDPR-style data deletion capabilities
- Election law compliance reporting

### Performance Considerations
- Database query optimization
- Caching strategies for frequently accessed data
- Efficient AI model usage
- Real-time data synchronization

## Integration Points

### Existing System Integration
- **Voter Profile API Extension**: Add new sections to existing `/api/ga/voter/profile/[registration_number]` endpoint
  - Add `contacts`, `scripts`, `sentiment`, `predictions` sections to match existing pattern
  - Integrate with current `useVoterProfileSection` hook for consistent data fetching
  - Follow existing error handling and loading state patterns
- **Database Integration**: Build on existing PostgreSQL schema with Drizzle ORM
  - Reference existing `ga_voter_registration_list` table structure
  - Use existing migration pattern in `lib/ga-voter-registration/migrations/`
  - Follow existing naming conventions and column types
- **UI Component Integration**: Extend existing profile section components
  - Follow existing `components/ga/voter/profile-sections/` pattern
  - Use existing ShadCN UI components and styling
  - Integrate with existing navigation and layout structure
- **Authentication**: Prepare for integration with existing NextAuth.js system
  - Design user references to be compatible with future auth implementation
  - Plan role-based access controls for campaign management features

### External Integrations (Future)
- Phone system integration for auto-dialing
- Email marketing platform integration
- Text messaging service integration
- Social media monitoring integration
- External voter file updates

## Success Metrics and Monitoring

### Technical Metrics
- API response times < 200ms
- Database query performance
- AI model accuracy rates
- System uptime and reliability

### Business Metrics
- Contact logging completion rates
- Script generation usage and effectiveness
- Sentiment analysis accuracy
- Prediction model performance
- User adoption and engagement

This technical solution provides a comprehensive roadmap for implementing the voter sentiment tracking system while building on existing infrastructure and maintaining system reliability and performance. 

FilterPanel → "Young Voters 18-35" → 247 voters
FilterPanel → "Education Advocates" → 156 voters  
FilterPanel → "Neutral Persuadables" → 423 voters
                    ↓
All become part of "March 2024 Education Campaign"
                    ↓
Contact tracking across all 826 unique voters
                    ↓
Analytics show which filter strategies work best 