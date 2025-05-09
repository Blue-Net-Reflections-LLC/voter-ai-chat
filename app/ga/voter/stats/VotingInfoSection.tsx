"use client";
import React from "react"; 
import AggregateFieldDisplay from "@/components/AggregateFieldDisplay";

interface VotingInfoSectionProps {
  data: any; 
  loading: boolean;
  error: string | null;
  totalVoters: number;
  onFilterChange: (fieldName: string, value: string | number) => void;
}

function VotingInfoSection({ 
  data,
  loading,
  error,
  totalVoters,
  onFilterChange
}: VotingInfoSectionProps) {
  if (error) {
    return <div className="text-destructive text-sm p-4 border border-destructive rounded-md">Error loading Voting Info: {error}</div>;
  }
  
  if (!loading && (!data || (!data.status && !data.status_reason && !data.residence_city && !data.residence_zipcode))) {
    return <div className="text-muted-foreground text-sm p-4 border rounded-md">No data available for Voting Info fields.</div>;
  }

  const formatDataForDisplay = (items: any[] | undefined): { value: string; count: number }[] => {
    if (!items) return [];
    return items.map(item => ({ value: String(item.label), count: item.count }));
  };

  return (
    <div className="flex flex-col gap-6">
      <AggregateFieldDisplay
        fieldName="Status"
        data={formatDataForDisplay(data?.status || [])}
        totalVoters={totalVoters} 
        onFilterChange={onFilterChange} 
        localStorageKey="stats-status-chartType"
        loading={loading}
      />
      
      <AggregateFieldDisplay
        fieldName="Inactive Status Reason Distribution"
        data={formatDataForDisplay(data?.status_reason || [])}
        totalVoters={totalVoters}
        onFilterChange={onFilterChange}
        localStorageKey="stats-status-reason-chartType"
        loading={loading}
      />
      
      <AggregateFieldDisplay
        fieldName="Residence City"
        data={formatDataForDisplay(data?.residence_city || [])}
        totalVoters={totalVoters}
        onFilterChange={onFilterChange}
        localStorageKey="stats-residence-city-chartType"
        loading={loading}
      />
      
      <AggregateFieldDisplay
        fieldName="Residence Zipcode"
        data={formatDataForDisplay(data?.residence_zipcode || [])}
        totalVoters={totalVoters}
        onFilterChange={onFilterChange}
        localStorageKey="stats-residence-zipcode-chartType"
        loading={loading}
      />
    </div>
  );
}

export default VotingInfoSection; 