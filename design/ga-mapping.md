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

## Technical Requirements

- **Mapping Library:** Use the latest **ArcGIS Maps SDK for JavaScript (v4.32+)** via the `@arcgis/core` npm package ([ArcGIS Maps SDK for JavaScript Documentation](https://developers.arcgis.com/javascript/latest/)). Adhere to modern ES module patterns and avoid legacy API usage.
- **Authentication:** An ArcGIS API Key is required for accessing basemaps and services, especially for deployment. This key must be configured using the `NEXT_PUBLIC_ARCGIS_API_KEY` environment variable.
- **Basemap:** Utilize a standard ArcGIS basemap (e.g., `arcgis/topographic`, `arcgis/streets-vector`). The suitability of the default basemap needs confirmation. Specific overlay layers (like districts) are not required initially but may be added later as toggleable options (See Task List: 5. Overlays).
- **Backend API:** A dedicated SSE endpoint (`/api/ga/voter/map-data`) will serve the GeoJSON map data, using **parallel database batching (multiple concurrent `LIMIT`/`OFFSET` workers)** for efficient streaming.
- **Frontend Framework:** Integration within the existing Next.js/React application structure.
- **Caching:** Implement an in-memory cache for the map data API endpoint. Cache the results of **individual database batch queries** (keyed by the specific SQL string including `LIMIT`/`OFFSET`). Serve cached batch results directly for subsequent identical batch requests. Define placeholder functions for TTL/invalidation.

## Non-Requirements (Initially)

- Drawing custom shapes on the map to filter.
- Advanced spatial analysis features beyond point display and popups.
- Displaying individual voters as separate points.
- Toggleable overlay layers (e.g., district boundaries) - designated as a future task.

Task List
---
### 1. Setup & Basic Map
- [x] Task: Install `@arcgis/core` (`pnpm add @arcgis/core`).
- [x] Task: Create `app/ga/voter/map/page.tsx`.
- [x] Task: Update `app/ga/voter/layout.tsx` to include the "Map" tab link pointing to `/ga/voter/map`.
- [x] Task: Create `components/ga/voter/map/MapView.tsx` using `next/dynamic`.
- [x] Task: Initialize a basic ArcGIS Map/MapView within `MapView.tsx`. Confirm basemap loads. Define necessary state variables (e.g., for loading, graphics).
  - [x] Task: Configure the ArcGIS API Key (`NEXT_PUBLIC_ARCGIS_API_KEY`) during map initialization.

### 2. Backend API (SSE)
- [x] Task: Create API route `app/api/ga/voter/map-data/route.ts`.
- [x] Task: Set up the route handler to return a `Response` with a `ReadableStream` and `Content-Type: text/event-stream`.
- [x] Task: Implement In-Memory Cache Logic:
    - [x] Define cache structure (e.g., `Map`).
    - [x] Implement cache key generation (**from specific batch SQL string**).
    - [x] Check cache **before each DB batch query**; serve batch from cache if hit.
    - [x] Store successful **DB batch results** in cache after query.
    - [x] Define placeholder TTL/invalidation functions.
- [x] Task: Integrate the shared `whereClause` builder, parsing filters from URL parameters.
- [x] Task: Implement the database query (**parallel batching**): Launch multiple (e.g., 5) concurrent workers, each fetching filtered, aggregated address data (`ST_AsGeoJSON(geom)`, `COUNT`, `JSON_AGG(...) GROUP BY geom`) using unique `LIMIT`/`OFFSET` slices.
- [x] Task: Implement the **parallel streaming** logic: Each worker fetches its batches in a loop, formats rows as GeoJSON Features, and pushes to the shared SSE stream (`data: ...`). Use `Promise.all` to manage workers.
- [x] Task: Add `event: end` message when all workers are complete.
- [x] Task: Implement robust error handling for parallel workers and stream closure on client disconnect or errors.

### 3. Frontend Data Integration (SSE)
- [ ] Task: In `MapView.tsx`, consume the shared filter context.
- [ ] Task: Implement `useEffect` hook triggered by filter changes:
    - Close existing `EventSource`, clear graphics layer, set loading state.
    - Create new `EventSource` pointing to `/api/ga/voter/map-data` with current filters as query params.
    - Define `eventSource.onmessage`: Parse GeoJSON Feature, create ArcGIS `Graphic` with geometry and attributes (`voter_ids`, `voter_count`), add graphic to map layer, store graphic reference.
    - Define `eventSource.onerror`: Log error, potentially show UI error, close connection.
    - Define handler for `end` event (or `onclose`): Clear loading state, calculate extent of all received graphics, call `view.goTo()` for auto-zoom.

### 4. Map Interactions & Features
- [ ] Task: Implement `view.on('click', ...)` handler:
    - Identify clicked graphic.
    - Extract `voter_ids` attribute.
    - Fetch detailed voter data for those IDs (reuse/adapt existing API calls if possible, or create a simple helper endpoint).
    - Configure and show an ArcGIS `Popup` with the fetched voter details (Name, Address, Status, Race, Age, Gender).
- [ ] Task: Ensure basic map zoom/pan functionality is smooth.

### 5. Overlays (Future Task)
- [ ] Task (Low Priority): Add UI toggle for district layers.
- [ ] Task (Low Priority): When toggled, fetch relevant district boundaries (e.g., `ga_cong_districts_current`) as GeoJSON/FeatureSet from a new API endpoint and add as separate `FeatureLayer`(s) to the map.

### 6. Refinement & Review
- [ ] Task: Test SSE connection stability, rendering performance with many points, and filter responsiveness.
- [ ] Task: Consider ArcGIS Feature Reduction (clustering/aggregation) *if* performance degrades significantly with high point density. Implement client-side clustering first if needed.
- [ ] Task: Confirm final Basemap choice with stakeholders.
- [ ] Task: Code review, cross-browser/device testing.
- [ ] Task: Update `ga-mapping.md` documentation with any implementation details or changes.
- [ ] Task: Implement the loading progress bar UI element (3px height, below tabs) controlled by the SSE connection state (visible from connection open until close/end event).

