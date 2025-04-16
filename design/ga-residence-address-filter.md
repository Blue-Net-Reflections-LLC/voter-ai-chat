# Georgia Residence Address Filter: Technical Approach

## Overview and Goals

The Georgia Residence Address Filter enables users to search for voters by address using a set of interdependent, smart autocomplete fields. All options are dynamically sourced from the live voter registration database. The filter is designed for accuracy, performance, and a user-friendly experience, and is extensible for other states.

## API Endpoint Design

- **Prefix:** All endpoints are prefixed with `/ga` to support state-specific logic.
- **Base Path:** `/ga/api/voter-address/fields`
- **Method:** `GET`
- **Query Parameters:**
  - `field`: The address part to fetch options for (e.g., `street_name`, `street_number`, `pre_direction`, `street_type`, `post_direction`, `apt_unit_number`, `zipcode`, `city`)
  - Other address fields as filters (e.g., `city=Atlanta&street_name=PEACHTREE`)
- **Response Shape:**
  ```json
  {
    "field": "street_name",
    "values": ["PEACHTREE", "MARTIN LUTHER KING JR", ...] // up to 50 items
  }
  ```
- **Example:**
  - `/ga/api/voter-address/fields?field=street_name&city=Atlanta&zipcode=30303`
  - Returns up to 50 street names in Atlanta, 30303.

## Database Query Strategy

- Use the `GA_VOTER_REGISTRATION_LIST` table.
- For each field, query `SELECT DISTINCT` for that column, applying `WHERE` filters for all other selected fields.
- Always `LIMIT 50` for performance.
- Example SQL:
  ```sql
  SELECT DISTINCT street_name
  FROM GA_VOTER_REGISTRATION_LIST
  WHERE city = 'ATLANTA' AND zipcode = '30303'
  LIMIT 50;
  ```
- All values should be uppercased for consistency.

## Frontend Component Logic

- Each address part is an autocomplete/select field.
- User must select from the list (no freeform input).
- As the user selects a value in any field, the component fetches new options for all other fields, filtered by the current state.
- If a field has only one possible value, it is auto-selected and focus moves to the next logical field.
- City is always a select, and if only one value remains, it is visually highlighted.
- All autocomplete lists are capped at 50 items.
- If a user clears a field, dependent fields are reset as needed.

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

- Use a custom React hook (e.g., `useVoterFilters`) to manage all filter state, including address fields.
- The hook:
  - Reads initial filter state from the URL query params on page load (hydration).
  - Updates the URL query params whenever filter state changes (using Next.js router or similar).
  - Exposes `[filterState, setFilterState]` to the filter panel and child components.
  - Ensures that the UI is always in sync with the URL, enabling shareable/bookmarkable links and back/forward navigation.
  - Can be reused across pages (list, map, dashboard, etc.).
- Example usage:
  ```js
  const [filters, setFilters] = useVoterFilters();
  // filters = { residence_street_name: 'PEACHTREE', city: 'ATLANTA', ... }
  ```
- When a filter is changed, the hook updates both the state and the URL, and triggers any necessary data fetching.
- The backend API should accept the same query params for filtering.

## Support for Residence and Mailing Address Filters

- The system supports two distinct types of address data for a voter: **residence** and **mailing**.
- Filter logic, state, and API endpoints should be designed to support both address types, with clear field prefixes or grouping (e.g., `residence_street_name`, `mailing_street_name`).
- The UI and API should be easily extensible to add a mailing address filter in the future, using the same smart, interdependent logic as the residence address filter.
- All documentation, endpoints, and filter state should clearly delineate between residence and mailing address fields.

---

This document serves as a technical reference for both backend and frontend teams implementing the Georgia Residence Address Filter. 