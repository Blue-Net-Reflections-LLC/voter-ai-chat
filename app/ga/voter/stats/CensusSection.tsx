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
import CVAPRegistrationComparisonChart from "@/components/ga/voter/CVAPRegistrationComparisonChart";

// Restore props interface
interface CensusSectionProps {
  data: any; 
  loading: boolean;
  error: string | null;
  totalVoters: number;
  onFilterChange: (fieldName: string, value: string | number) => void;
}

interface CensusFieldMap {
  apiField: string;
  displayField: string;
  filterKey?: string;
}

const CENSUS_FIELDS: CensusFieldMap[] = [
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

// Format data for display in charts
const formatDataForDisplay = (items: any[] | undefined): { 
  value: string; 
  count: number; 
  fill: string;
}[] => {
  if (!items) return [];
  
  const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];
  
  return items.map((item, index) => ({
    value: String(item.label),
    count: item.count,
    fill: colors[index % colors.length]
  }));
};

function CensusSection({ 
  data,
  loading,
  error,
  totalVoters,
  onFilterChange
}: CensusSectionProps) {
  if (error) {
    return (
      <div className="text-red-500 text-sm p-4 border border-red-200 rounded-md">
        Error loading census data: {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Special handling for CVAP Registration Rates */}
      {data?.cvap_registration_rates && (
        <CVAPRegistrationComparisonChart
          data={data.cvap_registration_rates}
          loading={loading}
        />
      )}
      
      {/* Regular census fields */}
      {CENSUS_FIELDS.map(field => (
          data?.[field.apiField] && (
              <AggregateFieldDisplay
                  key={field.apiField}
                  fieldName={field.displayField}
                  data={formatDataForDisplay(data[field.apiField])}
                  totalVoters={totalVoters}
                  onFilterChange={onFilterChange}
                  localStorageKey={`stats-${field.apiField.toLowerCase().replace(/_/g, '-')}-chartType`}
                  loading={loading}
              />
          )
      ))}
      {CENSUS_FIELDS.length === 0 && !data?.cvap_registration_rates && (
          <div className="text-muted-foreground text-sm p-4 border rounded-md">
              Census analysis requires processed census tract data. This section provides insights into economic indicators, education levels, population density, and CVAP demographics for voters in selected areas.
          </div>
      )}
    </div>
  );
}

export default CensusSection; 