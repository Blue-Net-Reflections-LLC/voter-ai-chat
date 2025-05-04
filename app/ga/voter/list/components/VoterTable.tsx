"use client";

import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Voter } from '../types';
import { SortField, SortDirection } from '../hooks/useVoterList';
import { cn } from "@/lib/utils";
import { VoterQuickview } from "@/components/ga/voter/quickview/VoterQuickview";
import { ParticipationScoreWidget } from "@/components/voter/ParticipationScoreWidget";

interface VoterTableProps {
  voters: Voter[];
  isLoading?: boolean;
  sort?: {
    field: SortField;
    direction: SortDirection;
  };
  onSort?: (field: SortField) => void;
}

interface SortButtonProps {
  field: SortField;
  label: string;
  currentSort?: {
    field: SortField;
    direction: SortDirection;
  };
  onSort?: (field: SortField) => void;
}

const SortButton = ({ field, label, currentSort, onSort }: SortButtonProps) => {
  const active = currentSort?.field === field;
  const direction = active ? currentSort.direction : null;
  
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={() => onSort?.(field)} 
      className="h-6 px-1 font-semibold text-[10px] justify-between"
    >
      {label}
      {active ? (
        direction === 'asc' ? <ArrowUp className="ml-1 h-3.5 w-3.5" /> : <ArrowDown className="ml-1 h-3.5" />
      ) : (
        <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-50" />
      )}
    </Button>
  );
};

// Skeleton for loading state
const LoadingSkeleton = () => (
  <>
    {Array.from({ length: 25 }).map((_, i) => (
      <TableRow key={i} className="h-8 border-b border-gray-800">
        <TableCell className="py-1"><Skeleton className="h-4 w-32" /></TableCell>
        <TableCell className="py-1"><Skeleton className="h-4 w-24" /></TableCell>
        <TableCell className="py-1"><Skeleton className="h-4 w-40" /></TableCell>
        <TableCell className="py-1"><Skeleton className="h-4 w-16" /></TableCell>
        <TableCell className="py-1"><Skeleton className="h-4 w-20" /></TableCell>
      </TableRow>
    ))}
  </>
);

// Helper function to determine styling and text for status badges
const getStatusProps = (status: string | undefined) => {
  if (!status) {
    return {
      className: 'bg-gray-700 text-gray-200',
      text: 'Unknown'
    };
  }

  const statusUpper = status.toUpperCase();
  
  if (statusUpper === 'ACTIVE') {
    return {
      className: 'bg-green-950 text-green-400 border border-green-700',
      text: 'Active'
    };
  } else if (statusUpper === 'INACTIVE') {
    return {
      className: 'bg-amber-950 text-amber-300 border border-amber-700',
      text: 'Inactive'
    };
  } else if (statusUpper.includes('CANCEL')) {
    return {
      className: 'bg-red-950 text-red-400 border border-red-700',
      text: statusUpper.includes('PENDING') ? 'Pending Cancel' : 'Canceled'
    };
  } else {
    return {
      className: 'bg-gray-800 text-gray-300 border border-gray-700',
      text: status
    };
  }
};

// Helper to format Full Name
const formatFullName = (voter: Voter) => {
  const middlePart = voter.middleName ? `${voter.middleName.charAt(0)}. ` : ""; // Assuming middle initial if full middle name present
  const nameParts = [voter.firstName, middlePart, voter.lastName].filter(Boolean);
  let fullName = nameParts.join(" ");
  if (voter.nameSuffix) {
    fullName += `, ${voter.nameSuffix}`;
  }
  return fullName;
};

// Helper to format Resident Address
const formatAddress = (address: Voter['address']) => {
    if (!address) return "N/A";
    const addressParts = [
      address.preDirection, // Use preDirection from Voter type
      address.streetName,
      address.postDirection, // Use postDirection from Voter type
    ]
      .filter(Boolean)
      .join(" ");
      // Assuming streetNumber is available and relevant, prepend it
      const streetNumber = address.streetNumber ? `${address.streetNumber} ` : "";
      const fullAddressLine = `${streetNumber}${addressParts}`;
      return address.zipcode ? `${fullAddressLine}, ${address.zipcode}` : fullAddressLine;
};

export function VoterTable({ 
  voters, 
  isLoading = false, 
  sort,
  onSort 
}: VoterTableProps) {
  // State for the voter quickview
  const [selectedVoter, setSelectedVoter] = useState<string | undefined>(undefined);
  const [isQuickviewOpen, setIsQuickviewOpen] = useState(false);

  // Handle row click to open quickview
  const handleRowClick = (voterId: string) => {
    setSelectedVoter(voterId);
    setIsQuickviewOpen(true);
  };

  // Close quickview
  const handleCloseQuickview = () => {
    setIsQuickviewOpen(false);
  };

  return (
    <div className="w-full h-full">
      <Table className="relative border-separate border-spacing-0 w-full h-full" style={{ tableLayout: 'fixed' }}>
        <TableHeader>
          <TableRow className="h-7 border-b-0">
            <TableHead style={{ width: '30%', position: 'sticky', top: 0, zIndex: 2, background: '#18181b' }} className="py-1.5 px-3 text-white font-normal">
              <SortButton field="name" label="Full Name" currentSort={sort} onSort={onSort} />
            </TableHead>
            <TableHead style={{ width: '15%', position: 'sticky', top: 0, zIndex: 2, background: '#18181b' }} className="py-1.5 px-3 text-white font-normal">
              <SortButton field="county" label="County" currentSort={sort} onSort={onSort} />
            </TableHead>
            <TableHead style={{ width: '30%', position: 'sticky', top: 0, zIndex: 2, background: '#18181b' }} className="py-1.5 px-3 text-white font-normal text-left">
              <SortButton field="address" label="Resident Address" currentSort={sort} onSort={onSort} />
            </TableHead>
            <TableHead style={{ width: '10%', position: 'sticky', top: 0, zIndex: 2, background: '#18181b' }} className="py-1.5 px-3 text-white font-normal">
              <SortButton field="score" label="Score" currentSort={sort} onSort={onSort} />
            </TableHead>
            <TableHead style={{ width: '15%', position: 'sticky', top: 0, zIndex: 2, background: '#18181b' }} className="py-1.5 px-3 text-white font-normal">
              <SortButton field="status" label="Status" currentSort={sort} onSort={onSort} />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <LoadingSkeleton />
          ) : voters.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                No voters found matching your criteria
              </TableCell>
            </TableRow>
          ) : (
            voters.map((voter) => {
              const statusProps = getStatusProps(voter.status);
              return (
                <TableRow 
                  key={voter.id} 
                  className="h-8 border-b border-gray-800 hover:bg-gray-900/20 cursor-pointer"
                  onClick={() => handleRowClick(voter.id)}
                >
                  <TableCell style={{ width: '30%' }} className="py-1 px-3 text-xs">{formatFullName(voter)}</TableCell>
                  <TableCell style={{ width: '15%' }} className="py-1 px-3 text-xs">{voter.county || "N/A"}</TableCell>
                  <TableCell style={{ width: '30%' }} className="py-1 px-3 text-xs">{formatAddress(voter.address)}</TableCell>
                  <TableCell style={{ width: '10%' }} className="py-1 px-3 text-xs">
                    <ParticipationScoreWidget score={voter.participationScore} size="small" variant="compact" />
                  </TableCell>
                  <TableCell style={{ width: '15%' }} className="py-1 px-3">
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

      {/* Voter Quickview Modal */}
      <VoterQuickview
        isOpen={isQuickviewOpen}
        voterId={selectedVoter}
        onClose={handleCloseQuickview}
      />
    </div>
  );
}

export default VoterTable; 