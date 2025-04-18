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
    {Array(5).fill(0).map((_, i) => (
      <TableRow key={`loading-${i}`}>
        <TableCell>
          <Skeleton className="h-5 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-32" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-20" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-16" />
        </TableCell>
        <TableCell className="text-right">
          <Skeleton className="h-5 w-20 ml-auto" />
        </TableCell>
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
  const icon = isActive 
    ? (currentSort.direction === 'asc' ? <ArrowUp size={12} className="ml-1 inline" /> : <ArrowDown size={12} className="ml-1 inline" />) 
    : <ArrowUpDown size={12} className="ml-1 inline opacity-50" />;
  
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className={`font-semibold text-xs ${isActive ? 'text-primary' : ''}`}
      onClick={() => onSort?.(field)}
    >
      {label} {icon}
    </Button>
  );
};

export function VoterTable({ 
  voters, 
  isLoading = false, 
  sort,
  onSort 
}: VoterTableProps) {
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">
              <SortButton 
                field="id" 
                label="ID" 
                currentSort={sort}
                onSort={onSort}
              />
            </TableHead>
            <TableHead>
              <SortButton 
                field="name" 
                label="Full Name" 
                currentSort={sort}
                onSort={onSort}
              />
            </TableHead>
            <TableHead>
              <SortButton 
                field="county" 
                label="County" 
                currentSort={sort}
                onSort={onSort}
              />
            </TableHead>
            <TableHead>
              <SortButton 
                field="address" 
                label="Address" 
                currentSort={sort}
                onSort={onSort}
              />
            </TableHead>
            <TableHead className="text-right">
              <SortButton 
                field="status" 
                label="Status" 
                currentSort={sort}
                onSort={onSort}
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <LoadingSkeleton />
          ) : voters.length > 0 ? (
            voters.map((voter) => (
              <TableRow key={voter.id}>
                <TableCell className="font-mono text-xs">
                  <a href={`/ga/voter/profile/${voter.id}`} className="text-blue-600 hover:underline">
                    {voter.id}
                  </a>
                </TableCell>
                <TableCell className="font-medium">{voter.name}</TableCell>
                <TableCell>{voter.county}</TableCell>
                <TableCell className="max-w-[200px] truncate">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help line-clamp-1">
                          {voter.address?.fullAddress || "N/A"}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <div className="space-y-1">
                          <p><strong>Address:</strong> {voter.address?.fullAddress || "N/A"}</p>
                          <p><strong>City:</strong> {voter.address?.city || "N/A"}</p>
                          <p><strong>Zip:</strong> {voter.address?.zipcode || "N/A"}</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={voter.status === "Active" ? "solid" : "outline"}>
                    {voter.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                No voters found matching your criteria
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default VoterTable; 