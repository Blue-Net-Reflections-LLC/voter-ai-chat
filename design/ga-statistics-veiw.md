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
    - [x] Reuse the existing `whereClause` builder for filters.
    - [x] Add aggregation queries for each required field/section
        - [x] voting_info
        - [x] districts
        - [x] demographics
        - [x] voting_history
        - [x] census
    - [x] Limit results to top 500 counts per field.
    - [ ] Optimize queries for performance (indexes, batching, etc.).
    - [x] Return all aggregates in a structure suitable for section-based lazy loading.
- [ ] **Write tests** for the new API endpoint (unit/integration).

### Frontend/UI
- [ ] **Create Stats/Aggregate View page** (tabbed with the listing view).
    - [ ] Create /ga/voter/layout.tsx for shared layout (filter panel, tab navigation)
    - [ ] Create /ga/voter/list/page.tsx for the voter list
    - [ ] Create /ga/voter/stats/page.tsx for the stats/aggregate dashboard
    - [ ] Implement a shared filter context/provider for state sharing
    - [ ] Implement tab navigation using links to the two routes
    - [ ] Scaffold the new page/component for the dashboard
- [ ] **Implement section-based lazy loading** for aggregates.
    - [ ] Show a spinner/loading indicator for each section while loading.
- [ ] **Build grid layout** for dashboard sections.
    - [ ] Ensure each section is collapsible.
    - [ ] Set max height and enable vertical auto-scroll for long lists.
- [ ] **Display aggregate counts** for each field/label.
    - [ ] Always show sections, even if empty (empty state UI).
    - [ ] Add client-side search/filter for long aggregate lists.
- [ ] **Enable filter interaction:**
    - [ ] Clicking a label applies the filter and updates the summary.
    - [ ] Sync filters with the voter list filter panel.
- [ ] **Ensure mobile-friendliness** (responsive design, test on various devices).
- [ ] **Style using Tailwind, shadcn/ui, and Radix** as per codebase conventions.

### General/Other
- [ ] **Update documentation** (requirements, API docs, usage instructions).
- [ ] **QA and user testing** (test all edge cases, performance, and UX).
- [ ] **Iterate based on feedback** from stakeholders or users.