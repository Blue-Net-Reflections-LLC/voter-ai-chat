6# Voter Profile Requirements

## Objective

Utilize Voter AI to build an interactive chatbot capable of generating a comprehensive voter profile for any registered voter, facilitating targeted civic engagement, policy awareness, and voter outreach.

## Access Control
- Access to the profile generation chatbot is restricted to users with state-level permissions to protect sensitive data.
- Different states will have distinct access levels.
- A super-user access level will grant permissions across all states.

## User Interface (UI)
- The UI will feature a prompt field and potentially other form fields to guide profile building (details TBD).
- Profile components must be presented clearly and be easy to view.
- The UI must be mobile-friendly to support users in the field.
- The UI should be interactive to improve election engagement.

## Technical Implementation
- An Agentic AI layer will serve as the logical middle tier.
- This AI layer will use tools to fetch data from various internal and external sources via:
    - Database Connections
    - REST APIs
    - Advanced MCP (Multi-Cloud Platform) integrations where necessary.
- The system must allow users to download generated profile data as CSV files.

## Data Sources (Publicly Available)
The chatbot will leverage tools to search and integrate data from various sources:
- **Voter File Data:** Registered voter information (name, address, party affiliation, voting history where available).
- **Census Data:** Demographic insights (age, household size, economic status, education levels). Used also for identifying recent redistricting impacts (within the last 4 years).
- **Legislation Impact:** Laws or policies potentially affecting voters based on location/demographics.
- **White Pages Information:** Public residential/contact details for identity validation or geographic trends.
- **Public Social Media Data:** Publicly shared information (Twitter, Facebook, LinkedIn) to infer political interests, engagement, and issue activism. *Method for reliably linking voters to profiles needs identification.*
- **Election Participation Data:** Voter turnout and registration trends by demographics (e.g., U.S. Census Bureau Voting and Registration reports).
- **Federal Election Commission (FEC) Filings:** Political donation records, campaign finance reports, PAC/advocacy group affiliations.
- **Local News & Government Websites:** Recent policy discussions, municipal initiatives, local election developments.
- **Property & Tax Records:** Homeownership, rental status, property tax assessments influencing voter priorities.
- **Public Contact Information:** Available email addresses and phone numbers (must be publicly sourced).

## Key Features / Data Points
The Voter Profile tool should provide:
- **Voter Search:** By first name, last name, and/or address.
- **Household Information:** Number of registered voters in a given household.
- **Voting History:** Record of when voters last voted.
- **Voting Likelihood Prediction:** Assess the probability of a voter participating in future elections.
- **Redistricting Information:** Detect if a voter was part of a redistricting event in the last 4 years (using Census data).
- **Geographic/Election Data:**
    - District, county, and city-level election results.
    - Local representatives.
- **Demographic Data:**
    - Racial demographics.
    - Income levels.
    - Age breakdown.
- **Voter Turnout:** Participation score/rate for relevant districts/areas.
- **Social Media Presence:** Identify associated public social media profiles (*Method TBD*).
- **Public Contact Information:** Display available public email/phone numbers.

## Future Considerations
- Allow users to manually add/edit contact information (email, phone) and social media links via the UI.
- Expand rules and requirements as the project evolves.

## Updates (2025-04-16)

- The voter profile page is now located at `/ga/voter/profile/[voterId]` and uses the voter registration ID as a URL parameter for direct linking and navigation.
- The "Household Voters" section displays other household members with their first and last names, age, gender, and links to their own profile pages (using the same voter registration ID URL pattern).
- The "District Data" section now includes:
    - Income levels (percentage by bracket)
    - Redistricting information (whether the district was redrawn in the last 4 years, year, and source)
    - A link to a full district details page
- The project will use the [ArcGIS Maps SDK for JavaScript](https://developers.arcgis.com/javascript/latest/) for mapping and spatial features. (More mapping requirements to come.)

## New Page Requirements

### Voters Listing / Browse Page

**Objective:** Provide a filterable, sortable, and paginated interface to browse and search for specific voters or groups of voters.

**Features:**

- **Filtering / Facets:**
    - All filters should update the results dynamically.
    - Query filters/facets must be persisted in the URL parameters.
    - Filters Table:

        | Filter Category    | Filter Name              | Type                     | Notes                                                      |
        |--------------------|--------------------------|--------------------------|------------------------------------------------------------|
        | **Geographic**     | County                   | Multi-select (advanced)  | Searchable, selected at top, checkboxes, clear all         |
        |                    | Congressional District   | Multi-select (advanced)  | Searchable, selected at top, checkboxes, clear all         |
        |                    | State Senate District (Upper) | Multi-select (advanced)  | Searchable, selected at top, checkboxes, clear all         |
        |                    | State House District (Lower) | Multi-select (advanced)  | Searchable, selected at top, checkboxes, clear all         |
        |                    | Residence Address(es)    | Custom Multi-Filter      | See 'Residence Address Filter (Georgia)' section below     |
        |                    | Zip Code                 | Autocomplete / Multi-select | Accepts multiple zip codes                                 |
        |                    | City                     | Autocomplete / Multi-select | Accepts multiple city names                              |
        | **Voter Info**     | First Name               | Autocomplete             |                                                            |
        |                    | Last Name                | Autocomplete             |                                                            |
        |                    | Active / Inactive Status | Multi-select             | Options: Active, Inactive                                  |
        |                    | Registered Voter Party   | Multi-select             |                                                            |
        |                    | Voter History Party      | Multi-select             | Based on last voted primary                                |
        |                    | Age Range                | Multi-select             | Brackets: 18-21, 22-30, 31-40, 41-50, 51-65, 65+          |
        |                    | Gender                   | Multi-select             |                                                            |
        |                    | Race                     | Multi-select             |                                                            |
        |                    | Income Level             | Multi-select             | *Requires external data source correlation*              |
        |                    | Education Level          | Multi-select             | *Requires external data source correlation*              |
        | **Voting Behavior**| Registered But Never Voted| Boolean / Switch         |                                                            |
        |                    | Has Not Voted Since Year | Date / Year Input        | Specify year (e.g., "2020")                               |
        |                    | Contacted (No Response)  | Boolean / Switch         | *Requires data source*                                     |
        |                    | Voted by Election Type   | Multi-select             | Select from available election types                       |
        |                    | Redistricting Affected   | Boolean / Switch         | Filter for voters affected in last 4 years               |

- **Display:**
    - **Pagination:** Paginated results with user-selectable page sizes (e.g., 10, 25, 50, 100 per page), default 25, maximum 100.
    - **Sorting:** All default and selected columns should be sortable (ascending/descending) by clicking the column header.
    - **Default Columns:** Registration ID, Full Name, County, Active/Inactive Status.
    - **Selectable Columns:** Users should be able to add/remove columns corresponding to the available filters (e.g., Address details, Race, Age, Last Voted Date, Party, Gender, etc.).
    - Each result row should link to the corresponding Voter Profile Page (`/ga/voter/profile/[voterId]`)

- **Functionality:**
    - Query filters/facets must be persisted in the URL parameters for shareable and bookmarkable links.
    - Printable view of the current list page.
    - Download selected results or the entire filtered list as a CSV file.

**Note:** The UI for County, Congressional District, State Senate District (Upper), and State House District (Lower) uses an advanced multi-select: searchable, selected items appear at the top, checkboxes for each option, and a clear all button. This pattern is consistent across all major multi-select filters for clarity and usability.

### Residence Address Filter (Georgia)

- Users can add **multiple** residence address filters.
- An "Add Address Filter" button triggers a popover to add a new filter instance.
- Each filter instance contains the following fields, stored as separate columns in the database:
  - Street Number (autocomplete)
  - Pre Direction (autocomplete)
  - Street Name (autocomplete)
  - Street Type (autocomplete)
  - Post Direction (autocomplete)
  - Apt/Unit Number (autocomplete)
  - Zipcode (autocomplete)
  - City (select, not freeform)

- **Dynamic Data Sourcing:**
  - All autocomplete/select options are dynamically loaded from the live Georgia voter registration database via API endpoints **prefixed with `/ga`** (e.g., `/ga/api/voter-address/fields`).
  - Each endpoint returns distinct values for a given field, filtered by the current selections in the *other fields within the same filter instance*, and limited to 50 results.
  - City options are always filtered by the other address fields *within the same instance* and are never freeform.

- **Smart Interdependent Filtering (Per Instance):**
  - Selecting a value in any field (e.g., street name) *within a specific filter instance* narrows the autocomplete/select options for all other fields *within that same instance*.
  - If a field has only one possible value *within an instance*, it can be auto-selected (TBD based on UX testing).
  - If city is reduced to a single value *within an instance*, it is highlighted.
  - User must select from the list of values in all autocomplete fields (no freeform input).
  - All autocomplete lists are capped at 50 items for performance and usability.

- **API/Backend Requirements:**
  - Endpoints must be **/ga-prefixed** to support state-specific logic and data models.
  - Each endpoint accepts the current filter state *for the specific instance being edited* and returns the possible values for the requested field, filtered and limited as above.
  - Example endpoint: `/ga/api/voter-address/fields?field=street_name&city=Atlanta&zipcode=30303` returns up to 50 street names matching the provided city and zipcode *for that specific filter instance*.

- **Frontend/UI Requirements:**
  - The filter UI displays a list of address filter instances.
  - Each instance has its own set of autocomplete/select fields.
  - Options within an instance are updated as the user types/selects in any field *of that instance*.
  - City is always a select; if only one value remains *within an instance*, it is visually highlighted.
  - All fields require selection from the list (no freeform input allowed).
  - Each filter instance can be removed individually.
  - A "Clear All Address Filters" button is available.

- **Rationale:**
  - This approach allows users to specify multiple, precise address criteria additively, ensuring accurate, user-friendly, and efficient filtering of voters by address.

### Map Visualization Page

**Objective:** Provide a geographic visualization of voters based on selected filters, using the ArcGIS Maps SDK for JavaScript.

**Features:**

- **Mapping:**
    - Display voters as points on a regional map based on their geographic coordinates.
    - Leverage [ArcGIS Maps SDK for JavaScript](https://developers.arcgis.com/javascript/latest/).
- **Filtering:**
    - Apply most of the same filters available on the Voters Listing Page.
    - Filters should dynamically update the map display.
- **Interaction:**
    - Hover state on voter points to show light details (e.g., Name, Address, Party).
    - Click state on voter points to link to the full Voter Profile Page.
    - Ability to draw shapes on the map to filter voters within a specific geographic area.
- **Navigation:**
    - Allow users to easily switch between the Map View and the corresponding Voter List View while preserving applied filters.

### Summary / Dashboard Page

**Objective:** Provide an aggregated, statistical overview of the voter population based on selected filters.

**Features:**

- **Filtering:**
    - Apply most of the same filters available on the Voters Listing Page to refine the summary data.
- **Key Metrics:**
    - Total number of voters matching filters.
    - Count of Active vs. Inactive voters.
    - Count of voters who have never participated in an election.
    - Participation Rate Trend: Calculate and display whether participation (based on voting history over the last 20 years) is increasing or decreasing for the filtered group.
- **Breakdowns (Visualized with Charts/Graphs where appropriate):**
    - Age Breakdown (using standard brackets).
    - Racial Breakdown.
    - Gender Breakdown.
    - Registered Party Affiliation Breakdown.
    - Income Level Breakdown (*Requires external data source correlation*).
    - Education Level Breakdown (*Requires external data source correlation*).
- **Functionality:**
    - Filters must persist in URL parameters.
    - Printable summary report.

