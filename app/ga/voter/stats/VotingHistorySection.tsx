"use client";
import React from "react";
import AggregateFieldDisplay from "@/components/AggregateFieldDisplay";

// Define props
interface VotingHistoryData {
  election_date_counts?: { label: string; count: number }[]; // Renamed back
  participated_election_years?: { label: string; count: number }[];
}

interface VotingHistorySectionProps {
  data: VotingHistoryData | null;
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
  if (error && !loading && !data) {
    return <div className="text-destructive text-sm p-4 border border-destructive rounded-md">Error loading Voting History: {error}</div>;
  }
  if (!data || (!data.election_date_counts && !data.participated_election_years)) {
    return <div className="text-muted-foreground text-sm p-4 border rounded-md">No data available for Voting History fields.</div>;
  }

  // Helper to format data - Dates might need special handling if they are full timestamps
  const formatDataForDisplay = (items: { label: string | number; count: number }[] | undefined, isDate: boolean = false): { value: string; count: number }[] => {
    if (!items) return [];
    return items.map(item => {
      let displayValue = String(item.label);
      if (isDate && typeof item.label === 'string') {
        try {
          // Check if the label is already in YYYY-MM-DD format or similar
          if (/^\d{4}-\d{2}-\d{2}/.test(item.label)) {
            const dateStr = item.label.slice(0, 10);
            const date = new Date(dateStr + 'T00:00:00Z'); // Treat as UTC to avoid timezone issues
            if (!isNaN(date.getTime())) { // Check if date is valid
              displayValue = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: 'UTC' // Specify UTC timezone for consistency
              });
            } else {
              console.warn(`Invalid date encountered: ${item.label}`);
              // Keep original label if parsing fails
            }
          } else {
            // Keep original label if not in expected format
          }
        } catch (error) {
          console.error(`Error formatting date: ${item.label}`, error);
          // Keep original label on error
        }
      }
      return {
        value: displayValue,
        count: item.count
      };
    });
  };

  return (
    <div className="flex flex-col gap-6"> {/* Stack vertically */}
      {data?.election_date_counts && data.election_date_counts.length > 0 && (
        <AggregateFieldDisplay
          fieldName="Election Date Counts" // Updated display name
          data={formatDataForDisplay(data.election_date_counts, true)} // Use date formatting
          totalVoters={totalVoters}
          onFilterChange={onFilterChange}
          localStorageKey="stats-election-date-chartType"
        />
      )}
      {data?.participated_election_years && data.participated_election_years.length > 0 && (
        <AggregateFieldDisplay
          fieldName="Election Year" // Maps to 'electionYear' filter key
          data={formatDataForDisplay(data.participated_election_years)}
          totalVoters={totalVoters}
          onFilterChange={onFilterChange}
          localStorageKey="stats-election-year-chartType"
        />
      )}
    </div>
  );
}

export default VotingHistorySection; 