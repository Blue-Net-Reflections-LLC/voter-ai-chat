# Election Day Assistance - Technical Design

## Overview

This document outlines the technical implementation for Election Day voter assistance tracking, designed to be flexible and extensible to handle unknown challenges that may emerge during campaigns. The system integrates with the existing canvassing tracking infrastructure to provide comprehensive voter support from initial contact through successful voting.

## Database Schema Extensions

### 1. Voter Assistance Needs Table
```sql
CREATE TABLE voter_assistance_needs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voter_registration_number VARCHAR(50) REFERENCES ga_voter_registration_list(voter_registration_number),
    campaign_id UUID REFERENCES campaigns(id),
    assistance_category VARCHAR(100) NOT NULL, -- Flexible category system
    assistance_type VARCHAR(100) NOT NULL, -- Specific type within category
    priority_level INTEGER DEFAULT 3 CHECK (priority_level >= 1 AND priority_level <= 5), -- 1=Critical, 5=Low
    description TEXT,
    status VARCHAR(30) DEFAULT 'IDENTIFIED', -- 'IDENTIFIED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
    
    -- Discovery information
    discovered_during_contact_id UUID REFERENCES voter_contacts(id),
    discovered_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    discovered_by VARCHAR(255),
    
    -- Assignment and fulfillment
    assigned_to VARCHAR(255),
    assigned_date TIMESTAMP WITH TIME ZONE,
    completed_date TIMESTAMP WITH TIME ZONE,
    completion_notes TEXT,
    
    -- Follow-up tracking
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    reminder_sent BOOLEAN DEFAULT FALSE,
    
    -- Outcome tracking
    assistance_successful BOOLEAN,
    voter_voted BOOLEAN,
    impact_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for efficient querying
    INDEX idx_voter_assistance_voter_reg (voter_registration_number),
    INDEX idx_voter_assistance_campaign (campaign_id),
    INDEX idx_voter_assistance_category (assistance_category),
    INDEX idx_voter_assistance_status (status),
    INDEX idx_voter_assistance_priority (priority_level),
    INDEX idx_voter_assistance_assigned (assigned_to)
);
```

### 2. Assistance Categories Configuration Table
```sql
CREATE TABLE assistance_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id), -- NULL for global categories
    category_name VARCHAR(100) NOT NULL,
    category_description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    
    -- Configuration for this category
    requires_volunteer_assignment BOOLEAN DEFAULT TRUE,
    default_priority_level INTEGER DEFAULT 3,
    estimated_time_minutes INTEGER, -- How long this typically takes
    requires_follow_up BOOLEAN DEFAULT FALSE,
    
    -- Custom fields configuration
    custom_fields JSONB, -- Flexible field definitions
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate categories per campaign
    UNIQUE(campaign_id, category_name),
    
    INDEX idx_assistance_categories_campaign (campaign_id),
    INDEX idx_assistance_categories_active (is_active)
);
```

### 3. Assistance Types Configuration Table
```sql
CREATE TABLE assistance_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES assistance_categories(id) ON DELETE CASCADE,
    type_name VARCHAR(100) NOT NULL,
    type_description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    
    -- Type-specific configuration
    requires_advance_notice_hours INTEGER DEFAULT 0,
    requires_special_resources BOOLEAN DEFAULT FALSE,
    resource_requirements TEXT,
    
    -- Questions to ask when this type is selected
    intake_questions JSONB, -- Array of question objects
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate types per category
    UNIQUE(category_id, type_name),
    
    INDEX idx_assistance_types_category (category_id),
    INDEX idx_assistance_types_active (is_active)
);
```

### 4. Volunteer Resources Table
```sql
CREATE TABLE volunteer_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    volunteer_name VARCHAR(255) NOT NULL,
    volunteer_email VARCHAR(255),
    volunteer_phone VARCHAR(20),
    
    -- Availability
    available_dates JSONB, -- Array of date ranges
    available_times JSONB, -- Time preferences
    max_assignments_per_day INTEGER DEFAULT 5,
    
    -- Capabilities
    assistance_categories JSONB, -- Array of category IDs they can help with
    geographic_areas JSONB, -- ZIP codes or areas they can serve
    has_vehicle BOOLEAN DEFAULT FALSE,
    vehicle_capacity INTEGER,
    speaks_languages JSONB, -- Array of language codes
    accessibility_equipped BOOLEAN DEFAULT FALSE,
    
    -- Contact preferences
    preferred_contact_method VARCHAR(20) DEFAULT 'EMAIL', -- 'EMAIL', 'PHONE', 'TEXT'
    advance_notice_hours INTEGER DEFAULT 24,
    
    -- Performance tracking
    assignments_completed INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2),
    last_active_date DATE,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_volunteer_resources_active (is_active),
    INDEX idx_volunteer_resources_vehicle (has_vehicle),
    INDEX idx_volunteer_resources_accessibility (accessibility_equipped)
);
```

### 5. Assistance Assignments Table
```sql
CREATE TABLE assistance_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assistance_need_id UUID NOT NULL REFERENCES voter_assistance_needs(id) ON DELETE CASCADE,
    volunteer_id UUID NOT NULL REFERENCES volunteer_resources(id),
    
    -- Assignment details
    assigned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scheduled_date TIMESTAMP WITH TIME ZONE,
    estimated_duration_minutes INTEGER,
    
    -- Status tracking
    status VARCHAR(30) DEFAULT 'ASSIGNED', -- 'ASSIGNED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
    volunteer_confirmed BOOLEAN DEFAULT FALSE,
    voter_confirmed BOOLEAN DEFAULT FALSE,
    
    -- Completion tracking
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    actual_duration_minutes INTEGER,
    
    -- Feedback
    volunteer_notes TEXT,
    voter_feedback TEXT,
    success_rating INTEGER CHECK (success_rating >= 1 AND success_rating <= 5),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_assistance_assignments_need (assistance_need_id),
    INDEX idx_assistance_assignments_volunteer (volunteer_id),
    INDEX idx_assistance_assignments_status (status),
    INDEX idx_assistance_assignments_scheduled (scheduled_date)
);
```

## API Design

### 1. Assistance Categories Management
```typescript
// Get available assistance categories for a campaign
GET /api/campaigns/[id]/assistance-categories

// Create custom assistance category
POST /api/campaigns/[id]/assistance-categories
{
    categoryName: string;
    description?: string;
    requiresVolunteerAssignment: boolean;
    defaultPriorityLevel: number;
    estimatedTimeMinutes?: number;
    customFields?: CustomField[];
}

// Get assistance types for a category
GET /api/assistance-categories/[id]/types

// Create custom assistance type
POST /api/assistance-categories/[id]/types
{
    typeName: string;
    description?: string;
    requiresAdvanceNoticeHours: number;
    resourceRequirements?: string;
    intakeQuestions?: Question[];
}
```

### 2. Voter Assistance Needs
```typescript
// Record assistance need during voter contact
POST /api/voter-assistance-needs
{
    voterRegistrationNumber: string;
    campaignId: string;
    assistanceCategory: string;
    assistanceType: string;
    priorityLevel: number;
    description?: string;
    discoveredDuringContactId?: string;
    customFieldData?: Record<string, any>;
}

// Get assistance needs for a voter
GET /api/voters/[registrationNumber]/assistance-needs

// Get assistance needs for a campaign
GET /api/campaigns/[id]/assistance-needs?status=IDENTIFIED&priority=1,2

// Update assistance need status
PUT /api/voter-assistance-needs/[id]
{
    status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    assignedTo?: string;
    completionNotes?: string;
    assistanceSuccessful?: boolean;
    voterVoted?: boolean;
}
```

### 3. Volunteer Resource Management
```typescript
// Register volunteer resource
POST /api/volunteer-resources
{
    volunteerName: string;
    volunteerEmail: string;
    volunteerPhone?: string;
    availableDates: DateRange[];
    availableTimes: TimeRange[];
    assistanceCategories: string[];
    geographicAreas: string[];
    hasVehicle: boolean;
    vehicleCapacity?: number;
    speaksLanguages: string[];
    accessibilityEquipped: boolean;
}

// Find available volunteers for assistance need
GET /api/volunteer-resources/available?assistanceType=TRANSPORTATION&date=2024-11-05&area=30062

// Get volunteer assignments
GET /api/volunteer-resources/[id]/assignments?status=ASSIGNED
```

### 4. Assignment Coordination
```typescript
// Create assistance assignment
POST /api/assistance-assignments
{
    assistanceNeedId: string;
    volunteerId: string;
    scheduledDate: string;
    estimatedDurationMinutes: number;
}

// Confirm assignment (volunteer or voter)
PUT /api/assistance-assignments/[id]/confirm
{
    confirmedBy: 'VOLUNTEER' | 'VOTER';
    notes?: string;
}

// Complete assignment
PUT /api/assistance-assignments/[id]/complete
{
    actualDurationMinutes: number;
    volunteerNotes?: string;
    voterFeedback?: string;
    successRating: number;
    voterVoted: boolean;
}
```

## Flexible Configuration System

### 1. Default Assistance Categories
```typescript
const DEFAULT_ASSISTANCE_CATEGORIES = [
    {
        name: "Transportation",
        description: "Rides to polling locations",
        types: [
            { name: "Ride to Polls", requiresAdvanceNoticeHours: 2 },
            { name: "Ride from Work", requiresAdvanceNoticeHours: 4 },
            { name: "Accessible Vehicle", requiresAdvanceNoticeHours: 24 }
        ]
    },
    {
        name: "Voter ID",
        description: "Assistance with identification requirements",
        types: [
            { name: "ID Information", requiresAdvanceNoticeHours: 0 },
            { name: "Help Obtaining ID", requiresAdvanceNoticeHours: 72 },
            { name: "Provisional Ballot Info", requiresAdvanceNoticeHours: 0 }
        ]
    },
    {
        name: "Polling Information",
        description: "Location and procedure information",
        types: [
            { name: "Polling Location", requiresAdvanceNoticeHours: 0 },
            { name: "Ballot Information", requiresAdvanceNoticeHours: 0 },
            { name: "Voting Procedures", requiresAdvanceNoticeHours: 0 }
        ]
    },
    {
        name: "Accessibility",
        description: "Accommodations for voters with disabilities",
        types: [
            { name: "Wheelchair Access", requiresAdvanceNoticeHours: 0 },
            { name: "Language Assistance", requiresAdvanceNoticeHours: 2 },
            { name: "Vision/Hearing Assistance", requiresAdvanceNoticeHours: 0 }
        ]
    },
    {
        name: "Work/Schedule",
        description: "Employment-related voting barriers",
        types: [
            { name: "Time Off Rights", requiresAdvanceNoticeHours: 0 },
            { name: "Early Voting Info", requiresAdvanceNoticeHours: 0 },
            { name: "Absentee Ballot", requiresAdvanceNoticeHours: 48 }
        ]
    },
    {
        name: "Childcare",
        description: "Assistance with childcare during voting",
        types: [
            { name: "Polling Place Childcare", requiresAdvanceNoticeHours: 4 },
            { name: "Babysitting Service", requiresAdvanceNoticeHours: 24 },
            { name: "Family Voting Info", requiresAdvanceNoticeHours: 0 }
        ]
    }
];
```

### 2. Custom Field Definitions
```typescript
interface CustomField {
    fieldName: string;
    fieldType: 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'SELECT' | 'MULTISELECT';
    label: string;
    required: boolean;
    options?: string[]; // For SELECT/MULTISELECT types
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
    };
}

// Example: Transportation category custom fields
const TRANSPORTATION_CUSTOM_FIELDS: CustomField[] = [
    {
        fieldName: "pickup_address",
        fieldType: "TEXT",
        label: "Pickup Address",
        required: true
    },
    {
        fieldName: "mobility_assistance",
        fieldType: "SELECT",
        label: "Mobility Assistance Needed",
        required: false,
        options: ["None", "Walker", "Wheelchair", "Cane", "Other"]
    },
    {
        fieldName: "preferred_pickup_time",
        fieldType: "TEXT",
        label: "Preferred Pickup Time",
        required: false
    },
    {
        fieldName: "return_trip_needed",
        fieldType: "BOOLEAN",
        label: "Return Trip Needed",
        required: true
    }
];
```

## Frontend Integration

### 1. Enhanced Voter Contact Form
```typescript
const VoterContactForm = ({ voter, campaign }: Props) => {
    const [assistanceNeeds, setAssistanceNeeds] = useState<AssistanceNeed[]>([]);
    const { assistanceCategories } = useAssistanceCategories(campaign.id);
    
    const handleAddAssistanceNeed = () => {
        setAssistanceNeeds([...assistanceNeeds, {
            category: '',
            type: '',
            priority: 3,
            description: '',
            customFields: {}
        }]);
    };
    
    return (
        <form onSubmit={handleSubmit}>
            {/* Existing contact form fields */}
            
            <div className="space-y-4">
                <h3>Election Day Assistance Needs</h3>
                {assistanceNeeds.map((need, index) => (
                    <AssistanceNeedInput
                        key={index}
                        need={need}
                        categories={assistanceCategories}
                        onChange={(updatedNeed) => {
                            const updated = [...assistanceNeeds];
                            updated[index] = updatedNeed;
                            setAssistanceNeeds(updated);
                        }}
                        onRemove={() => {
                            setAssistanceNeeds(assistanceNeeds.filter((_, i) => i !== index));
                        }}
                    />
                ))}
                <Button type="button" onClick={handleAddAssistanceNeed}>
                    Add Assistance Need
                </Button>
            </div>
        </form>
    );
};
```

### 2. Assistance Need Input Component
```typescript
const AssistanceNeedInput = ({ need, categories, onChange, onRemove }: Props) => {
    const selectedCategory = categories.find(c => c.name === need.category);
    const availableTypes = selectedCategory?.types || [];
    const customFields = selectedCategory?.customFields || [];
    
    return (
        <Card className="p-4">
            <div className="grid grid-cols-2 gap-4">
                <Select
                    value={need.category}
                    onValueChange={(category) => onChange({ ...need, category, type: '' })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select assistance category" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map(category => (
                            <SelectItem key={category.name} value={category.name}>
                                {category.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                
                <Select
                    value={need.type}
                    onValueChange={(type) => onChange({ ...need, type })}
                    disabled={!need.category}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select assistance type" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableTypes.map(type => (
                            <SelectItem key={type.name} value={type.name}>
                                {type.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            
            <div className="mt-4">
                <Label>Priority Level</Label>
                <Select
                    value={need.priority.toString()}
                    onValueChange={(priority) => onChange({ ...need, priority: parseInt(priority) })}
                >
                    <SelectContent>
                        <SelectItem value="1">Critical (Election Day Emergency)</SelectItem>
                        <SelectItem value="2">High (Needs Immediate Attention)</SelectItem>
                        <SelectItem value="3">Medium (Standard Assistance)</SelectItem>
                        <SelectItem value="4">Low (Information Only)</SelectItem>
                        <SelectItem value="5">Future Reference</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            
            {/* Dynamic custom fields based on selected category */}
            {customFields.map(field => (
                <CustomFieldInput
                    key={field.fieldName}
                    field={field}
                    value={need.customFields[field.fieldName]}
                    onChange={(value) => onChange({
                        ...need,
                        customFields: { ...need.customFields, [field.fieldName]: value }
                    })}
                />
            ))}
            
            <Textarea
                placeholder="Additional details or notes"
                value={need.description}
                onChange={(e) => onChange({ ...need, description: e.target.value })}
                className="mt-4"
            />
            
            <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={onRemove}
                className="mt-2"
            >
                Remove
            </Button>
        </Card>
    );
};
```

### 3. Election Day Assistance Dashboard
```typescript
const ElectionDayDashboard = ({ campaignId }: Props) => {
    const { assistanceNeeds, loading } = useAssistanceNeeds(campaignId);
    const { volunteers } = useVolunteerResources();
    
    const needsByStatus = useMemo(() => {
        return assistanceNeeds.reduce((acc, need) => {
            acc[need.status] = (acc[need.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [assistanceNeeds]);
    
    const criticalNeeds = assistanceNeeds.filter(need => 
        need.priorityLevel <= 2 && need.status === 'IDENTIFIED'
    );
    
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Critical Needs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-600">
                            {criticalNeeds.length}
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Assigned</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-yellow-600">
                            {needsByStatus.ASSIGNED || 0}
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle>In Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-600">
                            {needsByStatus.IN_PROGRESS || 0}
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Completed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600">
                            {needsByStatus.COMPLETED || 0}
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Critical Assistance Needs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <AssistanceNeedsList 
                            needs={criticalNeeds}
                            volunteers={volunteers}
                            onAssign={handleAssignVolunteer}
                        />
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Available Volunteers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <VolunteerAvailabilityList volunteers={volunteers} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
```

## AI Integration for Assistance Prediction

### 1. Predictive Assistance Needs
```typescript
interface AssistancePredictionRequest {
    voterProfile: VoterProfile;
    contactHistory: ContactHistory[];
    demographicFactors: DemographicData;
    geographicFactors: GeographicData;
}

interface AssistancePredictionResponse {
    likelyNeeds: {
        category: string;
        type: string;
        probability: number; // 0-1
        reasoning: string[];
    }[];
    riskFactors: string[];
    recommendedQuestions: string[];
    optimalContactTiming: Date;
}

// Example AI prediction logic
const predictAssistanceNeeds = async (voter: VoterProfile): Promise<AssistancePredictionResponse> => {
    const predictions = [];
    
    // Transportation prediction based on demographics and location
    if (voter.age >= 65 || voter.hasDisability) {
        predictions.push({
            category: "Transportation",
            type: "Ride to Polls",
            probability: 0.7,
            reasoning: ["Age 65+", "Limited mobility indicators"]
        });
    }
    
    // ID requirements prediction
    if (voter.isFirstTimeVoter || voter.hasMovedRecently) {
        predictions.push({
            category: "Voter ID",
            type: "ID Information",
            probability: 0.6,
            reasoning: ["First time voter", "Recent address change"]
        });
    }
    
    // Work schedule conflicts
    if (voter.employmentStatus === 'FULL_TIME' && voter.age < 50) {
        predictions.push({
            category: "Work/Schedule",
            type: "Time Off Rights",
            probability: 0.4,
            reasoning: ["Full-time employment", "Working age"]
        });
    }
    
    return {
        likelyNeeds: predictions,
        riskFactors: extractRiskFactors(voter),
        recommendedQuestions: generateRecommendedQuestions(predictions),
        optimalContactTiming: calculateOptimalTiming(voter)
    };
};
```

## Benefits of This Flexible Design

### 1. **Adaptability**
- **Unknown Challenges**: System can capture new assistance categories as they're discovered
- **Local Variations**: Different campaigns can create location-specific assistance types
- **Evolving Needs**: Easy to add new fields and categories without database changes

### 2. **Comprehensive Tracking**
- **End-to-End Process**: From need identification through successful voting
- **Resource Coordination**: Match needs with available volunteer resources
- **Impact Measurement**: Track correlation between assistance and voter turnout

### 3. **AI Enhancement**
- **Predictive Identification**: AI suggests likely assistance needs during voter contacts
- **Resource Optimization**: AI recommendations for volunteer deployment
- **Success Prediction**: Forecast which assistance efforts will have highest impact

### 4. **Integration Benefits**
- **Contact History**: Assistance needs discovered during regular voter outreach
- **Voter Profiles**: Complete assistance history visible on voter profile pages
- **Campaign Analytics**: Assistance effectiveness metrics integrated with campaign reporting

This flexible design ensures the system can adapt to whatever Election Day challenges emerge while providing comprehensive tracking and coordination capabilities to maximize voter turnout. 