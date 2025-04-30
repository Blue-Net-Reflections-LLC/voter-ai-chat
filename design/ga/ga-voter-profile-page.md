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

Location
- County Code + Name
- Voter Resident Address
- Voter Mailing Address
- A static map image showing the voter's zoomed-in location (if available). *Future: Add link to interactive map page.*
  - **Static Map Implementation:** The map will be generated using the Mapbox Static Images API. The frontend component will construct the URL using the voter's longitude and latitude (obtained from the `geom` field via the profile API). A suitable zoom level (e.g., 15), map dimensions (e.g., 300x200), the `dark-v11` style, and a marker overlay (e.g., `pin-s+e55e5e({lon},{lat})`) will be included. The public Mapbox access token (`NEXT_PUBLIC_MAPBOX_TOKEN`) will be appended. The final URL will be used as the `src` for an `<img>` tag.
  - **Note:** The backend API must extract longitude and latitude from the `geom` field (using `ST_X(geom)` and `ST_Y(geom)`) and include them in the response.
- List of other voters at the resident address (names and registration numbers with links to their profiles).
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
| Voter Full Name                 | `first_name`, `middle_name`, `last_name`, `suffix`            |     `[ ]`      |
| Registration Number             | `voter_registration_number`                                   |     `[ ]`      |
| Registration Date               | `registration_date`                                           |     `[ ]`      |
| Status                          | `status`                                                      |     `[ ]`      |
| Birth year                      | `birth_year`                                                  |     `[ ]`      |
| Race                            | `race`                                                        |     `[ ]`      |
| Gender                          | `gender`                                                      |     `[ ]`      |
| Voter File Last Modified Date | `last_modified_date`                                          |     `[ ]`      |
| Voter Creation Date             | `voter_created_date`                                          |     `[ ]`      |
| **Location**                    |                                                               |                |
| County Code                     | `county_code`                                                 |     `[ ]`      |
| County Name                     | `county_name`                                                 |     `[ ]`      |
| Voter Resident Address          | `residence_street_number`, `residence_pre_direction`, etc.    |     `[ ]`      |
| Voter Mailing Address           | `mailing_street_number`, `_name`, `_apt_unit_number`, `_city`, `_zipcode`, `_state`, `_country` | `[ ]` |
| Static Map Image                | *Mapbox Static Images API (See Implementation Note above)*    |      N/A       |
| Other Voters at Address         | Query `ga_voter_registration_list` on address components      |     `[ ]`      |
| Included in Redistricting     | `redistricting_cong_affected`, `_senate_`, `_house_` flags  |     `[ ]`      |
| **Precincts & Districts**       |                                                               |                |
| County Precinct                 | `county_precinct`                                             |     `[ ]`      |
| County Precinct Description     | `county_precinct_description`                                 |     `[ ]`      |
| Municipal Precinct              | `municipal_precinct`                                          |     `[ ]`      |
| Congressional District          | `congressional_district`                                      |     `[ ]`      |
|   - Representative(s)           | *Live Backend Call (e.g., LegiEquity /api/impact)*            |     `[ ]`      |
|     - Name (linked)             | `name` field from LegiEquity response, link to `/sponsor/{id}/{slug}` | `[ ]` |
|     - Party                     | `party_name` field from LegiEquity response                 |     `[ ]`      |
|     - District                  | `district` field from LegiEquity response                   |     `[ ]`      |
|     - Chamber                   | `chamber` field from LegiEquity response                    |     `[ ]`      |
|     - Role                      | `role` field from LegiEquity response                       |     `[ ]`      |
| State Senate District           | `state_senate_district`                                       |     `[ ]`      |
|   - Representative(s)           | *Live Backend Call (e.g., LegiEquity /api/impact)*            |     `[ ]`      |
|     - Name (linked)             | `name` field from LegiEquity response, link to `/sponsor/{id}/{slug}` | `[ ]` |
|     - Party                     | `party_name` field from LegiEquity response                 |     `[ ]`      |
|     - District                  | `district` field from LegiEquity response                   |     `[ ]`      |
|     - Chamber                   | `chamber` field from LegiEquity response                    |     `[ ]`      |
|     - Role                      | `role` field from LegiEquity response                       |     `[ ]`      |
| State House District            | `state_house_district`                                        |     `[ ]`      |
|   - Representative(s)           | *Live Backend Call (e.g., LegiEquity /api/impact)*            |     `[ ]`      |
|     - Name (linked)             | `name` field from LegiEquity response, link to `/sponsor/{id}/{slug}` | `[ ]` |
|     - Party                     | `party_name` field from LegiEquity response                 |     `[ ]`      |
|     - District                  | `district` field from LegiEquity response                   |     `[ ]`      |
|     - Chamber                   | `chamber` field from LegiEquity response                    |     `[ ]`      |
|     - Role                      | `role` field from LegiEquity response                       |     `[ ]`      |
| Judicial District               | `judicial_district`                                           |     `[ ]`      |
| Municipality                    | `municipality`                                                |     `[ ]`      |
| **Voter Participation**         | (Data retrieved from `voting_events` JSONB in `ga_voter_registration_list`, derived from `GA_VOTER_HISTORY`) | |
| Participation History           | `voting_events` (JSONB Array)                                 |     `[ ]`      |
|   - Election Date               | `election_date` key within JSON object                        |     `[ ]`      |
|   - Election Type               | `election_type` key within JSON object                        |     `[ ]`      |
|   - Party                       | `party` key within JSON object                                |     `[ ]`      |
|   - Absentee                    | `absentee` key within JSON object (Y/N)                       |     `[ ]`      |
|   - Provisional                 | `provisional` key within JSON object (Y/N)                    |     `[ ]`      |
| **Census Data**                 |                                                               |                |
| Income, Education, etc.         | *Live Backend Call (Census API using `ucgid`)*               |     `[ ]`      |

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
 
+## Task List
+### 1. Backend API (`/api/ga/voter/profile/[registration-number]`)
+- [ ] Task: Create the API route file (`app/api/ga/voter/profile/[registration_number]/route.ts`).
+- [ ] Task: Implement basic route handler to accept GET requests with `registration_number`.
+- [ ] Task: Fetch core voter information (`ga_voter_registration_list`) based on registration number.
  - [ ] Include basic fields (name, status, birth year, race, gender, registration date, modified date, creation date).
  - [ ] Include residence and mailing address fields.
  - [ ] Include precinct and district fields (county precinct, muni precinct, congressional, state senate, state house, judicial).
  - [ ] Include municipality.
  - [ ] Include county code and name.
+- [ ] Task: Fetch voter participation history (`voting_events` JSONB) and format it.
+- [ ] Task: Fetch list of other voters at the same residence address.
  - [ ] Query `ga_voter_registration_list` based on shared address components (`residence_street_number`, `residence_pre_direction`, `residence_street_name`, `residence_street_type`, `residence_post_direction`, `residence_city`, `residence_zipcode`, and potentially `residence_apt_unit_number` - handle nulls/variations carefully).
  - [ ] Include only `registration_number`, `first_name`, `last_name` for the other voters.
+- [ ] Task: Integrate live call to fetch Representative data (placeholder for external service call based on districts).
+- [ ] Task: Integrate live call to fetch Census data (placeholder for Census API call using `ucgid` from voter record).
+- [ ] Task: Structure the API response JSON (e.g., nested objects for `voterInfo`, `location`, `districts`, `participation`, `otherVoters`, `representatives`, `census`).
+- [ ] Task: Add error handling (e.g., voter not found, external API errors).
+
+### 2. Frontend Page Structure
+- [ ] Task: Create the page file (`app/ga/voter/profile/[registration_number]/page.tsx`).
+- [ ] Task: Implement basic page component structure (skeleton/placeholders).
+- [ ] Task: Implement asynchronous data fetching for all profile sections based on the `registration_number` param.
+   - [ ] Consider separate hooks or state management for each major data section (Info, Location, Districts, Participation, Census, Reps, Other Voters) to allow independent loading.
+- [ ] Task: Ensure the `FilterPanel` is *not* rendered on this page (likely handled by layout modifications or conditional rendering).
+- [ ] Task: Implement the "Back" button/link with correct navigation logic.
+- [ ] Task: Display loading states (e.g., skeletons) for each section while data is fetching.
+- [ ] Task: Display error states for sections if fetching fails.
+- [ ] Task: Set up the main layout for the profile content area.
+
+### 3. Frontend Data Sections
+- [ ] Task: **Voter Information Section:** Display core voter details once loaded.
+- [ ] Task: **Location Section:**
  - [ ] Display county, residence address, mailing address once loaded.
  - [ ] Construct Mapbox Static Images API URL once coordinates are loaded.
  - [ ] Display the static map `<img>` tag once the URL is constructed.
  - [ ] Display list of other voters once loaded.
  - [ ] Display redistricting info once loaded.
+- [ ] Task: **Precincts & Districts Section:**
  - [ ] Display all precinct and district names/codes once core voter data is loaded.
  - [ ] Under each relevant district (Congressional, State Senate, State House), display representative details:
    - [ ] Display `name` linked to `https://legiequity.us/sponsor/{id}/{slugified-name}`.
    - [ ] Display `party_name`, `district`, `chamber`, `role`.
  - [ ] Consider using Accordions/Tabs for organization; display rep data once fetched.
+- [ ] Task: **Voter Participation Section:**
  - [ ] Display participation history once loaded in a table or list format (reverse chronological).
  - [ ] Consider using an Accordion/Tab.
+- [ ] Task: **Census Data Section:**
  - [ ] Display fetched Census metrics once loaded.
  - [ ] Handle cases where Census data might not be available or the API call fails.
  - [ ] Display Census data within its section once fetched (the entire section's loading is already async).
+
+### 4. Quickview Modal
+- [ ] Task: Create a reusable `VoterQuickview` component.
+- [ ] Task: Implement the modal structure (e.g., using ShadCN Dialog).
+- [ ] Task: Display the specified subset of Voter Info and Location data within the modal.
+- [ ] Task: Add the link to the full profile page.
+- [ ] Task: Implement trigger logic for List page (hover/click).
+- [ ] Task: Modify Map popup: Change name click behavior to open Quickview instead of navigating.
+- [ ] Task: Ensure close functionality works (click outside, 'x' button, Close button).
+
+### 5. Styling & Refinement
+- [ ] Task: Apply consistent styling using Tailwind/ShadCN.
+- [ ] Task: Ensure responsiveness across different screen sizes.
+- [ ] Task: Review layout and data presentation for clarity.
+- [ ] Task: Add appropriate icons where needed.
 
+## Performance Note:
+To optimize response time, the backend API should fetch external data (Representatives, Census) asynchronously or in parallel with the primary database queries where feasible.
+ - The frontend will initiate asynchronous requests to fetch data for the different profile sections upon page load.
+ - **Performance Note:** The backend API should still be optimized (e.g., parallel/async internal calls for external data) to ensure each section's data can be returned quickly when requested by the frontend.
 
 