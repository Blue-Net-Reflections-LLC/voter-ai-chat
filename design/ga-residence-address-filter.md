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

## API Endpoint Implementation

- **Base Path:** `/ga/api/voter-address/records` - fetches complete address records
- **Method:** `GET`
- **Query Parameters:** Any combination of address fields (e.g., `residence_street_name=PEACHTREE&residence_city=ATLANTA`)
- **Response Shape:**
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
      // ... more records
    ]
  }
  ```

- **Field-Specific Endpoint:** `/ga/api/voter-address/fields`
- **Method:** `GET`
- **Query Parameters:**
  - `field`: The address field to get values for (e.g., `residence_street_name`)
  - `query`: Optional search term to filter values (using SQL LIKE)
  - Additional filter parameters as needed
- **Response Shape:**
  ```json
  {
    "values": ["PEACHTREE", "MARTIN LUTHER KING JR", ...]
  }
  ```

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

## API Endpoint Design

- **Prefix:** All endpoints are prefixed with `/ga` to support state-specific logic.
- **Base Path:** `/ga/api/voter-address/fields`
- **Method:** `GET`
- **Query Parameters:**
  - `field`: The address part to fetch options for (e.g., `street_name`, `street_number`, `pre_direction`, `street_type`, `post_direction`, `apt_unit_number`, `zipcode`, `city`)
  - Other address fields *from the specific address filter being edited* as filters (e.g., `city=Atlanta&street_name=PEACHTREE`)
- **Response Shape:**
  ```json
  {
    "field": "street_name",
    "values": ["PEACHTREE", "MARTIN LUTHER KING JR", ...] // up to 50 items, sorted alphabetically for city
  }
  ```
- **Example:**
  - `/ga/api/voter-address/fields?field=street_name&city=Atlanta&zipcode=30303`
  - Returns up to 50 street names matching the provided city and zipcode in that specific filter.

## Database Query Strategy

- Use the `GA_VOTER_REGISTRATION_LIST` table.
- For each field within a *specific address filter*, query `SELECT DISTINCT` for that column, applying `WHERE` filters for all other fields *selected within that same filter instance*.
- Always `LIMIT 50` for performance.
- Sort `city` results alphabetically.
- Example SQL (fetching street names for a filter where city='ATLANTA' and zipcode='30303'):
  ```sql
  SELECT DISTINCT street_name
  FROM GA_VOTER_REGISTRATION_LIST
  WHERE city = 'ATLANTA' AND zipcode = '30303'
  LIMIT 50;
  ```
- All values should be uppercased for consistency.

## Frontend Component Logic (`ResidenceAddressFilter.tsx`)

- Manages a **list** of `AddressFilter` objects.
- Provides an "Add Address Filter" button that triggers a popover (`components/ui/popover.tsx`) to confirm adding a new, empty filter object to the list.
- Each `AddressFilter` object in the list is rendered as a separate UI block.
- Within each block:
    - Each address part is an autocomplete/select field (`ReactSelectAutocomplete`, `CitySelect`).
    - User must select from the list (no freeform input).
    - As the user selects a value in any field, the component fetches new options for *other fields within the same block*, filtered by the current state of *that specific block*.
    - **City Field (`CitySelect`):**
        - If no other fields *in that specific block* have values, list all available cities (sorted alphabetically).
        - If other fields *in that block* have values, constrain the city list based on those values.
    - If a field (excluding city) has only one possible value after filtering, it can optionally be auto-selected (TBD based on UX testing).
    - If the city field has only one possible value after filtering, it should be visually highlighted but likely not auto-selected to avoid confusion.
    - All autocomplete lists are capped at 50 items.
    - If a user clears a field, dependent fields *within the same block* are cleared/reset.
- Each filter block has a "Remove" button.
- A "Clear All Address Filters" button removes all blocks.

## Error Handling and Performance

- If the API returns an error, show a user-friendly message and allow retry.
- If no results are found, show "No options found".
- Debounce API calls on user input to avoid excessive requests.
- Cache recent queries/results in the frontend for smoother UX.

## Extensibility for Other States

- The `/ga` prefix allows for parallel endpoints for other states (e.g., `/tx/api/voter-address/fields`).
- Each state can implement its own logic and data model as needed.
- The frontend should be able to switch endpoints based on the selected state.

## Open Questions / Implementation Notes

- Should the API return additional metadata (e.g., counts, display labels) for each value?
- Should the frontend prefetch likely options for the next field when a value is selected?
- How should we handle address normalization (e.g., abbreviations, casing) for user input and display?
- What is the best UX for mobile users with many address options?

## Filter State Management: Custom Hook & URL Synchronization

- Use a custom React hook (e.g., `useVoterFilters`) to manage all filter state.
- This hook now manages an **array** of `AddressFilter` objects under a key like `residence_addresses`.
- Each `AddressFilter` object in the array needs a unique client-side ID for React keys.
- The hook:
  - Reads initial filter state from the URL query params on page load. This requires a serialization/deserialization strategy for the array of address filters (e.g., JSON stringification or multiple params like `addr1_city=Atlanta&addr1_zip=30303&addr2_city=...`).
  - Updates the URL query params whenever filter state changes.
  - Exposes state and functions to add, update, and remove specific `AddressFilter` objects from the array, and to clear all of them.
  - Ensures that the UI is always in sync with the URL.
- Example state structure:
  ```js
  {
    county: ['COBB'],
    // ... other filters
    residence_addresses: [
      { id: 'uid1', residence_street_name: 'PEACHTREE', residence_city: 'ATLANTA' },
      { id: 'uid2', residence_zipcode: '30067' }
    ]
  }
  ```
- When applying filters to the main voter list query, the backend needs to interpret the array of address filters as additive conditions (e.g., `(addr1_conditions) AND (addr2_conditions)`).

## Support for Residence and Mailing Address Filters

- The system supports two distinct types of address data for a voter: **residence** and **mailing**.
- Filter logic, state, and API endpoints should be designed to support both address types, with clear field prefixes or grouping (e.g., `residence_street_name`, `mailing_street_name`).
- The UI and API should be easily extensible to add a mailing address filter in the future, using the same smart, interdependent logic as the residence address filter.
- All documentation, endpoints, and filter state should clearly delineate between residence and mailing address fields.

---

This document reflects the actual implementation of the Georgia Residence Address Filter components. The system provides a robust, user-friendly way to filter voter records by address with smart, interdependent field filtering. 