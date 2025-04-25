"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Download, FilterX, LoaderCircle } from "lucide-react";
import { Voter, PaginationState } from '../types';
import VoterTable from './VoterTable';
import PaginationControls from './PaginationControls';
import { SortField, SortDirection } from '../hooks/useVoterList';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ResultsPanelProps {
  voters: Voter[];
  pagination: PaginationState;
  hasActiveFilters: boolean;
  isLoading?: boolean;
  sort: {
    field: SortField;
    direction: SortDirection;
  };
  currentQueryParams: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSort: (field: SortField) => void;
}

export function ResultsPanel({
  voters,
  pagination,
  hasActiveFilters,
  isLoading = false,
  sort,
  currentQueryParams,
  onPageChange,
  onPageSizeChange,
  onSort,
}: ResultsPanelProps) {
  const { currentPage, pageSize, totalItems } = pagination;
  const [isDownloadingCsv, setIsDownloadingCsv] = useState(false);
  const { toast } = useToast();
  
  // Calculate display range
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Handler for the download button using fetch
  const handleDownloadCsv = async () => {
    if (isDownloadingCsv) {
      if (!window.confirm("Another download is already in progress. Start a new download anyway?")) {
        return;
      }
    }

    setIsDownloadingCsv(true);
    toast({
      title: "Preparing Download",
      description: "Your CSV file is being generated...",
    });

    try {
      const downloadUrl = `/api/ga/voter/list/download?${currentQueryParams}`;
      console.log('Requesting download:', downloadUrl);

      const response = await fetch(downloadUrl);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || `Failed to download CSV: ${response.statusText}`);
      }

      // Extract filename from Content-Disposition header
      const disposition = response.headers.get('content-disposition');
      let filename = 'voter_list.csv'; // Default filename
      if (disposition && disposition.includes('attachment')) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: `${filename} should begin downloading shortly.`,
      });

    } catch (error) {
      console.error('Error downloading CSV:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: errorMessage,
      });
    } finally {
      setIsDownloadingCsv(false);
    }
  };

  return (
    <Card className="flex flex-col h-full min-h-0">
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
            <Button
              variant="link"
              size="sm"
              className={cn(
                "text-xs h-6 px-1",
                isDownloadingCsv && "opacity-75 cursor-not-allowed"
              )}
              disabled={isLoading || isDownloadingCsv}
            >
              <Printer size={14} className="mr-1"/> Print
            </Button>
            <Button
              variant="link"
              size="sm"
              className={cn(
                "text-xs h-6 px-1",
                isDownloadingCsv && "opacity-75 cursor-not-allowed"
              )}
              onClick={handleDownloadCsv}
              disabled={isLoading || isDownloadingCsv}
            >
              {isDownloadingCsv ? (
                <LoaderCircle size={14} className="mr-1 animate-spin" />
              ) : (
                <Download size={14} className="mr-1"/>
              )}
              Download CSV {isDownloadingCsv ? '(Processing...)' : ''}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 py-0 flex-grow min-h-0">
        <div className="h-full overflow-auto min-h-0">
          <VoterTable 
            voters={voters} 
            isLoading={isLoading} 
            sort={sort}
            onSort={onSort}
          />
        </div>
      </CardContent>
      <CardFooter className="py-0 px-4 flex-shrink-0 max-h-[50px] border-t">
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