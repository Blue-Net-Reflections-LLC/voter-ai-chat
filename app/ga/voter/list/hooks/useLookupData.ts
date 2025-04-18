"use client";

import { useState, useEffect } from 'react';

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

  // Cached values for commonly used fields
  const counties = getValuesForField('county_name');
  const congressionalDistricts = getValuesForField('congressional_district');
  const stateSenateDistricts = getValuesForField('state_senate_district');
  const stateHouseDistricts = getValuesForField('state_house_district');
  const statuses = getValuesForField('status');
  const parties = getValuesForField('last_party_voted');
  const genders = getValuesForField('gender');
  const races = getValuesForField('race');

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
                                      !registrationResponse.ok ? registrationResponse.status : 
                                      demographicResponse.status}`);
        }
        
        const districtData = await districtResponse.json();
        const registrationData = await registrationResponse.json();
        const demographicData = await demographicResponse.json();
        
        // Combine all data sets
        const combinedData = {
          fields: [...districtData.fields, ...registrationData.fields, ...demographicData.fields],
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
    getValuesForField
  };
} 