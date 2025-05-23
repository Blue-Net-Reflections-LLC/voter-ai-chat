"use client";

import React, { useState, useEffect } from 'react';
import DistrictMultiSelect, { MultiSelectOption } from './DistrictMultiSelect';
import { useVoterFilterContext } from '../../VoterFilterProvider';
import { Separator } from '@/components/ui/separator';

// Interface for the lookup response data from API
interface PrecinctLookupData {
  code: string;
  description: string | null;
  formatted_label: string;
  meta?: {
    facility_name?: string | null;
    facility_address?: string | null;
  } | null;
}

// Type for formatted precinct options
interface PrecinctOption {
  value: string;
  label: string;
  formatted_label: string;
  facilityName: string | null;
  facilityAddress: string | null;
}

// Global cache map by county code
const globalPrecinctCache: Record<string, { 
  county: PrecinctOption[], 
  municipal: PrecinctOption[] 
}> = {};

// Global label lookup map
const globalPrecinctLabelMap: Record<string, string> = {};

// Function to get a formatted label for a precinct code
export function getPrecinctLabel(precinctCode: string): string {
  return globalPrecinctLabelMap[precinctCode] || precinctCode;
}

// Function to fetch precinct data from API
async function fetchPrecinctData(countyCode: string): Promise<{ county: PrecinctOption[], municipal: PrecinctOption[] }> {
  try {
    console.log(`Fetching precinct data for county: ${countyCode}`);
    
    // Return empty arrays if no county is selected
    if (!countyCode) {
      return { county: [], municipal: [] };
    }
    
    // First, get the county name
    const countyNameResponse = await fetch(`/api/ga/voter/list/lookup?category=countyName&countyCode=${countyCode}`);
    let countyName = countyCode; // Default to code if we can't get the name
    
    if (countyNameResponse.ok) {
      const countyNameData = await countyNameResponse.json();
      if (countyNameData?.name) {
        countyName = countyNameData.name;
      }
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
          
          // Use the formatted_label directly from the API
          return { 
            value: item.code, 
            label: item.formatted_label, // Use the pre-formatted label
            formatted_label: item.formatted_label,
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
  onOptionsUpdate?: (countyOptions: PrecinctOption[], municipalOptions: PrecinctOption[]) => void;
}

export function PrecinctFilters({ 
  selectedCounties = [], 
  onOptionsUpdate 
}: PrecinctFiltersProps) {
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
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch precincts for all selected counties
        const allCountyPrecincts: PrecinctOption[] = [];
        const allMunicipalPrecincts: PrecinctOption[] = [];
        
        // Process each selected county
        for (const countyCode of selectedCounties) {
          // Check if we already have this county's data in the global cache
          if (globalPrecinctCache[countyCode]) {
            allCountyPrecincts.push(...globalPrecinctCache[countyCode].county);
            allMunicipalPrecincts.push(...globalPrecinctCache[countyCode].municipal);
          } else {
            // Fetch from API if not in cache
            const data = await fetchPrecinctData(countyCode);
            
            // Update global cache
            globalPrecinctCache[countyCode] = data;
            
            // Add to our combined arrays
            allCountyPrecincts.push(...data.county);
            allMunicipalPrecincts.push(...data.municipal);
          }
        }

        // Update the global label map
        [...allCountyPrecincts, ...allMunicipalPrecincts].forEach(option => {
          globalPrecinctLabelMap[option.value] = option.label;
        });
        
        // Update component state with combined precincts from all counties
        setCountyPrecinctOptions(allCountyPrecincts);
        setMunicipalPrecinctOptions(allMunicipalPrecincts);
        
        // Notify parent component about new options
        if (onOptionsUpdate) {
          onOptionsUpdate(allCountyPrecincts, allMunicipalPrecincts);
        }
      } catch (err) {
        console.error(`Error fetching precincts:`, err);
        setError(err instanceof Error ? err.message : 'Error loading precincts');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchPrecincts();
  }, [selectedCounties, onOptionsUpdate]);

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