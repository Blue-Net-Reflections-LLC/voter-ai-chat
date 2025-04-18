"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Voter List Results</span>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm"><Printer size={16} className="mr-1"/> Print</Button>
            <Button variant="outline" size="sm"><Download size={16} className="mr-1"/> Download CSV</Button>
          </div>
        </CardTitle>
        <div className="text-sm text-muted-foreground flex justify-between">
          {totalItems > 0 ? (
            <span>
              Showing {startItem} to {endItem} of {totalItems} voters
              {hasActiveFilters && (
                <span className="ml-1 inline-flex items-center gap-1 text-blue-600 font-medium">
                  (filtered)
                  {onClearFilters && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-1 text-xs text-blue-600 hover:text-blue-800"
                      onClick={onClearFilters}
                    >
                      <FilterX size={12} className="mr-1" />
                      Clear
                    </Button>
                  )}
                </span>
              )}
            </span>
          ) : (
            <span>{isLoading ? 'Loading voters...' : 'No voters found matching your criteria'}</span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <VoterTable 
          voters={voters} 
          isLoading={isLoading} 
          sort={sort}
          onSort={onSort}
        />
      </CardContent>
      <CardFooter className="pt-4">
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