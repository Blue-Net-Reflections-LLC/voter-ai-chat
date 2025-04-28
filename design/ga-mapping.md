# GA Mapping Requirements

## Objective
Integrate an interactive map visualization as a new tab within the Georgia voter exploration tool. This map will display the geographic distribution of voter addresses based on the currently applied filters, providing a spatial context to the data available in the List and Stats views.

## Functional Requirements

- **Map Tab:**
  - The map will reside in its own dedicated tab (`/ga/voter/map`), accessible alongside the "List" (`/ga/voter/list`) and "Stats" (`/ga/voter/stats`) tabs.
  - It will share the same filter panel and filter state context as the other tabs. Changes in the filter panel should update the map.
- **Data Display:**
  - The map will display points representing unique *residence addresses* that match the active filters. It does **not** show one point per individual voter.
  - Data points are derived from the `geom` column (Point geometry, SRID 4326) in the `ga_voter_registration_list` table, which is populated via the geocoding process (`lib/ga-voter-registration/import/geocode-addresses.ts`).
- **Interactivity:**
  - **Dynamic & Progressive Updates:** When filters are applied or changed in the shared filter panel, the map must initiate an update (debounced). The display should **progressively update** as data arrives from the backend via SSE, providing immediate visual feedback rather than waiting for the full dataset.
  - **Zoom/Pan:** Users must be able to zoom and pan the map using standard map controls.
  - **Auto-Zoom:** When the full set of filter results has been loaded (SSE stream completes), the map view should automatically adjust its extent (zoom and center) to optimally display all the resulting points.
  - **Point Click -> Popup:** When a user clicks on a map point (representing an address), a popup/infowindow should appear.
    - This popup must display key details for **all** registered voters residing at that specific address location.
    - Required voter details in the popup:
      - Voter Registration ID (linked to their profile page `/ga/voter/profile/[voterId]`)
      - Full Name
      - Full Residence Address
      - Registration Status
      - Race
      - Age
      - Gender
- **Data Loading (SSE & Performance):**
  - Map data (GeoJSON features for addresses) must be loaded from the backend using Server-Sent Events (SSE). This allows the frontend to **render points incrementally** as they arrive via the SSE stream, significantly improving perceived performance and responsiveness, especially for large datasets. The user should see the map populate progressively.
- **Loading Indicator:**
    - While the map is actively fetching and rendering data via the SSE stream (i.e., after a filter change initiates the stream and before the stream completes), a thin (e.g., 3px height) visual progress bar must be displayed horizontally across the top of the main content area, just below the tab navigation.
    - This progress bar serves as an indeterminate indicator, showing that the map is currently updating.
    - The progress bar should disappear once the SSE stream is closed and the map rendering is complete.

### Performance Strategy: Zoom-Dependent Aggregation & Bounding Box Filtering

To handle potentially large datasets efficiently and provide a responsive user experience, the map will implement the following strategy. This operates *after* the user's sidebar filters (e.g., Race, Status, Age) have been applied to the underlying voter data.

1.  **Map View Bounding Box Filtering (Performance Optimization):**
    *   On map interactions (pan/zoom end), the frontend will capture the current map view's geographic bounding box.
    *   This bounding box will be sent as query parameters to the backend SSE API (`/api/ga/voter/map-data`).
    *   The backend will use these bounds to spatially filter the *already sidebar-filtered* voter data. This ensures only data potentially visible within the current map view (plus a small buffer) is considered for aggregation and transmission, significantly reducing the load.
    *   **Crucially, this map-view filtering does not affect or change the user's selections in the main filter panel.**

2.  **Zoom-Dependent Aggregation (Backend):**
    *   The frontend will also send the current map `zoom` level as a query parameter to the SSE API.
    *   Based on the received `zoom` level, the backend API will dynamically aggregate the voter address data (which has already been filtered by both sidebar criteria *and* the map's bounding box). The aggregation groups data based on the administrative/statistical areas defined by the pre-loaded boundary shapefiles:
        *   **Zoom < 5 (State/Region View):** Aggregate filtered addresses by **County** (using `tl_2024_us_county` boundaries). The API returns one GeoJSON point feature per county within the bounding box that contains matching voters, with a `count` property. Optionally, include county name.
        *   **Zoom 5-8 (County/Multi-City View):** Aggregate filtered addresses by **City/Place** (using `tl_2024_13_place` boundaries). The API returns one point per city containing matching voters, with a `count` and city name.
        *   **Zoom 9-12 (City/Neighborhood View):** Aggregate filtered addresses by **Zip Code / ZCTA** (using `tl_2024_us_zcta520` boundaries). The API returns one point per ZCTA containing matching voters, with a `count` and zip code.
        *   **Zoom > 12 (Street Level View):** Return **individual unique addresses**. The API returns one point per unique geocoded address (`geom`) that matches the sidebar filters and falls within the bounding box. It may include a `count` if multiple filtered voters share the exact same point.
    *   The GeoJSON features returned by the backend will always include:
        *   Geometry (`Point`) representing the centroid of the aggregation unit (county, city, zip) or the specific address location.
        *   Properties:
            *   `aggregationLevel`: ('county', 'city', 'zip', 'address')
            *   `count`: Number of unique addresses (or voters at an address for the lowest level) represented by this point, matching all active filters.
            *   `label`: (e.g., County Name, City Name, Zip Code, Full Address - depending on aggregation level)
            *   `ids` or necessary info for drill-down/popup.

3.  **Frontend Display and Interaction:**
    *   The frontend `MapboxMapView` will receive these aggregated (or individual) GeoJSON features via SSE.
    *   Points will be styled differently based on the `aggregationLevel` and `count` (e.g., larger circles for higher counts). A label showing the count might be displayed directly on the map for Mapbox's text rendering capabilities.
    *   **Click Behavior:**
        *   **Clicking an Aggregated Point (County, City, Zip):** Should ideally zoom the map view into the bounds of that aggregation unit and trigger a new data fetch for the next level down within those new bounds. (Requires backend support for querying by county/city/zip boundaries or frontend calculation of appropriate zoom targets). *Initial implementation might just show a popup with the count and label.*
        *   **Clicking an Individual Address Point:** Will trigger the popup displaying details for all voters at that address, as previously defined.

This combined approach significantly reduces the data transferred and rendered, improving performance, especially at lower zoom levels, while still allowing users to drill down to specific address details. It shifts the aggregation complexity to the backend, which is generally better suited for handling large datasets.

## Technical Requirements

- **Mapping Library:** Use **Mapbox GL JS** ([Mapbox GL JS Docs](https://docs.mapbox.com/mapbox-gl-js/guides/)) via the **`react-map-gl`** wrapper library ([react-map-gl Docs](https://visgl.github.io/react-map-gl/)) for high-performance map rendering and interactions.
- **Authentication:** Requires a **Mapbox Access Token**. This token must be configured using the `NEXT_PUBLIC_MAPBOX_TOKEN` environment variable.
- **Basemap:** Utilize a standard Mapbox style (e.g., `mapbox://styles/mapbox/streets-v12`, `mapbox://styles/mapbox/dark-v11`). The specific style needs confirmation. Specific overlay layers (like districts) are not required initially but may be added later.
- **Data Preparation (Prerequisite):**
  - To enable efficient zoom-level aggregation (by County, City, Zip Code) in the backend API, the `ga_voter_registration_list` table must be pre-processed.
  - A one-time script (`lib/ga-voter-registration/import/enrich-voter-boundaries.ts`) should be run after loading initial voter data and boundary shapefiles (Counties - `tl_2024_us_county`, Places - `tl_2024_13_place`, ZCTAs - `tl_2024_us_zcta520`) into the database.
  - This script uses PostGIS spatial joins (`ST_Within`) to populate new columns in the `ga_voter_registration_list` table (e.g., `county_fips`, `county_name`, `place_name`, `zcta`) with the corresponding geographic identifiers for each voter's residence location (`geom`).
  - This denormalization allows the runtime API to quickly filter and group voters by these boundaries without performing expensive spatial joins on every map request.
- **Backend API:** A dedicated SSE endpoint (`/api/ga/voter/map-data`) will serve the GeoJSON map data, using parallel database batching and batch-level caching. *This API relies on the pre-enriched geographic columns mentioned above for aggregation.*
- **Frontend Framework:** Integration within the existing Next.js/React application structure.
- **Caching:** Implement an in-memory cache for the map data API endpoint. Cache the results of individual database batch queries (keyed by the specific SQL string including `LIMIT`/`OFFSET`). Serve cached batch results directly for subsequent identical batch requests. Define placeholder functions for TTL/invalidation.

## Non-Requirements (Initially)

- Drawing custom shapes on the map to filter.
- Advanced spatial analysis features beyond point display and popups.
- Displaying individual voters as separate points.
- Toggleable overlay layers (e.g., district boundaries) - designated as a future task.

Task List
---
**Note:** Implementation using Mapbox GL JS and react-map-gl.

### 1. Cleanup Previous Library
- [x] Task: Uninstall `@arcgis/core` using `pnpm remove @arcgis/core`.
- [x] Task: Remove ArcGIS CSS import from `app/globals.css`.
- [x] Task: Delete the old map component `components/ga/voter/map/MapView.tsx`.

### 2. Setup & Basic Map (Mapbox)
- [x] Task: Install `mapbox-gl` and `react-map-gl`. (Already done)
- [x] Task: Add Mapbox CSS import to global styles (`app/globals.css` or root layout).
- [x] Task: Configure Mapbox Access Token (`NEXT_PUBLIC_MAPBOX_TOKEN`) in environment variables.
- [x] Task: Create new Mapbox component `components/ga/voter/map/MapboxMapView.tsx`.
- [x] Task: Implement basic `<Map>` component from `react-map-gl` within `MapboxMapView.tsx`, configuring the access token and initial view state (center, zoom, style).
- [x] Task: Update `app/ga/voter/map/page.tsx` to dynamically import and render `MapboxMapView.tsx` (client-side only).

### 3. Backend API (SSE) - *Completed*
- [x] Task: Create API route `app/api/ga/voter/map-data/route.ts`.
- [x] Task: Set up route handler for SSE with `ReadableStream`.
- [x] Task: Implement In-Memory Batch-Level Cache Logic.
- [x] Task: Integrate shared `whereClause` builder.
- [x] Task: Implement parallel batching DB query.
- [x] Task: Implement parallel streaming logic.
- [x] Task: Add `end` event message.
- [x] Task: Implement error handling and stream closure.

### 4. Frontend Data Integration (SSE with Mapbox)
- [x] Task: Handle SSE Connection and Data Streaming in `MapboxMapView.tsx` (`EventSource`, state management).
- [x] Task: Add Mapbox `<Source>` Component for Voter Data (`type: 'geojson'`).
- [x] Task: Add Mapbox `<Layer>` Component to Visualize Voter Data (e.g., `type: 'circle'`).
    - [x] Configure basic paint/layout properties (color, size, etc.).
    - [ ] *Optional:* Consider enabling Mapbox source clustering here if initial performance warrants it.
- [ ] Task: Implement `useEffect` hook triggered by filter changes (after hydration):
    - [ ] Close existing `EventSource`.
    - [ ] Clear current GeoJSON feature array/state.
    - [ ] Set loading state `true`.
    - [ ] Build API URL with filters.
    - [ ] Create new `EventSource`.
    - [ ] Handle `onmessage`: Parse GeoJSON feature, add it to a temporary array.
    - [ ] Implement throttled/debounced updates (e.g., using `setTimeout` or `useDebouncedCallback`) to update the main GeoJSON state feeding the `<Source>` with the collected features from the temporary array. (Avoids updating state on *every* single message).
    - [ ] Handle `onerror`: Clear loading state, log error.
    - [ ] Handle `end` event: Update GeoJSON state with final features, clear loading state, trigger map fit bounds.
- [ ] Task: Implement map view adjustment (`mapRef.current?.fitBounds(...)` or similar) to zoom to data extent after the `'end'` event.
- [ ] Task: Implement loading indicator UI (ProgressBar in `map/page.tsx` driven by `onLoadingChange` prop from `MapboxMapView.tsx`).

### 5. Map Interactions & Features (Mapbox)
- [ ] Task: Add click handler to the point layer (`<Layer interactive={true} onClick={...}>`).
- [ ] Task: In the click handler, identify the clicked feature and extract `voter_ids` attribute.
- [ ] Task: Fetch detailed voter data for those IDs.
- [ ] Task: Add component state to manage popup info (lat, lon, content).
- [ ] Task: Render a `<Popup>` component from `react-map-gl` based on popup state, displaying formatted voter details.

### 6. Overlays (Future Task)
- [ ] Task (Low Priority): Add UI toggle for district layers.
- [ ] Task (Low Priority): Implement district layer fetching and display.

### 7. Refinement & Review
- [ ] Task: Test performance, stability, and UX with the new library.
- [ ] Task: Code review, cross-browser/device testing.
- [ ] Task: Update documentation.

