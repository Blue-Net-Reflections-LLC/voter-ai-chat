# Contacted Voters in List View - Demo Documentation

## Overview
This document demonstrates how contacted voters appear in the Voter List page with enhanced campaign status indicators.

## Campaign Status Column Visibility

### When No Campaign is Selected:
- The "Campaign Status" column is **hidden**
- Table shows only: Full Name, County, Resident Address, Score, Status
- Column widths are adjusted to use the full available space

### When a Campaign is Selected:
- The "Campaign Status" column **appears** with a pulsing blue indicator
- Shows the selected campaign name in the header tooltip
- Table shows: Full Name, County, Resident Address, Score, Campaign Status, Status
- Column widths are adjusted to accommodate the new column

## Prototype Demo Behavior

### First 10 Voters (Contacted):
When a campaign is selected, the **first 10 voters** in the list are automatically shown as contacted with realistic data:

1. **Voter 1**: 📞 Phone (10/15/2024) - "Committed to vote" ✅ Positive
2. **Voter 2**: 🚪 Door (10/16/2024) - "Very engaged" ✅ Positive  
3. **Voter 3**: 💬 Text (10/14/2024) - "Acknowledged message" 🔵 Neutral
4. **Voter 4**: 📧 Email (10/17/2024) - "Requested voting info" ✅ Positive
5. **Voter 5**: 📞 Phone (10/13/2024) - "Email opened" 🔵 Neutral
6. **Voter 6**: 🚪 Door (10/16/2024) - "Long conversation" ✅ Positive
7. **Voter 7**: 💬 Text (10/17/2024) - "Confirmed voting plan" ✅ Positive
8. **Voter 8**: 📧 Email (10/15/2024) - "Not interested" 🔴 Negative
9. **Voter 9**: 📞 Phone (10/14/2024) - "Brief conversation" 🔵 Neutral
10. **Voter 10**: 🚪 Door (10/16/2024) - "Enthusiastic supporter" ✅ Positive

### Voters 11-12 (Pending):
- **Voter 11**: ⏰ Pending contact
- **Voter 12**: ⏰ Pending contact

### Remaining Voters (Not Contacted):
- **Voter 13+**: "Not Contacted" status

## Visual Enhancements for Contacted Voters

### Campaign Status Column
The "Campaign Status" column shows detailed information for contacted voters:

#### Contacted Voters Display:
- **Status Badge**: Color-coded based on sentiment
  - 🟢 **Green**: Positive sentiment (committed voters, enthusiastic supporters)
  - 🔵 **Blue**: Neutral sentiment (acknowledged contact, brief interactions)
  - 🔴 **Red**: Negative sentiment (not interested, declined)

- **Contact Method Icons**:
  - 📞 **Phone**: Phone bank calls
  - 🚪 **Door**: Door-to-door canvassing
  - 💬 **Text**: SMS/Text messaging
  - 📧 **Email**: Email campaigns

- **Contact Date**: Shows when the voter was last contacted
- **Contact Notes**: Brief summary of the interaction (truncated with hover tooltip)

## Campaign Integration Features

### Campaign Selection
- Users can select an active campaign from the Campaign Selector in the filter panel
- Campaign context persists across all voter pages
- "Add to Campaign" button appears when filters are applied and a campaign is selected

### Real-time Status Updates
- Campaign status loads asynchronously via simulated XHR calls
- Loading indicators show while status is being fetched
- Status updates reflect the selected campaign context

### Contact Method Tracking
The system tracks multiple contact methods per voter:
- **Phone Banking**: Traditional phone calls with sentiment tracking
- **Door-to-Door**: Canvassing with detailed interaction notes
- **Digital Outreach**: Email and SMS with engagement metrics
- **Multi-touch Campaigns**: Voters can have multiple contact attempts

## Technical Implementation

### Dynamic Column Display
```typescript
// Campaign Status column only shows when campaign is selected
{selectedCampaign && (
  <TableHead>Campaign Status</TableHead>
)}

// Adjust column widths based on campaign selection
width: selectedCampaign ? '25%' : '30%'
```

### Prototype Data Logic
```typescript
// First 10 voters are contacted when campaign is selected
if (selectedCampaign) {
  const voterNumber = parseInt(voterId.replace('voter-', ''));
  if (voterNumber <= 10) {
    // Show as contacted with realistic data
  } else if (voterNumber <= 12) {
    // Show as pending
  } else {
    // Show as not contacted
  }
}
```

### Mock Data Structure
```typescript
{
  status: 'contacted' | 'pending' | 'not_contacted';
  campaignName?: string;
  contactDate?: string;
  contactMethod?: 'phone' | 'door' | 'text' | 'email';
  sentiment?: 'positive' | 'neutral' | 'negative';
  notes?: string;
}
```

## User Experience Benefits

1. **Clean Interface**: Campaign Status column only appears when relevant
2. **Quick Visual Scanning**: Users can immediately identify contacted voters
3. **Contact Method Recognition**: Icons help identify successful outreach channels
4. **Sentiment Tracking**: Color coding shows voter engagement levels
5. **Historical Context**: Contact dates provide timeline information
6. **Campaign Integration**: Seamless workflow from filtering to campaign management

## Demo Instructions

To see contacted voters in action:

1. Navigate to `/ga/voter/list`
2. **Without Campaign**: Notice the Campaign Status column is hidden
3. **Select a Campaign**: Click "Select" in the Campaign Selector
4. **Choose any campaign**: GOTV Drive 2024, Phone Bank October, or Canvassing Cobb County
5. **Observe Changes**:
   - Campaign Status column appears with pulsing blue indicator
   - First 10 voters show as contacted with different methods and sentiments
   - Voters 11-12 show as pending
   - Remaining voters show as "Not Contacted"
6. **Apply Filters**: The contacted status persists regardless of filters applied

## Stakeholder Demo Points

1. **Progressive Disclosure**: Interface adapts based on campaign selection
2. **Realistic Data**: First 10 voters show varied contact methods and outcomes
3. **Visual Hierarchy**: Color coding makes engagement levels immediately apparent
4. **Scalable Design**: System handles both campaign and non-campaign workflows
5. **Performance**: Async loading with visual feedback for better UX

The enhanced visual indicators and dynamic column display make it easy to identify which voters have been successfully contacted and their level of engagement with the campaign, while maintaining a clean interface when campaign tracking is not needed. 