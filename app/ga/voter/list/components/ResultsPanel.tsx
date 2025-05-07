"use client";

import React, { useState, useEffect, useLayoutEffect } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FilterX, LoaderCircle, LayoutGrid, LayoutList, ArrowUp, ArrowDown } from "lucide-react";
import { Voter, PaginationState } from '../types';
import VoterTable from './VoterTable';
import PaginationControls from './PaginationControls';
import { SortField, SortDirection } from '../hooks/useVoterList';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VoterQuickview } from "@/components/ga/voter/quickview/VoterQuickview";
import { ParticipationScoreWidget } from "@/components/voter/ParticipationScoreWidget";
import { useVoterList } from '../hooks/useVoterList';

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

// Safe useLayoutEffect that doesn't run on the server
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// Card component for each voter in the grid layout
const VoterCard = ({ voter, onClick }: { voter: Voter; onClick: () => void }) => {
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
  
  const formatFullName = (voter: Voter) => {
    const middlePart = voter.middleName ? `${voter.middleName.charAt(0)}. ` : ""; 
    const nameParts = [voter.firstName, middlePart, voter.lastName].filter(Boolean);
    let fullName = nameParts.join(" ");
    if (voter.nameSuffix) {
      fullName += `, ${voter.nameSuffix}`;
    }
    return fullName;
  };

  const formatAddress = (address: Voter['address']) => {
    if (!address) return "N/A";
    const addressParts = [
      address.preDirection,
      address.streetName,
      address.postDirection,
    ]
      .filter(Boolean)
      .join(" ");
    const streetNumber = address.streetNumber ? `${address.streetNumber} ` : "";
    const fullAddressLine = `${streetNumber}${addressParts}`;
    return address.zipcode ? `${fullAddressLine}, ${address.zipcode}` : fullAddressLine;
  };

  const statusProps = getStatusProps(voter.status);
  
  return (
    <div 
      className="border border-border rounded-md bg-card p-3 hover:bg-muted/50 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-sm">{formatFullName(voter)}</h3>
        <span className={cn("inline-flex items-center justify-center text-[10px] font-semibold rounded px-2 py-0.5", statusProps.className)}>
          {statusProps.text.toUpperCase()}
        </span>
      </div>
      <div className="text-xs text-muted-foreground mb-2">
        <div className="mb-1"><span className="font-medium text-foreground mr-1">County:</span> {voter.county || "N/A"}</div>
        <div><span className="font-medium text-foreground mr-1">Address:</span> {formatAddress(voter.address)}</div>
      </div>
      <div className="flex justify-between items-center mt-2">
        <div className="text-xs">
          <span className="font-medium mr-1">Score:</span> 
          <ParticipationScoreWidget score={voter.participationScore} size="small" variant="compact" />
        </div>
      </div>
    </div>
  );
};

// Grid layout component
const VoterCardGrid = ({ 
  voters, 
  isLoading,
  hasFetchedOnce,
  onVoterClick
}: { 
  voters: Voter[]; 
  isLoading: boolean;
  hasFetchedOnce: boolean;
  onVoterClick: (voterId: string) => void;
}) => {
  return (
    <div className="relative min-h-[400px] h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/50 z-10">
          <LoaderCircle className="h-12 w-12 animate-spin text-primary/70" />
        </div>
      )}
      
      {hasFetchedOnce && !isLoading && voters.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px] h-full text-muted-foreground">
          No voters found matching your criteria
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 p-1">
          {voters.map((voter) => (
            <VoterCard 
              key={voter.id} 
              voter={voter} 
              onClick={() => onVoterClick(voter.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Helper to get initial layout preference - client-side only
const getInitialLayout = (): 'table' | 'card' => {
  // Always return table for initial server render
  if (typeof window === 'undefined') return 'table';
  
  try {
    const savedLayout = localStorage.getItem('voterListLayout');
    if (savedLayout === 'table' || savedLayout === 'card') {
      return savedLayout;
    }
  } catch (error) {
    console.error('Error accessing localStorage:', error);
  }
  
  return 'table';
};

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
  hasFetchedOnce,
}: ResultsPanelProps & { hasFetchedOnce: boolean }) {
  const { currentPage, pageSize, totalItems } = pagination;
  const [isDownloadingCsv, setIsDownloadingCsv] = useState(false);
  const { toast } = useToast();
  
  // Set initial layout to 'table' for server render, will be updated on client after hydration
  const [layout, setLayout] = useState<'table' | 'card'>('table');
  const [effectiveLayout, setEffectiveLayout] = useState<'table' | 'card'>('table');
  const [isMounted, setIsMounted] = useState(false);
  
  // State for the voter quickview
  const [selectedVoter, setSelectedVoter] = useState<string | undefined>(undefined);
  const [isQuickviewOpen, setIsQuickviewOpen] = useState(false);
  
  // Calculate display range
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Get sorted field (for dropdown)
  const currentSortField = sort?.field || 'name';

  // Initialize client-side state after hydration
  useEffect(() => {
    setIsMounted(true);
    const initialLayout = getInitialLayout();
    setLayout(initialLayout);
    
    // Initial check for mobile (forcing card layout)
    const isMobile = window.innerWidth < 768;
    setEffectiveLayout(isMobile ? 'card' : initialLayout);
  }, []);

  // Save layout preference to localStorage - only runs on client
  useEffect(() => {
    if (!isMounted) return;
    
    try {
      localStorage.setItem('voterListLayout', layout);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [layout, isMounted]);

  // Handle layout changes based on screen size
  useEffect(() => {
    if (!isMounted) return;
    
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setEffectiveLayout(isMobile ? 'card' : layout);
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [layout, isMounted]);

  // Handler for toggling layout
  const toggleLayout = (newLayout: 'table' | 'card') => {
    setLayout(newLayout);
  };

  // Handle row click to open quickview
  const handleVoterClick = (voterId: string) => {
    setSelectedVoter(voterId);
    setIsQuickviewOpen(true);
  };

  // Close quickview
  const handleCloseQuickview = () => {
    setIsQuickviewOpen(false);
  };

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

  // Handle sort field change from dropdown
  const handleSortChange = (value: string) => {
    // Parse the field and direction from combined value
    const [field, direction] = value.split('-') as [SortField, SortDirection];
    
    // We need to set the sort state and call onSort with the field
    // If the field is changing, we just set it with the desired direction
    if (field !== sort.field) {
      // We're changing fields, so just call onSort with the new field
      // If direction is different than default 'asc', we need to call onSort again
      onSort(field);
      if (direction === 'desc' && sort.direction === 'asc') {
        // Toggle once more to get to 'desc'
        onSort(field);
      }
    } else {
      // Same field, but may need to toggle direction
      if (direction !== sort.direction) {
        // Need to toggle direction
        onSort(field);
      }
      // If direction already matches, do nothing
    }
  };

  // Return a consistent initial structure for SSR, then update with client-side effects
  return (
    <Card className="flex flex-col h-full w-full overflow-hidden">
      {/* Header - will stick to top when scrolling */}
      <CardHeader className="px-4 py-3 flex-shrink-0 border-b sticky top-0 z-10 bg-background">
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {totalItems > 0 ? (
              <span>
                {startItem.toLocaleString()} to {endItem.toLocaleString()} of {totalItems.toLocaleString()} voters
              </span>
            ) : (
              <span>{isLoading ? 'Loading voters...' : 'No voters found matching your criteria'}</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Layout Toggle Buttons - Hidden on Mobile - Only show after client-side hydration */}
            {isMounted && (
              <div className="hidden md:flex gap-1">
                <Button
                  variant={layout === 'table' ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => toggleLayout('table')}
                  title="Table Layout"
                >
                  <LayoutList size={16} />
                </Button>
                <Button
                  variant={layout === 'card' ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => toggleLayout('card')}
                  title="Card Layout"
                >
                  <LayoutGrid size={16} />
                </Button>
              </div>
            )}
            
            {/* Download Button */}
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "text-xs h-8 px-2",
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
              Download CSV
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Using flexbox for layout: content area will stretch and scroll, footer will stay at bottom */}
      {/* for mobile feight: calc(100% - 112px); for desktop     height: calc(100% - 58px);
 */}
      <div className="flex flex-col h-full">
        {/* Content area with auto overflow - will grow to fill available space */}
        <div className="flex-grow overflow-auto h-0">
          {/* Always render table on server, then client can switch as needed */}
          {(!isMounted || effectiveLayout === 'table') ? (
            <VoterTable 
              voters={voters} 
              isLoading={isLoading}
              sort={sort}
              onSort={onSort}
              hasFetchedOnce={hasFetchedOnce}
            />
          ) : (
            <VoterCardGrid
              voters={voters}
              isLoading={isLoading}
              hasFetchedOnce={hasFetchedOnce}
              onVoterClick={handleVoterClick}
            />
          )}
          
          {/* VoterQuickview component */}
          {isQuickviewOpen && selectedVoter && (
            <VoterQuickview
              isOpen={isQuickviewOpen}
              voterId={selectedVoter}
              onClose={handleCloseQuickview}
            />
          )}
        </div>

        {/* Footer always at bottom */}
        <div className="flex-shrink-0 border-t bg-background z-10">
          <CardFooter className="py-2 px-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">Sort</span>
              <Select
                value={`${sort.field}-${sort.direction}`}
                onValueChange={handleSortChange}
              >
                <SelectTrigger className="h-8 w-[105px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">
                    <div className="flex items-center">
                      Name <ArrowUp size={14} className="ml-2" />
                    </div>
                  </SelectItem>
                  <SelectItem value="name-desc">
                    <div className="flex items-center">
                      Name <ArrowDown size={14} className="ml-2" />
                    </div>
                  </SelectItem>
                  <SelectItem value="county-asc">
                    <div className="flex items-center">
                      County <ArrowUp size={14} className="ml-2" />
                    </div>
                  </SelectItem>
                  <SelectItem value="county-desc">
                    <div className="flex items-center">
                      County <ArrowDown size={14} className="ml-2" />
                    </div>
                  </SelectItem>
                  <SelectItem value="address-asc">
                    <div className="flex items-center">
                      Address <ArrowUp size={14} className="ml-2" />
                    </div>
                  </SelectItem>
                  <SelectItem value="address-desc">
                    <div className="flex items-center">
                      Address <ArrowDown size={14} className="ml-2" />
                    </div>
                  </SelectItem>
                  <SelectItem value="score-asc">
                    <div className="flex items-center">
                      Score <ArrowUp size={14} className="ml-2" />
                    </div>
                  </SelectItem>
                  <SelectItem value="score-desc">
                    <div className="flex items-center">
                      Score <ArrowDown size={14} className="ml-2" />
                    </div>
                  </SelectItem>
                  <SelectItem value="status-asc">
                    <div className="flex items-center">
                      Status <ArrowUp size={14} className="ml-2" />
                    </div>
                  </SelectItem>
                  <SelectItem value="status-desc">
                    <div className="flex items-center">
                      Status <ArrowDown size={14} className="ml-2" />
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <PaginationControls
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
            />
          </CardFooter>
        </div>
      </div>
    </Card>
  );
}

export default ResultsPanel; 