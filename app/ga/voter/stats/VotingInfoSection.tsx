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
  if (loading) {
    return <div className="flex flex-col items-center justify-center min-h-[150px] text-muted-foreground text-sm"><span className="animate-pulse">Loading Voting Info...</span></div>;
  }
  if (error) {
    return <div className="text-destructive text-sm p-4 border border-destructive rounded-md">Error loading Voting Info: {error}</div>;
  }
  if (!data || (!data.status && !data.status_reason && !data.residence_city && !data.residence_zipcode)) {
    return <div className="text-muted-foreground text-sm p-4 border rounded-md">No data available for Voting Info fields.</div>;
  }

  const formatDataForDisplay = (items: any[] | undefined): { value: string; count: number }[] => {
    if (!items) return [];
    return items.map(item => ({ value: String(item.label), count: item.count }));
  };

  return (
    <div className="flex flex-col gap-6">
      {data?.status && <AggregateFieldDisplay fieldName="Status" data={formatDataForDisplay(data.status)} totalVoters={totalVoters} onFilterChange={onFilterChange} />}
      {data?.status_reason && <AggregateFieldDisplay fieldName="Status Reason" data={formatDataForDisplay(data.status_reason)} totalVoters={totalVoters} onFilterChange={onFilterChange} />}
      {data?.residence_city && <AggregateFieldDisplay fieldName="Residence City" data={formatDataForDisplay(data.residence_city)} totalVoters={totalVoters} onFilterChange={onFilterChange} />}
      {data?.residence_zipcode && <AggregateFieldDisplay fieldName="Residence Zipcode" data={formatDataForDisplay(data.residence_zipcode)} totalVoters={totalVoters} onFilterChange={onFilterChange} />}
    </div>
  );
}

export default VotingInfoSection; 