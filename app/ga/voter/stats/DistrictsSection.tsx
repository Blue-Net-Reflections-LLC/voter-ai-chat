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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[150px] text-muted-foreground text-sm">
        <span className="animate-pulse">Loading Districts...</span>
      </div>
    );
  }
  if (error) {
    return <div className="text-destructive text-sm p-4 border border-destructive rounded-md">Error loading Districts: {error}</div>;
  }
  // Check specific data fields
  if (!data || (!data.county_name && !data.congressional_district && !data.state_senate_district && !data.state_house_district)) {
    return <div className="text-muted-foreground text-sm p-4 border rounded-md">No data available for District fields.</div>;
  }

  // Helper to format data
  const formatDataForDisplay = (items: any[] | undefined): { value: string; count: number }[] => {
    if (!items) return [];
    // The parent handler now handles Title Casing based on fieldName if needed
    return items.map(item => ({ value: String(item.label), count: item.count })); 
  };

  return (
    <div className="flex flex-col gap-6"> {/* Stack vertically */}
      {/* Map fieldName to the key used in page.tsx handler */}
      {data?.county_name && (
        <AggregateFieldDisplay
          fieldName="County" // This needs to map to a key in page.tsx handleFilterChange 
          data={formatDataForDisplay(data.county_name)}
          totalVoters={totalVoters}
          onFilterChange={onFilterChange}
        />
      )}
      {data?.congressional_district && (
        <AggregateFieldDisplay
          fieldName="Congressional District" // Maps to 'congressionalDistricts' in filter context
          data={formatDataForDisplay(data.congressional_district)}
          totalVoters={totalVoters}
          onFilterChange={onFilterChange}
        />
      )}
      {data?.state_senate_district && (
        <AggregateFieldDisplay
          fieldName="State Senate District" // Maps to 'stateSenateDistricts'
          data={formatDataForDisplay(data.state_senate_district)}
          totalVoters={totalVoters}
          onFilterChange={onFilterChange}
        />
      )}
      {data?.state_house_district && (
        <AggregateFieldDisplay
          fieldName="State House District" // Maps to 'stateHouseDistricts'
          data={formatDataForDisplay(data.state_house_district)}
          totalVoters={totalVoters}
          onFilterChange={onFilterChange}
        />
      )}
    </div>
  );
}

export default DistrictsSection; 