"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import { Voter, PaginationState } from '../types';
import VoterTable from './VoterTable';
import PaginationControls from './PaginationControls';

interface ResultsPanelProps {
  voters: Voter[];
  pagination: PaginationState;
  hasActiveFilters: boolean;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function ResultsPanel({
  voters,
  pagination,
  hasActiveFilters,
  isLoading = false,
  onPageChange,
  onPageSizeChange
}: ResultsPanelProps) {
  const { currentPage, pageSize, totalItems } = pagination;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Voter List Results</span>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" disabled><Printer size={16} className="mr-1"/> Print</Button>
            <Button variant="outline" size="sm" disabled><Download size={16} className="mr-1"/> Download CSV</Button>
          </div>
        </CardTitle>
        <CardDescription>
          {totalItems > 0 ? (
            <>
              Showing voters
              {hasActiveFilters && <span className="ml-1 text-blue-600">(filtered)</span>}
            </>
          ) : (
            'No voters found matching your criteria'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <VoterTable voters={voters} isLoading={isLoading} />
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