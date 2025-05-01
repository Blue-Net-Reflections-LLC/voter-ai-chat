# Integrate Census Data
We are going to denormalize Census Data into the voter_registration_to allow more comprehensive datapoints for the filtering

## Data Sources
- https://geocoding.geo.census.gov/geocoder/geographies/address?street=545%20chapman%20ln&city=Marietta&state=GA&benchmark=Public_AR_Current&vintage=Current_Current&layers=&format=json

We can use the census tract, or district values to find Census data via the Census Data API.

### Census API Key:
API Key: 03daa05a0a25133bea51761e8871b479f9fc0e40

## Implementation Plan

### 1. Access Census Tract ID
- The Census Tract ID is already stored in the voter registration data as `census_tract`
- Format example: 13067030111 (where '13' is state FIPS, '067' is county FIPS, and '030111' is the tract number)

### 2. Fetch Data from Census API
We'll focus on two key datasets:

#### A. Education Attainment (B15003)
- API endpoint: `https://api.census.gov/data/2023/acs/acs5?get=group(B15003)&ucgid=1400000US${censusTractId}&key=${API_KEY}`
- We'll extract and summarize key education levels:
  - High School Graduate (B15003_017E)
  - Some College (B15003_018E, B15003_019E, B15003_020E)
  - Associate's Degree (B15003_021E)
  - Bachelor's Degree (B15003_022E)
  - Graduate Degrees (B15003_023E, B15003_024E, B15003_025E)

#### B. Income Levels (B19013)
- API endpoint: `https://api.census.gov/data/2023/acs/acs5?get=group(B19013)&ucgid=1400000US${censusTractId}&key=${API_KEY}`
- We'll extract:
  - Median Household Income (B19013_001E)

### 3. API Implementation
Create a new file `lib/voter-profile/getCensusData.ts` that will:
1. Fetch the voter's Census Tract ID from the database
2. Use the ID to make requests to Census API for education and income data
3. Process and format the data for display
4. Handle errors gracefully (invalid census tract, API failures, etc.)

### 4. Data Processing
- Parse the JSON response format (array of arrays)
- Extract relevant values using variable codes (e.g., B15003_022E)
- Calculate derived values (e.g., percentage with bachelor's degree)
- Format currency values for display

### 5. UI Implementation
Update `CensusSection.tsx` to display:
- Education statistics with percentages
- Median household income
- Census tract ID and data source citation
- Loading states and error handling
- Responsive layout for mobile and desktop

## Census Data Tables Reference

### Georgia, US
#### Education Attainment level (B15003)
- Data Endpoint: https://api.census.gov/data/2023/acs/acs5?get=group(B15003)&ucgid=1400000US13067030111
- Metadata Endpoint: https://api.census.gov/data/2023/acs/acs5
- Datatable with fields: https://data.census.gov/table/ACSDT5Y2023.B15003?t=Educational+Attainment&g=1400000US13067030111&y=2023
- Only 24+ voters only (filter, not import)
- Key variables:
    - B15003_002E: No schooling completed
    - B15003_017E: Regular high school diploma
    - B15003_018E-020E: Some college
    - B15003_021E: Associate's degree
    - B15003_022E: Bachelor's degree
    - B15003_023E-025E: Advanced degrees

#### Income Levels (B19013)
- Data Endpoint: https://api.census.gov/  data/2023/acs/acs5?get=group(B19013)&ucgid=1400000US13067030111
- Key variables:
    - B19013_001E: Median household income in the past 12 months

#### Employment Rate (S2301)
- Datatable: https://data.census.gov/table/ACSST5Y2023.S2301?t=Employment&g=1400000US13067030111&y=2023
- Data Endpoint: https://api.census.gov/data/2023/acs/acs5/subject?get=group(S2301)&ucgid=1400000US13067030111
- Meta Endpoint: https://api.census.gov/data/2023/acs/acs5/subject
- Key variables:
    - S2301_C04_001E: Unemployment rate
    - S2301_C01_001E: Labor Force Participation Rate

## Implementation Considerations
1. Implement caching to minimize Census API requests for the same census tract
2. Handle edge cases (missing tract IDs, API timeouts)
3. Add proper error handling for production use
4. Format percentages and currency values for readability
5. Consider adding more Census variables in future iterations
