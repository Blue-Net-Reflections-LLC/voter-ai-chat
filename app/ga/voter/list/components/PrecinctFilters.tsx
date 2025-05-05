"use client";

import React, { useState, useEffect } from 'react';
import DistrictMultiSelect, { MultiSelectOption } from './DistrictMultiSelect';
import { useVoterFilterContext } from '../../VoterFilterProvider';

// Interface for the lookup response data from API
interface PrecinctLookupData {
  code: string;
  description: string | null;
  meta?: {
    facility_name?: string | null;
    facility_address?: string | null;
  } | null;
}

// Hardcoded county code for now - "067" is Fulton
const HARDCODED_COUNTY_CODE = "067";

export function PrecinctFilters() {
  const { filters, updateFilter } = useVoterFilterContext();

  // State for precinct data
  const [countyPrecinctOptions, setCountyPrecinctOptions] = useState<{ value: string; label: string; facilityName: string | null; facilityAddress: string | null }[]>([]);
  const [municipalPrecinctOptions, setMunicipalPrecinctOptions] = useState<{ value: string; label: string; facilityName: string | null; facilityAddress: string | null }[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);

  // Fetch precincts on component mount
  useEffect(() => {
    let active = true;

    const fetchPrecincts = async () => {
      try {
        const [countyRes, municipalRes] = await Promise.all([
          fetch(`/api/ga/voter/list/lookup?category=countyPrecinct&countyCode=${HARDCODED_COUNTY_CODE}`),
          fetch(`/api/ga/voter/list/lookup?category=municipalPrecinct&countyCode=${HARDCODED_COUNTY_CODE}`)
        ]);

        if (!active) return;

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

        const formatOptions = (data: PrecinctLookupData[]) => {
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
            .filter((item): item is { 
              value: string; 
              label: string; 
              facilityName: string | null; 
              facilityAddress: string | null 
            } => item !== null) // Filter out nulls
            .sort((a, b) => a.label.localeCompare(b.label));
        };

        if (active) {
          const formattedCountyOptions = formatOptions(countyPrecincts);
          const formattedMunicipalOptions = formatOptions(municipalPrecincts);
          
          setCountyPrecinctOptions(formattedCountyOptions);
          setMunicipalPrecinctOptions(formattedMunicipalOptions);
        }
      } catch (err) {
        if (active) {
          console.error("Error fetching precinct data:", err);
          setError(err instanceof Error ? err.message : 'Error loading precincts');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchPrecincts();

    return () => {
      active = false;
    };
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

      {/* Municipal Precinct Filter */}
      <div className="space-y-2">
        {renderMunicipalPrecinctSection()}
      </div>
    </>
  );
}

export default PrecinctFilters; 