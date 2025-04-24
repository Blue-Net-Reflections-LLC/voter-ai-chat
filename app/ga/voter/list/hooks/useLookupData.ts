"use client";

import { useState, useEffect } from 'react';
import { MultiSelectOption } from '../components/MultiSelect';
import { BALLOT_STYLE_OPTIONS, EVENT_PARTY_OPTIONS } from '../constants';

export type LookupField = {
  name: string;
  displayName: string;
  category: string;
  values: string[];
  count: number;
};

export type LookupData = {
  fields: LookupField[];
  timestamp: string;
};

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

export function useLookupData() {
  const [lookupData, setLookupData] = useState<LookupData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get values for a specific field
  const getValuesForField = (fieldName: string): string[] => {
    if (!lookupData) return [];
    const field = lookupData.fields.find(f => f.name === fieldName);
    return field?.values.map(toTitleCase) || [];
  };

  // Helper function to get options for a specific field
  const getOptionsForField = (fieldName: string): MultiSelectOption[] => {
    return toOptions(getValuesForField(fieldName));
  };

  // Cached values for commonly used fields using the standard getOptionsForField
  const counties = getOptionsForField('county_name');
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

  // Fetch lookup data on component mount
  useEffect(() => {
    async function fetchLookupData() {
      setIsLoading(true);
      setError(null);
      
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
        
        console.log("Lookup API Combined Data:", combinedData); // Log the full fetched data
        setLookupData(combinedData);
      } catch (err) {
        console.error('Error fetching lookup data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchLookupData();
  }, []);

  // Add logging after data is set
  useEffect(() => {
    if (lookupData) {
      console.log("LookupData state updated:", lookupData);
      const rawReasons = lookupData.fields.find(f => f.name === 'status_reason')?.values || [];
      console.log("Raw status_reason values:", rawReasons);
      const options = getOptionsForField('status_reason');
      console.log("Generated statusReason Options:", options);
    }
  }, [lookupData]); // Run when lookupData changes

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