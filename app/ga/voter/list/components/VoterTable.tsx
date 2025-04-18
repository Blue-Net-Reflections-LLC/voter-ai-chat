"use client";

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Voter } from '../types';
import { SortField, SortDirection } from '../hooks/useVoterList';
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown } from "lucide-react";

interface VoterTableProps {
  voters: Voter[];
  isLoading?: boolean;
  sort?: {
    field: SortField;
    direction: SortDirection;
  };
  onSort?: (field: SortField) => void;
}

// Skeleton for loading state
const LoadingSkeleton = () => (
  <>
    {Array.from({ length: 8 }).map((_, i) => (
      <TableRow key={i}>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
        <TableCell><Skeleton className="h-5 w-28" /></TableCell>
        <TableCell><Skeleton className="h-5 w-28" /></TableCell>
        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
      </TableRow>
    ))}
  </>
);

// Sort button with appropriate icon based on current sort state
const SortButton = ({ 
  field, 
  label, 
  currentSort, 
  onSort 
}: { 
  field: SortField; 
  label: string; 
  currentSort?: { field: SortField; direction: SortDirection }; 
  onSort?: (field: SortField) => void;
}) => {
  const isActive = currentSort?.field === field;
  const direction = isActive ? currentSort.direction : null;
  
  return (
    <button
      className="flex items-center space-x-1 hover:text-blue-600 focus:outline-none group"
      onClick={() => onSort?.(field)}
    >
      <span>{label}</span>
      <span className="flex items-center">
        {direction === 'asc' ? (
          <ChevronUp className="h-4 w-4 text-blue-600" />
        ) : direction === 'desc' ? (
          <ChevronDown className="h-4 w-4 text-blue-600" />
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100" />
        )}
      </span>
    </button>
  );
};

export function VoterTable({ 
  voters, 
  isLoading = false, 
  sort,
  onSort 
}: VoterTableProps) {
  return (
    <div className="w-full h-full overflow-auto">
      <Table className="relative">
        <TableHeader className="bg-gray-50 sticky top-0 z-10">
          <TableRow>
            <TableHead className="w-[10%]">
              <SortButton field="id" label="Voter ID" currentSort={sort} onSort={onSort} />
            </TableHead>
            <TableHead className="w-[20%]">
              <SortButton field="name" label="Name" currentSort={sort} onSort={onSort} />
            </TableHead>
            <TableHead className="w-[7%]">
              <SortButton field="age" label="Age" currentSort={sort} onSort={onSort} />
            </TableHead>
            <TableHead className="w-[7%]">
              <SortButton field="gender" label="Gender" currentSort={sort} onSort={onSort} />
            </TableHead>
            <TableHead className="w-[14%]">
              <SortButton field="race" label="Race" currentSort={sort} onSort={onSort} />
            </TableHead>
            <TableHead className="w-[14%]">
              <SortButton field="status" label="Status" currentSort={sort} onSort={onSort} />
            </TableHead>
            <TableHead className="w-[15%]">
              <SortButton field="address" label="Address" currentSort={sort} onSort={onSort} />
            </TableHead>
            <TableHead className="w-[13%]">
              <SortButton field="votingHistory" label="Voting History" currentSort={sort} onSort={onSort} />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <LoadingSkeleton />
          ) : voters.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                No voters found matching your criteria
              </TableCell>
            </TableRow>
          ) : (
            voters.map((voter) => (
              <TableRow key={voter.id}>
                <TableCell className="font-medium">{voter.id}</TableCell>
                <TableCell>{voter.firstName} {voter.lastName}</TableCell>
                <TableCell>{voter.age}</TableCell>
                <TableCell>{voter.gender}</TableCell>
                <TableCell>{voter.race}</TableCell>
                <TableCell>
                  <Badge 
                    variant={voter.status === 'Active' ? 'default' : 
                            voter.status === 'Inactive' ? 'secondary' : 
                            'outline'}
                  >
                    {voter.status}
                  </Badge>
                </TableCell>
                <TableCell className="truncate max-w-xs">
                  {voter.address?.street}, {voter.address?.city}
                </TableCell>
                <TableCell>
                  {voter.votingHistory?.reduce(
                    (count, vote) => (vote.voted ? count + 1 : count), 
                    0
                  )} / {voter.votingHistory?.length || 0} elections
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default VoterTable; 