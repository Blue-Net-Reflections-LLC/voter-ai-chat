# Google Stitch UI Design Prompts
## Voter Sentiment Tracking System

This document contains detailed prompts for Google Stitch (https://stitch.withgoogle.com/) to generate UI mockups for stakeholder brainstorming sessions.

---

## 1. Campaign Management Dashboard

**Context & Requirements:**
This dashboard serves as the central hub for organizing and managing voter outreach campaigns. It must support multiple campaign types (GOTV, phone banks, canvassing, mail, digital) and integrate with existing voter filtering capabilities. Key business rules include preventing duplicate voter assignments across filter results, tracking campaign progress in real-time, and providing comprehensive analytics for campaign optimization.

**Required Functionality:**
- Campaign creation and management (REQ-3.1.1.1, REQ-3.1.1.2)
- Integration with existing voter filtering system (REQ-3.1.1.3)
- Real-time progress tracking and analytics
- Team member assignment to geographic areas or voter lists
- Campaign performance reporting and metrics
- Support for multiple filter results within single campaigns

```
Create a modern web dashboard for campaign management with dark theme similar to existing voter platform. Include:

Header: "Campaign Dashboard" with navigation tabs (Active Campaigns, Analytics, Volunteers, Reports)

Main content area with:
- Campaign creation card with "New Campaign" button and campaign type dropdown (Phone Bank, Canvassing, GOTV, Mail, Digital)
- Active campaigns grid showing 3-4 campaign cards, each displaying:
  * Campaign name and type
  * Progress bar showing contact completion (e.g., "1,247 of 2,500 contacts")
  * Key metrics: "Positive Responses: 68%", "Volunteers: 12", "Days Remaining: 8"
  * Status indicator (Active/Paused)
  * Quick action buttons (View Details, Analytics, Manage)
- Filter integration indicator showing "3 Filter Results" or "Using: Age 18-35, Cobb County"

Sidebar with:
- Quick stats cards showing total voters contacted, response rate, volunteer hours
- Recent activity feed showing contact attempts and outcomes
- Upcoming deadlines and campaign milestones
- Alert panel for duplicate contact warnings

Footer toolbar:
- Bulk campaign actions (Pause All, Export Data, Generate Reports)
- System status indicators (Last sync, Active volunteers)

Use professional blue/green color scheme with clean typography and card-based layout. Include visual indicators for campaign health and progress status.
```

---

## 1.1. Create New Campaign Interface

**Context & Requirements:**
Campaign creation interface that allows users to set up new voter outreach campaigns with comprehensive configuration options. Must integrate with existing voter filtering system to build target lists and support multiple campaign types with specific settings for each type.

**Required Functionality:**
- Campaign type selection with type-specific configuration (REQ-3.1.1.1)
- Integration with FilterPanel for voter list creation (REQ-3.1.1.3)
- Goal setting, timeline management, and team assignment (REQ-3.1.1.2)
- Contact frequency and compliance settings (REQ-3.1.2.3)
- Volunteer assignment and territory management

```
Create a comprehensive campaign creation form with modern, step-by-step wizard design. Dark theme consistent with voter platform.

Header: "Create New Campaign" with progress indicator showing steps (1. Basic Info, 2. Target Voters, 3. Team Setup, 4. Settings, 5. Review)

Step 1 - Basic Information:
- Campaign name input field
- Campaign type selection with large cards (Phone Bank, Door-to-Door Canvassing, GOTV Drive, Mail Campaign, Digital Outreach)
- Each type card shows icon, description, and typical timeline
- Campaign description text area
- Start and end date pickers
- Campaign goals section with target metrics (Total contacts, Response rate goal, Volunteer hours)

Step 2 - Target Voters:
- "Use Existing Filter" button that opens FilterPanel integration
- Display selected filter results: "Age 18-35, Cobb County - 2,847 voters"
- Option to "Add Additional Filters" showing multiple filter result cards
- Voter preview table showing sample of selected voters
- Total target count: "4,293 voters across 3 filter results"
- Estimated contact time calculator

Step 3 - Team Setup:
- Campaign manager assignment dropdown
- Volunteer recruitment section with invite options
- Territory assignment map showing geographic divisions
- Team member roles and permissions settings
- Contact assignment strategy (Geographic, Random, Skill-based)

Step 4 - Campaign Settings:
- Contact frequency limits (Max contacts per voter, Days between attempts)
- Compliance settings (Do-not-call integration, TCPA compliance for texts)
- Script generation preferences (Tone, Key messages, Candidate focus)
- Reporting and analytics preferences
- Integration settings (CRM sync, Export options)

Step 5 - Review & Launch:
- Campaign summary with all settings
- Estimated timeline and resource requirements
- Pre-launch checklist (Scripts ready, Volunteers assigned, Compliance verified)
- "Launch Campaign" and "Save as Draft" buttons

Use clean wizard styling with clear navigation, validation indicators, and helpful tooltips throughout.
```

---

## 1.2. Campaign Details & Management Interface

**Context & Requirements:**
Detailed campaign management interface for monitoring and controlling active campaigns. Must provide comprehensive oversight of contact progress, volunteer performance, and campaign effectiveness while allowing real-time adjustments to strategy and assignments.

**Required Functionality:**
- Real-time campaign progress monitoring (REQ-3.1.1.2)
- Contact tracking across multiple channels (REQ-3.1.2.1, REQ-3.1.2.2)
- Volunteer management and assignment (REQ-3.5.1.1)
- Contact quality control and compliance monitoring (REQ-3.5.2.1, REQ-3.5.2.2)
- Campaign analytics and performance reporting (REQ-3.7.4.1)

```
Design a comprehensive campaign details dashboard for active campaign management. Dark theme with data-rich layout.

Header: Campaign name "GOTV Drive 2024" with status badge (Active), edit button, and action menu (Pause, Clone, Archive, Export)

Top metrics row with 6 KPI cards:
- Total Contacts: 1,247 / 2,500 (49.9% with progress bar)
- Positive Responses: 68% (trending up arrow)
- Active Volunteers: 12 / 15 assigned
- Avg Response Time: 2.3 hours
- Contact Success Rate: 73%
- Days Remaining: 8 (with urgency indicator)

Main content in tabbed sections:

Overview Tab:
- Campaign timeline with milestones and current progress
- Recent activity feed showing live contact updates
- Performance trends chart (contacts per day, response rates)
- Alert panel showing issues requiring attention

Voters Tab:
- Filter results breakdown showing "3 Active Filter Results"
- Voter list table with contact status, last attempt, sentiment, assigned volunteer
- Bulk actions toolbar (Assign volunteers, Export list, Mark priority)
- Search and additional filtering options
- Contact attempt history per voter

Volunteers Tab:
- Volunteer performance grid showing productivity metrics
- Territory assignments map with volunteer locations
- Individual volunteer detail cards (contacts made, success rate, hours worked)
- Volunteer assignment tools and workload balancing
- Training materials and communication tools

Analytics Tab:
- Contact method effectiveness comparison (phone vs door vs email)
- Response sentiment analysis with geographic breakdown
- Volunteer productivity rankings and coaching recommendations
- Campaign ROI and efficiency metrics
- Predictive analytics showing projected completion date

Settings Tab:
- Contact frequency and compliance settings
- Script management and AI generation preferences
- Team permissions and access controls
- Integration and export configurations
- Campaign modification history

Right sidebar:
- Quick actions panel (Add contact, Assign volunteer, Generate report)
- Campaign health score with recommendations
- Upcoming deadlines and reminders
- Recent volunteer check-ins
- Emergency contact information

Use professional dashboard styling with clear data hierarchy, interactive charts, and actionable insights throughout.
```

---

## 2. Enhanced Voter Profile Page with Contact Tracking

```
Design a voter profile page extension showing contact tracking integration. Dark theme with modern card layout.

Top section: Voter header with name "SOPHIA ROSEMARIE REID", photo placeholder, and key info (Age: 48, Status: ACTIVE, Score: 8.9)

Main content in tabbed sections:
- Voter Info tab (existing)
- NEW "Contact History" tab prominently displayed
- Voting History tab
- Districts tab
- Census Data tab

Contact History tab content:
- Timeline view showing contact attempts with icons for phone, email, door-to-door
- Each contact entry shows: Date, Method, Volunteer name, Outcome, Sentiment indicator
- "Add New Contact" button prominently placed
- AI-generated script section with personalized talking points
- Contact preferences and restrictions panel

Right sidebar:
- Contact summary stats (Total contacts: 4, Last contact: 3 days ago, Response rate: 75%)
- Quick action buttons (Schedule Contact, Mark Do Not Contact, Generate Script)
- Assistance needs alerts if any

Use existing voter platform styling with green accent colors for positive interactions, red for negative
```

---

## 3. Contact Logging Form

```
Create a contact logging form modal/overlay for recording voter interactions. Modern, mobile-friendly design.

Form title: "Log Voter Contact - Sophia Reid"

Form sections:
1. Contact Details:
   - Contact method dropdown (Phone Call, Text, Email, Door Visit, Event)
   - Date/time picker (defaulted to now)
   - Duration field for calls/visits
   - Volunteer name field

2. Contact Outcome:
   - Radio buttons for outcome (Successful conversation, No answer, Wrong number, Hostile response, Supportive response, Callback requested)
   - Sentiment slider from Negative to Positive
   - Voting likelihood dropdown (Very Likely, Likely, Undecided, Unlikely, Very Unlikely)

3. Conversation Details:
   - Large text area for notes
   - Issue tags (checkboxes for Healthcare, Economy, Education, etc.)
   - Follow-up required checkbox with date picker

4. AI Assistance:
   - "Generate Summary" button to AI-analyze notes
   - Suggested tags based on conversation content

Bottom: Save Contact button (primary) and Cancel button
Use clean form styling with proper spacing and validation indicators
```

---

## 4. Election Day Assistance Dashboard

```
Design an Election Day assistance coordination dashboard with real-time monitoring feel.

Header: "Election Day Assistance Command Center" with live clock and "Election Day - November 5, 2024"

Top metrics row with 4 cards:
- Critical Needs (red): 23
- Assigned (yellow): 67
- In Progress (blue): 45
- Completed (green): 156

Main content in 2-column layout:

Left column - "Critical Assistance Needs":
- List of urgent requests with priority indicators
- Each item shows: Voter name, assistance type (Transportation, ID Help, etc.), location, time needed
- "Assign Volunteer" buttons
- Filter options (Transportation, ID Requirements, Accessibility, etc.)

Right column - "Available Volunteers":
- List of volunteers with status indicators (Available, Busy, Off Duty)
- Each showing: Name, location, capabilities (Has vehicle, Speaks Spanish, etc.)
- Quick assignment buttons

Bottom section: Map view showing assistance requests and volunteer locations with color-coded pins

Use emergency/command center styling with high contrast colors and clear status indicators
```

---

## 5. AI Script Generation Interface

```
Create an AI script generation interface for personalized voter conversations.

Header: "AI-Generated Script for Sophia Reid" with voter photo and key details

Left panel - Voter Context:
- Voting history summary (Frequent voter, last voted 2024)
- Demographics (Age 48, Female, Black)
- Location info (Cobb County, District info)
- Previous conversation topics
- Issues of interest

Center panel - Generated Script:
- Greeting section with personalized opener
- Key talking points organized by topic
- Voting encouragement based on history
- Local candidate information
- Closing with next steps

Right panel - Script Controls:
- Regenerate button
- Customize tone dropdown (Formal, Friendly, Urgent)
- Contact method tabs (Phone, Door, Text, Email)
- Performance metrics from similar scripts
- Save/Export options

Bottom: Feedback section to rate script effectiveness after use

Use clean, readable typography with clear section divisions and professional color scheme
```

---

## 6. Campaign Analytics Dashboard

```
Design a comprehensive campaign analytics dashboard with data visualization focus.

Header: "Campaign Analytics - GOTV 2024" with date range selector

Top KPI row:
- Contact Coverage: 78% (with progress bar)
- Response Rate: 64% (trending up)
- Volunteer Productivity: 23 contacts/hour avg
- AI Prediction Accuracy: 87%

Main content in grid layout:

Chart section:
- Contact volume over time (line chart)
- Response sentiment breakdown (pie chart)
- Geographic coverage map with heat zones
- Volunteer performance comparison (bar chart)

Tables section:
- Top performing volunteers
- Most effective contact methods
- Emerging voter concerns (AI-detected trends)
- Assistance needs by category

Right sidebar:
- AI Insights panel with recommendations
- Alerts for concerning trends
- Quick action items
- Export/share options

Use data visualization best practices with clear legends, tooltips, and professional dashboard styling
```

---

## 7. Mobile Contact App Interface

```
Design a mobile-first contact logging app for field canvassers. Clean, thumb-friendly interface.

Header: Voter name "Sophia Reid" with address and quick info

Main screen sections:
- Large contact method buttons (Call, Text, Door Knock, Email) with icons
- Quick outcome buttons (Positive, Neutral, Negative, No Answer)
- Voice-to-text note recording button
- Photo capture for door hangers/materials left

Quick actions:
- "Mark as Do Not Contact" toggle
- "Schedule Follow-up" with date picker
- "Request Assistance" for voter needs
- GPS location confirmation

Bottom navigation:
- Current voter info
- Next voter in route
- Campaign progress
- Sync status indicator

Use large touch targets, high contrast text, and offline-capable design patterns
```

---

## 8. Volunteer Assignment Interface

```
Create a volunteer management interface for assigning contacts and territories.

Header: "Volunteer Assignment - GOTV Campaign 2024"

Left panel - Available Volunteers:
- List with volunteer photos, names, and status
- Skills indicators (Bilingual, Has car, Experienced, etc.)
- Availability schedule grid
- Performance metrics (Contacts/hour, Success rate)

Center panel - Territory Map:
- Interactive map showing voter locations
- Color-coded by contact priority (High, Medium, Low)
- Volunteer assignment overlays
- Route optimization suggestions

Right panel - Assignment Tools:
- Drag-and-drop voter assignment
- Auto-assign based on proximity/skills
- Workload balancing indicators
- Time estimates for routes

Bottom toolbar:
- Bulk assignment tools
- Export assignments to mobile
- Send notifications to volunteers
- Save assignment templates

Use intuitive drag-drop interactions with clear visual feedback
```

---

## 9. Real-Time Campaign Monitor

```
Design a real-time campaign monitoring dashboard for election day operations.

Header: "Live Campaign Monitor - Election Day 2024" with countdown timer

Top status bar:
- Polls open/close status
- Weather alerts
- System health indicators
- Active volunteers count

Main grid layout:

Live Activity Feed:
- Real-time contact updates scrolling
- Volunteer check-ins
- Assistance requests
- Issue reports

Geographic Overview:
- Live map with volunteer locations
- Polling place status indicators
- Traffic/accessibility alerts
- Assistance dispatch tracking

Performance Metrics:
- Contacts per hour trending
- Response rate by time of day
- Volunteer productivity rankings
- Assistance fulfillment rates

Alert Panel:
- Critical issues requiring attention
- Volunteer emergency contacts
- Polling place problems
- System notifications

Use mission-critical styling with clear alert hierarchies and real-time data indicators
```

---

## 10. AI Insights Dashboard

```
Create an AI-powered insights dashboard showing predictive analytics and recommendations.

Header: "AI Campaign Insights" with confidence score indicator

Main sections:

Predictive Models Panel:
- Voter turnout forecast with confidence intervals
- Persuadability scores by demographic
- Optimal contact timing recommendations
- Resource allocation suggestions

Sentiment Analysis:
- Real-time sentiment trending
- Issue importance heatmap
- Geographic sentiment variations
- Conversation topic clustering

Performance Optimization:
- Script effectiveness rankings
- Volunteer coaching recommendations
- Contact method optimization
- Territory rebalancing suggestions

Strategic Recommendations:
- AI-generated action items
- Risk alerts and mitigation strategies
- Opportunity identification
- Resource reallocation advice

Use modern data visualization with AI/ML styling cues (gradients, neural network aesthetics)
```

---

## Usage Instructions for Stitch

### Getting Started:
1. Visit https://stitch.withgoogle.com/
2. Copy and paste one prompt at a time
3. Generate the initial design
4. Use the iteration features to refine based on stakeholder feedback

### Best Practices:
- **Start with the Campaign Dashboard** - It provides the best overview for stakeholders
- **Generate 2-3 variations** of each design to show different approaches
- **Focus on user workflows** - Show how the interfaces connect together
- **Use realistic data** - Include actual voter names and believable metrics
- **Maintain consistency** - Reference the existing dark theme and styling

### Stakeholder Presentation Tips:
- Present designs in user journey order (Dashboard → Voter Profile → Contact Form → Analytics)
- Explain how each interface addresses specific requirements from the business document
- Highlight AI-powered features and their benefits
- Show mobile and desktop versions for field vs. office use
- Gather feedback on layout, functionality, and missing features

### Iteration Strategy:
1. **First Round**: Generate all 10 designs for complete system overview
2. **Second Round**: Refine 3-4 key interfaces based on stakeholder priorities
3. **Third Round**: Create detailed variations showing different user scenarios
4. **Final Round**: Polish the most important interfaces for development handoff

These prompts will help create compelling visual representations of the Voter Sentiment Tracking System that stakeholders can easily understand and provide feedback on. 