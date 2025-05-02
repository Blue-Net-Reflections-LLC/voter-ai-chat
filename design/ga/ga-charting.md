# Charting Requirements

## Objective

Integrate an interactive charting capability as a new tab within the Georgia voter exploration tool. This will allow users to visualize aggregations and distributions within the currently filtered voter dataset based on selectable dimensions.

## UI Components

1.  **Charts Tab:**
    *   A new primary tab labeled "Charts" accessible at `/ga/voter/charts`.
    *   This tab will share the main sidebar filter context with the List, Stats, and Map tabs.
2.  **Chart Configuration Panel:**
    *   A dedicated panel/section displayed prominently on the Charts tab (e.g., above or beside the chart area).
    *   **Controls:**
        *   **Dimension (Group By):** Dropdown/Select list to choose the primary category for the chart's x-axis or segments (e.g., Race, Gender, Status, County, Party Affiliation, Participation Score Range).
        *   **Breakdown (Optional):** Dropdown/Select list to choose a secondary dimension for grouping/stacking within the primary dimension (e.g., break down Race by Age Range, or County by Status). Initially, might be limited or optional.
        *   **Metric (Measure):** Dropdown/Select list to choose what value is being plotted on the y-axis.
            *   Initial Requirement: "Count of Voters".
            *   Future Possibilities: "Average Participation Score", "Turnout % (if data available)".
        *   **Chart Type:** Select list or buttons to choose the visualization type (e.g., Vertical Bar, Horizontal Bar, Pie/Donut).
3.  **Chart Display Area:**
    *   The main area where the selected chart type is rendered using the configured dimensions and data.
    *   Must include clear axes labels and a title reflecting the current configuration.
4.  **Loading / Error / No Data States:**
    *   Visual indicators when chart data is loading.
    *   Clear messages if an error occurs during data fetching.
    *   A message indicating "No data matches the current filters" if the result set is empty.

## Functional Requirements

1.  **Filter Integration:** The data used for chart generation **must** always be filtered by the active selections in the main sidebar filter panel. Changes in the sidebar filters should trigger a chart data refresh.
2.  **Dynamic Configuration:** Changing any selection in the Chart Configuration Panel (Dimension, Metric, Chart Type, Breakdown) should dynamically update the chart display and fetch new data if necessary.
3.  **Initial State:** Define a sensible default chart configuration (e.g., Count of Voters by Status as a Bar Chart).
4.  **Supported Dimensions (Initial):**
    *   Status
    *   Race
    *   Gender
    *   County
    *   Party Affiliation (e.g., `last_party_voted`)
    *   Participation Score Range (using the labels like "Power Voter")
    *   Age Range (Requires backend logic to bucket `birth_year`)
    *   Election (Year / Type) (Requires historical participation data)
5.  **Supported Metrics (Initial):**
    *   Count of Voters (`COUNT(*)`)
    *   Average Participation Score (`AVG(participation_score)`)
6.  **Supported Chart Types (Initial):**
    *   Vertical Bar Chart
    *   Horizontal Bar Chart
    *   Pie Chart (Consider limiting use for dimensions with few categories, e.g., Gender, Status)
    *   Line Chart / Multi-Line Chart
7.  **Tooltips:** Hovering over chart elements (bars, pie slices, line points) should display a tooltip showing the category/date and exact value.

## Example Scenario (User Request)

1.  User selects "Age Range" = "18-23" and "25-44" in the **Sidebar Filter**.
2.  User goes to the **Charts Tab**.
3.  In the **Chart Configuration Panel**:
    *   Selects Dimension = "Race".
    *   Selects Metric = "Count of Voters".
    *   Selects Breakdown = "Age Range".
    *   Selects Chart Type = "Grouped Vertical Bar Chart".
4.  The **Chart Display Area** shows a grouped bar chart.
    *   X-axis categories are the distinct Races present in the filtered data (e.g., White, Black, Asian, Other).
    *   For each Race category, there are two bars side-by-side: one for the count of voters aged 18-23 and one for voters aged 25-44 within that race.
    *   Y-axis represents the Count of Voters.

## Example Scenario (Stakeholder Request - Historical Trend)

1.  User selects filters in the **Sidebar Filter** (e.g., County = "Fulton").
2.  User goes to the **Charts Tab**.
3.  In the **Chart Configuration Panel**:
    *   Selects Dimension = "Election" (representing specific Election Year+Type, e.g., "GEN 2020", "PRI 2022", "GEN 2022").
    *   Selects Metric = "Count of Voters".
    *   Selects Breakdown = "Race".
    *   Selects Chart Type = "Multi-Line Chart".
4.  The **Chart Display Area** shows a multi-line chart.
    *   X-axis represents Elections (e.g., "GEN 2020", "PRI 2022", "GEN 2022").
    *   Y-axis represents the Count of Voters.
    *   There is a separate colored line for each Race selected in the breakdown (e.g., one line for White voters count, one line for Black voters count across the selected elections).

## Data API Requirements

1.  **Endpoint:** `/api/ga/voter/chart-data` (Method: GET)
2.  **Request Parameters:**
    *   All existing sidebar filter parameters (derived from `buildVoterListWhereClause`).
    *   `dimension`: The primary field to group by (e.g., `race`, `status`).
    *   `metric`: The aggregation function (e.g., `count`, `avg_score`).
    *   `breakdown` (Optional): The secondary field to group/stack by.
    *   `ageBuckets` (Optional): If dimension or breakdown is 'Age Range', provide the definitions (e.g., `['18-24', '25-34', ...]`)
    *   `scoreBuckets` (Optional): If dimension or breakdown is 'Score Range', provide the definitions (min/max/label).
3.  **Backend Logic:**
    *   Apply sidebar filters using `buildVoterListWhereClause`.
    *   Construct a `GROUP BY` SQL query based on `dimension` and `breakdown` parameters.
    *   Use the appropriate SQL aggregate function (`COUNT(*)`, `AVG(participation_score)`) based on the `metric` parameter.
    *   Handle bucketing for Age/Score if specified as a dimension/breakdown.
    *   **Crucially, if dimension/breakdown involves historical election data, logic must query/unnest/aggregate based on historical participation records (e.g., `voting_events` JSONB or `participated_election_years` array), not just current voter status.**
4.  **Response Format:** Return JSON data suitable for the charting library, e.g.:
    *   For simple bar/pie: `[{ category: 'Active', value: 5000 }, { category: 'Inactive', value: 2000 }]`
    *   For grouped bar: `[{ category: 'White', age_18_23: 100, age_25_44: 500 }, { category: 'Black', age_18_23: 80, age_25_44: 400 }]`
    *   For multi-line: `[{ election: 'GEN 2020', White: 1500, Black: 1200 }, { election: 'GEN 2022', White: 1600, Black: 1350 }]` (Format depends heavily on library choice).

## Technical Requirements

1.  **Charting Library:** Recommend **Recharts** due to its React-centric nature and good integration possibilities, or **Tremor** if aiming for a quick dashboard style compatible with Tailwind/Shadcn. (Decision to be finalized).
2.  **State Management:** Chart configuration state needs to be managed within the Charts tab components. Consider URL persistence for shareable chart views (optional initial).

## Non-Requirements (Initially)

*   Saving/naming user-defined charts.
*   Exporting charts as images/data.
*   Advanced chart types (scatter plots, heatmaps, etc.).
*   Real-time chart updates (beyond filter/config changes).

## Task List

**Phase 1: Setup & Proof of Concept (POC)**

*   [ ] **Task:** Install Charting Library (`pnpm install recharts`).
*   [ ] **Task:** Create Charts Page (`app/ga/voter/charts/page.tsx`).
*   [ ] **Task:** Create Mock Data File (`components/ga/voter/charts/MockChartData.ts`) with sample data for:
    *   [ ] Count by Race (Bar Chart)
    *   [ ] Count by Race, grouped by Age Range (Grouped Bar Chart)
    *   [ ] Count by Election, grouped by Race (Line Chart)
*   [ ] **Task:** Create POC Chart Component (`components/ga/voter/charts/ChartPOC.tsx`).
*   [ ] **Task:** Implement Recharts rendering in POC using mock data:
    *   [ ] Bar Chart Example.
    *   [ ] Grouped Bar Chart Example.
    *   [ ] Multi-Line Chart Example.
*   [ ] **Task:** Add basic controls (buttons/select) to `ChartPOC.tsx` to switch between chart examples.
*   [ ] **Task:** Render `ChartPOC` component (client-side) within `app/ga/voter/charts/page.tsx`.
*   [ ] **Task:** Review POC with stakeholders/team and incorporate feedback into requirements/design before proceeding.

**Phase 2: Backend API Development**

*   [ ] **Task:** Create API route file (`app/api/ga/voter/chart-data/route.ts`).
*   [ ] **Task:** Implement basic GET handler structure.
*   [ ] **Task:** Integrate `buildVoterListWhereClause` to apply sidebar filters.
*   [ ] **Task:** Parse and handle chart configuration request parameters (`dimension`, `metric`, `breakdown`).
*   [ ] **Task:** Implement dynamic SQL `GROUP BY` logic based on `dimension` (and `breakdown` if provided).
*   [ ] **Task:** Implement SQL aggregation logic for `metric` = `count` (`COUNT(*)`).
*   [ ] **Task:** Implement SQL aggregation logic for `metric` = `avg_score` (`AVG(participation_score)`).
*   [ ] **Task:** Implement backend logic for Age Range bucketing when dimension/breakdown = 'Age Range'.
*   [ ] **Task:** Implement backend logic for Score Range bucketing when dimension/breakdown = 'Score Range' (using imported `SCORE_RANGES`).
*   [ ] **Task:** *(Stretch/Complex)* Implement backend logic for historical election aggregation (querying/unnesting `voting_events` or similar) when dimension/breakdown = 'Election'.
*   [ ] **Task:** Format API response JSON appropriately for different chart data structures.
*   [ ] **Task:** Implement robust error handling.

**Phase 3: Frontend Integration**

*   [ ] **Task:** Create Chart Configuration Panel component (`components/ga/voter/charts/ChartConfigPanel.tsx`).
*   [ ] **Task:** Add controls (Select components from Shadcn UI) for Dimension, Metric, Breakdown, Chart Type.
    *   [ ] Populate Dimension/Breakdown options dynamically or from constants.
*   [ ] **Task:** Manage chart configuration state within the Charts page/context.
*   [ ] **Task:** Integrate `ChartConfigPanel` into `app/ga/voter/charts/page.tsx` (replacing POC controls).
*   [ ] **Task:** Create Chart Display component (`components/ga/voter/charts/ChartDisplay.tsx`).
*   [ ] **Task:** Implement data fetching logic within `ChartDisplay` (or parent page) to call `/api/ga/voter/chart-data` based on sidebar filters and chart config.
*   [ ] **Task:** Implement Loading, Error, and No Data states for the chart area.
*   [ ] **Task:** Pass fetched data and configuration to Recharts components within `ChartDisplay`.
*   [ ] **Task:** Implement rendering logic for different chart types (Bar, Grouped Bar, Line) using Recharts based on selected type.
*   [ ] **Task:** Configure Recharts Tooltips, Axes (dynamic labels), Legend.
*   [ ] **Task:** Integrate `ChartDisplay` into `app/ga/voter/charts/page.tsx` (replacing `ChartPOC`).

**Phase 4: Refinement & Testing**

*   [ ] **Task:** Test various filter and chart configuration combinations.
*   [ ] **Task:** Test edge cases (no data, single data point, etc.).
*   [ ] **Task:** Optimize API query performance for complex groupings/filters.
*   [ ] **Task:** Refine chart aesthetics (colors, fonts, layout) for consistency with app theme.
*   [ ] **Task:** Ensure responsiveness and test on different screen sizes.
*   [ ] **Task:** Cross-browser testing.
*   [ ] **Task:** Update documentation (README, comments).
*   [ ] **Task:** Final code review.

