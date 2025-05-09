"use client";
import React from "react";
import AggregateFieldDisplay from "@/components/AggregateFieldDisplay";

// Define props
interface DemographicsSectionProps {
  data: any; // Define specific type later
  loading: boolean;
  error: string | null;
  totalVoters: number;
  onFilterChange: (fieldName: string, value: string | number) => void;
}

function DemographicsSection({ 
  data,
  loading,
  error,
  totalVoters,
  onFilterChange
}: DemographicsSectionProps) {
  // Remove early loading return to allow individual charts to show loading states
  /*
  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[150px] text-muted-foreground text-sm">
        <span className="animate-pulse">Loading Demographics...</span>
      </div>
    );
  }
  */
  
  if (!loading && error && !data) {
    return <div className="text-destructive text-sm p-4 border border-destructive rounded-md">Error loading Demographics: {error}</div>;
  }
  
  if (!loading && (!data || (!data.race && !data.gender && !data.age_range))) {
    return <div className="text-muted-foreground text-sm p-4 border rounded-md">No data available for Demographic fields.</div>;
  }

  // Helper to format data
  const formatDataForDisplay = (items: any[] | undefined): { value: string; count: number }[] => {
    if (!items) return [];
    return items.map(item => ({ value: String(item.label), count: item.count }));
  };

  return (
    <div className="flex flex-col gap-6"> {/* Stack vertically */}
      <AggregateFieldDisplay
        fieldName="Race" // Maps to 'race' filter key
        data={formatDataForDisplay(data?.race || [])}
        totalVoters={totalVoters}
        onFilterChange={onFilterChange}
        localStorageKey="stats-race-chartType"
        loading={loading}
      />
      
      <AggregateFieldDisplay
        fieldName="Gender" // Maps to 'gender' filter key
        data={formatDataForDisplay(data?.gender || [])}
        totalVoters={totalVoters}
        onFilterChange={onFilterChange}
        localStorageKey="stats-gender-chartType"
        loading={loading}
      />
      
      <AggregateFieldDisplay
        fieldName="Age Range" // Maps to 'age' filter key
        data={formatDataForDisplay(data?.age_range || [])}
        totalVoters={totalVoters}
        onFilterChange={onFilterChange}
        localStorageKey="stats-age-range-chartType"
        loading={loading}
      />
    </div>
  );
}

export default DemographicsSection; 