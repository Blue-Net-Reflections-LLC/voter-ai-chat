# UI Design notes for Google Stitch


- Add a new tab to the current design called Campaign management.
- Add a new page that reuses the existing layout in the /ga/voter section
- The Campaign Page must:
  - Display a list of campaigns
  - Select a campaign to set active
  - Display the number of voters in a selected campaign
  - Have the ability to display the selected set of filters that generated the selected campaign
  - Display the list of voters that were engaged compared to the list of voters that need to be contacted.
  - Display a campaign meta data
  - Add a new Campaign required details
  - Remove and existing campaign with a confirmation prompt
  - Activate or Deactive a compaign from a list or from a detail page
  - Display Campaign reports and analysis data.
- Changes to List Page
  - Users should be able to find a campaign to set as active for all List filtration actions.
  - Users should be able to apply a filter and then add voters for that filter to the  active campaign.  We must keep record of the filter to bulk populate a campaign
  - Users should have the ability to add to individual registared voters to the active campaign.
  - The list will indicate which voters are in a campaign from a filter or from an individual addition

- Profile page changes
  - The profile pages must display the campaigns a voter was included
  - Users should be able to add a voter to a selected campaign
  - Users should be able to remove a voter from a selected campaign
  - We should see the contact and sentiment status for any previous cmapaign or the selected campaign.

- Quickview changes
  - Display selected campaign metadata if user is part of the campaign    