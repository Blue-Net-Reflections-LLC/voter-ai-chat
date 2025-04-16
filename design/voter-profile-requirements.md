# Voter Profile Requirements

## Objective

Utilize Voter AI to build an interactive chatbot capable of generating a comprehensive voter profile for any registered voter, facilitating targeted civic engagement, policy awareness, and voter outreach.

## Access Control
- Access to the profile generation chatbot is restricted to users with state-level permissions to protect sensitive data.
- Different states will have distinct access levels.
- A super-user access level will grant permissions across all states.

## User Interface (UI)
- The UI will feature a prompt field and potentially other form fields to guide profile building (details TBD).
- Profile components must be presented clearly and be easy to view.
- The UI must be mobile-friendly to support users in the field.
- The UI should be interactive to improve election engagement.

## Technical Implementation
- An Agentic AI layer will serve as the logical middle tier.
- This AI layer will use tools to fetch data from various internal and external sources via:
    - Database Connections
    - REST APIs
    - Advanced MCP (Multi-Cloud Platform) integrations where necessary.
- The system must allow users to download generated profile data as CSV files.

## Data Sources (Publicly Available)
The chatbot will leverage tools to search and integrate data from various sources:
- **Voter File Data:** Registered voter information (name, address, party affiliation, voting history where available).
- **Census Data:** Demographic insights (age, household size, economic status, education levels). Used also for identifying recent redistricting impacts (within the last 4 years).
- **Legislation Impact:** Laws or policies potentially affecting voters based on location/demographics.
- **White Pages Information:** Public residential/contact details for identity validation or geographic trends.
- **Public Social Media Data:** Publicly shared information (Twitter, Facebook, LinkedIn) to infer political interests, engagement, and issue activism. *Method for reliably linking voters to profiles needs identification.*
- **Election Participation Data:** Voter turnout and registration trends by demographics (e.g., U.S. Census Bureau Voting and Registration reports).
- **Federal Election Commission (FEC) Filings:** Political donation records, campaign finance reports, PAC/advocacy group affiliations.
- **Local News & Government Websites:** Recent policy discussions, municipal initiatives, local election developments.
- **Property & Tax Records:** Homeownership, rental status, property tax assessments influencing voter priorities.
- **Public Contact Information:** Available email addresses and phone numbers (must be publicly sourced).

## Key Features / Data Points
The Voter Profile tool should provide:
- **Voter Search:** By first name, last name, and/or address.
- **Household Information:** Number of registered voters in a given household.
- **Voting History:** Record of when voters last voted.
- **Voting Likelihood Prediction:** Assess the probability of a voter participating in future elections.
- **Redistricting Information:** Detect if a voter was part of a redistricting event in the last 4 years (using Census data).
- **Geographic/Election Data:**
    - District, county, and city-level election results.
    - Local representatives.
- **Demographic Data:**
    - Racial demographics.
    - Income levels.
    - Age breakdown.
- **Voter Turnout:** Participation score/rate for relevant districts/areas.
- **Social Media Presence:** Identify associated public social media profiles (*Method TBD*).
- **Public Contact Information:** Display available public email/phone numbers.

## Future Considerations
- Allow users to manually add/edit contact information (email, phone) and social media links via the UI.
- Expand rules and requirements as the project evolves.

## Updates (2024-06)

- The voter profile page is now located at `/ga/voter/profile/[voterId]` and uses the voter registration ID as a URL parameter for direct linking and navigation.
- The "Household Voters" section displays other household members with their first and last names, age, gender, and links to their own profile pages (using the same voter registration ID URL pattern).
- The "District Data" section now includes:
    - Income levels (percentage by bracket)
    - Redistricting information (whether the district was redrawn in the last 4 years, year, and source)
    - A link to a full district details page
- The project will use the [ArcGIS Maps SDK for JavaScript](https://developers.arcgis.com/javascript/latest/) for mapping and spatial features. (More mapping requirements to come.)

