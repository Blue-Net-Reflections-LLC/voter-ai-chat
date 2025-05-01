"use client";

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface VotingHistorySectionProps {
  participationData: any;
  participationLoading: boolean;
  participationError: string | null;
}

// Helper function to safely format dates or return a fallback
const formatElectionDate = (dateString: string | undefined | null): string => {
  if (!dateString) return 'Unknown Date';
  
  // Try to parse the date
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    // Try to extract year from the string if it's in a format like "2020-11-03"
    const yearMatch = dateString.match(/\d{4}/);
    if (yearMatch) {
      return yearMatch[0]; // Return just the year
    }
    return 'Unknown Date';
  }
  
  // Format valid date
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Helper function to get date for sorting
const getDateForSorting = (dateString: string | undefined | null): number => {
  if (!dateString) return 0;
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    // Try to extract year from the string
    const yearMatch = dateString.match(/\d{4}/);
    if (yearMatch) {
      return parseInt(yearMatch[0], 10);
    }
    return 0;
  }
  
  return date.getTime();
};

export function VotingHistorySection({
  participationData,
  participationLoading,
  participationError
}: VotingHistorySectionProps) {
  // Sort history in reverse chronological order
  const sortedHistory = React.useMemo(() => {
    if (!participationData?.history?.length) return [];
    
    return [...participationData.history].sort((a, b) => {
      const dateA = getDateForSorting(a.election_date);
      const dateB = getDateForSorting(b.election_date);
      return dateB - dateA; // Sort descending (newest first)
    });
  }, [participationData]);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Voting History</CardTitle>
        <CardDescription>
          Past elections participation
        </CardDescription>
      </CardHeader>
      <CardContent>
        {participationLoading ? (
          <div className="space-y-2">
            <Skeleton className="w-full h-5" />
            <Skeleton className="w-full h-5" />
            <Skeleton className="w-4/5 h-5" />
          </div>
        ) : participationError ? (
          <div className="text-red-500">Error loading voting history: {participationError}</div>
        ) : sortedHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Election Type</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedHistory.map((item: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {formatElectionDate(item.election_date)}
                    </TableCell>
                    <TableCell>
                      {item.election_type || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {item.party || '-'}
                    </TableCell>
                    <TableCell>
                      {[
                        item.ballot_style,
                        item.absentee === 'Y' ? 'Absentee' : null,
                        item.provisional === 'Y' ? 'Provisional' : null
                      ].filter(Boolean).join(', ') || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No voting history available for this voter.</div>
        )}
      </CardContent>
    </Card>
  );
} 