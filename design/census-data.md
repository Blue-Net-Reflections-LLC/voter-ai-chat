# Integrate Census Data
We are going to denormalize Census Data into the voter_registration_to allow more comprehensive datapoints for the filtering

## Data Sources
- https://geocoding.geo.census.gov/geocoder/geographies/address?street=545%20chapman%20ln&city=Marietta&state=GA&benchmark=Public_AR_Current&vintage=Current_Current&layers=&format=json

We can use the census tract, or district values to find Census data via the Census Data API.

Hello!

Thank you for your interest in the Census Data API. Your API key is 03daa05a0a25133bea51761e8871b479f9fc0e40. Please click here to activate your key.

 Save this email for future reference.

Have Fun,

The Census Bureau API Team

Follow @uscensusbureau on twitter for API updates. 

## Census Data 

### Georgia, US
#### Import Education Attainment level
- Create a table to education_attainment
  - name: ga_census_education_attainment
  - fields (minimum):  id, census_tract, year, education_level (plain text), total, source, updated
  - Normalization not required
- Data Endpoint:  https://api.census.gov/data/2023/acs/acs5?get=group(B15003)&ucgid=1400000US13067030111
- Metadata Endpoint:  https://api.census.gov/data/2023/acs/acs5
- Datatable with fields:  https://data.census.gov/table/ACSDT5Y2023.B15003?t=Educational+Attainment&g=1400000US13067030111&y=2023
- Notes, we are only fetching the most recent data which is 2023
- We want to associate voters by census_tract=
- Only 24+ voters only  (filter, not import)
- Options: 
    - No schooling completed
    - Nursery school
    - Kindergarten
    - 1st grade
    - 2nd grade
    - 3rd grade
    - 4th grade
    - 5th grade
    - 6th grade
    - 7th grade
    - 8th grade
    - 9th grade
    - 10th grade
    - 11th grade
    - 12th grade, no diploma
    - Regular high school diploma
    - GED or alternative credential
    - Some college, less than 1 year
    - Some college, 1 or more years, no degree
    - Associate's degree
    - Bachelor's degree
    - Master's degree
    - Professional school degree
    - Doctorate degree

 #### Employment Rate
 - Datatable:  https://data.census.gov/table/ACSST5Y2023.S2301?t=Employment&g=1400000US13067030111&y=2023
 - Data Endpoint:  https://api.census.gov/data/2023/acs/acs5/subject?get=group(S2301)&ucgid=1400000US13067030111
 - Meta Endpoint: https://api.census.gov/data/2023/acs/acs5/subject
 - Create a table to track the total employment and unemployment rate for a census tract.
   - Name: ga_census_employment_status
   - Fields:
    - id
    - Year
    - Census Tract    - Total population
    - Labor Force Participation Rate
    - Employment/Population Ratio
    - Unemployment rate
