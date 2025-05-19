# Georgia Voter Turnout Analysis Feature

## 1. Overview and Goals

This document outlines the requirements for a new Voter Turnout analysis feature for the Georgia region. The primary goal is to provide users with tools to analyze voter participation across various geographies, election dates, and demographic breakdowns, complemented by optional census data overlays. This feature will replace any existing chart functionalities in the `/ga/voter/charts` section with a new, more comprehensive section at `/ga/voter/turnout`.

## 2. User Interface (UI) / User Experience (UX) Requirements

### 2.1. Initial View & Controls
- When navigating to `/ga/voter/turnout`, the user will be presented with selection controls for:
    - Geography
    - Election Date
    - Data Points for Breakdown (Turnout Dimensions)
    - Option to include Census Data
- A clear Call to Action (CTA) button (e.g., "Generate Report & Chart") will be present to execute the query based on user selections.
- No data or charts will be displayed by default until the user makes selections and executes the query.

### 2.2. Geography Selection
- Users must be able to select a single geographical area for analysis.
- Supported geographical levels:
  - County
  - Districts
    - Precincts (available for selection only when a County is selected)
    - Municipalities (available for selection only when a County is selected)
    - Zip Code (can be a subset of a County, District, Precinct, or Municipality)

### 2.3. Election Date Selection
- Users must select a single election date for analysis.
- A predefined list of historical Georgia election dates will be available for selection.
  ```
  ELECTION_DATES = ["2024-12-03", "2024-11-05", ..., "2004-01-04"]; // (Full list as provided)
  ```

### 2.4. Data Point Selection (Turnout Dimensions for Breakdown)
- Users can select one or more "Turnout Dimensions" to break down the data:
    - Race
    - Gender
    - Age Range (see Data Definitions for categories)
- For **Reporting**: Users can select up to three turnout dimensions simultaneously.
- For **Charting (MVP)**: Users can select only one turnout dimension.

### 2.5. Census Data Inclusion
- Users will have an option (e.g., a checkbox) to include relevant census data in the report.
- If selected, aggregated census metrics will be displayed alongside turnout data for the chosen geographies.

### 2.6. Report Display
- Reports will be displayed in a tabular format.
- Columns will dynamically adjust based on selected geography, data points, and census data inclusion.
- See "Functional Requirements - Reporting" for details on report content.

### 2.7. Chart Display (MVP)
- Charts will be displayed below or alongside the report.
- See "Functional Requirements - Charting (MVP)" for details on chart types and behavior.

### 2.8. Data Export
- Users must be able to download the generated report as an Excel/CSV file.
- Users must be able to download the generated chart as an SVG or PNG file.

### 2.9. URL Parameters
- All user selections (geography, election date, data points, census inclusion) must persist in the URL as query parameters to ensure reports and charts are bookmarkable and shareable.

### 2.10. Detailed UI Layout and Components (Report & Chart View)

This section outlines the proposed visual structure and key UI components for the Voter Turnout Analysis page.

**Overall Page Structure:**
- A main title for the page, e.g., "Georgia Voter Turnout Analysis".
- A two-column layout or a prominent top section for controls, with the main area below for displaying the report and chart once generated.

**A. Controls Section:**
   - This section will contain all user-selectable filters and the action button.
   - **A1. Geography Selection:**
      - **Control 1: "Area Type" Dropdown:**
         - Options: "County", "District", "Zip Code".
         - Selection here populates/enables Control 2.
      - **Control 2: "Select Specific Area" Dropdown/Searchable Select:**
         - Populated based on "Area Type" selection (e.g., list of counties, districts, or zip codes).
      - **Control 3: "Sub-Area Type (Optional)" Dropdown (Conditional):**
         - Appears if "Area Type" is "County".
         - Options: "Precinct", "Municipality".
         - Selection here populates/enables Control 4.
      - **Control 4: "Select Specific Sub-Area" Dropdown/Searchable Select (Conditional):**
         - Appears if a "Sub-Area Type" is selected.
         - Populated based on the selected County and Sub-Area Type.
   - **A2. Election Date Selection:**
      - **Control: "Select Election Date" Dropdown:**
         - Single-select, populated with the predefined `ELECTION_DATES` list.
   - **A3. Data Point Breakdown Selection:**
      - **For Reporting (Multi-Select):**
         - **Control: "Report Data Points" Multi-Select Dropdown or Checkbox Group:**
           - Options: "Race", "Gender", "Age Range".
           - User can select 0 to 3 options.
      - **For Charting (MVP - Single-Select):**
         - **Control: "Chart Data Point" Dropdown:**
           - Options: "Race", "Gender", "Age Range".
           - User can select 0 or 1 option. (If 0, a basic turnout chart is shown).
   - **A4. Census Data Inclusion:**
      - **Control: "Include Census Data" Checkbox.**
   - **A5. Action Button:**
      - **Button: "Generate Report & Chart"**
         - Becomes active/clickable once minimum required selections are made (e.g., Geography and Election Date).
         - Triggers data fetching and display of the Report and Chart sections.

**B. Results Section (Displayed after "Generate" is clicked):**
   - This section will be dynamically populated.
   - **B1. Report Display Area:**
      - **Header:** e.g., "Voter Turnout Report"
      - **Download Button:** "Download Report (CSV/Excel)"
      - **Table Component:**
         - Dynamically generated columns based on user selections (geography level, data point breakdowns, census data).
         - Rows representing individual geographical units (e.g., precincts within a selected county).
         - Data cells showing counts, turnout rates (%), and census metrics.
         - A footer row in the table for aggregations: "Average Turnout Rate" and "Total Voters (Participated)".
   - **B2. Chart Display Area (MVP):**
      - **Header:** e.g., "Voter Turnout Chart"
      - **Download Buttons:** "Download Chart (SVG)", "Download Chart (PNG)"
      - **Chart Component:**
         - Displays the appropriate chart (standard horizontal bar or row stacked horizontal bar) based on the "Chart Data Point" selection.
         - Interactive elements (e.g., tooltips on hover for chart segments/bars showing exact values) are desirable.

**C. Styling and Behavior:**
   - Responsive design to ensure usability on various screen sizes.
   - Loading indicators while data is being fetched and processed.
   - Clear error message display area for any issues encountered during data retrieval or processing.
   - Consistent styling with the rest of the application, leveraging existing UI component libraries (e.g., ShadCN/UI if applicable).

## 3. Functional Requirements - Reporting

### 3.1. Core Metrics Calculation
- **Turnout Rate (Overall for a selected region/geography):**
  `(Total voters who participated in the selected election in the region) / (Total registered voters in the region for that election)`
- **System must always display total registered voters** in the selected region/geography.

### 3.2. Breakdown by Single Turnout Dimension (Race, Gender, Age-Range)
- If one turnout dimension is selected (e.g., Race):
    - The report will include columns for each category within that dimension (e.g., White, Black, etc.).
    - For each category:
        - `[Category] Registered Voters`: Count of registered voters in that category for the selected region/election.
        - `[Category] Voters Voted`: Count of voters in that category who participated.
        - `[Category] Turnout Rate`: `([Category] Voters Voted) / ([Category] Registered Voters)`.

### 3.3. Breakdown by Multiple Turnout Dimensions (Cartesian Product)
- If multiple (up to 3) turnout dimensions are selected (e.g., Age-Range AND Race):
    - The report will include columns for the Cartesian product of the selected dimensions' categories (e.g., "18-23 & Black", "18-23 & White", "25-44 & Black", etc.).
    - For each combination:
        - `[Combination] Registered Voters`: Count of registered voters in that combined demographic for the selected region/election.
        - `[Combination] Voters Voted`: Count of voters in that combination who participated.
        - `[Combination] Turnout Rate`: `([Combination] Voters Voted) / ([Combination] Registered Voters)`.

### 3.4. Census Data Integration
- If the "Include Census Data" option is selected:
    - The report will include additional columns displaying aggregated census metrics for each geographical row.
    - Examples: Average Median Household Income, Average Pct Bachelors Degree Or Higher, etc. (as defined in "Data Definitions").
    - These are contextual metrics about the area and are not used to calculate voter turnout rates directly for census categories.
    - The system will *not* display "total voters who participated" broken down by census categories (e.g., no "Voters Voted in X Income Bracket").

### 3.5. Report Aggregations
- The system will calculate and display:
    - **Average Turnout Rate:** The average of the overall turnout rates for all distinct geographical units included in the report.
    - **Total Voters (Participated):** The sum of voters who participated across all distinct geographical units in the report.

## 4. Functional Requirements - Charting (MVP)

### 4.1. Chart Type: No Data Point Selected
- **Chart Type:** Standard horizontal bar chart.
- **Rows:** Each bar represents a geographical unit from the report.
- **Bar Length:** Represents the **overall turnout rate** (0-100%) for that geographical unit.
- **Sorting:** Bars are sorted by the overall turnout rate, with the geographical unit having the **lowest overall turnout rate** appearing at the top.
- **X-axis:** Percentage (0-100%).

### 4.2. Chart Type: Single Data Point Selected (e.g., Age-Range, Race, or Gender)
- **Chart Type:** Row stacked horizontal bar chart.
- **Rows:** Each bar represents a geographical unit from the report.
- **Segments in each Bar:**
    - Each segment corresponds to a category within the selected data point (e.g., if "Age-Range" is selected, segments for "18-23", "25-44", etc.).
    - The length of each segment directly represents the **turnout rate *within* that specific demographic category** for that geographical unit.
      - Example (Age 18-23 segment): `(Voters aged 18-23 in Location X who voted) / (Registered voters aged 18-23 in Location X)`.
    - The order of segments (and their colors) will be consistent across all bars.
- **Total Length of Bar:** The total length of the stacked bar for a geographical unit is the **sum of the individual turnout rates of its demographic segments**. This sum can exceed 100%.
    - This summed value is referred to as the "Summed Demographic Turnout Rate".
- **Sorting:** Bars (geographical units) are sorted by their "Summed Demographic Turnout Rate", with the geographical unit having the **lowest summed rate** appearing at the top.
- **X-axis:** Percentage. The scale must accommodate values potentially exceeding 100% (e.g., up to 400% or 500% based on observed data).
- **Legend:** Clearly identifies each segment/color with its corresponding demographic category and indicates that it represents the turnout rate for that category.

## 5. Data Definitions

### 5.1. Turnout Dimensions & Categories
- **Race:** Categories to be defined (e.g., White, Black, Hispanic, Asian, Other).
- **Gender:** Categories to be defined (e.g., Male, Female, Unknown/Other).
- **Age Range:**
    - '18-23'
    - '25-44' (Note: `constants.ts` has '25-44', example chart data had '25-44'. Consistency needed.)
    - '45-64'
    - '65-74'
    - '75+'
    *(Based on `app/ga/voter/list/constants.ts` and confirmed by chart data)*

### 5.2. Census Data Points (Examples)
- Average Median Household Income
- Average Percentage Bachelors Degree Only
- Average Percentage Bachelors Degree Or Higher
- Average Labor Force Participation Rate
- Average Unemployment Rate
- Average Employment Rate
- Total Education Population 25 Plus
- Distinct Tract IDs In Geography
- Census Data Source Year
*(These will be derived from `stg_processed_census_tract_data` or similar, aggregated to the chosen geographical level).*

### 5.3. Geographical Areas
- As defined in Section 2.2.

## 6. Technical Requirements

### 6.1. Database Schema
- The system will primarily use data from tables related to voter registration and voter history.
- Refer to migration files for schema details:
    - `lib/ga-voter-history/migrations`
    - `lib/ga-voter-registration/migrations`
- Census data will be sourced from tables like `stg_processed_census_tract_data`.

### 6.2. Performance
- Report and chart generation queries should ideally complete within **1 minute**.

### 6.3. Error Handling
- Implement industry-standard error messaging for:
    - Application-level errors (e.g., invalid selections, no data found).
    - System-level errors (e.g., API failures, database issues).

### 6.4. UI Component Reuse
- Leverage existing UI components from the project's library where possible (refer to `package.json` for available libraries like ShadCN/UI).

### 6.5. Backend API
- New API endpoints will be required to support fetching data for reports and charts based on user selections. These endpoints will encapsulate the complex query logic.

**Proposed Endpoint Design: Voter Turnout Analysis**

**Endpoint:** `POST /api/ga/voter/turnout-analysis`

**Method:** `POST` (Using POST to accommodate potentially complex/numerous filter parameters in the request body)

**Request Body (JSON):**
```json
{
  "geography": {
    "areaType": "County", // "County", "District", "ZipCode"
    "areaValue": "067",   // e.g., County FIPS code, District ID, Zip Code
    "subAreaType": "Precinct", // Optional: "Precinct", "Municipality" (if areaType is "County")
    "subAreaValue": "P001" // Optional: e.g., Precinct ID, Municipality ID
  },
  "electionDate": "2024-11-05", // YYYY-MM-DD format
  "reportDataPoints": ["Race", "AgeRange"], // Array of strings: "Race", "Gender", "AgeRange". Max 3. Empty array if no breakdown.
  "chartDataPoint": "AgeRange", // Single string: "Race", "Gender", "AgeRange", or null/empty for basic turnout chart.
  "includeCensusData": true // boolean
}
```

**Parameters Description:**
*   `geography`: Object defining the selected geographical scope.
    *   `areaType`: The primary level of geography selected.
    *   `areaValue`: The specific value for the selected `areaType`.
    *   `subAreaType` (Optional): If `areaType` is "County", this can specify a finer level like "Precinct" or "Municipality".
    *   `subAreaValue` (Optional): The specific value for the `subAreaType`.
*   `electionDate`: The selected election date.
*   `reportDataPoints`: An array of strings specifying the demographic dimensions for the report's Cartesian product breakdown.
*   `chartDataPoint`: A single string specifying the demographic dimension for the chart's breakdown (MVP). If null or empty, a basic overall turnout chart is expected.
*   `includeCensusData`: Boolean indicating whether to include aggregated census data in the report.

**Response Body (JSON Success Example - Chart by AgeRange, Report by Race & AgeRange):**
```json
{
  "report": {
    "rows": [
      {
        "geoLabel": "Precinct P001 (Cobb County)", // e.g., "Cobb County", "District 5", "Precinct P001", "City of Marietta"
        "totalRegistered": 5000,
        "totalVoted": 3000,
        "overallTurnoutRate": 0.60, // (totalVoted / totalRegistered)
        "breakdowns": { // Cartesian product for reportDataPoints
          "White_18-23_Registered": 100,
          "White_18-23_Voted": 40,
          "White_18-23_Turnout": 0.40,
          "Black_18-23_Registered": 80,
          "Black_18-23_Voted": 30,
          "Black_18-23_Turnout": 0.375,
          // ... other combinations for Race & AgeRange
        },
        "censusData": { // Only if includeCensusData was true
          "avgMedianHouseholdIncome": 75000,
          "avgPctBachelorsOrHigher": 0.45
          // ... other census metrics
        }
      }
      // ... other geographical rows (e.g., multiple precincts if a county was selected and subAreaType was Precinct)
    ],
    "aggregations": {
      "averageOverallTurnoutRate": 0.58, // Average of overallTurnoutRate from all rows
      "grandTotalVoted": 15000 // Sum of totalVoted from all rows
    }
  },
  "chart": { // Data specifically for the selected chartDataPoint
    "type": "stackedRow", // "stackedRow" or "bar" (if no chartDataPoint)
    "rows": [
      {
        "geoLabel": "Precinct P001 (Cobb County)",
        "summedDemographicTurnoutRate": 1.85, // Sum of turnout rates for each age group below
        "segments": [ // One entry per category in chartDataPoint (e.g., AgeRange)
          { "label": "18-23", "turnoutRate": 0.45, "color": "#FF0000" }, // (Voted 18-23 / Registered 18-23)
          { "label": "25-44", "turnoutRate": 0.40, "color": "#00FF00" },
          { "label": "45-64", "turnoutRate": 0.60, "color": "#0000FF" },
          { "label": "65-74", "turnoutRate": 0.25, "color": "#FFFF00" },
          { "label": "75+", "turnoutRate": 0.15, "color": "#FF00FF" }
        ]
      }
      // ... other geographical rows, sorted by summedDemographicTurnoutRate (lowest first)
    ],
    "xAxisMax": 2.50 // Suggested max for X-axis if summed rates can exceed 1.0 (100%)
  },
  "metadata": {
    "requestParameters": { /* echo back the request for reference */ },
    "generatedAt": "2023-10-27T10:30:00Z",
    "notes": "Data prepared for chart sorted by Summed Demographic Turnout Rate."
  }
}
```

**Key aspects of the Response:**
*   **`report.rows`**: Array of objects, each representing a geographical unit.
    *   Includes overall registration, voted counts, and turnout rate for that unit.
    *   `breakdowns`: Contains the Cartesian product results for the selected `reportDataPoints`. Each key is a combination (e.g., "White_18-23"), and the value is an object with registered, voted, and turnout for that specific slice.
    *   `censusData`: Included if requested.
*   **`report.aggregations`**: Summary statistics for the entire report.
*   **`chart.rows`**: Array of objects, each representing a geographical unit, formatted for the chart.
    *   `summedDemographicTurnoutRate`: Crucial for sorting and understanding the bar length in the "summed" stacked bar chart.
    *   `segments`: An array where each object represents a segment in the stacked bar (e.g., one age group), containing its specific turnout rate. This is the turnout *within* that demographic for that location.
*   **`chart.type`**: Indicates to the frontend which chart type to render.
*   **`chart.xAxisMax`**: A hint for the frontend for scaling the X-axis of the summed stacked bar chart.
*   **`metadata`**: Useful for debugging and context.

**Error Response Example:**
```json
{
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Invalid election date format. Expected YYYY-MM-DD.",
    "details": "electionDate: '2023/10/27'"
  }
}
```

## 7. Out of Scope for MVP (Minimum Viable Product)

- **Charting Cartesian Products:** Charts will only support a single selected data point for breakdown in the MVP. Multi-data point (Cartesian product) visualizations are deferred.
- **Advanced User Roles/Permissions:** All users will have the same level of access to this feature in MVP.

## 8. Existing System Considerations (Context)
- This feature replaces charts previously in `/ga/voter/charts`.
- Existing code for charts in that section should be backed up or archived before removal.

## 9. Implementation Task List

This section outlines a high-level list of tasks required to implement the Georgia Voter Turnout Analysis feature.

### 9.1. Backend Development
1.  **API Design & Prototyping:**
    *   Define request/response schemas for the new turnout data endpoint(s).
    *   Consider parameters for geography, election date, selected turnout dimensions (race, gender, age), census inclusion.
2.  **Database Query Development (Core Logic):**
    *   Develop SQL queries or data retrieval logic for fetching registered voters and participated voters based on dynamic geography selections (County, District, Precinct, Municipality, Zip Code) and a selected election date.
    *   Implement logic for calculating overall turnout rates.
3.  **Database Query Development (Turnout Dimension Breakdowns):
    *   Extend queries to handle single turnout dimension breakdowns (Race, Gender, Age Range), providing counts and turnout rates per category.
    *   Implement logic for Cartesian product breakdowns (up to 3 dimensions) for reporting, providing counts and turnout rates per combined category.
4.  **Database Query Development (Charting Data - MVP):
    *   For charts with a single selected data point (e.g., Age Range): Develop queries to calculate turnout rates *within each specific demographic category* for each geographical unit.
    *   Ensure queries can provide data needed to calculate the "Summed Demographic Turnout Rate" for sorting.
    *   For charts with no data point selected: Ensure queries provide overall turnout for each geographical unit.
5.  **Census Data Integration:**
    *   Develop logic to join voter data with aggregated census data (`stg_processed_census_tract_data` or similar) based on the selected geography.
    *   Ensure census metrics are correctly averaged/aggregated to the report's geographical level.
6.  **API Endpoint Implementation:**
    *   Build robust API endpoint(s) that orchestrate the query execution based on input parameters.
    *   Implement data transformation/formatting for the response.
    *   Ensure proper error handling and status codes.
7.  **Performance Optimization:**
    *   Review and optimize all database queries for performance, aiming for the <1 minute SLA.
    *   Consider indexing strategies for relevant tables.

### 9.2. Frontend Development
1.  **Project Setup & Structure:**
    *   Create new route and page components for `/ga/voter/turnout`.
2.  **Controls UI Implementation (Section 2.10.A):
    *   Implement Geography selection controls (dropdowns for Area Type, Specific Area, conditional Sub-Area Type, Specific Sub-Area), including logic for populating dependent dropdowns.
    *   Implement Election Date selection dropdown.
    *   Implement Data Point selection for Reporting (multi-select/checkbox group for Race, Gender, Age Range).
    *   Implement Data Point selection for Charting (MVP - single select dropdown for Race, Gender, Age Range).
    *   Implement "Include Census Data" checkbox.
    *   Implement "Generate Report & Chart" button with logic for enabling/disabling based on required selections.
3.  **State Management:**
    *   Implement state management (e.g., using React Context, Zustand, Redux, or component state) for all user selections, fetched data, loading states, and error states.
4.  **API Integration:**
    *   Develop service/hook to call the new backend API endpoint(s).
    *   Handle API request/response lifecycle (loading, success, error).
5.  **Report Display UI (Section 2.10.B1):
    *   Implement dynamic table rendering for the report based on API response (dynamic columns and rows).
    *   Display calculated metrics (counts, turnout rates, census data).
    *   Implement display of report aggregations (Average Turnout Rate, Total Voters Participated).
    *   Implement "Download Report (CSV/Excel)" functionality.
6.  **Chart Display UI (MVP - Section 2.10.B2):
    *   Integrate a charting library (e.g., Recharts, Chart.js, Nivo).
    *   Implement logic to render a standard horizontal bar chart (no data point selected).
    *   Implement logic to render a row stacked horizontal bar chart (single data point selected), ensuring segments represent demographic-specific turnout and total bar length is the sum of these rates.
    *   Implement sorting of chart rows as per requirements.
    *   Implement X-axis scaling to accommodate sums >100%.
    *   Implement chart legends.
    *   Implement "Download Chart (SVG)" and "Download Chart (PNG)" functionality.
    *   Add tooltips for chart elements.
7.  **URL Parameter Management:**
    *   Implement logic to read initial selections from URL query parameters on page load.
    *   Implement logic to update URL query parameters when user selections change and a report/chart is generated.
8.  **Responsiveness & Styling:**
    *   Ensure the page layout and components are responsive.
    *   Apply consistent styling, reusing existing UI library components where possible.
    *   Implement loading indicators and user-friendly error messages.

### 9.3. Data Setup & Verification
1.  **Finalize Demographic Categories:**
    *   Confirm and document the definitive list of categories for Race and Gender to be used in queries and display.
    *   Ensure Age Range categories are consistent between constants, backend logic, and frontend display.
2.  **Verify Census Data Mapping:**
    *   Confirm the linkage between geographical units in voter data and census tracts/data.
    *   Verify accuracy of aggregated census metrics.

### 9.4. Testing
1.  **Backend Unit Tests:**
    *   Test individual query components and calculation logic.
2.  **API Integration Tests:**
    *   Test API endpoints with various valid and invalid parameter combinations.
    *   Verify response schemas and data accuracy.
3.  **Frontend Unit/Component Tests:**
    *   Test UI components in isolation (controls, report table, chart wrapper).
    *   Test state management logic.
4.  **End-to-End (E2E) Tests:**
    *   Simulate user flows: selecting filters, generating reports/charts, verifying data, downloading.
    *   Test scenarios with different geography levels and data point combinations.
    *   Verify URL parameter updates.
5.  **Performance Testing:**
    *   Test report and chart generation times under typical and high-load scenarios.
6.  **Cross-Browser & Cross-Device Testing:**
    *   Ensure consistent functionality and appearance across major browsers and common device sizes.

### 9.5. Documentation & Deployment
1.  **Code Documentation:**
    *   Ensure backend and frontend code is well-commented, especially complex logic.
2.  **Deployment Preparation:**
    *   Prepare deployment scripts/configurations.
3.  **Old Feature Archival/Removal:**
    *   Backup code for the old `/ga/voter/charts` section.
    *   Remove the old `/ga/voter/charts` routes and components after successful deployment and verification of the new feature.






