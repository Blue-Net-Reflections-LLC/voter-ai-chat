"use client";

/**
 * Census Section for Voter Statistics Dashboard
 * 
 * Provides comprehensive census-based analysis of voters including:
 * - Income bracket distribution based on tract median household income
 * - Education attainment levels based on bachelor's degree rates
 * - Unemployment rate categories for economic context
 * - Population density analysis
 * - CVAP (Citizen Voting Age Population) demographics with racial estimates
 * - CVAP vs Registered voter comparison by race (shows engagement levels)
 * 
 * Data sourced from 2020 Decennial Census, 2019-2023 ACS, and official CVAP tabulations.
 */

import React from "react";
import { useVoterFilterContext, buildQueryParams } from "../VoterFilterProvider";
import type { FilterState, ResidenceAddressFilterState } from "../list/types";
import AggregateFieldDisplay from "@/components/AggregateFieldDisplay";

// Restore props interface
interface CensusSectionProps {
  data: any; 
  loading: boolean;
  error: string | null;
  totalVoters: number;
  onFilterChange: (fieldName: string, value: string | number) => void;
}

// Keep field mapping definitions
interface CensusFieldMap {
    apiField: string;
    displayField: string;
    filterKey?: keyof FilterState; 
}

// Define race-specific colors for consistent grouping
const RACE_COLORS: Record<string, string> = {
  'White': '#0088FE',
  'Black': '#00C49F', 
  'Asian/Pacific Islander': '#FFBB28',
  'Hispanic/Latino': '#FF8042',
  'Other Races': '#8884D8'
};

const CENSUS_FIELDS: CensusFieldMap[] = [
    { 
        apiField: 'cvap_registration_rates', 
        displayField: 'CVAP vs Registered Voters by Race Comparison'
    },
    { 
        apiField: 'income_brackets', 
        displayField: 'Income Brackets',
        filterKey: 'incomeRanges' // Maps to existing income filter
    },
    { 
        apiField: 'education_levels', 
        displayField: 'Education Attainment Levels',
        filterKey: 'educationRanges' // Maps to existing education filter
    },
    { 
        apiField: 'unemployment_rates', 
        displayField: 'Unemployment Rate Categories',
        filterKey: 'unemploymentRanges' // Maps to existing unemployment filter
    },
    { 
        apiField: 'population_density', 
        displayField: 'Population Density Categories'
    },
    { 
        apiField: 'cvap_demographics', 
        displayField: 'CVAP Demographics (Eligible Voter Estimates)'
    }
];

// Custom function to format CVAP comparison data with race-specific colors
const formatCVAPComparisonData = (items: any[] | undefined): { 
  value: string; 
  count: number; 
  fill: string;
  race_category?: string;
  data_type?: string;
}[] => {
  if (!items) return [];
  
  return items.map(item => {
    // Extract race category from the extended item properties
    const raceCategory = item.race_category || 'Unknown';
    const dataType = item.data_type || 'unknown';
    
    // Get base color for this race
    const baseColor = RACE_COLORS[raceCategory] || '#999999';
    
    // For registered voters, use a slightly lighter/different shade
    const fillColor = dataType === 'registered' 
      ? adjustColorBrightness(baseColor, 30) // Lighter for registered
      : baseColor; // Original color for CVAP
    
    return {
      value: String(item.label),
      count: item.count,
      fill: fillColor,
      race_category: raceCategory,
      data_type: dataType
    };
  });
};

// Helper function to adjust color brightness
const adjustColorBrightness = (color: string, amount: number): string => {
  const usePound = color[0] === '#';
  const colorHex = usePound ? color.slice(1) : color;
  const num = parseInt(colorHex, 16);
  
  let r = (num >> 16) + amount;
  let g = (num >> 8 & 0x00FF) + amount;
  let b = (num & 0x0000FF) + amount;
  
  r = r > 255 ? 255 : r < 0 ? 0 : r;
  g = g > 255 ? 255 : g < 0 ? 0 : g;
  b = b > 255 ? 255 : b < 0 ? 0 : b;
  
  return (usePound ? '#' : '') + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
};

// Restore props destructuring
function CensusSection({ 
  data,
  loading,
  error,
  totalVoters,
  onFilterChange
}: CensusSectionProps) {
  // Remove early loading return to allow individual charts to show loading state
  /*
  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[150px] text-muted-foreground text-sm">
        <span className="animate-pulse">Loading Census Data...</span>
      </div>
    );
  }
  */
  
  if (!loading && error && !data) { 
    return <div className="text-destructive text-sm p-4 border border-destructive rounded-md">Error loading Census Data: {error}</div>;
  }
  const hasCensusData = data && CENSUS_FIELDS.some(field => data[field.apiField]);
  if (!loading && !hasCensusData && CENSUS_FIELDS.length > 0) {
      return <div className="text-muted-foreground text-sm p-4 border rounded-md">No data available for Census fields.</div>;
  }

  // formatDataForDisplay remains
  const formatDataForDisplay = (items: any[] | undefined): { value: string; count: number }[] => {
    if (!items) return [];
    return items.map(item => ({ value: String(item.label), count: item.count }));
  };

  return (
    <div className="flex flex-col gap-6">
      {CENSUS_FIELDS.map(field => (
          data?.[field.apiField] && (
              <AggregateFieldDisplay
                  key={field.apiField}
                  fieldName={field.displayField}
                  data={
                    field.apiField === 'cvap_registration_rates' 
                      ? formatCVAPComparisonData(data[field.apiField])
                      : formatDataForDisplay(data[field.apiField])
                  }
                  totalVoters={totalVoters}
                  onFilterChange={onFilterChange}
                  localStorageKey={`stats-${field.apiField.toLowerCase().replace(/_/g, '-')}-chartType`}
                  loading={loading}
              />
          )
      ))}
      {CENSUS_FIELDS.length === 0 && (
          <div className="text-muted-foreground text-sm p-4 border rounded-md">
              Census analysis requires processed census tract data. This section provides insights into economic indicators, education levels, population density, and CVAP demographics for voters in selected areas.
          </div>
      )}
    </div>
  );
}

export default CensusSection; 