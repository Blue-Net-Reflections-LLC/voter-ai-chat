# Technical Specification: District Lookup API Endpoint (Batch Processing)

## 1. Overview

This document outlines the technical requirements for a server-side API endpoint designed to determine the US Congressional and state legislative districts for **multiple locations** in a single request. Input locations can be provided as full addresses, zip codes, or city names (with state context derived server-side). This endpoint is intended for integration into external sites or services needing district information for batches of user inputs.

The core functionality for *each location* follows a unified, two-step process executed server-side:
1.  Utilize the Google Maps Geocoding API to convert the input location (address, zip code, or city + derived state) into precise coordinates (latitude/longitude) and a normalized address.
2.  Use these coordinates to query the US Census Bureau's Geocoding API to retrieve the corresponding district boundaries.
This approach ensures robust location resolution, handles batch processing, and keeps all API keys secure on the server.

## 2. Endpoint Definition

*   **URL:** `/api/districts/lookup/batch` (Updated URL to reflect batch nature)
*   **HTTP Method:** `POST`
*   **Content-Type:** `application/json`

## 3. Request Body Format

The request body must be a JSON **array** of location objects. Each object in the array must contain *one* of the following primary inputs: `address`, `zipCode`, or `city`. **If `city` is provided, `state` is also required.**

```json
[
  {
    "address": "Optional[string]: A full street address",
    "zipCode": "Optional[string]: A 5-digit or 9-digit US zip code",
    "city": "Optional[string]: City name",
    "state": "Optional[string]: 2-letter state abbreviation (REQUIRED if 'city' is the primary input)",
    "requestId": "Optional[string | number]: Client-provided identifier to correlate request/response items"
  },
  // ... more location objects
]
```

**Constraints:**

*   The request body MUST be an array.
*   Each object in the array must contain exactly one of `address`, `zipCode`, or `city` as the primary input.
*   If `city` is the primary input, the `state` field **must** also be provided and contain a valid 2-letter US state abbreviation.
*   If `zipCode` is the primary input, it must be a valid US zip code format (`^\d{5}(-\d{4})?$`). The optional `state` field can provide context but isn't strictly required for zip lookups.
*   **Maximum Batch Size:** The array should contain no more than **50** location objects per request (configurable server-side). Requests exceeding this limit will be rejected.
*   `requestId`: If provided by the client, this ID should be echoed back in the corresponding result/error object in the response array to help with correlation.

## 4. Response Body Format

### 4.1. Success Response (`200 OK`)

Indicates the batch request was successfully processed (though individual lookups within the batch may have failed). Returns a JSON **array** containing result objects or error objects, corresponding positionally to the input array.

```json
[
  // Result for input[0]
  {
    "requestId": "string | number | null: Echoed from the request object",
    "status": "success",
    "query": {
      "address": "string | null",
      "zipCode": "string | null",
      "city": "string | null",
      "state": "string | null"
    },
    "normalizedAddress": "string | null",
    "coordinates": {
      "latitude": "number | null",
      "longitude": "number | null"
    },
    "districts": {
      "congressionalDistrict": "string | null",
      "stateLegislativeDistrictUpper": "string | null",
      "stateLegislativeDistrictLower": "string | null"
    }
  },
  // Error for input[1]
  {
    "requestId": "string | number | null: Echoed from the request object",
    "status": "error",
    "error": {
        "code": "string: e.g., GOOGLE_GEOCODING_FAILED",
        "message": "string: User-friendly error message"
    }
  },
  // ... more results or errors corresponding to input array
]
```

**Structure Notes:**

*   The response is an array with the same number of elements as the input array.
*   Each element in the response array corresponds to the location object at the same index in the input array.
*   Each element will have a `status` field: `"success"` or `"error"`.
*   If `status` is `"success"`, the object contains the fields defined in the previous single-lookup spec (query, normalizedAddress, coordinates, districts).
*   If `status` is `"error"`, the object contains an `error` field with `code` and `message`.
*   The `requestId`, if provided in the input object, is echoed back.
*   The `districts` object contains the full **GEOID** values for the respective districts as determined by the Census API.

### 4.2. Overall Request Error Response (`4xx` or `5xx`)

These errors apply to the entire batch request, not individual lookups.

```json
// Example: 400 Bad Request (Invalid JSON format, Array too large)
{
  "error": {
    "code": "string: e.g., 'INVALID_BATCH_REQUEST', 'BATCH_SIZE_EXCEEDED', 'UNAUTHORIZED'",
    "message": "string: A user-friendly error message"
  }
}
```

## 5. Core Logic / Workflow (Batch Flow)

1.  **Receive Request:** Accept the `POST` request at `/api/districts/lookup/batch`.
2.  **Parse & Validate Batch Request:**
    *   Attempt to parse the request body as a JSON array. If parsing fails, return `400 Bad Request` (`INVALID_BATCH_REQUEST`).
    *   Check if the array size exceeds the maximum batch limit (e.g., 50). If exceeded, return `400 Bad Request` or `413 Payload Too Large` (`BATCH_SIZE_EXCEEDED`).
3.  **Process Each Location:** Iterate through the input array of location objects.
    *   For **each** location object:
        *   **a. Validate Input & Determine Primary:** Perform validation. Check if exactly one primary key (`address`, `zipCode`, `city`) exists. If `city` is primary, check if `state` is also provided and valid. If invalid, create an error result object (`INVALID_INPUT`) for this item and continue to the next item.
        *   **b. Step 1: Geocode with Google Maps:** Perform the Google Maps geocoding call using the primary input (address, zipCode, or city+state). If it fails, create an error result object (`GOOGLE_GEOCODING_FAILED`) for this item and continue.
        *   **c. Step 2: Lookup Districts with Census:** Perform the Census geocoding call using coordinates. If it fails, create an error result object (`CENSUS_GEOCODING_FAILED`) for this item and continue.
        *   **d. Format Success:** If both steps succeed, format the successful result object.
        *   **e. Add Result/Error to Response Array:** Add the result/error object to a response array, maintaining order.
4.  **Return Response Array:** Send the `200 OK` response with the final array.

## 6. Data Sources

*(Data sources remain the same: Google Maps Geocoding API and Census Geocoding API, used iteratively for each item in the batch)*

*   **Step 1 - Geocoding/Normalization:** Google Maps Geocoding API (Web Service)
    *   URL: `https://maps.googleapis.com/maps/api/geocode/json`
    *   Role: Converts input address, zip code, or city+state into latitude, longitude, and a normalized formatted address.
    *   Authentication: API Key (Secure, Server-side key required).
*   **Step 2 - District Lookup:** US Census Bureau Geocoding Services API
    *   URL: `https://geocoding.geo.census.gov/geocoder/`
    *   Role: Uses latitude/longitude (obtained from Google Maps) to find corresponding geographical boundaries (Congressional District, State Legislative Districts).
    *   Relevant Endpoint: `/geographies/coordinates`
    *   Authentication: None (public API).

## 7. Error Handling

### 7.1. Overall Batch Request Errors

| Status Code | Error Code                 | Condition                                       | Message Suggestion                          |
| :---------- | :------------------------- | :---------------------------------------------- | :------------------------------------------ |
| `400`       | `INVALID_BATCH_REQUEST`    | Request body is not a valid JSON array        | "Invalid request format. Expected JSON array." |
| `400` / `413` | `BATCH_SIZE_EXCEEDED`      | Input array contains too many locations       | "Maximum batch size exceeded (Limit: 50)."    |
| `500`       | `INTERNAL_SERVER_ERROR`    | Unexpected server-side error during batch setup | "An internal server error occurred."      |

### 7.2. Individual Item Errors (within `200 OK` response array)

| Item `status` | Item `error.code`          | Condition                                                 | Item `error.message` Suggestion                          |
| :------------ | :------------------------- | :-------------------------------------------------------- | :--------------------------------------------------------- |
| `"error"`     | `INVALID_INPUT`            | Missing/ambiguous primary input, city without state, invalid zip format, invalid state format | "Invalid input. Provide address OR zipCode OR (city AND state). Check formats." |
| `"error"`     | `GOOGLE_GEOCODING_FAILED`  | Google Maps API returned no match for input location      | "Could not resolve the provided location (Google)."        |
| `"error"`     | `CENSUS_GEOCODING_FAILED`  | Census API returned no match for coordinates              | "Could not find district information for the location."    |
| `"error"`     | `GOOGLE_API_ERROR`         | Google Maps API call failed (non-200, denied)            | "Error communicating with the location service (Google)."  |
| `"error"`     | `CENSUS_API_ERROR`         | Census API call failed (non-200)                          | "Error communicating with the district data service (Census)."|

## 8. API Keys & Security

*   **Google Maps Server API Key (`GOOGLE_MAPS_SERVER_API_KEY`):**
    *   Used by the server to authenticate with the Google Maps Geocoding API.
    *   Must be stored securely (e.g., environment variables).
    *   Requires "Geocoding API" enabled in Google Cloud.
    *   Should have server-side restrictions (e.g., IP address) configured.
    *   **Never** expose in client-side code.
*   **Census API Usage:** Public, adhere to usage policies.
*   **Input Sanitization:** Sanitize input parameters.

## 9. Caching (Recommended)

*(Caching logic applies per-item within the batch)*

*   Implement server-side caching for **both** Google Maps API and Census API responses.
*   Before calling Google Maps for an item, check the cache using the primary input (address, zip/city/state, or city + derived state) as the key.
*   Before calling Census for an item, check the cache using the latitude/longitude obtained from Google as the key.
*   Store successful results in the cache after external API calls.
*   Set appropriate Time-To-Live (TTL) values (e.g., 1 hour to 1 day).

## 10. Example Request / Response (Batch)

### Example Batch Request

```json
// POST /api/districts/lookup/batch
// Headers: { "Content-Type": "application/json" } // No X-API-Key needed
[
  {
    "address": "1 Dr Carlton B Goodlett Pl, San Francisco, CA 94102",
    "requestId": "req-123"
  },
  {
    "zipCode": "90210",
    // "state": "CA", // Optional with zip
    "requestId": "req-124"
  },
  {
    "city": "Atlanta",
    "state": "GA", // REQUIRED with city
    "requestId": "req-125"
  },
  {
    "zipCode": "00000" // Invalid zip for error example
  }
]
```

### Example Batch Success Response (`200 OK`)

```json
// 200 OK
[
  {
    "requestId": "req-123",
    "status": "success",
    "query": { "address": "1 Dr Carlton B Goodlett Pl, San Francisco, CA 94102", "zipCode": null, "city": null, "state": "CA" },
    "normalizedAddress": "1 Dr Carlton B Goodlett Pl, San Francisco, CA 94102, USA",
    "coordinates": { "latitude": 37.7790, "longitude": -122.4191 },
    "districts": { "congressionalDistrict": "0611", "stateLegislativeDistrictUpper": "06011", "stateLegislativeDistrictLower": "06017" }
  },
  {
    "requestId": "req-124",
    "status": "success",
    "query": { "address": null, "zipCode": "90210", "city": null, "state": "CA" }, 
    "normalizedAddress": "Beverly Hills, CA 90210, USA",
    "coordinates": { "latitude": 34.0901, "longitude": -118.4065 },
    "districts": { "congressionalDistrict": "0636", "stateLegislativeDistrictUpper": "06024", "stateLegislativeDistrictLower": "06051" }
  },
  {
    "requestId": "req-125",
    "status": "success",
    "query": { "address": null, "zipCode": null, "city": "Atlanta", "state": "GA" },
    "normalizedAddress": "Atlanta, GA, USA",
    "coordinates": { "latitude": 33.7490, "longitude": -84.3880 },
    "districts": { "congressionalDistrict": "1305", "stateLegislativeDistrictUpper": "13039", "stateLegislativeDistrictLower": "13058" }
  },
  {
    "requestId": null,
    "status": "error",
    "error": { "code": "GOOGLE_GEOCODING_FAILED", "message": "Could not resolve the provided location (Google)." }
  }
]
```