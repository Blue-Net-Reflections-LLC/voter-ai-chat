"use client";
import React from "react";
import AggregateFieldDisplay from "@/components/AggregateFieldDisplay";

// Define props
interface CensusSectionProps {
  data: any; // Define specific type later based on API response for census data
  loading: boolean;
  error: string | null;
  totalVoters: number;
  onFilterChange: (fieldName: string, value: string | number) => void;
}

// Define type for census field mapping
interface CensusFieldMap {
    apiField: string;
    displayField: string;
}

// Placeholder: Define expected census fields from the API data object
const CENSUS_FIELDS: CensusFieldMap[] = [
    // Example fields - replace with actual field names from API response
    // { apiField: "census_tract", displayField: "Census Tract" },
    // { apiField: "census_block_group", displayField: "Census Block Group" },
    // { apiField: "census_block", displayField: "Census Block" },
];

function CensusSection({ 
  data,
  loading,
  error,
  totalVoters,
  onFilterChange
}: CensusSectionProps) {

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[150px] text-muted-foreground text-sm">
        <span className="animate-pulse">Loading Census Data...</span>
      </div>
    );
  }
  if (error) {
    return <div className="text-destructive text-sm p-4 border border-destructive rounded-md">Error loading Census Data: {error}</div>;
  }
  // Check if data object exists and has *any* of the expected census fields
  const hasCensusData = data && CENSUS_FIELDS.some(field => data[field.apiField]);
  if (!hasCensusData) {
      return <div className="text-muted-foreground text-sm p-4 border rounded-md">No data available for Census fields. (Or fields not defined yet)</div>;
  }

  // Helper to format data
  const formatDataForDisplay = (items: any[] | undefined): { value: string; count: number }[] => {
    if (!items) return [];
    return items.map(item => ({ value: String(item.label), count: item.count }));
  };

  return (
    <div className="flex flex-col gap-6"> {/* Stack vertically */}
      {CENSUS_FIELDS.map(field => (
          data?.[field.apiField] && (
              <AggregateFieldDisplay
                  key={field.apiField}
                  fieldName={field.displayField} // Ensure this matches a key in page.tsx handler if filtering is needed
                  data={formatDataForDisplay(data[field.apiField])}
                  totalVoters={totalVoters}
                  onFilterChange={onFilterChange}
              />
          )
      ))}
      {/* Add a message if the fields array is empty */}
      {CENSUS_FIELDS.length === 0 && (
          <div className="text-muted-foreground text-sm p-4 border rounded-md">
              Census fields need to be defined in CensusSection.tsx.
          </div>
      )}
    </div>
  );
}

export default CensusSection; 