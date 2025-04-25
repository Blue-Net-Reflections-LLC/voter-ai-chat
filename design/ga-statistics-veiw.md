# Stats View / Aggregate View

To create a dashboard of aggregate totals based on the applied filters.

## Requirements (Updated)

- **Aggregation:**
  - All aggregate counts should be calculated server-side in the database as much as possible.
  - The API endpoint for the summary/aggregate view must accept the same filter parameters as the voter list endpoint (reusing the whereClause builder shared with the voter list and download routes).
  - There is no dedicated API yet; it must be designed and built for this summary view.
  - Each section (e.g., Voting Info, Districts, Demographics, etc.) should be loaded independently (section-based lazy loading) to improve perceived performance.
  - For each field, return the top 500 counts (by count, descending) for any item/value.

- **Fields to Aggregate:**
  - **Voting Info:**
    - 'status'
    - 'status_reason': for each option in the result
    - 'residence_city', for each city in the result
    - 'residence_zipcode', for each zipcode in the result
  - **Districts**
    - 'county_name' ('county_code'),
    - 'congressional_district', for each in the result
    - 'state_senate_district', for each in the result
    - 'state_house_district', for each in the result
  - **Demographics**
    - 'race', for each in the result
    - 'gender', for each in the result
    - Age ranges calculated from 'birth_year', using the same age ranges as the Filter Panel for consistency
  - **Voting History**
    - 'derived_last_vote_date', for each in the result
    - 'participated_election_years' for each in the result (show a count of voters for each year)
  - **Census**
    - 'census_tract', for each in the result

- **UI/UX:**
  - The page will be tabbed with the listing view.
  - Use a grid layout for the sections.
  - Each section is collapsible.
  - Each label/count should be listed.
  - Clicking a label with a count should add that value to the filters and update the summary.
  - The dashboard must be mobile-friendly (review codebase for Tailwind, shadcn/ui, Radix usage).
  - Each section should have a maximum height with vertical auto-scroll (no pagination).
  - Lazy loading is preferred: each section loads independently, and a spinner/loading indicator is shown while loading.
  - Always show the section, even if there are no results (empty state UI).
  - For fields with many results, provide a client-side search/filter within the aggregate lists.

## Implementation Task List

### Backend/API
- [x] **Design API contract** for the summary/aggregate endpoint (input filters, output structure, error handling).
- [x] **Implement new API route** for summary/aggregate data.
    - [x] Endpoint location: `app/api/ga/voter/summary/route.ts` (call as `/api/ga/voter/summary`)
    - [x] Reuse the existing `whereClause` builder for filters.
    - [x] Add aggregation queries for each required field/section
        - [x] voting_info
        - [x] districts
        - [x] demographics
        - [x] voting_history
        - [x] census
    - [x] Limit results to top 500 counts per field.
    - [x] Return all aggregates in a structure suitable for section-based lazy loading.
- [ ] Optimize queries for performance (indexes, batching, etc.).
- [ ] Write tests for the new API endpoint.

### Frontend/UI
- [x] **Create Stats/Aggregate View page** (tabbed with the listing view).
    - [x] Create /ga/voter/layout.tsx for shared layout (filter panel, tab navigation)
        - [x] Integrate FilterPanel in the sidebar, using context for state
        - [x] Implement tab navigation (links to /ga/voter/list and /ga/voter/stats)
    - [x] Create /ga/voter/list/page.tsx for the voter list
    - [x] Create /ga/voter/stats/page.tsx for the stats/aggregate dashboard
    - [x] Scaffold the new page/component for the dashboard
    - [x] Build grid layout for dashboard sections
    - [x] Ensure each section is collapsible
    - [x] Set max height and enable vertical auto-scroll for long lists (structure in place)
    - [x] Ensure mobile-friendliness (responsive design, test on various devices)
    - [x] Style using Tailwind, shadcn/ui, and Radix as per codebase conventions

- [ ] **Implement section-based lazy loading and data integration**
    - [x] Voting Info
        - [x] API call for Voting Info aggregates
        - [x] Show loading spinner while fetching
        - [x] Display aggregate counts/labels
        - [x] Handle empty state
        - [x] Enable filter interaction (click to filter)
        - [x] UI/UX and data integration for Voting Info complete
    - [x] Districts
        - [x] API call for Districts aggregates
        - [x] Show loading spinner while fetching
        - [x] Display aggregate counts/labels
        - [x] Handle empty state
        - [x] Enable filter interaction (click to filter)
        - [x] UI/UX and data integration for Districts complete
    - [ ] Demographics
        - [ ] API call for Demographics aggregates
        - [ ] Show loading spinner while fetching
        - [ ] Display aggregate counts/labels
        - [ ] Handle empty state
        - [ ] Enable filter interaction (click to filter)
    - [ ] Voting History
        - [ ] API call for Voting History aggregates
        - [ ] Show loading spinner while fetching
        - [ ] Display aggregate counts/labels
        - [ ] Handle empty state
        - [ ] Enable filter interaction (click to filter)
    - [ ] Census
        - [ ] API call for Census aggregates
        - [ ] Show loading spinner while fetching
        - [ ] Display aggregate counts/labels
        - [ ] Handle empty state
        - [ ] Enable filter interaction (click to filter)

- [ ] **Add client-side search/filter for long aggregate lists**
- [ ] **Sync filters with the voter list filter panel**

### General/Other
- [ ] **Update documentation** (requirements, API docs, usage instructions).
- [ ] **QA and user testing** (test all edge cases, performance, and UX).
- [ ] **Iterate based on feedback** from stakeholders or users.

---

**Next step:**
- Implement the API call and UI for the Voting Info section in the stats/aggregate dashboard.

- The aggregate stats API endpoint is implemented at `app/api/ga/voter/summary/route.ts` and is called as `/api/ga/voter/summary` from the frontend.