"use client";

import React from 'react';
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Download, FilterX } from "lucide-react";
import { Voter, PaginationState } from '../types';
import VoterTable from './VoterTable';
import PaginationControls from './PaginationControls';
import { SortField, SortDirection } from '../hooks/useVoterList';

interface ResultsPanelProps {
  voters: Voter[];
  pagination: PaginationState;
  hasActiveFilters: boolean;
  isLoading?: boolean;
  sort: {
    field: SortField;
    direction: SortDirection;
  };
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSort: (field: SortField) => void;
  onClearFilters?: () => void;
}

export function ResultsPanel({
  voters,
  pagination,
  hasActiveFilters,
  isLoading = false,
  sort,
  onPageChange,
  onPageSizeChange,
  onSort,
  onClearFilters
}: ResultsPanelProps) {
  const { currentPage, pageSize, totalItems } = pagination;
  
  // Calculate display range
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="px-4 py-3 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {totalItems > 0 ? (
              <span>
                Showing {startItem} to {endItem} of {totalItems} voters
              </span>
            ) : (
              <span>{isLoading ? 'Loading voters...' : 'No voters found matching your criteria'}</span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {hasActiveFilters && onClearFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800 flex items-center"
                onClick={onClearFilters}
              >
                <FilterX size={14} className="mr-1" />
                Clear Filters
              </Button>
            )}
            
            <div className="flex gap-3">
              <Button variant="link" size="sm" className="text-xs h-6 px-1">
                <Printer size={14} className="mr-1"/> Print
              </Button>
              <Button variant="link" size="sm" className="text-xs h-6 px-1">
                <Download size={14} className="mr-1"/> Download CSV
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 py-0 flex-grow overflow-auto">
        <VoterTable 
          voters={voters} 
          isLoading={isLoading} 
          sort={sort}
          onSort={onSort}
        />
      </CardContent>
      <CardFooter className="py-2 px-4 flex-shrink-0 max-h-[50px] border-t">
        <PaginationControls
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </CardFooter>
    </Card>
  );
}

export default ResultsPanel; 