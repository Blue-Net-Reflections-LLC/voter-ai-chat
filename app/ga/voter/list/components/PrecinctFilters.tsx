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

// Remove hardcoded county code
// const HARDCODED_COUNTY_CODE = "067";

// Cache now includes county code in the key
const getCountyPrecinctCacheKey = (countyCode: string) => `voter-county-precinct-cache-${countyCode}`;
const getMunicipalPrecinctCacheKey = (countyCode: string) => `voter-municipal-precinct-cache-${countyCode}`;
const PRECINCT_CACHE_TIMESTAMP_KEY = 'voter-precinct-cache-timestamp';
// Cache expiration time - 1 hour in milliseconds
const CACHE_EXPIRATION = 60 * 60 * 1000;

// Global cache map by county code
const globalPrecinctCache: Record<string, { 
  county: PrecinctOption[], 
  municipal: PrecinctOption[] 
}> = {};

// Helper function to save precinct data to localStorage
function savePrecinctDataToCache(countyCode: string, countyData: PrecinctOption[], municipalData: PrecinctOption[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(getCountyPrecinctCacheKey(countyCode), JSON.stringify(countyData));
    localStorage.setItem(getMunicipalPrecinctCacheKey(countyCode), JSON.stringify(municipalData));
    localStorage.setItem(PRECINCT_CACHE_TIMESTAMP_KEY, Date.now().toString());
    console.log(`Precinct data for county ${countyCode} saved to localStorage cache`);
  } catch (error) {
    console.error("Error saving precinct data to localStorage:", error);
  }
}

// Helper function to load precinct data from localStorage
function loadPrecinctDataFromCache(countyCode: string): { county: PrecinctOption[], municipal: PrecinctOption[] } | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const timestamp = localStorage.getItem(PRECINCT_CACHE_TIMESTAMP_KEY);
    // Check if cache is expired
    if (timestamp && Date.now() - parseInt(timestamp) < CACHE_EXPIRATION) {
      const cachedCountyData = localStorage.getItem(getCountyPrecinctCacheKey(countyCode));
      const cachedMunicipalData = localStorage.getItem(getMunicipalPrecinctCacheKey(countyCode));
      
      if (cachedCountyData && cachedMunicipalData) {
        console.log(`Using cached precinct data for county ${countyCode}`);
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
async function fetchPrecinctData(countyCode: string): Promise<{ county: PrecinctOption[], municipal: PrecinctOption[] }> {
  try {
    console.log(`Fetching precinct data for county: ${countyCode}`);
    
    // Return empty arrays if no county is selected
    if (!countyCode) {
      return { county: [], municipal: [] };
    }
    
    const [countyRes, municipalRes] = await Promise.all([
      fetch(`/api/ga/voter/list/lookup?category=countyPrecinct&countyCode=${countyCode}`),
      fetch(`/api/ga/voter/list/lookup?category=municipalPrecinct&countyCode=${countyCode}`)
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
    
    console.log(`Precinct data for county ${countyCode} fetched successfully`);
    return {
      county: formattedCountyOptions,
      municipal: formattedMunicipalOptions
    };
  } catch (err) {
    console.error(`Error fetching precinct data for county ${countyCode}:`, err);
    return { county: [], municipal: [] };
  }
}

interface PrecinctFiltersProps {
  selectedCounties?: string[];
}

export function PrecinctFilters({ selectedCounties = [] }: PrecinctFiltersProps) {
  const { filters, updateFilter } = useVoterFilterContext();

  // State for precinct data
  const [countyPrecinctOptions, setCountyPrecinctOptions] = useState<PrecinctOption[]>([]);
  const [municipalPrecinctOptions, setMunicipalPrecinctOptions] = useState<PrecinctOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch precincts whenever selected counties change
  useEffect(() => {
    async function fetchPrecincts() {
      // If no counties selected, clear the precincts
      if (selectedCounties.length === 0) {
        setCountyPrecinctOptions([]);
        setMunicipalPrecinctOptions([]);
        return;
      }
      
      // Only supporting a single county for now - use the first selected county
      const countyCode = selectedCounties[0];
      
      // Check if we already have this county's data in the global cache
      if (globalPrecinctCache[countyCode]) {
        setCountyPrecinctOptions(globalPrecinctCache[countyCode].county);
        setMunicipalPrecinctOptions(globalPrecinctCache[countyCode].municipal);
        return;
      }
      
      // Try to load from localStorage first
      const cachedData = loadPrecinctDataFromCache(countyCode);
      if (cachedData) {
        globalPrecinctCache[countyCode] = cachedData;
        setCountyPrecinctOptions(cachedData.county);
        setMunicipalPrecinctOptions(cachedData.municipal);
        return;
      }
      
      // If no cached data, fetch from API
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await fetchPrecinctData(countyCode);
        
        // Update global cache
        globalPrecinctCache[countyCode] = data;
        
        // Update component state
        setCountyPrecinctOptions(data.county);
        setMunicipalPrecinctOptions(data.municipal);
        
        // Save to localStorage for future component mounts
        savePrecinctDataToCache(countyCode, data.county, data.municipal);
      } catch (err) {
        console.error(`Error fetching precincts for county ${countyCode}:`, err);
        setError(err instanceof Error ? err.message : 'Error loading precincts');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchPrecincts();
  }, [selectedCounties]);

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

  // Display a message when no counties are selected
  if (selectedCounties.length === 0) {
    return (
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded border border-dashed border-muted">
          Please select a county first to view available precincts.
        </div>
      </div>
    );
  }

  // Render county precinct section
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