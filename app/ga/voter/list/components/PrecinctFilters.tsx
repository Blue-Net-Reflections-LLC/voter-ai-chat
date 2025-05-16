"use client";

import React, { useState, useEffect } from 'react';
import DistrictMultiSelect, { MultiSelectOption } from './DistrictMultiSelect';
import { useVoterFilterContext } from '../../VoterFilterProvider';
import { Separator } from '@/components/ui/separator';

// Interface for the lookup response data from API
interface PrecinctLookupData {
  code: string;
  description: string | null;
  meta?: {
    facility_name?: string | null;
    facility_address?: string | null;
  } | null;
}

// Type for formatted precinct options
interface PrecinctOption {
  value: string;
  label: string;
  facilityName: string | null;
  facilityAddress: string | null;
}

// Hardcoded county code for now - "067" is Fulton
const HARDCODED_COUNTY_CODE = "067";

// Cache keys for precinct data
const COUNTY_PRECINCT_CACHE_KEY = 'voter-county-precinct-cache';
const MUNICIPAL_PRECINCT_CACHE_KEY = 'voter-municipal-precinct-cache';
const PRECINCT_CACHE_TIMESTAMP_KEY = 'voter-precinct-cache-timestamp';
// Cache expiration time - 1 hour in milliseconds
const CACHE_EXPIRATION = 60 * 60 * 1000;

// Global data for singleton pattern
let globalCountyPrecinctOptions: PrecinctOption[] = [];
let globalMunicipalPrecinctOptions: PrecinctOption[] = [];
let isGlobalFetchInProgress = false;
let fetchPromise: Promise<{ county: PrecinctOption[], municipal: PrecinctOption[] }> | null = null;

// Helper function to save precinct data to localStorage
function savePrecinctDataToCache(countyData: PrecinctOption[], municipalData: PrecinctOption[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(COUNTY_PRECINCT_CACHE_KEY, JSON.stringify(countyData));
    localStorage.setItem(MUNICIPAL_PRECINCT_CACHE_KEY, JSON.stringify(municipalData));
    localStorage.setItem(PRECINCT_CACHE_TIMESTAMP_KEY, Date.now().toString());
    console.log("Precinct data saved to localStorage cache");
  } catch (error) {
    console.error("Error saving precinct data to localStorage:", error);
  }
}

// Helper function to load precinct data from localStorage
function loadPrecinctDataFromCache(): { county: PrecinctOption[], municipal: PrecinctOption[] } | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const timestamp = localStorage.getItem(PRECINCT_CACHE_TIMESTAMP_KEY);
    // Check if cache is expired
    if (timestamp && Date.now() - parseInt(timestamp) < CACHE_EXPIRATION) {
      const cachedCountyData = localStorage.getItem(COUNTY_PRECINCT_CACHE_KEY);
      const cachedMunicipalData = localStorage.getItem(MUNICIPAL_PRECINCT_CACHE_KEY);
      
      if (cachedCountyData && cachedMunicipalData) {
        console.log("Using cached precinct data from localStorage");
        return {
          county: JSON.parse(cachedCountyData),
          municipal: JSON.parse(cachedMunicipalData)
        };
      }
    }
    return null;
  } catch (error) {
    console.error("Error loading precinct data from localStorage:", error);
    return null;
  }
}

// Function to fetch precinct data from API
async function fetchPrecinctData(): Promise<{ county: PrecinctOption[], municipal: PrecinctOption[] }> {
  try {
    const [countyRes, municipalRes] = await Promise.all([
      fetch(`/api/ga/voter/list/lookup?category=countyPrecinct&countyCode=${HARDCODED_COUNTY_CODE}`),
      fetch(`/api/ga/voter/list/lookup?category=municipalPrecinct&countyCode=${HARDCODED_COUNTY_CODE}`)
    ]);

    if (!countyRes.ok || !municipalRes.ok) {
      console.error('Precinct fetch failed:', { 
        countyStatus: countyRes.status, 
        municipalStatus: municipalRes.status 
      });
      throw new Error('Failed to fetch precinct data');
    }

    const countyData = await countyRes.json();
    const municipalData = await municipalRes.json();
    
    // Extract precinct values from the nested structure
    let countyPrecincts: PrecinctLookupData[] = [];
    let municipalPrecincts: PrecinctLookupData[] = [];
    
    // Handle nested structure for county precincts
    if (countyData && 
        typeof countyData === 'object' && 
        'fields' in countyData && 
        Array.isArray(countyData.fields) && 
        countyData.fields.length > 0 && 
        countyData.fields[0].values) {
      countyPrecincts = countyData.fields[0].values;
    }
    
    // Handle nested structure for municipal precincts
    if (municipalData && 
        typeof municipalData === 'object' && 
        'fields' in municipalData && 
        Array.isArray(municipalData.fields) && 
        municipalData.fields.length > 0 && 
        municipalData.fields[0].values) {
      municipalPrecincts = municipalData.fields[0].values;
    }

    const formatOptions = (data: PrecinctLookupData[]): PrecinctOption[] => {
      // Ensure data is an array and not null/undefined
      if (!Array.isArray(data)) return [];
      
      return data
        .map(item => {
          if (!item) return null; // Skip null/undefined items
          
          // Format the label in the new format: "DESCRIPTION (CODE)"
          // Store facility info in separate properties for display in the UI
          return { 
            value: item.code, 
            label: `${item.description || 'N/A'} (${item.code})`,
            facilityName: item.meta?.facility_name || null,
            facilityAddress: item.meta?.facility_address || null
          };
        })
        .filter((item): item is PrecinctOption => item !== null) // Filter out nulls
        .sort((a, b) => a.label.localeCompare(b.label));
    };

    const formattedCountyOptions = formatOptions(countyPrecincts);
    const formattedMunicipalOptions = formatOptions(municipalPrecincts);
    
    console.log("Precinct data fetched successfully");
    return {
      county: formattedCountyOptions,
      municipal: formattedMunicipalOptions
    };
  } catch (err) {
    console.error("Error fetching precinct data:", err);
    return { county: [], municipal: [] };
  }
}

export function PrecinctFilters() {
  const { filters, updateFilter } = useVoterFilterContext();

  // State for precinct data
  const [countyPrecinctOptions, setCountyPrecinctOptions] = useState<PrecinctOption[]>(globalCountyPrecinctOptions);
  const [municipalPrecinctOptions, setMunicipalPrecinctOptions] = useState<PrecinctOption[]>(globalMunicipalPrecinctOptions);
  const [isLoading, setIsLoading] = useState(!globalCountyPrecinctOptions.length || !globalMunicipalPrecinctOptions.length);
  const [error, setError] = useState<string | null>(null);

  // Initialize precinct data
  useEffect(() => {
    // If global data already exists, use it immediately
    if (globalCountyPrecinctOptions.length && globalMunicipalPrecinctOptions.length) {
      setCountyPrecinctOptions(globalCountyPrecinctOptions);
      setMunicipalPrecinctOptions(globalMunicipalPrecinctOptions);
      setIsLoading(false);
      return;
    }
    
    async function initializePrecinctData() {
      // Only start a new fetch if no fetch is already in progress
      if (isGlobalFetchInProgress) {
        if (fetchPromise) {
          const result = await fetchPromise;
          setCountyPrecinctOptions(result.county);
          setMunicipalPrecinctOptions(result.municipal);
        }
        setIsLoading(false);
        return;
      }
      
      // Try to load from localStorage first
      const cachedData = loadPrecinctDataFromCache();
      if (cachedData) {
        globalCountyPrecinctOptions = cachedData.county;
        globalMunicipalPrecinctOptions = cachedData.municipal;
        setCountyPrecinctOptions(cachedData.county);
        setMunicipalPrecinctOptions(cachedData.municipal);
        setIsLoading(false);
        return;
      }
      
      // If no cached data, fetch from API
      setIsLoading(true);
      isGlobalFetchInProgress = true;
      fetchPromise = fetchPrecinctData();
      
      try {
        const data = await fetchPromise;
        
        // Update global cache
        globalCountyPrecinctOptions = data.county;
        globalMunicipalPrecinctOptions = data.municipal;
        
        // Update component state
        setCountyPrecinctOptions(data.county);
        setMunicipalPrecinctOptions(data.municipal);
        
        // Save to localStorage for future component mounts
        savePrecinctDataToCache(data.county, data.municipal);
      } catch (err) {
        console.error('Error in precinct data initialization:', err);
        setError(err instanceof Error ? err.message : 'Error loading precincts');
      } finally {
        setIsLoading(false);
        isGlobalFetchInProgress = false;
        fetchPromise = null;
      }
    }
    
    initializePrecinctData();
  }, []);

  // Format function for displaying precincts
  const formatPrecinctLabel = (code: string): string => {
    // Find the precinct option for this code
    const option = countyPrecinctOptions.find(opt => opt.value === code) || 
                   municipalPrecinctOptions.find(opt => opt.value === code);
    
    if (!option) return code;
    
    // For the dropdown display, return just the basic label
    return option.label;
  };

  // Format function for the selected items display
  const renderCompletePrecinctLabel = (option: MultiSelectOption): React.ReactNode => {
    if (!option.facilityName && !option.facilityAddress) {
      return option.label;
    }
    
    return (
      <div className="text-left">
        <div>{option.label}</div>
        {option.facilityName && (
          <div className="text-[10px] text-muted-foreground">
            {option.facilityName}
          </div>
        )}
        {option.facilityAddress && (
          <div className="text-[9px] text-muted-foreground">
            {option.facilityAddress}
          </div>
        )}
      </div>
    );
  };

  // Return loading state for each dropdown
  const renderCountyPrecinctSection = () => {
    return (
      <DistrictMultiSelect
        label="County Precincts"
        options={countyPrecinctOptions}
        value={Array.isArray(filters.countyPrecincts) ? filters.countyPrecincts : []}
        setValue={(value) => updateFilter('countyPrecincts', value)}
        isLoading={isLoading}
        error={error}
        compact={true}
        formatLabel={formatPrecinctLabel}
        renderOption={renderCompletePrecinctLabel}
      />
    );
  };
  
  const renderMunicipalPrecinctSection = () => {
    return (
      <DistrictMultiSelect
        label="Municipal Precincts"
        options={municipalPrecinctOptions}
        value={Array.isArray(filters.municipalPrecincts) ? filters.municipalPrecincts : []}
        setValue={(value) => updateFilter('municipalPrecincts', value)}
        isLoading={isLoading}
        error={error}
        compact={true}
        formatLabel={formatPrecinctLabel}
        renderOption={renderCompletePrecinctLabel}
      />
    );
  };

  return (
    <>
      {/* County Precinct Filter */}
      <div className="space-y-2">
        {renderCountyPrecinctSection()}
      </div>
      <div>
        <Separator className="my-3 mt-5" />
      </div>
      {/* Municipal Precinct Filter */}
      <div className="space-y-2">
        {renderMunicipalPrecinctSection()}
      </div>
    </>
  );
}

export default PrecinctFilters; 