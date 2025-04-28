// Shared constants for map zoom level thresholds

export const ZOOM_COUNTY_LEVEL = 6; // Below this, show counties
export const ZOOM_CITY_LEVEL = 11;   // Below this (and >= COUNTY_LEVEL), show cities
export const ZOOM_ZIP_LEVEL = 13;  // Below this (and >= CITY_LEVEL), show zip codes
// >= ZIP_LEVEL shows addresses 