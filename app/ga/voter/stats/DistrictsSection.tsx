"use client";
import React from "react";
import AggregateFieldDisplay from "@/components/AggregateFieldDisplay";

// Define props
interface DistrictsSectionProps {
  data: any; // Define specific type later
  loading: boolean;
  error: string | null;
  totalVoters: number;
  onFilterChange: (fieldName: string, value: string | number) => void;
}

function DistrictsSection({ 
  data,
  loading,
  error,
  totalVoters,
  onFilterChange
}: DistrictsSectionProps) {

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[150px] text-muted-foreground text-sm">
        <span className="animate-pulse">Loading Districts...</span>
      </div>
    );
  }
  if (!loading && error && !data) {
    return <div className="text-destructive text-sm p-4 border border-destructive rounded-md">Error loading Districts: {error}</div>;
  }
  if (!data || (!data.county_name && !data.congressional_district && !data.state_senate_district && !data.state_house_district)) {
    return <div className="text-muted-foreground text-sm p-4 border rounded-md">No data available for District fields.</div>;
  }

  // Helper to format data - modified to preserve full value for filtering
  const formatDataForDisplay = (items: { label: string | number; count: number }[] | undefined, fieldName?: string): { value: string; count: number; filterValue?: string }[] => {
    if (!items) return [];
    
    return items.map(item => {
      let displayValue = String(item.label);
      let filterValue = String(item.label); // Keep original value for filtering

      // Format specific district codes by removing the first two characters only for display
      if ((fieldName === "State Senate District" || fieldName === "State House District" || fieldName === "Congressional District") &&
          typeof item.label === 'string' && item.label.length > 2 // Ensure it's a string long enough to slice
      ) {
        displayValue = item.label.slice(2); // Remove first 2 characters for display only
      }

      return { 
        value: displayValue, 
        count: item.count,
        filterValue: filterValue // Preserve full district code for filtering
      };
    });
  };

  // Modified handler to use filterValue when available
  const handleFilterChange = (fieldName: string, value: string | number, item: any) => {
    // Use the full district code from filterValue if available, otherwise use the display value
    const filterValue = item.filterValue || value;
    onFilterChange(fieldName, filterValue);
  };

  return (
    <div className="flex flex-col gap-6"> {/* Stack vertically */}
      {/* Map fieldName to the key used in page.tsx handler */}
      {data?.county_name && (
        <AggregateFieldDisplay
          fieldName="County" // This needs to map to a key in page.tsx handleFilterChange 
          data={formatDataForDisplay(data.county_name, "County")}
          totalVoters={totalVoters}
          onFilterChange={handleFilterChange}
          localStorageKey="stats-county-chartType"
        />
      )}
      {data?.congressional_district && (
        <AggregateFieldDisplay
          fieldName="Congressional District" // Maps to 'congressionalDistricts' in filter context
          data={formatDataForDisplay(data.congressional_district, "Congressional District")}
          totalVoters={totalVoters}
          onFilterChange={handleFilterChange}
          localStorageKey="stats-congressional-district-chartType"
        />
      )}
      {data?.state_senate_district && (
        <AggregateFieldDisplay
          fieldName="State Senate District" // Maps to 'stateSenateDistricts'
          data={formatDataForDisplay(data.state_senate_district, "State Senate District")}
          totalVoters={totalVoters}
          onFilterChange={handleFilterChange}
          localStorageKey="stats-state-senate-district-chartType"
        />
      )}
      {data?.state_house_district && (
        <AggregateFieldDisplay
          fieldName="State House District" // Maps to 'stateHouseDistricts'
          data={formatDataForDisplay(data.state_house_district, "State House District")}
          totalVoters={totalVoters}
          onFilterChange={handleFilterChange}
          localStorageKey="stats-state-house-district-chartType"
        />
      )}
    </div>
  );
}

export default DistrictsSection; 