"use client";

import { useState, useEffect } from 'react';
// import { MultiSelectOption } from '../components/MultiSelect'; // Assuming this was old or local
import { BALLOT_STYLE_OPTIONS, EVENT_PARTY_OPTIONS } from '../constants';

// Export this type
export type MultiSelectOption = {
  value: string;
  label: string;
};

export type LookupField = {
  name: string;
  displayName: string;
  category: string;
  values: any[]; // Changed from string[] to any[] to support objects
  count: number;
};

export type LookupData = {
  fields: LookupField[];
  timestamp: string;
};

// Cache keys
const LOOKUP_CACHE_KEY = 'voter-lookup-data-cache';
const LOOKUP_CACHE_TIMESTAMP_KEY = 'voter-lookup-data-timestamp';
// Cache expiration time - 1 hour in milliseconds
const CACHE_EXPIRATION = 60 * 60 * 1000;

// Helper function to convert text to Title Case
const toTitleCase = (text: string): string => {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Helper function to convert string array to MultiSelectOption array
const toOptions = (values: string[]): MultiSelectOption[] => {
  return values.map(value => ({
    value: value,
    label: value
  }));
};

// Create a singleton instance to ensure the data is only fetched once across components
let globalLookupData: LookupData | null = null;
let isGlobalFetchInProgress = false;
let fetchPromise: Promise<LookupData | null> | null = null;

async function fetchLookupDataFromAPI(): Promise<LookupData | null> {
  try {
    // Fetch district, registration, demographic, and voter_events data in parallel
    const [districtResponse, registrationResponse, demographicResponse, eventsResponse] = await Promise.all([
      fetch('/api/ga/voter/list/lookup?category=district'),
      fetch('/api/ga/voter/list/lookup?category=registration'),
      fetch('/api/ga/voter/list/lookup?category=demographic'),
      fetch('/api/ga/voter/list/lookup?category=voter_events')
    ]);
    
    if (!districtResponse.ok || !registrationResponse.ok || !demographicResponse.ok || !eventsResponse.ok) {
      throw new Error(`API error: ${!districtResponse.ok ? districtResponse.status : 
                                  !registrationResponse.ok ? registrationResponse.status : 
                                  !demographicResponse.ok ? demographicResponse.status : eventsResponse.status}`);
    }
    
    const districtData = await districtResponse.json();
    const registrationData = await registrationResponse.json();
    const demographicData = await demographicResponse.json();
    const eventsData = await eventsResponse.json();
    
    // Combine all data sets including voter_events
    const combinedData = {
      fields: [
        ...districtData.fields,
        ...registrationData.fields,
        ...demographicData.fields,
        ...eventsData.fields
      ],
      timestamp: new Date().toISOString()
    };
    
    console.log("Lookup API data fetched successfully");
    return combinedData;
  } catch (err) {
    console.error('Error fetching lookup data:', err);
    return null;
  }
}

// Helper to save data to localStorage
function saveLookupDataToCache(data: LookupData): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(LOOKUP_CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(LOOKUP_CACHE_TIMESTAMP_KEY, Date.now().toString());
    console.log("Lookup data saved to localStorage cache");
  } catch (error) {
    console.error("Error saving lookup data to localStorage:", error);
  }
}

// Helper to load data from localStorage
function loadLookupDataFromCache(): LookupData | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const timestamp = localStorage.getItem(LOOKUP_CACHE_TIMESTAMP_KEY);
    // Check if cache is expired
    if (timestamp && Date.now() - parseInt(timestamp) < CACHE_EXPIRATION) {
      const cachedData = localStorage.getItem(LOOKUP_CACHE_KEY);
      if (cachedData) {
        console.log("Using cached lookup data from localStorage");
        return JSON.parse(cachedData);
      }
    }
    return null;
  } catch (error) {
    console.error("Error loading lookup data from localStorage:", error);
    return null;
  }
}

export function useLookupData() {
  const [lookupData, setLookupData] = useState<LookupData | null>(globalLookupData);
  const [isLoading, setIsLoading] = useState<boolean>(!globalLookupData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If global data already exists, use it immediately
    if (globalLookupData) {
      setLookupData(globalLookupData);
      setIsLoading(false);
      return;
    }
    
    async function initializeLookupData() {
      // Only start a new fetch if no fetch is already in progress
      if (isGlobalFetchInProgress) {
        // Wait for existing fetch to complete
        if (fetchPromise) {
          const result = await fetchPromise;
          if (result) {
            setLookupData(result);
          }
        }
        setIsLoading(false);
        return;
      }
      
      // Try to load from localStorage first
      const cachedData = loadLookupDataFromCache();
      if (cachedData) {
        globalLookupData = cachedData;
        setLookupData(cachedData);
        setIsLoading(false);
        return;
      }
      
      // If no cached data, fetch from API
      setIsLoading(true);
      isGlobalFetchInProgress = true;
      fetchPromise = fetchLookupDataFromAPI();
      
      try {
        const data = await fetchPromise;
        if (data) {
          globalLookupData = data;
          setLookupData(data);
          // Save to localStorage for future component mounts
          saveLookupDataToCache(data);
        }
      } catch (err) {
        console.error('Error in lookup data initialization:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
        isGlobalFetchInProgress = false;
        fetchPromise = null;
      }
    }
    
    initializeLookupData();
  }, []);

  // Helper function to get values for a specific field
  const getValuesForField = (fieldName: string): any[] => {
    if (!lookupData) return [];
    const field = lookupData.fields.find(f => f.name === fieldName);
    
    if (!field) return [];
    
    // Check if values are objects (for county_code)
    if (field.values.length > 0 && typeof field.values[0] === 'object') {
      return field.values;
    }
    
    // For string values, apply title case as before
    return field.values.map(toTitleCase);
  };

  // Helper function to get options for a specific field
  const getOptionsForField = (fieldName: string): MultiSelectOption[] => {
    const values = getValuesForField(fieldName);
    
    // Handle county_code specially
    if (fieldName === 'county_code' && values.length > 0 && typeof values[0] === 'object') {
      return values.map(county => ({
        value: county.code,
        label: `${county.name} (${county.code})`
      }));
    }
    
    // For regular string values
    return toOptions(values);
  };

  // Cached values for commonly used fields using the standard getOptionsForField
  const counties = getOptionsForField('county_code');
  const congressionalDistricts = getOptionsForField('congressional_district');
  const stateSenateDistricts = getOptionsForField('state_senate_district');
  const stateHouseDistricts = getOptionsForField('state_house_district');
  const statuses = getOptionsForField('status');
  const statusReasons = getOptionsForField('status_reason'); // Derive using standard helper
  const parties = getOptionsForField('last_party_voted');
  const genders = getOptionsForField('gender');
  const races = getOptionsForField('race');
  const electionDates = getOptionsForField('election_date');
  // Derive election years from dates
  const electionYears = Array.from(
    new Set(electionDates.map(opt => opt.value.split('-')[0]))
  )
    .sort((a, b) => Number(b) - Number(a))
    .map(year => ({ value: year, label: year }));

  // Hardcoded Voter Events options
  const ballotStyles = BALLOT_STYLE_OPTIONS;
  const eventParties = EVENT_PARTY_OPTIONS;

  // Add logging after data is set
  return {
    isLoading,
    error,
    lookupData,
    counties,
    congressionalDistricts,
    stateSenateDistricts,
    stateHouseDistricts,
    statuses,
    statusReasons,
    parties,
    genders,
    races,
    electionYears,
    electionDates,
    ballotStyles,
    eventParties,
    getValuesForField,
    getOptionsForField
  };
} 