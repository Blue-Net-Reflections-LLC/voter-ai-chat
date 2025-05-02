# GA Mapping Requirements

## Objective
Integrate an interactive map visualization as a new tab within the Georgia voter exploration tool. This map will display the geographic distribution of voter addresses based on the currently applied filters, providing a spatial context to the data available in the List and Stats views.

## Functional Requirements

- **Map Tab:**
  - The map will reside in its own dedicated tab (`/ga/voter/map`), accessible alongside the "List" (`/ga/voter/list`) and "Stats" (`/ga/voter/stats`) tabs.
  - It will share the same filter panel and filter state context as the other tabs. Changes in the filter panel should update the map.
- **Data Display:**
  - The map will display points representing unique *residence addresses* (at high zoom) or aggregated areas (county, zip) that match the active filters. It does **not** show one point per individual voter at lower zoom levels.
  - Data points are derived from the `geom` column (Point geometry, SRID 4326) in the `ga_voter_registration_list` table, which is populated via the geocoding process (`lib/ga-voter-registration/import/geocode-addresses.ts`).
- **Interactivity:**
  - **Dynamic Updates:** When filters are applied or changed in the shared filter panel, the map must initiate an update (debounced for zoom/pan).
  - **Zoom/Pan:** Users must be able to zoom and pan the map using standard map controls.
  - **Auto-Zoom/Fit:** When filter results are loaded after a filter change, the map view should automatically adjust its extent (zoom and center) to optimally display the resulting points or aggregated shapes.
  - **Point Click -> Popup:** When a user clicks on a map point (representing an address), a popup/infowindow should appear.
    - This popup must display key details for **all** registered voters residing at that specific address location.
    - Required voter details in the popup (fetched via `/api/ga/voter/details-at-location`):
      - Voter Registration ID (linked to their profile page `/ga/voter/profile/[voterId]`)
      - Full Name
    - The popup should also display the formatted address.
- **Data Loading (Standard Fetch):**
  - Map data (GeoJSON features for addresses or aggregated areas) must be loaded from the backend using a standard `fetch` request to the `/api/ga/voter/map-data` endpoint.
  - This endpoint determines the appropriate aggregation level based on zoom and applies filters before returning the GeoJSON.
- **Loading Indicator:**
    - While the map is actively fetching data (e.g., after a filter change or map interaction initiates a fetch), a thin (e.g., 3px height) visual progress bar must be displayed horizontally across the top of the main content area, just below the tab navigation.
    - This progress bar serves as an indeterminate indicator, showing that the map is currently updating.
    - The progress bar should disappear once the fetch request completes and the map rendering is finished.

### Performance Strategy: Zoom-Dependent Aggregation & Bounding Box Filtering

To handle potentially large datasets efficiently and provide a responsive user experience, the map will implement the following strategy. This operates *after* the user's sidebar filters (e.g., Race, Status, Age) have been applied to the underlying voter data.

1.  **Map View Bounding Box Filtering (Performance Optimization):**
    *   On map interactions (pan/zoom end), the frontend will capture the current map view's geographic bounding box.
    *   This bounding box will be sent as query parameters to the backend API (`/api/ga/voter/map-data`).
    *   The backend will use these bounds to spatially filter the *already sidebar-filtered* voter data. This ensures only data potentially visible within the current map view (plus a small buffer) is considered for aggregation and transmission, significantly reducing the load.
    *   **Crucially, this map-view filtering does not affect or change the user's selections in the main filter panel.**

2.  **Zoom-Dependent Aggregation (Backend):**
    *   The frontend will also send the current map `zoom` level as a query parameter to the API.
    *   Based on the received `zoom` level, the backend API will dynamically aggregate the voter address data (which has already been filtered by both sidebar criteria *and* the map's bounding box). The aggregation groups data based on the administrative/statistical areas defined by the pre-loaded boundary shapefiles:
        *   **Zoom < 6 (State/Region View):** Aggregate filtered addresses by **County** (using `tl_2024_us_county` boundaries). The API returns one GeoJSON polygon feature per county within the bounding box that contains matching voters, with a `count` property and county name.
        *   **Zoom 6-11 (County/Zip View):** Aggregate filtered addresses by **Zip Code / ZCTA** (using `tl_2024_us_zcta520` boundaries). The API returns one GeoJSON polygon feature per ZCTA containing matching voters, with a `count` and zip code.
        *   **Zoom >= 11 (Street Level View):** Return **individual unique addresses**. The API returns one point per unique geocoded address (`geom`) that matches the sidebar filters and falls within the bounding box. It includes a `count` property indicating the number of filtered voters at that address.
    *   The GeoJSON features returned by the backend will always include:
        *   Geometry (`Polygon` for aggregated levels, `Point` for addresses).
        *   Properties:
            *   `aggregationLevel`: ('county', 'zip', 'address')
            *   `count`: Number of unique addresses (or voters at an address for the lowest level) represented by this feature, matching all active filters.
            *   `label`: (e.g., County Name, Zip Code, Full Address - depending on aggregation level)
            *   `id`: GeoID for County or ZCTA for Zip (used for styling).

3.  **Frontend Display and Interaction:**
    *   The frontend `MapboxMapView` will receive these aggregated (or individual) GeoJSON features from the `fetch` request.
    *   Features will be styled differently based on the `aggregationLevel` and `count` (e.g., fill color for polygons, circle size/color for points). Labels might be shown directly on the map (e.g., zip codes).
    *   **Click Behavior:**
        *   **Clicking an Aggregated Polygon (County, Zip):** No specific interaction defined yet (map zooms naturally).
        *   **Clicking an Individual Address Point:** Will trigger the popup displaying details for all voters at that address, as previously defined.

This combined approach significantly reduces the data transferred and rendered, improving performance, especially at lower zoom levels, while still allowing users to drill down to specific address details. It shifts the aggregation complexity to the backend, which is generally better suited for handling large datasets.

## Technical Requirements

- **Mapping Library:** Use **Mapbox GL JS** ([Mapbox GL JS Docs](https://docs.mapbox.com/mapbox-gl-js/guides/)) via the **`react-map-gl`** wrapper library ([react-map-gl Docs](https://visgl.github.io/react-map-gl/)) for high-performance map rendering and interactions.
- **Authentication:** Requires a **Mapbox Access Token**. This token must be configured using the `NEXT_PUBLIC_MAPBOX_TOKEN` environment variable.
- **Basemap:** Utilize a standard Mapbox style (e.g., `mapbox://styles/mapbox/dark-v11`).
- **Data Preparation (Prerequisite):**
  - To enable efficient zoom-level aggregation (by County, Zip Code) in the backend API, the `ga_voter_registration_list` table must be pre-processed.
  - A one-time script (`lib/ga-voter-registration/import/enrich-voter-boundaries.ts`) should be run after loading initial voter data and boundary shapefiles (Counties - `tl_2024_us_county`, ZCTAs - `tl_2024_us_zcta520`) into the database.
  - This script uses PostGIS spatial joins (`ST_Within`) to populate new columns in the `ga_voter_registration_list` table (e.g., `county_fips`, `county_name`, `zcta`) with the corresponding geographic identifiers for each voter's residence location (`geom`).
  - This denormalization allows the runtime API to quickly filter and group voters by these boundaries without performing expensive spatial joins on every map request.
- **Backend API:** A dedicated standard `GET` endpoint (`/api/ga/voter/map-data`) will serve the GeoJSON map data. It uses the `buildVoterListWhereClause` helper and zoom/bounds parameters to query the database. *This API relies on the pre-enriched geographic columns mentioned above for aggregation.*
- **Frontend Framework:** Integration within the existing Next.js/React application structure.
- **Caching:** Caching is not currently implemented for the map data API.

## Non-Requirements (Initially)

- Drawing custom shapes on the map to filter.
- Advanced spatial analysis features beyond point display and popups.
- Displaying individual voters as separate points (except at high zoom).
- Toggleable overlay layers (e.g., district boundaries) - designated as a future task.

Task List
---
**Note:** Implementation using Mapbox GL JS and react-map-gl.

### 1. Cleanup Previous Library
- [x] Task: Uninstall `@arcgis/core` using `pnpm remove @arcgis/core`.
- [x] Task: Remove ArcGIS CSS import from `app/globals.css`.
- [x] Task: Delete the old map component `components/ga/voter/map/MapView.tsx`.

### 2. Setup & Basic Map (Mapbox)
- [x] Task: Install `mapbox-gl` and `react-map-gl`.
- [x] Task: Add Mapbox CSS import to global styles (`app/globals.css` or root layout).
- [x] Task: Configure Mapbox Access Token (`NEXT_PUBLIC_MAPBOX_TOKEN`) in environment variables.
- [x] Task: Create new Mapbox component `components/ga/voter/map/MapboxMapView.tsx`.
- [x] Task: Implement basic `<Map>` component from `react-map-gl` within `MapboxMapView.tsx`, configuring the access token and initial view state (center, zoom, style).
- [x] Task: Update `app/ga/voter/map/page.tsx` to dynamically import and render `MapboxMapView.tsx` (client-side only).

### 3. Backend API (Standard Fetch)
- [x] Task: Create API route `app/api/ga/voter/map-data/route.ts`.
- [x] Task: Implement standard GET request handler.
- [x] Task: Integrate shared `buildVoterListWhereClause` builder.
- [x] Task: Implement zoom/bounds parameter handling.
- [x] Task: Implement zoom-dependent aggregation logic (County/Zip/Address).
- [x] Task: Return GeoJSON FeatureCollection.
- [x] Task: Implement error handling.
- [-] Task: Implement In-Memory Batch-Level Cache Logic. *(Removed/Not Implemented)*
- [-] Task: Set up route handler for SSE with `ReadableStream`. *(Removed/Not Implemented)*
- [-] Task: Implement parallel batching DB query. *(Removed/Not Implemented)*
- [-] Task: Implement parallel streaming logic. *(Removed/Not Implemented)*
- [-] Task: Add `end` event message. *(Removed/Not Implemented)*

### 4. Frontend Data Integration (Fetch with Mapbox)
- [x] Task: Handle `fetch` Request Lifecycle in `MapboxMapView.tsx`.
- [x] Task: Add Mapbox `<Source>` Component for Voter Data (`type: 'geojson'`).
- [x] Task: Add Mapbox `<Layer>` Components to Visualize Voter Data (points, polygons, labels).
    - [x] Configure paint/layout properties for different aggregation levels.
- [x] Task: Implement `useEffect` hooks triggered by filter changes and map interactions (debounced):
    - [x] Abort previous fetch requests.
    - [x] Clear current GeoJSON feature array/state (`setVoterFeatures`).
    - [x] Set loading state `true`.
    - [x] Build API URL with filters, zoom, and bounds.
    *   [x] Initiate `fetch` request.
    *   [x] Handle successful response: Parse GeoJSON, update `voterFeatures` state, clear loading state.
    *   [x] Handle errors: Clear loading state, log error.
- [x] Task: Implement map view adjustment (`mapRef.current?.flyTo(...)`) to zoom to data extent after filter changes.
- [x] Task: Implement loading indicator UI (ProgressBar in `map/page.tsx` driven by `isLoading` from context).

### 5. Map Interactions & Features (Mapbox)
- [x] Task: Add click handler to the address point layer (`<Layer interactive={true} onClick={...}>`).
- [x] Task: In the click handler, identify the clicked address feature.
- [x] Task: Fetch detailed voter data for that address using `/api/ga/voter/details-at-location`.
- [x] Task: Add component state to manage popup info (lat, lon, content).
- [x] Task: Render a `<Popup>` component from `react-map-gl` based on popup state, displaying formatted voter details and address.

### 6. Overlays (Future Task)
- [-] Task (Low Priority): Add UI toggle for district layers.
- [-] Task (Low Priority): Implement district layer fetching and display.

### 7. Refinement & Review
- [ ] Task: Test performance, stability, and UX.
- [ ] Task: Implement smarter zoom/pan control (e.g., avoid refetching if zoom crosses aggregation thresholds but bounds haven't significantly changed).
- [ ] Task: Improve loading experience: Avoid clearing layers before fetch to reduce flashing; enhance loading indicator.
- [ ] Task: Re-evaluate and potentially re-introduce SSE for data loading if backend query performance is confirmed fast and JSON generation/transfer is the bottleneck.
- [ ] Task: Code review, cross-browser/device testing.
- [ ] Task: Update documentation.

## Change Requests

- **CR-001: Display In-View Participation Score & Voter Count (Completed)**
  - **Requirement:** Display the average Participation Score and the total count of voters currently visible within the map's bounding box, respecting all active sidebar filters.
  - **Implementation:** 
    - Modified the `/api/ga/voter/map-data` endpoint to calculate `AVG(participation_score)` and `COUNT(*)` based on the combined sidebar and bounding box filters.
    - Updated the API response to include an `inViewStats: { score: number|null, voterCount: number|null }` object alongside the `geoJson`.
    - Updated `MapboxMapView.tsx` to store these stats in local state (`inViewScoreData`).
    - Added an overlay `div` positioned in the top-right corner of the map to display the `score` (using `ParticipationScoreWidget`) and `voterCount`.
  - **Status:** Completed.

