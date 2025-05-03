# Participation Score Over Time Chart Requirements

This document outlines the requirements for the initial chart displaying voter participation scores over time by election type.

## Overview
- **Goal:** Track and visualize the average participation score for various election types over a defined time period (2004-2025).
- **Chart Type:** Multi-line chart.
- **Location:** `/ga/voter/charts` (Requires a sub-navigation layout to accommodate future charts).
- **Technology:** Use Recharts library for implementation.

## Data & API
- **Data Source:** Calculate average participation scores from voter election history.
- **API Endpoint:** Create a new endpoint at `/api/ga/voter/chart-data`.
    - It should accept a `chartType` query parameter. For this chart, the expected value is `participationOverTime`. The API should validate this parameter.
    - It should also accept filter parameters (derived from the `FilterPanel`).
- **Aggregation:**
    - Each line represents the average participation score for a specific election type per year.
    - If multiple elections of the same type occur within a single year, the score for that year is the *average* across those elections.
- **Handling Missing Data:** Lines on the chart should connect across years where an election type did not occur (e.g., connect 2020 'GENERAL' point to 2024 'GENERAL' point).

## Chart Axes
- **X-axis:** Years from 2004 to 2025.
- **Y-axis:** Participation score, ranging from 1.0 to 10.0.

## Interactivity & Filtering
- **Default View:** On initial load, display lines only for 'GENERAL' and 'GENERAL PRIMARY' election types.
- **Line Toggling:** Users must be able to toggle the visibility of lines for any election type (likely via the chart legend).
- **Filter Integration:**
    - The chart must consider filters selected in the `FilterPanel` (using `VoterFilterProvider` context).
    - When filters are applied, the chart data should be recalculated and the chart redrawn based on the filtered voter subset.
    - By default (no filters applied), the chart represents data for all voters.
- **Filter Indication:** When filters are active, update a label or legend element near the chart to clearly state that the displayed data is based on a filtered subset.

## Relevant Code/References
- **Participation Score Logic:** `design/ga/participation-score.md`
- **Database Schema:** `lib/ga-voter-registration/migrations/0001_create_ga_voter_registration_list.sql`
- **Filter Components:** `app/ga/voter/list/components/FilterPanel.tsx`
- **Filter Context/Logic:** `app/ga/voter/VoterFilterProvider.tsx`, `lib/voter/build-where-clause.ts`
- **Election Types:** Defined in `constants.ts`:
  ```typescript
  export const ELECTION_TYPE_OPTIONS = [
    { value: 'GENERAL', label: 'GENERAL' },
    { value: 'GENERAL ELECTION RUNOFF', label: 'GENERAL ELECTION RUNOFF' },
    { value: 'GENERAL PRIMARY', label: 'GENERAL PRIMARY' },
    // ... other types ...
  ];
  ```
- **Related Design:** `design/ga/voter-profile-requirements.md`

## Location

Route:  http://localhost:3000/ga/voter/charts
API: http://localhost:3000/api/ga/voter/chart-data

## UI
- Use Recharts
- 

## Implementation Tasks

*   [ ] **API Endpoint (`/api/ga/voter/chart-data`):**
    *   [ ] Define route handler (`app/api/ga/voter/chart-data/route.ts`).
    *   [ ] Accept and validate `chartType` query parameter (expect `participationOverTime` initially).
    *   [ ] Accept and process filter query parameters.
    *   [ ] Implement database query for participation scores by year and election type (driven by `chartType`).
    *   [ ] Implement aggregation logic (average score per type per year).
    *   [ ] Implement logic to connect data points across missing years.
    *   [ ] Integrate filter logic using `build-where-clause.ts` and query parameters.
    *   [ ] Define and return JSON structure.
*   [ ] **Frontend Route & Layout (`/ga/voter/charts`):**
    *   [ ] Create page component (`app/ga/voter/charts/page.tsx`).
    *   [ ] Enable and link the "Chart" tab in the main voter section navigation.
    *   [ ] Implement sub-navigation layout.
*   [ ] **Chart Component (`ParticipationChart.tsx`):**
    *   [ ] Create component file (e.g., `components/charts/ParticipationChart.tsx`).
    *   [ ] Fetch data from the `/api/ga/voter/chart-data` endpoint.
    *   [ ] Configure Recharts component with X (Year) and Y (Score) axes.
    *   [ ] Render lines based on fetched data.
    *   [ ] Implement default view (show 'GENERAL' and 'GENERAL PRIMARY' only).
    *   [ ] Implement line toggling via legend interaction.
    *   [ ] Connect to `VoterFilterProvider` to react to filter changes.
    *   [ ] Implement filter indication (label/legend update).
*   [ ] **Database:**
    *   [ ] Verify/add necessary database indexes for efficient querying.
*   [ ] **Styling & Testing:**
    *   [ ] Add appropriate styling to the chart and layout.
    *   [ ] Write API tests.
    *   [ ] Write component tests.

