"use client";
import React from "react";
import AggregateFieldDisplay from "@/components/AggregateFieldDisplay";

// Define props
interface VotingHistorySectionProps {
  data: any; // Define specific type later
  loading: boolean;
  error: string | null;
  totalVoters: number;
  onFilterChange: (fieldName: string, value: string | number) => void;
}

function VotingHistorySection({ 
  data,
  loading,
  error,
  totalVoters,
  onFilterChange
}: VotingHistorySectionProps) {

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[150px] text-muted-foreground text-sm">
        <span className="animate-pulse">Loading Voting History...</span>
      </div>
    );
  }
  if (!loading && error && !data) {
    return <div className="text-destructive text-sm p-4 border border-destructive rounded-md">Error loading Voting History: {error}</div>;
  }
  if (!data || (!data.derived_last_vote_date && !data.participated_election_years)) {
    return <div className="text-muted-foreground text-sm p-4 border rounded-md">No data available for Voting History fields.</div>;
  }

  // Helper to format data - Dates might need special handling if they are full timestamps
  const formatDataForDisplay = (items: any[] | undefined, isDate: boolean = false): { value: string; count: number }[] => {
    if (!items) return [];
    return items.map(item => ({
       // Use only YYYY-MM-DD for dates if needed, otherwise full label
      value: (isDate && typeof item.label === 'string') ? item.label.slice(0, 10) : String(item.label), 
      count: item.count
    }));
  };

  return (
    <div className="flex flex-col gap-6"> {/* Stack vertically */}
      {data?.derived_last_vote_date && (
        <AggregateFieldDisplay
          fieldName="Election Date" // Maps to 'electionDate' filter key
          data={formatDataForDisplay(data.derived_last_vote_date, true)}
          totalVoters={totalVoters}
          onFilterChange={onFilterChange}
        />
      )}
      {data?.participated_election_years && (
        <AggregateFieldDisplay
          fieldName="Election Year" // Maps to 'electionYear' filter key
          data={formatDataForDisplay(data.participated_election_years)}
          totalVoters={totalVoters}
          onFilterChange={onFilterChange}
        />
      )}
    </div>
  );
}

export default VotingHistorySection; 