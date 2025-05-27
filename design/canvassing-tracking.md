# Voter Engagement Tracking

We need to add voter engagement tracking to the stack for Canvassers and Campaign candidates or, elected representatives (incumbents).

We put a together an AI tool to allow Canvessers to find voters @see .\ga\ga-voter-profile-page.md.

Here are the high level requirements:
- Campaign Type.  Like Phonebanks evetns, mailing initiatives, or GOTV events.
- Contact Type (email, text, social media, phone banking calls, door knocks, tents).  Are there others?
- Registration ID for voters that are already registered and have been identified.  How should we track contacts with non-voters?  TODO:  Create non-voter contacts
- Contact Information
  - Email
  - Social Media -->  how do we reference social media?
  - Mobile Phone number
  - Land line phone number
  - Contact's Address, if different from address in Voter Data table in Db.
- Who contacted the voter?
    - Team?
    - Designation:  Was the contact assigned or designed to a specified area, or asigned based on a specific criteria?
- When was the voter contacted?
- How often was the voter contacted?  TODO:  We need to track history
- Generate engagement scripts based on evidenced based data of the voter.  We need to generate relevant scripts based on multiple factors.  However, the gist of the scripts need to be consistent.
  - Voting History:  Powerful to engage voters that have stopped voting or registered or never voted.
  - Demographics:  Scripts should have language specific for a specific age-generation, or self-identified skin, color or gender.  We need to provide LLMs the issues to inject into the engagement scripts.
  - Census Data, using subtle references to income (low), education attainment, and (high) unemployment rate.
  - Candidates:  We will need to provide LLMs the candidates that people should vote for.  We need to align voter's issues with the candidate's plan to address these issue.
    - Capture sentiment
  - History of shared Voter Issues.  
  - Cature Notes for each engagment that envolved verbal communication.
  - Capture Failed attemtps
    - Returned mail
    - Incorrect Phone Numbers
    - Failed SMS attempts
    - Door knocking
        - No Answer
        - no longer at address
        - Rejected or negative sentiment

- Voter Profile
  - Already provide Voter File data from the Secretary of State and Voting History.
  - Should provide the realtime LLM generated scripts based on the criteria and target contact type
  - Show how Voter Engagement information and become the principal placement for capturing voter engagement information.
  

