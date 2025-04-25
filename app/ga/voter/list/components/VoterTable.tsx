"use client";

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Voter } from '../types';
import { SortField, SortDirection } from '../hooks/useVoterList';
import { cn } from "@/lib/utils";

interface VoterTableProps {
  voters: Voter[];
  isLoading?: boolean;
  sort?: {
    field: SortField;
    direction: SortDirection;
  };
  onSort?: (field: SortField) => void;
}

// Helper to get status display properties
const getStatusProps = (status: string | undefined | null) => {
  const upperStatus = status?.toUpperCase();
  if (upperStatus === 'ACTIVE') {
    return {
      text: 'Active',
      className: "bg-blue-500/10 border border-blue-600/30 text-blue-500"
    };
  }
  // Default to inactive or unknown style
  return {
    text: status || 'Unknown', // Display original status or 'Unknown'
    className: "bg-gray-700/20 border border-gray-600/30 text-gray-400"
  };
};

// Skeleton for loading state
const LoadingSkeleton = () => (
  <>
    {Array.from({ length: 10 }).map((_, i) => (
      <TableRow key={i} className="h-8 border-b border-gray-800">
        <TableCell className="py-1"><Skeleton className="h-4 w-24" /></TableCell>
        <TableCell className="py-1"><Skeleton className="h-4 w-40" /></TableCell>
        <TableCell className="py-1"><Skeleton className="h-4 w-28" /></TableCell>
        <TableCell className="py-1"><Skeleton className="h-4 w-20" /></TableCell>
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
      className="flex items-center text-white text-xs gap-1 hover:text-blue-300 focus:outline-none"
      onClick={() => onSort?.(field)}
    >
      <span>{label}</span>
      {direction === 'asc' ? (
        <ArrowUp className="h-3.5 w-3.5 text-blue-300" />
      ) : direction === 'desc' ? (
        <ArrowDown className="h-3.5 w-3.5 text-blue-300" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-60" />
      )}
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
    <div className="w-full h-full">
      <Table className="relative border-separate border-spacing-0 w-full h-full" style={{ tableLayout: 'fixed' }}>
        <TableHeader>
          <TableRow className="h-7 border-b-0">
            <TableHead style={{ width: '25%', position: 'sticky', top: 0, zIndex: 2, background: '#18181b' }} className="py-1.5 px-3 text-white font-normal">
              <SortButton field="id" label="Registration ID" currentSort={sort} onSort={onSort} />
            </TableHead>
            <TableHead style={{ width: '35%', position: 'sticky', top: 0, zIndex: 2, background: '#18181b' }} className="py-1.5 px-3 text-white font-normal">
              <SortButton field="name" label="Full Name" currentSort={sort} onSort={onSort} />
            </TableHead>
            <TableHead style={{ width: '20%', position: 'sticky', top: 0, zIndex: 2, background: '#18181b' }} className="py-1.5 px-3 text-white font-normal">
              <SortButton field="county" label="County" currentSort={sort} onSort={onSort} />
            </TableHead>
            <TableHead style={{ width: '20%', position: 'sticky', top: 0, zIndex: 2, background: '#18181b' }} className="py-1.5 px-3 text-white font-normal">
              <SortButton field="status" label="Status" currentSort={sort} onSort={onSort} />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <LoadingSkeleton />
          ) : voters.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                No voters found matching your criteria
              </TableCell>
            </TableRow>
          ) : (
            voters.map((voter) => {
              const statusProps = getStatusProps(voter.status);
              return (
                <TableRow key={voter.id} className="h-8 border-b border-gray-800 hover:bg-gray-900/20">
                  <TableCell style={{ width: '25%' }} className="py-1 px-3 text-xs">{voter.id}</TableCell>
                  <TableCell style={{ width: '35%' }} className="py-1 px-3 text-xs">{voter.firstName} {voter.lastName}</TableCell>
                  <TableCell style={{ width: '20%' }} className="py-1 px-3 text-xs">{voter.county || (voter.address?.city && `${voter.address.city}`)}</TableCell>
                  <TableCell style={{ width: '20%' }} className="py-1 px-3">
                    <span className={cn("inline-flex items-center justify-center text-[10px] font-semibold rounded px-2 py-0.5", statusProps.className)}>
                      {statusProps.text.toUpperCase()}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default VoterTable; 