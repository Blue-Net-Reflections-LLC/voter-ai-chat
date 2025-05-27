# Campaign Filter Tracking Design

## Overview

This document addresses the critical workflow where campaigns generate multiple voter lists through FilterPanel results, and we need to track contacts across all these filter results within a single campaign.

## Workflow Understanding

### Campaign → Filter Results → Contact Tracking Hierarchy

```
Campaign: "2024 GOTV Drive"
├── Filter Result 1: "Young Voters 18-35 in ZIP 30062" (247 voters)
├── Filter Result 2: "Education-focused +1 sentiment" (156 voters)
├── Filter Result 3: "Neutral voters needing persuasion" (423 voters)
└── Filter Result 4: "High-confidence mobilization targets" (89 voters)
```

**Key Insight**: Voters can appear in multiple filter results, but we track all contacts under the campaign umbrella.

## Enhanced Database Schema

### 1. Campaigns Table (Enhanced)
```sql
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    campaign_type VARCHAR(50) NOT NULL, -- 'GOTV', 'PERSUASION', 'MOBILIZATION', 'EDUCATION'
    status VARCHAR(20) DEFAULT 'ACTIVE', -- 'ACTIVE', 'PAUSED', 'COMPLETED'
    start_date DATE NOT NULL,
    end_date DATE,
    target_voter_count INTEGER DEFAULT 0,
    contacted_voter_count INTEGER DEFAULT 0,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Campaign Filter Results Table (NEW)
```sql
CREATE TABLE campaign_filter_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    filter_name VARCHAR(255) NOT NULL,
    filter_description TEXT,
    filter_criteria JSONB NOT NULL, -- Store the actual filter parameters
    voter_count INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Index for efficient querying
    INDEX idx_campaign_filter_results_campaign_id (campaign_id)
);
```

### 3. Campaign Voter Assignments Table (NEW)
```sql
CREATE TABLE campaign_voter_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    filter_result_id UUID NOT NULL REFERENCES campaign_filter_results(id) ON DELETE CASCADE,
    voter_registration_number VARCHAR(50) NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by VARCHAR(255),
    
    -- Prevent duplicate assignments within same filter result
    UNIQUE(filter_result_id, voter_registration_number),
    
    -- Indexes for efficient querying
    INDEX idx_campaign_voter_assignments_campaign_id (campaign_id),
    INDEX idx_campaign_voter_assignments_voter_reg (voter_registration_number),
    INDEX idx_campaign_voter_assignments_filter_result (filter_result_id)
);
```

### 4. Voter Contacts Table (Enhanced)
```sql
CREATE TABLE voter_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    filter_result_id UUID REFERENCES campaign_filter_results(id), -- Optional: which filter led to this contact
    voter_registration_number VARCHAR(50) NOT NULL,
    contact_type VARCHAR(20) NOT NULL, -- 'PHONE', 'DOOR', 'EMAIL', 'TEXT', 'SOCIAL'
    contact_date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    contacted_by VARCHAR(255) NOT NULL,
    
    -- Contact outcome and details
    outcome VARCHAR(30) NOT NULL, -- 'CONNECTED', 'NO_ANSWER', 'BUSY', 'WRONG_NUMBER', 'HOSTILE', 'SUPPORTIVE'
    conversation_notes TEXT,
    contact_duration INTEGER, -- seconds
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    
    -- Sentiment and engagement tracking
    sentiment_score INTEGER CHECK (sentiment_score >= -2 AND sentiment_score <= 2),
    engagement_level VARCHAR(20), -- 'HIGH', 'MEDIUM', 'LOW'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for efficient querying
    INDEX idx_voter_contacts_campaign_id (campaign_id),
    INDEX idx_voter_contacts_voter_reg (voter_registration_number),
    INDEX idx_voter_contacts_contact_date (contact_date_time),
    INDEX idx_voter_contacts_filter_result (filter_result_id)
);
```

## API Design for Filter-Based Campaigns

### 1. Create Campaign with Filter Results
```typescript
interface CreateCampaignRequest {
    name: string;
    description?: string;
    campaignType: 'GOTV' | 'PERSUASION' | 'MOBILIZATION' | 'EDUCATION';
    startDate: string;
    endDate?: string;
    filterResults: FilterResultInput[];
}

interface FilterResultInput {
    filterName: string;
    filterDescription?: string;
    filterCriteria: FilterCriteria; // From existing FilterPanel
    voterRegistrationNumbers: string[]; // Results from filter
}

interface FilterCriteria {
    ageRange?: [number, number];
    zipCodes?: string[];
    sentimentScore?: number[];
    engagementLevel?: string[];
    // ... other filter criteria from FilterPanel
}
```

### 2. Track Contact with Filter Context
```typescript
interface CreateContactRequest {
    campaignId: string;
    filterResultId?: string; // Optional: which filter led to this contact
    voterRegistrationNumber: string;
    contactType: ContactType;
    contactDateTime: string;
    contactedBy: string;
    outcome: ContactOutcome;
    conversationNotes?: string;
    contactDuration?: number;
    followUpRequired?: boolean;
    followUpDate?: string;
    sentimentScore?: number;
    engagementLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
}
```

### 3. Campaign Analytics with Filter Breakdown
```typescript
interface CampaignAnalytics {
    campaignId: string;
    campaignName: string;
    totalVoters: number;
    contactedVoters: number;
    contactRate: number;
    
    filterResults: FilterResultAnalytics[];
    
    overallSentiment: {
        positive: number;
        neutral: number;
        negative: number;
    };
    
    contactOutcomes: {
        connected: number;
        noAnswer: number;
        supportive: number;
        hostile: number;
        // ... other outcomes
    };
}

interface FilterResultAnalytics {
    filterResultId: string;
    filterName: string;
    totalVoters: number;
    contactedVoters: number;
    contactRate: number;
    avgSentimentScore: number;
    topOutcomes: ContactOutcome[];
}
```

## Frontend Integration

### 1. Campaign Creation Flow
```typescript
// In FilterPanel component
const handleCreateCampaign = async (filterResults: FilterResult[]) => {
    const campaignData = {
        name: campaignName,
        description: campaignDescription,
        campaignType: selectedCampaignType,
        startDate: startDate,
        filterResults: filterResults.map(result => ({
            filterName: result.name,
            filterDescription: result.description,
            filterCriteria: result.criteria,
            voterRegistrationNumbers: result.voters.map(v => v.registrationNumber)
        }))
    };
    
    const campaign = await createCampaign(campaignData);
    router.push(`/campaigns/${campaign.id}`);
};
```

### 2. Contact Tracking with Filter Context
```typescript
// In voter contact form
const handleCreateContact = async (contactData: ContactFormData) => {
    const contact = await createContact({
        ...contactData,
        campaignId: currentCampaign.id,
        filterResultId: currentFilterResult?.id, // Track which filter led to contact
        voterRegistrationNumber: voter.registrationNumber
    });
    
    // Update campaign analytics
    await refreshCampaignAnalytics(currentCampaign.id);
};
```

### 3. Campaign Dashboard with Filter Breakdown
```typescript
const CampaignDashboard = ({ campaignId }: { campaignId: string }) => {
    const { campaign, analytics } = useCampaignAnalytics(campaignId);
    
    return (
        <div>
            <CampaignOverview campaign={campaign} analytics={analytics} />
            
            {/* Filter Results Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.filterResults.map(filterResult => (
                    <FilterResultCard 
                        key={filterResult.filterResultId}
                        filterResult={filterResult}
                        onViewDetails={() => router.push(`/campaigns/${campaignId}/filters/${filterResult.filterResultId}`)}
                    />
                ))}
            </div>
            
            <ContactHistory campaignId={campaignId} />
            <SentimentAnalysis campaignId={campaignId} />
        </div>
    );
};
```

## Benefits of This Design

### 1. **Flexible Campaign Management**
- Create campaigns with multiple targeted voter lists
- Track performance across different filter strategies
- Compare effectiveness of different voter segments

### 2. **Comprehensive Contact Tracking**
- All contacts roll up to campaign level
- Optional filter context for detailed analysis
- Prevent duplicate contacts across filter results

### 3. **Advanced Analytics**
- Campaign-level performance metrics
- Filter-level breakdown for strategy optimization
- Cross-filter sentiment and engagement analysis

### 4. **Scalable Architecture**
- Supports unlimited filter results per campaign
- Efficient querying with proper indexing
- Easy integration with existing FilterPanel

## Example Workflow

### Step 1: Create Campaign with Multiple Filters
```
Campaign: "March 2024 Education Push"
├── Filter 1: "Parents with school-age children" (1,247 voters)
├── Filter 2: "Education advocates (+1 sentiment)" (856 voters)
├── Filter 3: "Neutral voters in school districts" (2,134 voters)
└── Filter 4: "Young professionals 25-40" (967 voters)
```

### Step 2: Contact Tracking
- Volunteer calls voter from "Parents with school-age children" filter
- Contact is logged with campaign_id and filter_result_id
- Sentiment and outcome are recorded
- Analytics update in real-time

### Step 3: Campaign Analytics
- Overall campaign: 5,204 total voters, 1,247 contacted (24% contact rate)
- Filter breakdown shows "Education advocates" have highest positive response
- Sentiment analysis reveals messaging effectiveness by voter segment

This design perfectly captures the workflow you described and provides the flexibility needed for sophisticated campaign management! Does this align with your vision? 