# Voter Profile Requirements

## Data points
Add a page that will display voter profile information:
Voter Information
- Voter FULL Name (header)
- Registration Number
- Registration Date (often this is blank)
- Status: Active / Inactive
- Birth year
- Race
- Gender
- Voter File Last Modified Date
- Voter Creation Date
- Participation Score (pre-calculated)

Location
- County Code + Name
- Voter Resident Address
- Voter Mailing Address
- A static map image showing the voter's zoomed-in location (if available). *Future: Add link to interactive map page.*
  - **Static Map Implementation:** The map will be generated using the Mapbox Static Images API. The frontend component will construct the URL using the voter's longitude and latitude (obtained from the `geom` field via the profile API). A suitable zoom level (e.g., 15), map dimensions (e.g., 300x200), the `dark-v11` style, and a marker overlay (e.g., `pin-s+e55e5e({lon},{lat})`) will be included. The public Mapbox access token (`NEXT_PUBLIC_MAPBOX_TOKEN`) will be appended. The final URL will be used as the `src` for an `<img>` tag.
  - **Note:** The backend API must extract longitude and latitude from the `geom` field (using `ST_X(geom)` and `ST_Y(geom)`) and include them in the response.
- List of other voters at the resident address:
  - Full Name (with link to their profile)
  - Registration Number
  - Status (Active/Inactive)
  - Gender
  - Age (calculated from birth_year)
- Included in redistricting (Yes/No flag, potentially listing affected districts if applicable).

- Precincts & Districts
  - County Precinct
  - Municipal Precinct
  - Congressional District
    - Includes Representative Name(s) fetched via live backend API call (e.g., to LegiEquity or similar service).
  - State Senate District
    - Includes Representative Name(s) fetched via live backend API call.
  - State House District
      - Includes Representative Name(s) fetched via live backend API call.
- Judicial District
- Municipality

- Voter Participation
  - Shows details for each voting event in reverse chronological order
    - Election Date
    - Election Type
    - Party
    - Absentee (Y/N)
    - Provisional (Y/N)

- Census Data (if available)
  - Fetch key metrics (e.g., Income, Education) via live backend API call to the Census Bureau API.
  - Uses the voter's stored Census Tract ID (e.g., `13067030111`) to query the ACS 5-Year Subject Tables.
  - Example Endpoint: `https://api.census.gov/data/2023/acs/acs5/subject?get=group(S2301)&ucgid=1400000US{census_tract_geoid}`

## Data Point Summary & Backend Status

| Data Point                      | Source / Calculation                                          | Backend Status |
| :------------------------------ | :------------------------------------------------------------ | :------------: |
| **Voter Information**           |                                                               |                |
| Voter Full Name                 | `first_name`, `middle_name`, `last_name`, `suffix`            |     `[x]`      |
| Registration Number             | `voter_registration_number`                                   |     `[x]`      |
| Registration Date               | `registration_date`                                           |     `[x]`      |
| Status                          | `status`                                                      |     `[x]`      |
| Birth year                      | `birth_year`                                                  |     `[x]`      |
| Age                             | Calculated from `birth_year` and current year                 |     `[x]`      |
| Race                            | `race`                                                        |     `[x]`      |
| Gender                          | `gender`                                                      |     `[x]`      |
| Voter File Last Modified Date   | `last_modified_date`                                          |     `[x]`      |
| Voter Creation Date             | `voter_created_date`                                          |     `[x]`      |
| Participation Score             | `participation_score` (pre-calculated)                        |     `[x]`      |
| **Location**                    |                                                               |                |
| County Code                     | `county_code` (move from Voter Info)                          |     `[x]`      |
| County Name                     | `county_name` (move from Voter Info)                          |     `[x]`      |
| Voter Resident Address          | `residence_street_number`, `residence_pre_direction`, etc.    |     `[x]`      |
| Voter Mailing Address           | `mailing_street_number`, `_name`, `_apt_unit_number`, `_city`, `_zipcode`, `_state`, `_country` | `[x]` |
| Static Map Image                | *Mapbox Static Images API (See Implementation Note above)*    |     `[x]`      |
| Other Voters at Address         | Query `ga_voter_registration_list` on address components, returning: registration_number, first_name, middle_name, last_name, suffix, status, gender, birth_year (for age calculation) |     `[x]`      |
| Included in Redistricting       | `redistricting_cong_affected`, `_senate_`, `_house_` flags   |     `[x]`      |
| **Precincts & Districts**       |                                                               |                |
| County Precinct                 | `county_precinct`                                             |     `[x]`      |
| County Precinct Description     | `county_precinct_description` (or lookup from `REFERENCE_DATA`) |     `[ ]`      |
| Municipal Precinct              | `municipal_precinct`                                          |     `[x]`      |
| Municipal Precinct Description  | `municipal_precinct_description`                                |     `[x]`      |
| Congressional District          | `congressional_district`                                      |     `[x]`      |
|   - Representative(s)           | *Live Backend Call (e.g., LegiEquity /api/impact)*            |     `[x]`      |
|     - Name (linked)             | `name` field from LegiEquity response, link to `/sponsor/{id}/{slug}` | `[x]` |
|     - Party                     | `party_name` field from LegiEquity response                   |     `[x]`      |
|     - District                  | `district` field from LegiEquity response                     |     `[x]`      |
|     - Chamber                   | `chamber` field from LegiEquity response                      |     `[x]`      |
|     - Role                      | `role` field from LegiEquity response                         |     `[x]`      |
| State Senate District           | `state_senate_district`                                       |     `[x]`      |
|   - Representative(s)           | *Live Backend Call (e.g., LegiEquity /api/impact)*            |     `[x]`      |
|     - Name (linked)             | `name` field from LegiEquity response, link to `/sponsor/{id}/{slug}` | `[x]` |
|     - Party                     | `party_name` field from LegiEquity response                   |     `[x]`      |
|     - District                  | `district` field from LegiEquity response                     |     `[x]`      |
|     - Chamber                   | `chamber` field from LegiEquity response                      |     `[x]`      |
|     - Role                      | `role` field from LegiEquity response                         |     `[x]`      |
| State House District            | `state_house_district`                                        |     `[x]`      |
|   - Representative(s)           | *Live Backend Call (e.g., LegiEquity /api/impact)*            |     `[x]`      |
|     - Name (linked)             | `name` field from LegiEquity response, link to `/sponsor/{id}/{slug}` | `[x]` |
|     - Party                     | `party_name` field from LegiEquity response                   |     `[x]`      |
|     - District                  | `district` field from LegiEquity response                     |     `[x]`      |
|     - Chamber                   | `chamber` field from LegiEquity response                      |     `[x]`      |
|     - Role                      | `role` field from LegiEquity response                         |     `[x]`      |
| Judicial District               | `judicial_district`                                           |     `[x]`      |
| Municipality                    | `municipality`                                                |     `[x]`      |
| **Voter Participation**         | (Data retrieved from `voting_events` JSONB in `ga_voter_registration_list`, derived from `GA_VOTER_HISTORY`) | |
| Participation History           | `voting_events` (JSONB Array)                                 |     `[x]`      |
|   - Election Date               | `election_date` key within JSON object                        |     `[x]`      |
|   - Election Type               | `election_type` key within JSON object                        |     `[x]`      |
|   - Party                       | `party` key within JSON object                                |     `[x]`      |
|   - Absentee                    | `absentee` key within JSON object (Y/N)                       |     `[x]`      |
|   - Provisional                 | `provisional` key within JSON object (Y/N)                    |     `[x]`      |
| **Census Data**                 |                                                               |                |
| Income, Education, etc.         | *Live Backend Call (Census API using `ucgid`)*                |     `[x]`      |
    
## Presentation
- We need to discuss how to layout the datapoints 
 - Route will be `/ga/voter/profile/[registration-number]` (optional fullname slug can be added for SEO/readability but is not required for lookup).
 - The page will render in the main section and vertical scrolling is allowed.
 - It will include the voter section tabs (List, Stats, Map) for navigation between views.
 - It will **not** include the FilterPanel on the left sidebar.
 - It will contain a "Back" link/button.
   - If navigated from List, Stats, or Map, it goes back to the previous view.
   - If visited directly, it navigates to the List page with the voter's `resident_address` applied as a filter.
 - Determine what will be presented in Accordions or Tabs for sections based on data density and user experience (e.g., Participation History, Districts might be suitable for accordions).
 - Quickview
   - Displays Voter Info subset (Name, Status, Age, Gender, Race, Address).
   - Displays Voter Location subset (County, City, Zip).
   - Provides a prominent link to the full Voter Profile Detail page.
   - Quick view works on hover/click action on the List page.
   - Quick view works when clicking the voter name in the Map popup (instead of direct navigation).
   - Quick View should be a modal dialog (e.g., ShadCN Dialog) over a gray overlay.
   - Users can close the quick view by clicking outside the dialog, clicking the 'x' icon in the upper right corner, or clicking an explicit "Close" button.
   - Reuse Tailwind and ShadCN components.
   

## Schemas and Datasources
Schemas used for the voter data:
 - lib\ga-voter-history\migrations\0001_create_ga_voter_history.sql
 - lib\ga-voter-registration\migrations\0001_create_ga_voter_registration_list.sql
 - lib\ga-voter-registration\migrations\0006_add_derived_vote_info.sql
 - lib\ga-voter-registration\migrations\0008_add_geocoding_cols.sql
 - lib\ga-voter-registration\migrations\0009_add_redistricting_cols_and_indexes.sql
 - lib\ga-voter-registration\migrations\0010_tile_current_district_geometries.sql
 - lib\ga-voter-registration\migrations\0011_add_voting_events_jsonb.sql
 - lib\ga-voter-registration\migrations\0014_add_geo_boundaries_to_voters.sql # Contains Census Tract ID (ucgid)

 Scripts
 - lib\ga-voter-history\import\parse-history-csv.ts
 - lib\ga-voter-registration\import\parse-registration-csv.ts
 - lib\ga-voter-registration\import\update-redistricting-flags.ts
 - lib\ga-voter-registration\import\geocode-addresses.ts
 - lib\ga-voter-registration\import\enrich-voter-boundaries.ts # Populates Census Tract ID

 ## Endpoint Strategy
 - A primary backend API endpoint (e.g., `/api/ga/voter/profile/[registration-number]`) will fetch the core voter data:
   - Voter Information
   - Location details (including the list of other voters at the same address)
   - Precincts & Districts (excluding live representative data)
   - Voter Participation History
 - Related external data should be fetched by the backend API during the request:
   - **Representatives:** Fetched via live calls to an external service (e.g., LegiEquity) based on the voter's districts.
   - **Census Data:** Fetched via live calls to the Census API using the voter's stored Census Tract ID.
 - The frontend will initiate asynchronous requests to fetch data for the different profile sections upon page load.
 
## Task List
### 1. Backend API (`/api/ga/voter/profile/[registration-number]`)
- [x] Task: Create the API route file (`app/api/ga/voter/profile/[registration_number]/route.ts`).
- [x] Task: Implement basic route handler to accept GET requests with `registration_number`.
- [x] Task: Fetch core voter information (`ga_voter_registration_list`) based on registration number.
  - [x] Include basic fields (name, status, birth year, race, gender, registration date, modified date, creation date).
  - [x] Include residence and mailing address fields.
  - [x] Include precinct and district fields (county precinct, muni precinct, congressional, state senate, state house, judicial).
  - [x] Include municipality.
  - [x] Include county code and name.
- [x] Task: Fetch voter participation history (`voting_events` JSONB) and format it.
- [x] Task: Fetch list of other voters at the same residence address.
  - [x] Query `ga_voter_registration_list` based on shared address components (`residence_street_number`, `residence_pre_direction`, `residence_street_name`, `residence_street_type`, `residence_post_direction`, `residence_city`, `residence_zipcode`, and potentially `residence_apt_unit_number` - handle nulls/variations carefully).
  - [x] Include `registration_number`, `first_name`, `middle_name`, `last_name`, `suffix`, `status`, `gender`, `birth_year` for the other voters to display full name, status, gender, and calculated age.
- [x] Task: Integrate live call to fetch Representative data (placeholder implementation with district-based data, to be enhanced with LegiEquity API).
- [x] Task: Integrate live call to fetch Census data (placeholder implementation with tract-based data, to be enhanced with Census API).
- [x] Task: Structure the API response JSON (e.g., nested objects for `voterInfo`, `location`, `districts`, `participation`, `otherVoters`, `representatives`, `census`).
- [x] Task: Add error handling (e.g., voter not found, external API errors).

### 2. Frontend Page Structure
- [x] Task: Create the page file (`app/ga/voter/profile/[registration_number]/page.tsx`).
- [x] Task: Implement basic page component structure (skeleton/placeholders).
- [x] Task: Implement asynchronous data fetching for all profile sections based on the `registration_number` param.
  - [x] Consider separate hooks or state management for each major data section (Info, Location, Districts, Participation, Census, Reps, Other Voters) to allow independent loading.
- [x] Task: Ensure the `FilterPanel` is *not* rendered on this page (likely handled by layout modifications or conditional rendering).
- [x] Task: Implement the "Back" button/link with correct navigation logic.
- [x] Task: Display loading states (e.g., skeletons) for each section while data is fetching.
- [x] Task: Display error states for sections if fetching fails.
- [x] Task: Set up the main layout for the profile content area.

### 3. Frontend Data Sections
- [x] Task: **Voter Information Section:** Display core voter details once loaded.
- [x] Task: **Location Section:**
  - [x] Display county, residence address, mailing address once loaded.
  - [x] Construct Mapbox Static Images API URL once coordinates are loaded.
  - [x] Display the static map `<img>` tag once the URL is constructed.
  - [x] Display list of other voters once loaded.
  - [x] Display redistricting info once loaded.
  - [x] **Household Score:** Display average participation score for the household (fetched from frontend).
- [x] Task: **Precincts & Districts Section:**
  - [x] Display all precinct and district names/codes once core voter data is loaded.
  - [x] Under each relevant district (Congressional, State Senate, State House), display representative details:
    - [x] Display `name` linked to `https://legiequity.us/sponsor/{id}/{slugified-name}`.
    - [x] Display `party_name`, `district`, `chamber`, `role`.
  - [x] Consider using Accordions/Tabs for organization; display rep data once fetched.
- [x] Task: **Voter Participation Section:**
  - [x] Display participation history once loaded in a table or list format (reverse chronological).
  - [x] Consider using an Accordion/Tab.
- [x] Task: **Census Data Section:**
  - [x] Display fetched Census metrics once loaded.
  - [x] Handle cases where Census data might not be available or the API call fails.
  - [x] Display Census data within its section once fetched (the entire section's loading is already async).

### 4. Quickview Modal
- [x] Task: Create a reusable `VoterQuickview` component.
- [x] Task: Implement the modal structure (e.g., using ShadCN Dialog).
- [x] Task: Display the specified subset of Voter Info and Location data within the modal.
- [x] Task: Add the link to the full profile page.
- [x] Task: Implement trigger logic for List page (hover/click).
- [x] Task: Modify Map popup: Change name click behavior to open Quickview instead of navigating.
- [x] Task: Ensure close functionality works (click outside, 'x' button, Close button).

### 5. Styling & Refinement
- [x] Task: Apply consistent styling using Tailwind/ShadCN.
- [x] Task: Ensure responsiveness across different screen sizes.
- [x] Task: Review layout and data presentation for clarity.
- [x] Task: Add appropriate icons where needed.
 
## Performance Note:
To optimize response time, the backend API should fetch external data (Representatives, Census) asynchronously or in parallel with the primary database queries where feasible.
 - The frontend will initiate asynchronous requests to fetch data for the different profile sections upon page load.
 - **Performance Note:** The backend API should still be optimized (e.g., parallel/async internal calls for external data) to ensure each section's data can be returned quickly when requested by the frontend.

## Next Steps Summary

### Completed:
✅ **Backend API Development**
- Modular API route with section-based loading (info, location, districts, participation, otherVoters, representatives, census)
- Comprehensive error handling
- Implementation of all data sections with proper formatting
- Real-time server-side logging for debugging and monitoring

✅ **Frontend Page Structure**
- Created the page file (`app/ga/voter/profile/[registration_number]/page.tsx`)
- Implemented basic layout and section loading structure
- Set up async data fetching hooks for each section

✅ **Frontend Section Components**
- Designed and implemented UI components for each data section
- Ensured responsive layouts and consistent styling
- Implemented loading and error states

✅ **Navigation and Integration**
- Implemented back navigation with context awareness
- Integrated with the existing voter map and list views
- Created quickview component for use in list/map interactions

✅ **Quickview Modal**
- Implemented reusable VoterQuickview component with ShadCN Dialog
- Created horizontal layout for compact data presentation
- Added integration in both list view and map popups
- Ensured proper styling and user experience

### Post-MVP Enhancements (Stabilization Sprint):
- Performance optimization for high-traffic periods
- Add additional census data visualizations
- Enhance error recovery mechanisms
- Implement caching strategies for frequently accessed profiles
- Expand test coverage for edge cases
- Consider adding export functionality for voter data

### Technical Notes
- Use ShadCN UI components for consistent styling
- Implement section-specific data fetching hooks (useVoterSection)
- Store navigation state to support back button functionality
- Use skeleton loaders during async data fetching for better UX

## Change Requests

### CR-001: Add Participation Score Filter (Implemented)

- **Date:** [Insert Date]
- **Request:** Add a filter to the sidebar to allow users to select voters based on their Participation Score range.
- **Implementation Details:**
    - Added a new multi-select filter component labeled "Participation Score Range" to the top of the Filter Panel (`app/ga/voter/list/components/FilterPanel.tsx`).
    - Uses predefined score ranges (Needs Attention, Needs Review, Participates, Power Voter, Elite Voter) defined in `lib/participation-score/constants.ts`.
    - Filter selections are stored in the `scoreRanges` array within the `VoterFilterContext` state (`app/ga/voter/VoterFilterProvider.tsx`).
    - URL parameter `scoreRanges` is used for persistence.
    - The `buildVoterListWhereClause` function (`lib/voter/build-where-clause.ts`) was updated to generate appropriate SQL `WHERE` conditions (e.g., `participation_score BETWEEN X AND Y OR participation_score = 10.0`) based on selected ranges.
    - Filter is additive (multiple ranges can be selected).

### CR-002: Add Household Participation Score Display (Implemented)

- **Date:** [Insert Date]
- **Request:** Display the average Participation Score for all voters residing at the same address on the Voter Profile page.
- **Implementation Details:**
    - Added a new hook `useHouseholdParticipationScore` to `app/ga/voter/profile/[registration_number]/page.tsx`.
    - This hook formats the primary voter's residence address into a `resident_address` query parameter.
    - It fetches the average score by calling `/api/ga/voter/participation-score` with the `resident_address` parameter.
    - The fetched score and loading state are passed down to the `LocationSection` component (`components/ga/voter/profile-sections/LocationSection.tsx`).
    - The `LocationSection` component now renders the `ParticipationScoreWidget` near the "Other Voters at Residence" list, displaying the household average.

### CR-003: Add County and Municipal Precinct Filters

- **Date:** [Insert Date]
- **Request:** Add multi-select filters for County Precinct and Municipal Precinct to the Filter Panel, appearing below the County filter. Use precinct descriptions sourced from a new `REFERENCE_DATA` table (for County Precincts) or existing DB columns (for Municipal Precincts) for UI display/search. Filter using precinct codes.
- **Prerequisites:**
    - Creation of `REFERENCE_DATA` table (See Task below).
    - Loading of relevant precinct descriptions into `REFERENCE_DATA` (e.g., Cobb County data). *Note: Data loading is a separate process.*
- **Implementation Details:**
    - **Backend (Data Structure):**
        - [X] Define schema for `REFERENCE_DATA` table (Columns: `id`, `lookup_type`, `state_code`, `county_code`, `lookup_key`, `lookup_value`, `lookup_meta` (JSONB), `created_at`, `updated_at`). `lookup_type` = 'GA_COUNTY_PRECINCT_DESC', `state_code` = 'GA', `county_code` = FIPS (e.g., '067' for Cobb), `lookup_key` = Precinct Code (e.g., 'BF02'), `lookup_value` = Precinct Description (e.g., 'Bells Ferry 02').
        - [X] Create migration script `lib/ga-voter-registration/migrations/0016_create_reference_data_table.sql` for the `REFERENCE_DATA` table.
    - **Backend (API & Filtering):**
        - [X] Add `countyPrecincts` and `municipalPrecincts` (string arrays storing **codes**) to `FilterState` in `@app/ga/voter/VoterFilterProvider.tsx`.
        - [X] Update `FILTER_TO_URL_PARAM_MAP` in `@app/ga/voter/VoterFilterProvider.tsx` with URL parameters (e.g., `countyPrecinct`, `municipalPrecinct`).
        - [X] Update `buildQueryParams` and URL parsing logic in `@app/ga/voter/VoterFilterProvider.tsx` to handle these new array parameters.
        - [X] Update `buildVoterListWhereClause` function (`lib/voter/build-where-clause.ts`) to add `county_precinct = ANY($...)` and `municipal_precinct = ANY($...)` conditions based on selected **codes**. (Inclusive OR logic).
string, description: string }`.
    - **Frontend (UI):**
        - [ ] Update the Filter Panel UI component (`app/ga/voter/list/components/FilterPanel.tsx`) to include two new multi-select components below "County":
            - "County Precinct": Fetches options from the new lookup API (`type=county`). Displays options as "Description (Code)" (e.g., "Bells Ferry 02 (BF02)"). Stores selected **codes** in context state (`countyPrecincts`).
            - "Municipal Precinct": Fetches options from the new lookup API (`type=municipal`). Displays options as "Description (Code)". Stores selected **codes** in context state (`municipalPrecincts`). *(Note: May be removed later based on data utility)*.
    - **Data Point Summary:**
        - [x] Add `county_precinct`, `county_precinct_description`, `municipal_precinct`, `municipal_precinct_description` to the Data Point Summary table in `design/ga/ga-voter-profile-page.md`.

 
 