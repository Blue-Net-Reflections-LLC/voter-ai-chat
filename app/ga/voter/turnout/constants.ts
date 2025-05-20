// A partial list for example; replace with the full list from the design document.
export const ELECTION_DATES: string[] = [
  "2024-11-05",
  "2024-08-20", // Example placeholder
  "2024-05-21",
  "2023-11-07",
  "2022-11-08",
  "2022-06-21", // Example placeholder
  "2022-05-24",
  "2021-11-02",
  "2020-11-03",
  "2020-08-11", // Example placeholder
  "2020-06-09",
  // ... Add all dates from the design document ...
  "2004-01-04" // Assuming this is the last one from the ellipsis
];

export const GEO_AREA_TYPES = [
  { value: "County", label: "County" },
  { value: "District", label: "District" },
  { value: "ZipCode", label: "Zip Code" },
];

export const REPORT_DATA_POINTS = [
  { id: "Race", label: "Race" },
  { id: "Gender", label: "Gender" },
  { id: "AgeRange", label: "Age Range" },
];

export const CHART_DATA_POINTS = [
  { value: "overall", label: "Overall Turnout" },
  { value: "Race", label: "Race" },
  { value: "Gender", label: "Gender" },
  { value: "AgeRange", label: "Age Range" },
];

// New constants for enhanced geography selection
export const PRIMARY_GEO_TYPES = [
  { value: "County", label: "County" },
  { value: "District", label: "District" },
];

export const DISTRICT_TYPES = [
  { value: "Congressional", label: "Congressional District" },
  { value: "StateSenate", label: "State Senate District" },
  { value: "StateHouse", label: "State House District" },
];

export const SECONDARY_BREAKDOWN_TYPES = [
  { value: "None", label: "None (Show selected area summary)" },
  { value: "Precinct", label: "Precincts" },
  { value: "Municipality", label: "Municipalities" },
  { value: "ZipCode", label: "Zip Codes" },
];

// Placeholder for County List - will be replaced by dynamic data
export const ALL_COUNTIES_OPTION = { value: "ALL", label: "All Georgia Counties" };

// Placeholder for District Number List - will be replaced by dynamic data
export const ALL_DISTRICTS_OPTION = { value: "ALL", label: "All Districts" }; 