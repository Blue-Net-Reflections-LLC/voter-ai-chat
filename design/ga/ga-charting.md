# Participation Score Over Time Chart Requirements (Postpone due to very small variances)

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

# Demographic Ratio Over Time Chart Requirements

This document outlines requirements for a chart visualizing the ratio of specific voter demographic subgroups among participating voters, tracked by election year.

## Overview
- **Goal:** Analyze how the demographic composition of participating voters changes over time based on selected filter criteria.
- **Chart Type:** Multi-line chart.
- **Location:** `/ga/voter/charts` (Requires sub-navigation).
- **Technology:** Recharts.

## Chart Axes & Data
- **X-Axis:** Election Year (derived from voter's participation history in `voting_events`).
- **Y-Axis:** ✅ Ratio (Proportion), displayed as 0-100% (rather than 0.0-1.0 for better readability).
- **Calculation:** For a given election year (Y), the Y-value for a specific line (representing a filter combination) is:
  `Ratio = COUNT(DISTINCT voters matching Combination C who participated in Year Y) / COUNT(DISTINCT total voters who participated in Year Y)`

## Filtering & Line Generation
- **No Filters:** ✅ If no filter options are selected, the chart area displays a message prompting the user to select at least one filter.
- **Allowed Filter Categories:** ✅ Lines are generated based ONLY on selections within these categories:
    - `county` (from `v.county_name`)
    - `congressionalDistricts` (from `v.congressional_district`)
    - `stateSenateDistricts` (from `v.state_senate_district`)
    - `stateHouseDistricts` (from `v.state_house_district`)
    - `status` (from `v.status`)
    - `statusReason` (from `v.status_reason`)
    - `eventParty` (from `event ->> 'party'` in `v.voting_events`)
    - `ageRange` (derived from `v.birth_year`)
    - `gender` (from `v.gender`)
    - `race` (from `v.race`)
    - `electionType` (from `event ->> 'election_type'` in `v.voting_events`)
    - `ballotStyle` (from `event ->> 'ballot_style'` in `v.voting_events`)
- **Invalid Filters:** ✅ If any *other* filter parameter is present in the URL, the API returns an error (400) indicating which filters are invalid for this chart.
- **Line Generation Logic (Cartesian Product):** ✅ Implemented
    - When multiple filter options are selected *across different allowed categories*, the chart generates lines for **all possible combinations** of those selections.
    - *Example 1:* `race=White,Black` & `gender=Male` -> 2 lines: (White, Male Ratio), (Black, Male Ratio).
    - *Example 2:* `race=White,Black` & `gender=Male,Female` -> 4 lines: (White, Male), (White, Female), (Black, Male), (Black, Female).
    - *Example 3:* `race=White` -> 1 line: (White Ratio).
- **Line Limit:** ✅ There is no hard limit on the number of lines generated by the API, and the frontend properly handles line toggling.

## API Endpoint (`/api/ga/voter/chart-data`)
- **`chartType` Parameter:** ✅ Validates `demographicRatioOverTime`.
- **Functionality:** ✅ All implemented
    1. Validate `chartType`.
    2. Validate that only allowed filter keys are present.
    3. Check if any allowed filters have selected values. If not, return 400 ("Please select filters...").
    4. Generate the list of filter combinations based on selected values (Cartesian product).
    5. Dynamically build SQL queries for each combination.
    6. Execute the queries.
    7. Process results: Calculate the ratio for each combination in each year.
    8. Return data in the specified format.
- **Response Format:** ✅ Implemented as specified
  ```json
  {
    "years": [Number], // Array of years with participation data
    "series": [
      {
        "name": String, // Descriptive label (e.g., "Race: White, Gender: Male")
        "filters": Object, // The filter combination for this line (e.g., { race: "White", gender: "Male" })
        "data": [Number | null] // Array of ratios corresponding to the 'years' array
      }
      // ... more series objects
    ]
  }
  ```
  *Or, if no filters selected:* `{ "message": "Please select filter options..." }`
  *Or, if invalid filters present:* `{ "error": "Invalid filter...", "allowedFilters": [...] }`

## Frontend Chart Component (`DemographicRatioChart.tsx`)
- ✅ Created `DemographicRatioChart.tsx`
- ✅ Fetches data from the API using `chartType=demographicRatioOverTime` and current filters
- ✅ Handles API responses: Displays message if no filters selected, displays error if invalid filters used, renders chart if data received
- ✅ Renders lines based on the `series` array from the API
    - Uses `series[i].name` for legend labels
    - Uses `series[i].data` for line Y-values
- ✅ Enhanced line toggling via custom legend component
- ✅ Displays X-axis (Election Year) and Y-axis (Percentage 0-100%)

## Additional Enhancements Beyond Original Requirements
- ✅ **Auto-Scaling Toggle:** Added a switch to enable/disable Y-axis auto-scaling for better visualization of small variances
- ✅ **Enhanced Legend:** Implemented a custom legend component that:
  - Provides clear visual feedback for active/inactive lines
  - Maintains clickability for all lines, even when hidden
  - Uses strikethrough and reduced opacity to indicate hidden lines
- ✅ **Optimized Data Fetching:** Added fetch cancellation to prevent race conditions when filters change rapidly
- ✅ **Improved Y-Axis Display:** Enhanced calculation to provide clean, rounded values that properly represent visible data

## Relevant Code/References
- **Primary Data Table:** `ga_voter_registration_list` (contains demographics, `voting_events` JSONB)
- **Migrations:**
    - `lib/ga-voter-registration/migrations/0001_create_ga_voter_registration_list.sql`
    - `lib/ga-voter-registration/migrations/0011_add_voting_events_jsonb.sql`
- **Filter Components:** `app/ga/voter/list/components/FilterPanel.tsx`
- **Filter Context:** `app/ga/voter/VoterFilterProvider.tsx`
- **Filter Constants:** `app/ga/voter/list/constants.ts` (for dropdown options)
- **DB Connection:** `@/lib/voter/db` (used by API)

## Implementation Tasks

*   [✅] **API Endpoint (`/api/ga/voter/chart-data`):**
    *   [✅] Update route handler (`route.ts`) for `chartType=demographicRatioOverTime`.
    *   [✅] Implement filter key validation (check against `ALLOWED_COMBO_FILTER_KEYS`).
    *   [✅] Implement check for selected filter options.
    *   [✅] Implement Cartesian product logic to generate filter combinations.
    *   [✅] Implement query execution for each combination:
        *   [✅] Use shared `buildVoterListWhereClause` for consistent filtering.
        *   [✅] Convert filter values to uppercase to match database values.
        *   [✅] Properly construct SQL for each combination.
    *   [✅] Execute the queries using `sql.unsafe`.
    *   [✅] Implement result processing:
        *   [✅] Calculate ratios (handling division by zero).
        *   [✅] Structure data into the specified `years` and `series` format.
    *   [✅] Handle error responses (invalid filters, no selections).
*   [✅] **Frontend Chart Component (`DemographicRatioChart.tsx`):**
    *   [✅] Create `DemographicRatioChart.tsx`.
    *   [✅] Fetch data based on current filters.
    *   [✅] Render lines based on `series` data.
    *   [✅] Implement and enhance legend click handler for line toggling.
    *   [✅] Adjust Y-axis to represent percentages (0-100%).
    *   [✅] Add auto-scaling toggle feature.
    *   [✅] Implement loading and error states.
*   [✅] **Frontend Page (`/ga/voter/charts/page.tsx`):**
    *   [✅] Create page component with chart.
    *   [✅] Enable and link the "Chart" tab in the main voter section navigation.
    *   [✅] Implement tab navigation for future chart types.
    *   [✅] Display proper filter indication.
*   [✅] **Performance Optimization:**
    *   [✅] Implement fetch cancellation for rapid filter changes.
    *   [✅] Add memoization for total voter counts to reduce query time.
    *   [✅] Optimize data structure for chart rendering.
*   [✅] **Styling & Testing:**
    *   [✅] Add clean, consistent styling.
    *   [✅] Verify functionality across various filter combinations.
    *   [✅] Fix bugs in Y-axis calculation and legend toggling.

# Counts over Time Chart
The chart will use the same grouping logic as the Demographic Ratio ove time but it will count the total voters in a give given year.

It will also have a bar and pie chart 

# Voter Counts Over Time Chart Requirements

This document outlines requirements for a chart visualizing the absolute number of participating voters for specific demographic subgroups, tracked by election year.

## Overview
- **Goal:** Analyze how the absolute number of participating voters within specific demographic groups changes over time, based on selected filter criteria. This complements the Ratio chart by showing scale.
- **Chart Type:** User-selectable view: Multi-line, Grouped Bar, or Stacked Area chart.
- **Location:** `/ga/voter/charts` (using the same sub-navigation as the Ratio chart).
- **Technology:** Recharts.

## Chart Axes & Data
- **X-Axis:** Election Year (derived from voter's participation history in `voting_events`).
- **Y-Axis:** Voter Count (absolute number).
- **Calculation:** For a given election year (Y), the Y-value for a specific line (representing a filter combination C) is:
  `Count = COUNT(DISTINCT voters matching Combination C who participated in Year Y)`

## Filtering & Line Generation
- **Filter Logic:** Identical to the "Demographic Ratio Over Time" chart.
- **No Filters:** If no filter options are selected from the allowed categories, the chart area displays a message prompting the user to select at least one filter.
- **Allowed Filter Categories:** Lines are generated based ONLY on selections within these categories:
    - `county` (from `v.county_name`)
    - `congressionalDistricts` (from `v.congressional_district`)
    - `stateSenateDistricts` (from `v.state_senate_district`)
    - `stateHouseDistricts` (from `v.state_house_district`)
    - `status` (from `v.status`)
    - `statusReason` (from `v.status_reason`)
    - `eventParty` (from `event ->> 'party'` in `v.voting_events`)
    - `ageRange` (derived from `v.birth_year`)
    - `gender` (from `v.gender`)
    - `race` (from `v.race`)
    - `electionType` (from `event ->> 'election_type'` in `v.voting_events`)
    - `ballotStyle` (from `event ->> 'ballot_style'` in `v.voting_events`)
- **Invalid Filters:** If any *other* filter parameter is present in the URL, the API returns an error (400) indicating which filters are invalid for this chart type.
- **Line Generation Logic (Cartesian Product):** Identical to the Ratio chart.
    - Generates lines for all possible combinations of selected values across different allowed categories.
- **Line Limit:** No hard limit imposed by the API. Frontend handles toggling.

## API Endpoint (`/api/ga/voter/chart-data`)
- **`chartType` Parameter:** Needs a new value, e.g., `voterCountsOverTime`.
- **Functionality:** Largely the same as `demographicRatioOverTime`, except for the final calculation:
    1. Validate `chartType`.
    2. Validate that only allowed filter keys are present.
    3. Check if any allowed filters have selected values. If not, return 400 ("Please select filters...").
    4. Generate the list of filter combinations based on selected values (Cartesian product).
    5. Dynamically build SQL queries for each combination to get counts per year. *Crucially, this does NOT need the total voter count per year query required by the Ratio chart, simplifying the logic.*
    6. Execute the queries.
    7. Process results: Aggregate the counts for each combination in each year.
    8. Return data in a similar format to the Ratio chart.
- **Response Format:**
  ```json
  {
    "years": [Number], // Array of years with participation data
    "series": [
      {
        "name": String, // Descriptive label (e.g., "Race: White, Gender: Male")
        "filters": Object, // The filter combination for this line (e.g., { race: "White", gender: "Male" })
        "data": [Number | null] // Array of *counts* corresponding to the 'years' array
      }
      // ... more series objects
    ]
  }
  ```
  *Or, if no filters selected:* `{ "message": "Please select filter options..." }`
  *Or, if invalid filters present:* `{ "error": "Invalid filter...", "allowedFilters": [...] }`

## Frontend Chart Component (`VoterCountsChart.tsx`)
- Create a new component `VoterCountsChart.tsx`.
- Implement a UI switcher (e.g., tabs or segmented control) to select between "Line", "Bar" (Grouped), and "Area" (Stacked) chart views.
- Fetches data from the API using `chartType=voterCountsOverTime` and current filters (data is the same for all three views).
- Handles API responses (no filters, invalid filters, data).
- Renders the selected chart type based on the `series` array from the API:
    - **Line:** Multiple lines, one per series.
    - **Bar:** Grouped bars for each year, one bar per series within the group.
    - **Area:** Stacked areas, one area per series.
- Uses `series[i].name` for legend labels/tooltips across all views.
- Uses `series[i].data` for Y-values (absolute counts) across all views.
- Implement line/bar/area toggling using the same custom legend component as the Ratio chart (legend interaction hides/shows the corresponding series in the active view).
- Displays X-axis (Election Year) and Y-axis (Voter Count).
- Implement loading and error states.
- Consider adding the Y-axis Auto-Scaling toggle, applicable to all views.

## Relevant Code/References
- (Same as Demographic Ratio Over Time chart, as the underlying data and filtering logic are largely shared)

## Implementation Tasks (Adaptation from Ratio Chart)

*   [ ] **API Endpoint (`/api/ga/voter/chart-data`):**
    *   [ ] Update route handler (`route.ts`) to accept `chartType=voterCountsOverTime`.
    *   [ ] Reuse filter validation logic.
    *   [ ] Reuse Cartesian product logic.
    *   [ ] Adapt query generation: Only need the count for the specific combination per year (no total needed).
    *   [ ] Implement result processing for counts.
    *   [ ] Ensure consistent error handling.
*   [ ] **Frontend Chart Component (`VoterCountsChart.tsx`):**
    *   [ ] Create `VoterCountsChart.tsx`.
    *   [ ] Implement UI switcher for Line, Grouped Bar, Stacked Area views.
    *   [ ] Implement data fetching logic for the `chartType=voterCountsOverTime`.
    *   [ ] Implement rendering logic for Line view using Recharts.
    *   [ ] Implement rendering logic for Grouped Bar view using Recharts.
    *   [ ] Implement rendering logic for Stacked Area view using Recharts.
    *   [ ] Configure Recharts for count-based Y-axis.
    *   [ ] Reuse or adapt the legend component for series toggling across views.
    *   [ ] Implement loading/error states.
    *   [ ] Consider adding the auto-scaling toggle.
*   [ ] **Frontend Page (`/ga/voter/charts/page.tsx`):**
    *   [ ] Add state/logic to switch between displaying the Ratio chart and the Counts chart (e.g., using tabs within the charts page).
    *   [ ] Ensure the Counts chart component (`VoterCountsChart.tsx`) is rendered when selected.
    *   [ ] Ensure filter context updates trigger re-fetch for the *active* chart.
*   [ ] **Styling & Testing:**
    *   [ ] Ensure consistent styling across chart views and with the Ratio chart.
    *   [ ] Test with various filter combinations.
    *   [ ] Test switching between Ratio and Counts charts.
    *   [ ] Test switching between Line, Bar, and Area views within the Counts chart.

## Bar/Pie Chart Note
- The mention of Bar and Pie charts needs further definition. Are they:
    1.  Alternative views *of the Counts Over Time data* (e.g., showing counts for the *latest* year as a pie/bar)?
    2.  Separate charts entirely with different goals/data?
- This requirement document focuses on the multi-line "Counts Over Time" chart first. The bar/pie charts should be specified separately once their purpose is clear.



