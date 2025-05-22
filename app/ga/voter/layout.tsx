'use client'; // Make this layout a client component

import React, { Suspense, useState, useEffect } from "react";
import { Metadata } from 'next';
import VoterHeader from "./VoterHeader";
import { Toaster } from "@/components/ui/toaster";
import { VoterFilterProvider, useVoterFilterContext } from './VoterFilterProvider';
import FilterPanel from './list/components/FilterPanel';
import TabNavigation from "./TabNavigation";
import { VoterListProvider } from "./VoterListContext";
import { MapStateProvider } from '@/context/MapStateContext';
import { usePathname } from 'next/navigation';
import { Filter, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Note: Metadata export might not work reliably in a 'use client' layout.
// Consider moving it to a parent server component layout if needed.
/* export const metadata: Metadata = {
  title: 'Voter List | Georgia Voter Registry',
  description: 'View and manage the list of registered voters in Georgia',
}; */

// Estimate combined height of fixed elements (Header + Nav)
const FIXED_HEADER_NAV_HEIGHT = '92px'; // User specified height

// Define paths where the FilterPanel should be visible
const filterPanelVisiblePaths = [
  '/ga/voter/list',
  '/ga/voter/stats',
  '/ga/voter/map',
  '/ga/voter/charts'
];

// Helper function to count total active filters
const countActiveFilters = (filters: any, residenceAddressFilters: any[]) => {
  let count = 0;
  
  // Count array filters
  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value) && value.length > 0) {
      count += value.length;
    }
  });
  
  // Count string filters
  if (filters.firstName) count++;
  if (filters.lastName) count++;
  if (filters.notVotedSinceYear) count++;
  if (filters.voterEventMethod) count++;
  
  // Count boolean filters and special enum filters
  if (filters.neverVoted) count++;
  if (filters.electionParticipation === 'satOut') count++;
  
  // Count address filters
  count += residenceAddressFilters.length;
  
  return count;
};

// Separate component that will be rendered inside the VoterFilterProvider
const FilterButton = ({ onClick }: { onClick: () => void }) => {
  const { filters, residenceAddressFilters, hasActiveFilters } = useVoterFilterContext();
  const totalFilterCount = countActiveFilters(filters, residenceAddressFilters);
  
  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="w-full flex justify-between items-center h-8"
      onClick={onClick}
    >
      <span className="flex items-center">
        <Menu size={16} className="mr-2" />
        Filters
      </span>
      {hasActiveFilters() && (
        <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
          {totalFilterCount}
        </span>
      )}
    </Button>
  );
};

export default function VoterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Determine if the filter panel should be shown based on the current path
  const showFilterPanel = filterPanelVisiblePaths.includes(pathname);
  const [filterPanelVisible, setFilterPanelVisible] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  
  // Toggle mobile filters
  const toggleMobileFilters = () => {
    setMobileFiltersOpen(!mobileFiltersOpen);
  };
  
  // Listen for custom toggle-filter-panel event
  useEffect(() => {
    const handleToggleFilterPanel = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.open !== undefined) {
        setFilterPanelVisible(customEvent.detail.open);
      } else {
        setFilterPanelVisible(prev => !prev);
      }
    };

    window.addEventListener('toggle-filter-panel', handleToggleFilterPanel);
    
    return () => {
      window.removeEventListener('toggle-filter-panel', handleToggleFilterPanel);
    };
  }, []);

  return (
    <Suspense>
      <VoterListProvider>
        <VoterFilterProvider>
          <MapStateProvider>
            <div className="flex flex-col min-h-screen">
              {/* Main header with tabs */}
              <VoterHeader />
              
              {/* Secondary header with participation score and filters */}
              <div className="flex w-full items-center">
                {/* Score information */}
                <TabNavigation />
                
                {/* Filter button on mobile - Now showing on all pages where filter panel is visible */}
                {showFilterPanel && (
                  <div className="md:hidden flex-grow pr-4 pl-2">
                    <FilterButton onClick={toggleMobileFilters} />
                  </div>
                )}
              </div>
              
              {/* Content area with sidebar and main content */}
              <div className="flex flex-grow relative">
                {/* Filter panel - desktop visible, mobile slide out */}
                {showFilterPanel && (
                  <>
                    {/* Desktop filter panel */}
                    <div 
                      className={cn(
                        "md:w-[280px] md:flex-shrink-0 border-r overflow-y-auto",
                        !filterPanelVisible ? "md:hidden" : "md:block",
                        "hidden" // Hide on mobile, show in slide-out
                      )}
                      style={{ maxHeight: 'calc(100dvh - 90px)' }}
                    >
                      <FilterPanel />
                    </div>
                  </>
                )}
                
                {/* Main content area */}
                <main 
                  className={cn(
                    "flex-grow overflow-y-auto",
                    showFilterPanel && filterPanelVisible ? "md:w-[calc(100%-280px)]" : "w-full"
                  )}
                  style={{ height: '' }}
                >
                  {children}
                </main>
              </div>

              {/* Toggle button for desktop filter panel when hidden */}
              {showFilterPanel && !filterPanelVisible && (
                <button 
                  className="fixed left-0 top-[126px] z-10 bg-background border border-l-0 rounded-r-md p-2 hidden md:block"
                  onClick={() => setFilterPanelVisible(true)}
                  aria-label="Show filters"
                >
                  <Filter size={16} />
                </button>
              )}
              
              {/* Mobile filter panel - separate from the layout flow */}
              {showFilterPanel && mobileFiltersOpen && (
                <div className="md:hidden fixed inset-0 z-[20000]">
                  {/* Semi-transparent backdrop */}
                  <div 
                    className="absolute inset-0 bg-black/50" 
                    onClick={toggleMobileFilters}
                  />
                  
                  {/* Filter panel */}
                  <div className="absolute left-0 top-0 bottom-0 w-[85%] max-w-[300px] bg-background flex flex-col h-full shadow-lg">
                    <div className="flex items-center justify-between p-4 border-b">
                      <h3 className="font-medium">Filters</h3>
                      <button onClick={toggleMobileFilters} className="p-1 rounded-full hover:bg-gray-200">
                        <X size={20} />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                      <FilterPanel />
                    </div>
                  </div>
                </div>
              )}
              
              <Toaster />
            </div>
          </MapStateProvider>
        </VoterFilterProvider>
      </VoterListProvider>
    </Suspense>
  );
} 