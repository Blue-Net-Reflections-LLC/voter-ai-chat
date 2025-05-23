"use client";

/*
 * NOTE: The districts section has been temporarily removed from the UI.
 * The section is commented out in the ALL_SECTIONS array and the content rendering.
 * API calls for districts data are skipped.
 * To restore, uncomment the 'districts' entry in ALL_SECTIONS, the rendering section,
 * and remove the condition that skips the districts fetch.
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import VotingInfoSection from "./VotingInfoSection";
import DistrictsSection from "./DistrictsSection";
import DemographicsSection from "./DemographicsSection";
import VotingHistorySection from "./VotingHistorySection";
import CensusSection from "./CensusSection";
import AggregateFieldDisplay from "@/components/AggregateFieldDisplay";
import { useVoterFilterContext, buildQueryParams } from "../VoterFilterProvider";
import type { FilterState, ResidenceAddressFilterState } from "../list/types";

interface SummaryData {
  voting_info?: any;
  districts?: any;
  demographics?: any;
  voting_history?: any;
  census?: any;
  precincts?: any;
}

const toTitleCase = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  return text.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const ALL_SECTIONS: (keyof SummaryData)[] = [
  'voting_info', 
  // 'districts', // Temporarily removed districts section
  'demographics', 
  'voting_history', 
  'precincts', 
  'census'
];

function StatsDashboardSection() {
  // Add rendering log
  console.log('Horace: StatsDashboardSection rendering');
  
  const { filters, residenceAddressFilters, filtersHydrated, setFilters, setResidenceAddressFilters, updateFilter } = useVoterFilterContext();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Add ref to track first mount
  const isFirstMountRef = useRef<boolean>(true);
  
  // Add a lifecycle logger
  useEffect(() => {
    console.log('Horace: StatsDashboardSection mounted');
    return () => {
      console.log('Horace: StatsDashboardSection unmounted');
    }
  }, []);
  
  // Get initial tab from URL or default to 'voting_info'
  const initialTab = searchParams.get('tab');
  const defaultTab = initialTab && ALL_SECTIONS.includes(initialTab as keyof SummaryData) ? initialTab : 'voting_info';

  // Track the current section for display in dropdown
  const [currentSection, setCurrentSection] = useState(defaultTab);
  
  // Effect to update the current section when URL changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ALL_SECTIONS.includes(tab as keyof SummaryData)) {
      setCurrentSection(tab);
    }
  }, [searchParams]);

  const [summaryData, setSummaryData] = useState<SummaryData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchKey = useRef<string | null>(null);
  const isFetchingRef = useRef<boolean>(false);
  const currentControllersRef = useRef<Map<string, AbortController>>(new Map());

  // Create stable filter references for dependency tracking
  const filterString = useMemo(() => JSON.stringify(filters), [filters]);
  const residenceFilterString = useMemo(() => JSON.stringify(residenceAddressFilters), [residenceAddressFilters]);

  useEffect(() => {
    if (!filtersHydrated) return;
    
    const currentFetchKey = JSON.stringify({ filters, residenceAddressFilters });
    if (currentFetchKey === lastFetchKey.current) {
      if (loading) setLoading(false);
      return;
    }
    
    // Abort in-flight requests when filters change
    currentControllersRef.current.forEach((controller, section) => {
      try {
        controller.abort();
        console.log(`[stats] Aborted request for ${section} due to filter change`);
      } catch (e) {
        console.warn(`Error aborting request for ${section}:`, e);
      }
    });
    currentControllersRef.current.clear();
    
    isFetchingRef.current = true;
    lastFetchKey.current = currentFetchKey;
    setLoading(true);
    setError(null);
    
    // Function to execute the fetch operations
    const executeFetch = () => {
      console.log('[stats] Executing fetch operations');
      
      // Creating a new set of fetch requests with abort controllers
      const fetchPromises = ALL_SECTIONS.map(sectionKey => {
        // Skip districts section - it's temporarily disabled
        if (sectionKey === 'districts') {
          console.log('[stats] Skipping districts section fetch - temporarily disabled');
          return Promise.resolve({ section: 'districts', status: 'skipped' });
        }

        // Add controller creation for each request
        const controller = new AbortController();
        currentControllersRef.current.set(sectionKey, controller);
        
        const params = buildQueryParams(filters, residenceAddressFilters, { section: sectionKey });
        const url = `/api/ga/voter/summary?${params.toString()}`;
        
        return fetch(url, { signal: controller.signal })
          .then(async (res) => {
              // Add check for aborted request
              if (controller.signal.aborted) {
                console.log(`[stats] Request for ${sectionKey} was aborted before response handling`);
                return { section: sectionKey, status: 'aborted' };
              }
              
              if (!res.ok) {
                  const errorText = await res.text();
                  throw { section: sectionKey, status: res.status, message: errorText || `Failed to fetch ${sectionKey}` };
              }
              
              const data = await res.json();
              
              // Check for abort after parsing
              if (controller.signal.aborted || lastFetchKey.current !== currentFetchKey) {
                console.log(`[stats] Request for ${sectionKey} was aborted after response handling or is no longer current`);
                return { section: sectionKey, status: 'aborted' };
              }
              
              const sectionData = data[sectionKey] || data;
              setSummaryData(prev => ({ ...prev, [sectionKey]: sectionData }));
              return { section: sectionKey, status: 'fulfilled' };
          })
          .catch(err => {
              // Add back abort error handling
              if (err.name === 'AbortError' || controller.signal.aborted) {
                console.log(`[stats] Caught AbortError for ${sectionKey}`);
                return { section: sectionKey, status: 'aborted' };
              }
              
              console.error(`Error fetching ${sectionKey}:`, err);
              return Promise.reject({ 
                section: sectionKey, 
                status: 'rejected', 
                reason: { 
                  section: sectionKey, 
                  message: err.message || `Error fetching ${sectionKey}`, 
                  isNetworkError: !err.status 
                }
              });
          })
          .finally(() => {
            // Add cleanup of controller reference when request completes or errors
            if (currentControllersRef.current.has(sectionKey)) {
              currentControllersRef.current.delete(sectionKey);
              console.log(`[stats] Removed controller for ${sectionKey} after completion`);
            }
          });
      });

      Promise.allSettled(fetchPromises)
          .then(results => {
              if (lastFetchKey.current !== currentFetchKey) return;
              
              let errorsFound = false;
              
              results.forEach(result => {
                  if (result.status === 'rejected') {
                      errorsFound = true;
                      setError(prevError => prevError || `Error loading data.`);
                  }
              });
              
              isFetchingRef.current = false;
              setLoading(false);
          });
    };
    
    // **************************************************************************
    // IMPORTANT: DO NOT REMOVE THIS DELAY WITHOUT TESTING THOROUGHLY
    // **************************************************************************
    // The 200ms delay below is a critical workaround for a known Next.js App Router issue:
    // When navigating between pages (e.g. List→Stats), Next.js App Router can briefly mount, 
    // unmount, and remount components during navigation, particularly when filter parameters 
    // change or get synchronized with URL.
    //
    // This causes fetch requests to start, get aborted immediately on unmount, then restart 
    // on remount. The symptom is that API calls fail with "AbortError", leaving 
    // the Stats page with the "No data available" message.
    //
    // The 200ms delay gives the App Router time to stabilize before starting expensive API 
    // requests, ensuring that they're only initiated when the component is fully mounted and 
    // won't immediately unmount. We only need to delay the first mount's requests because 
    // subsequent renders won't have this mounting/remounting issue.
    //
    // Related discussions:
    // **************************************************************************
    // Delay the first request by 200ms to handle AppRouter remounting bug
    if (isFirstMountRef.current) {
      console.log('[stats] First mount detected, delaying initial request by 200ms');
      const timerId = setTimeout(() => {
        console.log('[stats] Executing delayed initial request');
        executeFetch();
        isFirstMountRef.current = false;
      }, 200);
      
      // Clean up timeout if component unmounts before it fires
      return () => {
        console.log('[stats] Cleaning up during first mount timeout');
        clearTimeout(timerId);
        
        console.log(`[stats] Cleanup running, controllers count: ${currentControllersRef.current.size}`);
        currentControllersRef.current.forEach((controller, section) => {
          try {
            console.log(`[stats] Aborting request for ${section} during cleanup`);
            controller.abort();
          } catch (e) {
            console.warn('Error aborting controller during cleanup:', e);
          }
        });
        currentControllersRef.current.clear();
        isFetchingRef.current = false;
        lastFetchKey.current = null;
      };
    } else {
      // After first mount, execute fetch immediately
      console.log('[stats] Not first mount, executing request immediately');
      executeFetch();
      
      // Add back the controller cleanup
      return () => {
        console.log(`[stats] Cleanup running, controllers count: ${currentControllersRef.current.size}`);
        currentControllersRef.current.forEach((controller, section) => {
          try {
            console.log(`[stats] Aborting request for ${section} during cleanup`);
            controller.abort();
          } catch (e) {
            console.warn('Error aborting controller during cleanup:', e);
          }
        });
        currentControllersRef.current.clear();
        isFetchingRef.current = false;
        lastFetchKey.current = null;
      };
    }
  }, [filtersHydrated, filterString, residenceFilterString]);

  const totalVoters = useMemo(() => {
    if (!summaryData?.voting_info?.status) return 0;
    const activeCount = summaryData.voting_info.status.find((s: any) => s.label === 'ACTIVE')?.count || 0;
    const inactiveCount = summaryData.voting_info.status.find((s: any) => s.label === 'INACTIVE')?.count || 0;
    return activeCount + inactiveCount;
  }, [summaryData.voting_info]);

  const handleFilterChange = useCallback((fieldName: string, value: string | number) => {
    // Set loading state to true immediately when filters change
    setLoading(true);
    
    const filterValue = String(value);
    const arrayFilterMap: { [key: string]: keyof FilterState } = { 
      'Status': 'status', 
      'Status Reason': 'statusReason', 
      'Race': 'race', 
      'Gender': 'gender', 
      'County': 'county', 
      'Congressional District': 'congressionalDistricts', 
      'State Senate District': 'stateSenateDistricts', 
      'State House District': 'stateHouseDistricts', 
      'County Precinct': 'countyPrecincts',
      'Municipal Precinct': 'municipalPrecincts',
      'Age Range': 'age', 
      'Election Date': 'electionDate', 
      'Election Year': 'electionYear' 
    };
    const addressFilterMap: { [key: string]: keyof ResidenceAddressFilterState } = { 'Residence City': 'residence_city', 'Residence Zipcode': 'residence_zipcode' };

    if (arrayFilterMap[fieldName]) {
        const filterKey = arrayFilterMap[fieldName];
        const prev = (filters[filterKey] as string[]) || [];
        if (!prev.includes(filterValue)) { updateFilter(filterKey, [...prev, filterValue]); }
    } else if (addressFilterMap[fieldName]) {
        const addressKey = addressFilterMap[fieldName];
        const processedValue = addressKey === 'residence_city' ? toTitleCase(filterValue) : filterValue;
        setResidenceAddressFilters((prevAddrFilters: ResidenceAddressFilterState[]) => {
            const updatedFilters = [...prevAddrFilters]; let targetFilter = updatedFilters[0];
            if (!targetFilter) { targetFilter = { id: crypto.randomUUID(), residence_street_number: '', residence_pre_direction: '', residence_street_name: '', residence_street_type: '', residence_post_direction: '', residence_apt_unit_number: '', residence_city: '', residence_zipcode: '' }; updatedFilters[0] = targetFilter; }
            if (targetFilter[addressKey] !== processedValue) { updatedFilters[0] = { ...targetFilter, [addressKey]: processedValue }; return updatedFilters; }
            return prevAddrFilters;
        });
    } else { console.warn("Unhandled filter field in StatsDashboardPage:", fieldName); }
  }, [filters, setFilters, setResidenceAddressFilters, updateFilter]);

  // Handle tab changes by updating URL
  const handleTabChange = useCallback((value: string) => {
    // Remove the restriction that prevented census tab selection
    
    if (value && ALL_SECTIONS.includes(value as keyof SummaryData)) {
      // Update our dropdown display
      setCurrentSection(value);
      
      // Update URL search param without page refresh
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      current.set("tab", value);
      const search = current.toString();
      const query = search ? `?${search}` : "";
    //   router.replace(`${pathname}${query}`, { scroll: false });
    }
  }, [pathname, router, searchParams]);

  // Helper function to format tab title with special cases for "voting_info" and "voting_history"
  const formatTabTitle = useCallback((section: string) => {
    if (section === 'voting_info') return 'Info';
    if (section === 'voting_history') return 'History';
    return section.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }, []);

  return (
    <div className="w-full p-2 md:p-6 xl:p-8">
      <div className="flex justify-between items-center mb-4">
        {/* Mobile dropdown - now on the left */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-between">
                <span className="truncate max-w-[160px]">{formatTabTitle(currentSection)}</span>
                <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px]">
              {ALL_SECTIONS.map(section => {
                return (
                  <DropdownMenuItem 
                    key={section} 
                    onClick={() => {
                      // This directly updates the URL which will trigger the tab change
                      const current = new URLSearchParams(Array.from(searchParams.entries()));
                      current.set("tab", section);
                      const search = current.toString();
                      const query = search ? `?${search}` : "";
                    //   router.replace(`${pathname}${query}`);
                      
                      // Also update our display immediately
                      setCurrentSection(section);
                    }}
                  >
                    <span className="truncate">{formatTabTitle(section)}</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Voter count - now as the second item in the flex row */}
        <div className="text-sm text-muted-foreground">
          {!loading && summaryData.voting_info && (
             <span>Voters <span className="font-semibold text-foreground">{totalVoters.toLocaleString()}</span></span>
          )}
          {loading && (
             <span className="animate-pulse flex items-center gap-1.5">
               <span>Loading data</span>
               <span className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse"></span>
               <span className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: '0.2s' }}></span>
               <span className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: '0.4s' }}></span>
             </span>
          )}
        </div>
      </div>

      {/* Desktop tabs with modified styles */}
      <div className="hidden md:block mb-4">
        <Tabs defaultValue={defaultTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-6">
            {ALL_SECTIONS.map(section => (
              <TabsTrigger 
                key={section} 
                value={section}
              >
                <div className="truncate max-w-full">{formatTabTitle(section)}</div>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Content sections */}
      <div>
        {ALL_SECTIONS.map(section => {
          if (section !== currentSection) return null;
          
          // Modified loading state for section - show loading whenever general loading is true
          // Don't require !data condition which was preventing loading state from showing during filter changes
          const sectionIsLoading = loading;
          
          return (
            <div key={`${section}-content`} className="mt-4">
              {section === 'voting_info' && <VotingInfoSection data={summaryData.voting_info} loading={sectionIsLoading} error={error} totalVoters={totalVoters} onFilterChange={handleFilterChange}/>}
              {/* Districts section temporarily removed 
              {section === 'districts' && <DistrictsSection data={summaryData.districts} loading={sectionIsLoading} error={error} totalVoters={totalVoters} onFilterChange={handleFilterChange}/>}
              */}
              {section === 'demographics' && <DemographicsSection data={summaryData.demographics} loading={sectionIsLoading} error={error} totalVoters={totalVoters} onFilterChange={handleFilterChange}/>}
              {section === 'voting_history' && <VotingHistorySection data={summaryData.voting_history} loading={sectionIsLoading} error={error} totalVoters={totalVoters} onFilterChange={handleFilterChange}/>}
              {section === 'census' && <CensusSection data={summaryData.census} loading={sectionIsLoading} error={error} totalVoters={totalVoters} onFilterChange={handleFilterChange}/>}
              {section === 'precincts' && (
                <PrecinctSectionContent 
                  data={summaryData.precincts}
                  loading={sectionIsLoading}
                  error={error}
                  totalVoters={totalVoters}
                  onFilterChange={handleFilterChange}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Wrap the component with React.memo to prevent unnecessary re-renders
export default React.memo(StatsDashboardSection);

// Directly include the PrecinctSectionContent within the same file
interface PrecinctSectionContentProps {
  data: any;
  loading: boolean;
  error: string | null;
  totalVoters: number;
  onFilterChange: (fieldName: string, value: string | number) => void;
}

function PrecinctSectionContent({ 
  data,
  loading,
  error,
  totalVoters,
  onFilterChange
}: PrecinctSectionContentProps) {

  // Remove early loading return to allow individual charts to show loading state
  /*
  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[150px] text-muted-foreground text-sm">
        <span className="animate-pulse">Loading Precincts...</span>
      </div>
    );
  }
  */
  
  if (!loading && error && !data) {
    return <div className="text-destructive text-sm p-4 border border-destructive rounded-md">Error loading Precincts: {error}</div>;
  }
  
  if (!loading && (!data || (!data.county_precinct && !data.municipal_precinct))) {
    return <div className="text-muted-foreground text-sm p-4 border rounded-md">No data available for Precinct fields.</div>;
  }

  // Helper to format data
  const formatDataForDisplay = (items: { label: string | number; count: number; facility_name?: string; facility_address?: string }[] | undefined, fieldName?: string): { value: string; count: number; meta?: { facility_name?: string; facility_address?: string } }[] => {
    if (!items) return [];
    
    return items.map(item => {
      return { 
        value: String(item.label), 
        count: item.count,
        meta: {
          facility_name: item.facility_name,
          facility_address: item.facility_address
        }
      };
    });
  };

  // Extract just the precinct code from a label that has format "Description (CODE)"
  const extractPrecinctCode = (label: string): string => {
    const matches = label.match(/\(([^)]+)\)$/);
    return matches?.[1] || label;
  };

  return (
    <div className="flex flex-col gap-16">
      {/* County Precincts */}
      <div className="mb-6">
        <AggregateFieldDisplay
          fieldName="County Precinct"
          data={formatDataForDisplay(data?.county_precinct || [], "County Precinct")}
          totalVoters={totalVoters}
          onFilterChange={(_, value) => onFilterChange("County Precinct", extractPrecinctCode(String(value)))}
          localStorageKey="stats-county-precinct-chartType"
          displayExtraInfo={(item) => (
            <div className="text-xs text-muted-foreground mt-1">
              {item.meta?.facility_name && <div>{item.meta.facility_name}</div>}
              {item.meta?.facility_address && <div>{item.meta.facility_address}</div>}
            </div>
          )}
          variant="stacked"
          loading={loading}
        />
      </div>
      
      {/* Municipal Precincts */}
      <div className="mt-6">
        <AggregateFieldDisplay
          fieldName="Municipal Precinct"
          data={formatDataForDisplay(data?.municipal_precinct || [], "Municipal Precinct")}
          totalVoters={totalVoters}
          onFilterChange={(_, value) => onFilterChange("Municipal Precinct", extractPrecinctCode(String(value)))}
          localStorageKey="stats-municipal-precinct-chartType"
          displayExtraInfo={(item) => (
            <div className="text-xs text-muted-foreground mt-1">
              {item.meta?.facility_name && <div>{item.meta.facility_name}</div>}
              {item.meta?.facility_address && <div>{item.meta.facility_address}</div>}
            </div>
          )}
          variant="stacked"
          loading={loading}
        />
      </div>
    </div>
  );
} 