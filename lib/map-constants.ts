// Shared constants for map zoom level thresholds
 
export const ZOOM_COUNTY_LEVEL = 6; // Below this, show counties
// export const ZOOM_CITY_LEVEL = 11; // Removed city level
export const ZOOM_ZIP_LEVEL = 11;  // Changed from 13. Below this (and >= COUNTY_LEVEL), show zip codes
// >= ZIP_LEVEL shows addresses 