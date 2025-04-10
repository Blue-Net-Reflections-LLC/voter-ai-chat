# State Level Chats
Warning: Breaking Changes

We need to adapt the site to handle state level Voter AI Chat sessions. Each state manages its own Voter Activity so we must derive different schemas for each state.

## Routing changes
- Existing routes (`/chat`, `/chat/[guid]`) will check for a selected state. If none is found, they will trigger the state selection overlay.
- New routes will include the state abbreviation: Eg. `/[state]/chat`, `/[state]/chat/[guid]`. These will be the primary routes after a state is selected.
- Attempting to access a route for an unsupported state (e.g., `/fl/chat`) should redirect the user to a static page indicating the state is not yet supported and providing contact information (`sales@voterai.chat`).

## Database changes
- **User Profile:** Add a column to the existing `UserProfile` table (in the `PG_VOTERDATA_URL` schema) to store the user's selected state abbreviation. A suggested name is `selectedState` (e.g., storing 'GA').
    - See schema reference: `lib/db/schema.ts` (Note: `UserProfile` table is assumed to exist here).
- **State-Specific Schemas:** New tables will be created per state (e.g., `ga_voter_history`, `ga_voter_registration_list`) as defined in their respective migration files.

## State Selection
- **Triggering Selection:**
    - After user authentication (or on visit to `/chat*` if already authenticated), check the `UserProfile.selectedState` column.
    - If `selectedState` is null or empty, display the State Selection UI as an overlay.
- **Selection UI:**
    - Present a grid or list of US States using icons from `public/images/states`.
    - Initially, only Georgia ('GA') will be active/selectable.
    - All other states should be displayed but appear greyed-out or disabled to indicate they are not yet supported.
    - Use an overlay/modal component for this selection process. Do not use a full page redirect for the selection itself.
- **Persistence:** Upon successful selection, store the chosen state's abbreviation (e.g., 'GA') in the `UserProfile.selectedState` column in the database.
- **Redirection:** After selection, redirect the user to the appropriate state-specific chat route (e.g., `/ga/chat`).

## VoterAI Chatbot changes
Modify the state-specific chat routes (`/[state]/chat*`) to:
- Identify the state from the URL parameter.
- Verify the state is supported.
- Load the appropriate system prompt for that state.

### System prompt
- System prompts will be stored in a structured folder path: `lib/state-prompts/[state-abbr]/system-prompt.md`.
    - Example: `lib/state-prompts/ga/system-prompt.md`
- The content of each state's system prompt should include the full SQL DDL (`CREATE TABLE ...`) statements for its specific database schemas.
    - For Georgia ('GA'), include the DDL from:
        - `lib/ga-voter-history/migrations/0001_create_ga_voter_history.sql`
        - `lib/ga-voter-registration/migrations/0001_create_ga_voter_registration_list.sql`
- The previous method of using a tool for dynamic schema definition is deprecated.

### Chat UI Changes
- **Header:** Display the full name of the selected state prominently in the chat page header.
- **Change State Link:**
    - Include a "Change State" link or button in the chat UI.
    - Clicking this link should trigger the same State Selection overlay used for initial selection.
    - This action should be cancelable, allowing the user to close the overlay without changing their state.
    - If a new state is selected, update `UserProfile.selectedState` and redirect to the new state's chat URL (e.g., `/tx/chat`).

## Deprecated Functionality / Tables
- **Bill Data:** The previous method for fetching/displaying bill data is deprecated. (Future integration with LegiEquity via MCP is planned but out of scope for this task).
- **Generic Voter Tables:** The following tables in the `PG_VOTERDATA_URL` schema are deprecated and will be replaced by state-specific tables:
    - `voter_address_change`
    - `voter_address_change_embedding`
    - `voter_all_data`
    - `voter_all_data_embedding`
    - `voter_dropped_records`
    - `voter_dropped_records_embedding`
    - `voter_inactive_data`
    - `voter_inactive_data_embedding`
    - `voter_name_change`
    - `voter_name_change_embedding`
    - `voter_new_records`
    - `voter_new_records_embedding`
    - `voter_status_change`
    - `voter_status_change_embedding`
    - `voter_table_ddl`
    - `voter_table_ddl_embeddings`

## Error Handling
- **System Prompt Load Failure:** If the application cannot load the required `system-prompt.md` file for a supported state, it should return an HTTP 500 Internal Server Error.
- **State Persistence Failure:** If saving the `selectedState` to the `UserProfile` table fails, the user should be shown an error message in the UI and prevented from proceeding until the issue is resolved (e.g., they can retry the save).

## Work Plan
- Understand and iterate on the requirements (Completed)
- **Implement Database Changes:**
    - Add `selectedState` column to `UserProfile`.
    - Ensure state-specific tables (`ga_*`) are correctly migrated/created.
- **Implement Routing Changes:**
    - Modify base `/chat*` routes for state check/overlay trigger.
    - Create new dynamic `/[state]/chat*` routes.
    - Implement redirect logic for unsupported state URLs.
- **Implement State Selection UI:**
    - Create the state selection overlay component (reusable for initial selection and changes).
    - Fetch and display state icons (`public/images/states`).
    - Handle selection logic (enabling/disabling states).
    - Implement database persistence on selection.
- **Implement Chat Page Changes:**
    - Update chat routes to load state-specific system prompts.
    - Modify system prompt files (`lib/state-prompts/ga/system-prompt.md`) to include SQL DDL.
    - Update chat UI header to display the state name.
    - Add "Change State" link triggering the selection overlay.
- **Implement Unsupported State Page:**
    - Create the static page for unsupported states with contact info.
- **Testing:**
    - Unit/integration tests for new logic (routing, DB interaction, state selection).
    - End-to-end testing of the user flow (login -> initial state selection -> chat -> change state).
    - Test error handling scenarios (prompt load failure, DB save failure, unsupported state access).
- **Cleanup:** (Optional/Future) Plan for removing deprecated tables and associated code.

# Tasks
- [x] **Database:** Add `selectedState` column (type: `varchar` or appropriate text type, nullable) to `UserProfile` table. Create migration file.
- [x] **Database:** Verify `ga_voter_history` migration (`0001_create_ga_voter_history.sql`) is correctly configured.
- [x] **Database:** Verify `ga_voter_registration_list` migration (`0001_create_ga_voter_registration_list.sql`) is correctly configured.
- [x] **Backend:** Update authentication/session logic to check `UserProfile.selectedState` upon login or relevant session load. *(Modify NextAuth session callback in `app/(auth)/auth.ts` to fetch profile using `getUserProfile` from `lib/db/queries.ts` and add `selectedState` to the session object)*.
- [x] **Frontend:** Create reusable State Selection Overlay component.
    - [~] Fetch list of states (currently hardcoded placeholder).
    - [x] Display states using SVG icons from `public/images/states`.
    - [x] Style active vs. inactive/greyed-out states.
    - [x] Handle click events on states (only active states trigger action).
    - [x] Include 'Confirm' and 'Cancel' actions.
- [x] **API/Backend:** Create endpoint to save `selectedState` to `UserProfile`.
- [x] **Frontend:** Integrate State Selection Overlay trigger logic:
    - [x] On initial load of `/chat*` if `selectedState` is missing from user data.
    - [x] On click of "Change State" button/link in chat UI.
- [x] **Frontend:** Implement logic to call the API endpoint upon confirming state selection in the overlay. Handle success (redirect) and failure (show error).
- [x] **Routing:** Implement dynamic routes `/[state]/chat` and `/[state]/chat/[guid]`.
- [x] **Routing:** Add middleware or logic to `/[state]/...` routes to validate the `state` parameter against a list of supported states (initially just 'GA'). Redirect if invalid/unsupported.
- [x] **Routing:** Implement redirect from unsupported state URLs to the new static "Unsupported State" page.
- [x] **Frontend:** Create the static "Unsupported State" page with the required message and contact info.
- [x] **Backend:** Modify chat logic (in `/[state]/chat*` routes) to load system prompt dynamically based on the `state` parameter (e.g., read `lib/state-prompts/[state]/system-prompt.md`). Implement 500 error on failure.
- [x] **Content:** Update `lib/state-prompts/ga/system-prompt.md` to include the SQL DDL from the specified migration files.
- [x] **Frontend:** Update Chat UI header to dynamically display the full name of the currently selected state.
- [ ] **Testing:** Write unit/integration tests for backend logic (DB access, routing, prompt loading).
- [ ] **Testing:** Write tests for frontend components (State Selection Overlay).
- [ ] **Testing:** Perform end-to-end tests covering all user flows and error conditions.
- [ ] **Documentation:** Update any relevant READMEs or developer docs.

(Note: Task breakdown is preliminary and may be refined during implementation.)



