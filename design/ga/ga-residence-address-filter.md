# Georgia Residence Address Filter: Technical Implementation

## Overview and Goals

The Georgia Residence Address Filter enables users to search for voters by specifying **one or more** address criteria sets. Each set uses interdependent, smart autocomplete fields. All options are dynamically sourced from the live voter registration database. The filter is designed for accuracy, performance, and a user-friendly experience, and is extensible for other states.

## Implementation Architecture

### Components

We implemented the following key components:

1. **AddressDataProvider** (`AddressDataProvider.tsx`)
   - React Context provider for address data management
   - Manages the state of current filter selections, search, and API data
   - Handles API calls with debouncing to prevent excessive requests
   - Auto-fills fields when a single matching record is found
   - Provides methods for updating fields and clearing selections

2. **ReactSelectAutocomplete** (`ReactSelectAutocomplete.tsx`)
   - Field-specific autocomplete component using shadcn UI's Command component
   - Connects to AddressDataProvider context for state and updates
   - Handles individual field selection, clearing, and search
   - Updates options dynamically based on current selections
   - Shows loading states and empty states appropriately

3. **CitySelect** (`CitySelect.tsx`)
   - Special component for City field selection
   - Gets filtered options based on current selections in other fields
   - Shows a dropdown of available cities
   - Prevents freeform input to ensure data integrity

4. **ResidenceAddressFilter** (`ResidenceAddressFilter.tsx`)
   - Main container component for the entire address filter system
   - Manages multiple address filter instances
   - Provides UI for adding and removing filter instances
   - Contains the dialog interface for building a new filter

## API Implementation

### Records Endpoint - `/ga/api/voter-address/records`

In our implementation, we use a single primary endpoint that serves both for fetching complete address records and for deriving field options:

- **Purpose:** Fetch address records based on current filter selections and extract unique field values
- **Method:** `GET`
- **Query Parameters:** 
  - Any combination of address fields as filters
  - Active search field and query for typeahead functionality
  - Example: `/ga/api/voter-address/records?residence_street_name=PEACHTREE&residence_city=ATLANTA`
- **Response:**
  ```json
  {
    "records": [
      {
        "residence_street_number": "123",
        "residence_pre_direction": "N",
        "residence_street_name": "PEACHTREE",
        "residence_street_type": "ST",
        "residence_post_direction": null,
        "residence_apt_unit_number": "4B",
        "residence_zipcode": "30303",
        "residence_city": "ATLANTA"
      },
      // ... more records (limited to 50)
    ]
  }
  ```

### Client-Side Processing

Rather than using a separate endpoint for field options, our implementation:

1. Fetches records from `/ga/api/voter-address/records` with the current filter and search params
2. Extracts unique values for each field from the returned records on the client side
3. Converts these unique values into option objects for each field
4. Updates the context state with these derived options

Example client-side processing (from AddressDataProvider):
```typescript
// Derive options for each field
const newOptions: Record<string, SelectOption[]> = {};
ADDRESS_FIELDS.forEach(field => {
  const uniqueValues = new Set<string>();
  fetchedRecords.forEach((record: AddressRecord) => {
    if (record[field]) uniqueValues.add(String(record[field]));
  });
  
  newOptions[field] = Array.from(uniqueValues)
    .sort((a, b) => a.localeCompare(b))
    .map(val => ({ value: val, label: val }));
});
```

### Implementation Notes:
- The endpoint is prefixed with `/ga` to support state-specific logic
- Results are always limited to 50 items for performance
- Field values are uppercased for consistency
- Database queries use WHERE clauses for filtering based on current selections
- Debouncing is implemented on the client side to prevent excessive requests
- Wildcard search is implemented on the server side for partial text matching

## Key Features Implemented

### Smart Interdependent Filtering

- Selecting a value in any field narrows options in other fields
- Each filter instance is isolated, with its own context provider
- Database queries filter based on current selections
- The UI updates dynamically as users make selections

### User Experience Improvements

- **Loading States:** Clear indicators when data is being fetched
- **Empty States:** Helpful messages when no options are found
- **Field Clearing:** Each field has an X button to clear its value
- **Error Handling:** Graceful handling of API failures
- **Debouncing:** Prevents excessive API calls during typing
- **Auto-filling:** When a single record matches, other fields can be auto-filled

### Clear All Functionality

- **Individual Field Clearing:** X button in each field to clear that field
- **Dialog Clear All Button:** Button in the dialog footer to clear all fields at once
- **Global Clear Button:** Option to clear all address filters in the main UI
- Clear functions properly reset state in the context provider

## Performance Considerations

- **Debounced API Calls:** Prevents excessive requests during typing
- **Limit on Results:** All queries include limits to prevent large result sets
- **Focused Queries:** Only the necessary data is fetched based on current selections
- **Efficient State Updates:** React state updates are batched where possible

## Error Handling

- API failures are caught and logged
- User-friendly error messages are displayed
- The UI remains functional even when API calls fail
- Option to retry failed requests

## Future Enhancements

- Implement type-ahead suggestions for faster selection
- Add keyboard navigation for better accessibility
- Support for additional address format standards
- Advanced filtering based on address proximity
- Integration with mapping services for visual selection
- Add dedicated field options endpoint to reduce payload size

---

This document reflects the actual implementation of the Georgia Residence Address Filter components. The system provides a robust, user-friendly way to filter voter records by address with smart, interdependent field filtering. 