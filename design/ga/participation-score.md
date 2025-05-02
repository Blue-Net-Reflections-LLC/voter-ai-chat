# Participation Score

We need to develop a scoring system to calculate a participation score for any given set of GA Voter List and GA Voter History data.

## High level requirements
- **Score Range:** The participation score will range from **1.0 to 10.0** (e.g., 8.7, 1.5, 5.0).
- **Calculation Basis:** The calculation will be rule-based, using an **additive approach** combining status, recency, and frequency, with a multiplier for diversity. The formula structure is: `Score = Base_Points(Status) + Points(Recency) + (Points(Frequency) * Multiplier(Diversity))`. The final score is capped between 1.0 and 10.0.
    - **Voter Status (Base Points):** Active vs. Inactive.
        - **Inactive voters:** Base score contribution ensures the final score is **always less than 5.0**.
        - **Active voters:** Base score contribution allows the final score to range from **2.0 to 10.0**, depending on voting history additions.
    - **Recency (Points):** Based on the most recent `ga_voter_history` event date within the rolling 8-year window.
        - **Method:** Uses a **step function**. *Initial proposal (configurable):*
            - Voted in last 0-2 years: High points contribution.
            - Voted in last 3-5 years: Medium points contribution.
            - Voted in last 6-8 years: Low points contribution.
            - No votes in last 8 years: Zero points contribution.
        - *Note:* The exact point values and year brackets should be easily adjustable.
    - **Frequency (Points):** Based on the **raw count** of `ga_voter_history` events for the voter within the rolling 8-year window.
        - *Note:* The method for scaling this raw count into `Points(Frequency)` needs definition during implementation (e.g., logarithmic scaling, capped points) to fit appropriately within the 1.0-10.0 range alongside other factors. The system should allow this scaling logic to be adjusted.
    - **Diversity (Multiplier):** Acts as a multiplier on the `Points(Frequency)`.
        - **Method:** If the voter has participated in at least one **non-General** election (Primary, Special, Runoff) within the rolling 8-year window, apply a small bonus multiplier (e.g., 1.1x, 1.2x) to the frequency points. Otherwise, the multiplier is 1.0.
        - *Note:* The exact multiplier value should be easily configurable.
- **Time Window:** The calculation considers voting history within a **rolling 8-year window** from the current date.
- **Eligibility:** Determining the number of elections a voter *could* have voted in is difficult due to inconsistent registration data. Therefore, the score will focus **solely on the available voting history (events)**, not on a calculated eligibility denominator.
- **Dynamic Filtering:** The score calculation will be dynamic, based on the filters applied via the `VoterFilterProvider`.
- **Endpoint:** A dedicated endpoint, `/api/ga/voter/participation-score`, will handle calculations.
    - It must support both **individual voter scores** (accepting a `registrationNumber`) and **aggregate scores** based on the standard filter set.
    - Integration with `lib\\voter\\build-where-clause.ts` is required. The `registrationNumber` filter needs to be added to `app\\ga\\voter\\list\\components\\FilterPanel.tsx`.
    - For aggregate requests (Phase 1), the endpoint will return the **average (mean) score** for the filtered set.
- **Asynchronous Return:** The score will always return asynchronously alongside list data, stats, maps, and profile page information.
- **UI Component:** The score will be presented in a widget/UI component on the list, stats, maps, and profile pages.
    - **Household Score:** For profile pages, a household score will be calculated by averaging the individual scores of all voters identified at the same residence address (similar to the `ResidenceAddressFilter` logic).
    - **Explanation:** The widget will display the score (e.g., 8.7) and an explanation underneath it based on predefined ranges. *Initial ranges (configurable):*
        - **1.0 - 2.9:** Needs Attention
        - **3.0 - 4.9:** Needs Review (Note: Max for Inactive is < 5.0)
        - **5.0 - 6.4:** Participates
        - **6.5 - 9.9:** Power Voter
        - **10.0:** Super Power Voter
- **Calculation Location:** The decision of whether the core calculation logic resides primarily in SQL or the API (TypeScript) requires further analysis once the specific rules and scaling factors are finalized. Flexibility in the chosen approach is key.

## Schemas and Datasources
Schemas used for the voter data:
 - lib\ga-voter-history\migrations\0001_create_ga_voter_history.sql
 - lib\ga-voter-registration\migrations\0001_create_ga_voter_registration_list.sql
 - lib\ga-voter-registration\migrations\0006_add_derived_vote_info.sql
 - lib\ga-voter-registration\migrations\0008_add_geocoding_cols.sql
 - lib\ga-voter-registration\migrations\0009_add_redistricting_cols_and_indexes.sql
 - lib\ga-voter-registration\migrations\0010_tile_current_district_geometries.sql
 - lib\ga-voter-registration\migrations\0011_add_voting_events_jsonb.sql
 - lib\ga-voter-registration\migrations\0014_add_geo_boundaries_to_voters.sql # Contains Census Tract ID (ucgid)

 Scripts
 - lib\ga-voter-history\import\parse-history-csv.ts
 - lib\ga-voter-registration\import\parse-registration-csv.ts
 - lib\ga-voter-registration\import\update-redistricting-flags.ts
 - lib\ga-voter-registration\import\geocode-addresses.ts
 - lib\ga-voter-registration\import\enrich-voter-boundaries.ts # Populates Census Tract ID


 ## Rules (Examples & Guidelines)
- **(A) Highest Scores:** Active voters + Recent participation + High frequency + Diverse election types (within the rolling 8-year window).
- **(B) High Scores:** Active voters + Recent participation + High frequency (primarily General elections).
- **(X) Mid-Low Scores:** Inactive voters + Some past participation (score < 5.0). Recent participation scores higher than older participation.
- **(Y) Low Scores:** Active voters + No voting history (score >= 2.0).
- **(Z) Lowest Scores:** Inactive voters + No voting history (score < 2.0, likely close to 1.0).

**General Principles:**
- A perfect 10.0 represents an active voter who has participated frequently and recently across diverse election types within the last 8 years.
- An inactive voter's score cannot exceed 4.9 (realistically, based on base points).
- Active status is a prerequisite for scores >= 5.0, but history (recency, frequency, diversity) determines the actual score above the minimum active threshold (~2.0).

**Aggregation:**
- When calculating for multiple voters (based on filters), the scores are averaged to produce a mean participation score for the group.

## Implementation Plan

**Phase 1: Core Calculation and Aggregate Endpoint**

- [x] **Task 1: Backend Calculation Logic (TypeScript)**
    - [x] Create `lib/participation-score/calculate.ts`.
    - [x] Implement `calculateParticipationScore(voterData: { status: string, historyEvents: HistoryEvent[] }): number`.
        - [x] Handle Status, Recency (step function), Frequency (log scaling), Diversity (multiplier).
        - [x] Use additive formula: `Base(Status) + Points(Recency) + (Points(Frequency) * Multiplier(Diversity))`.
        - [x] Cap result: 1.0-10.0.
    - [x] Use adjustable constants/config for score parameters.
    - [x] Write comprehensive unit tests for `calculateParticipationScore`.

- [ ] **Task 2: Backend API Endpoint (`/api/ga/voter/participation-score`)**
    - [ ] Create `app/api/ga/voter/participation-score/route.ts`.
    - [ ] Integrate `lib/voter/build-where-clause.ts`; add `registrationNumber` query param support.
    - [ ] Implement data fetching (single voter or filtered set). Optimize queries.
    - [ ] Implement calculation call (single or iterate/average for aggregate).
    - [ ] Return JSON response `{ score: number | null }` asynchronously.
    - [ ] Write integration tests for the endpoint.

- [ ] **Task 3: Database Indexing**
    - [ ] Review/add indexes on `ga_voter_registration_list` (status, reg num) & `ga_voter_history` (reg num, date, type) as needed.

**Phase 2: Frontend Integration**

- [ ] **Task 4: Filter Panel Update**
    - [ ] Modify `app/ga/voter/list/components/FilterPanel.tsx`.
    - [ ] Add "Registration Number" input UI.
    - [ ] Add `registrationNumber` to `VoterFilterContext` state and functions.

- [ ] **Task 5: Participation Score Widget**
    - [ ] Create `components/voter/ParticipationScoreWidget.tsx`.
    - [ ] Define props: `score: number | null`, `isLoading: boolean`.
    - [ ] Implement UI: formatted score, explanation text, loading state, N/A state.

- [ ] **Task 6: Integration into List/Map/Stats**
    - [ ] Modify data fetching hooks/components for list/map/stats views.
    *   [ ] Add async call to `/api/ga/voter/participation-score` with current filters.
    *   [ ] Manage loading state and aggregate score.
    *   [ ] Place `ParticipationScoreWidget` in relevant UI locations.

- [ ] **Task 7: Integration into Voter Profile Page**
    *   [ ] Modify profile page data fetching (`app/ga/voter/[registrationNumber]/page.tsx`).
    *   [ ] Implement individual score fetching/display.
    *   [ ] Implement household score fetching/display:
        *   [ ] Fetch household members.
        *   [ ] *Preferred:* Enhance backend for efficient household average calculation.
        *   [ ] *Alternative:* Average individual scores on frontend.
        *   [ ] Display household average in a separate widget.

**Phase 3: Testing and Refinement**

- [ ] **Task 8: End-to-End Testing**
    - [ ] Verify calculations, filters, and UI components across all views.
- [ ] **Task 9: Performance Profiling**
    - [ ] Assess aggregate score calculation performance; optimize DB/backend if needed.
- [ ] **Task 10: Configuration Refinement**
    - [ ] Adjust score parameters based on testing and desired distribution.
