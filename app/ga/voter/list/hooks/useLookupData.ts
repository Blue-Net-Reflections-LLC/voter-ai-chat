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

  // Cached values for commonly used fields
  const counties = getOptionsForField('county_name');
  const congressionalDistricts = getOptionsForField('congressional_district');
  const stateSenateDistricts = getOptionsForField('state_senate_district');
  const stateHouseDistricts = getOptionsForField('state_house_district');
  const statuses = getOptionsForField('status');
  const parties = getOptionsForField('last_party_voted');
  const genders = getOptionsForField('gender');
  const races = getOptionsForField('race');

  // Hardcoded Voter Events options
  const ballotStyles = BALLOT_STYLE_OPTIONS;
  const eventParties = EVENT_PARTY_OPTIONS;

  // Fetch lookup data on component mount
  useEffect(() => {
    async function fetchLookupData() {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch district, registration, and demographic data in parallel
        const [districtResponse, registrationResponse, demographicResponse] = await Promise.all([
          fetch('/api/ga/voter/list/lookup?category=district'),
          fetch('/api/ga/voter/list/lookup?category=registration'),
          fetch('/api/ga/voter/list/lookup?category=demographic')
        ]);
        
        if (!districtResponse.ok || !registrationResponse.ok || !demographicResponse.ok) {
          throw new Error(`API error: ${!districtResponse.ok ? districtResponse.status : 
                                      !registrationResponse.ok ? registrationResponse.status : demographicResponse.status}`);
        }
        
        const districtData = await districtResponse.json();
        const registrationData = await registrationResponse.json();
        const demographicData = await demographicResponse.json();
        
        // Combine all data sets
        const combinedData = {
          fields: [
            ...districtData.fields,
            ...registrationData.fields,
            ...demographicData.fields
          ],
          timestamp: new Date().toISOString()
        };
        
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

  return {
    isLoading,
    error,
    lookupData,
    counties,
    congressionalDistricts,
    stateSenateDistricts,
    stateHouseDistricts,
    statuses,
    parties,
    genders,
    races,
    ballotStyles,
    eventParties,
    getValuesForField,
    getOptionsForField
  };
} 