# Address Filter Enhancement: Support for Multiple Addresses

## Current Behavior
- The address filter currently supports filtering by a single address
- Address components are sent as individual URL parameters:
  - residenceStreetNumber
  - residenceStreetName
  - residenceStreetSuffix
  - residenceZipcode
  - residenceCity

## Required Enhancement
- Enable filtering by multiple addresses with additive (OR) logic between them
- Instead of individual parameters for each address component, use a composite parameter format:
  - `resident_address=545,,chapman,ln,,,marietta,30066&resident_address=355,,bell,st,,,marietta,30060`
- The composite parameter format represents these fields in order:
  - street_number,predir,name,type,postdir,apt,city,zipcode
- Empty values are represented by consecutive commas

## Implementation Guidelines
1. Maintain the existing address filter UI that's already working
2. Modify how the filter data is sent to the API when "Confirm Add" is clicked
3. Update the useVoterList hook's buildQueryParams function to format addresses as composite parameters
4. Ensure the API endpoint can parse these composite parameters correctly
5. Make minimal changes to the existing code

## What Not To Do
- Do not create new UI components or filters
- Do not modify the existing interface for adding address filters
- Do not change working code unrelated to how addresses are sent to the API

## Example
Current format:
```
/api/ga/voter/list?page=1&pageSize=25&sortField=name&sortDirection=asc&residenceStreetNumber=545&residenceStreetName=CHAPMAN&residenceStreetSuffix=LN&residenceZipcode=30066&residenceCity=MARIETTA
```

New format:
```
/api/ga/voter/list?page=1&pageSize=25&sortField=name&sortDirection=asc&resident_address=545,,CHAPMAN,LN,,,MARIETTA,30066&resident_address=355,,BELL,ST,,,MARIETTA,30060
```