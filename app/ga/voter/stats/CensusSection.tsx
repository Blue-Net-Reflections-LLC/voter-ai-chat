"use client";
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
const CENSUS_FIELDS: CensusFieldMap[] = [
    // Examples remain commented
];

// Restore props destructuring
function CensusSection({ 
  data,
  loading,
  error,
  totalVoters,
  onFilterChange
}: CensusSectionProps) {
  // Use props for loading/error/no data checks
  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[150px] text-muted-foreground text-sm">
        <span className="animate-pulse">Loading Census Data...</span>
      </div>
    );
  }
  if (!loading && error && !data) { 
    return <div className="text-destructive text-sm p-4 border border-destructive rounded-md">Error loading Census Data: {error}</div>;
  }
  const hasCensusData = data && CENSUS_FIELDS.some(field => data[field.apiField]);
  if (!hasCensusData && CENSUS_FIELDS.length > 0) {
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
                  data={formatDataForDisplay(data[field.apiField])}
                  totalVoters={totalVoters}
                  onFilterChange={onFilterChange}
                  localStorageKey={`stats-${field.apiField.toLowerCase().replace(/_/g, '-')}-chartType`}
              />
          )
      ))}
      {CENSUS_FIELDS.length === 0 && (
          <div className="text-muted-foreground text-sm p-4 border rounded-md">
              Census fields need to be defined in CensusSection.tsx.
          </div>
      )}
    </div>
  );
}

export default CensusSection; 