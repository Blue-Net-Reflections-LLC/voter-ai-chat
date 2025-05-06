"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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

const ALL_SECTIONS: (keyof SummaryData)[] = ['voting_info', 'districts', 'demographics', 'voting_history', 'precincts', 'census'];

export default function StatsDashboardPage() {
  const { filters, residenceAddressFilters, filtersHydrated, setFilters, setResidenceAddressFilters, updateFilter } = useVoterFilterContext();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Get initial tab from URL or default to 'voting_info'
  const initialTab = searchParams.get('tab');
  const defaultTab = initialTab && ALL_SECTIONS.includes(initialTab as keyof SummaryData) ? initialTab : 'voting_info';

  const [summaryData, setSummaryData] = useState<SummaryData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchKey = useRef<string | null>(null);
  const isFetchingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!filtersHydrated || isFetchingRef.current) {
        return;
    }
    const currentFetchKey = JSON.stringify({ filters, residenceAddressFilters });
    if (currentFetchKey === lastFetchKey.current) {
      if (loading) setLoading(false);
      return;
    }
    isFetchingRef.current = true;
    lastFetchKey.current = currentFetchKey;
    setLoading(true);
    setError(null);
    setSummaryData({});

    const fetchPromises = ALL_SECTIONS.map(sectionKey => {
      const params = buildQueryParams(filters, residenceAddressFilters, { section: sectionKey });
      const url = `/api/ga/voter/summary?${params.toString()}`;
      return fetch(url)
        .then(async (res) => {
            if (!res.ok) {
                const errorText = await res.text();
                console.error(`[Stats Fetch] Error fetching ${sectionKey}: ${res.status} - ${errorText}`);
                throw { section: sectionKey, status: res.status, message: errorText || `Failed to fetch ${sectionKey}` };
            }
            const data = await res.json();
            const sectionData = data[sectionKey] || data;
            setSummaryData(prev => ({ ...prev, [sectionKey]: sectionData }));
            return { section: sectionKey, status: 'fulfilled' };
        })
        .catch(err => {
            const errorPayload = { section: sectionKey, message: err.message || `Network error fetching ${sectionKey}`, isNetworkError: !err.status };
            console.error(`[Stats Fetch] Network/Catch Error fetching ${sectionKey}:`, errorPayload);
            return Promise.reject({ section: sectionKey, status: 'rejected', reason: errorPayload });
        });
    });

    Promise.allSettled(fetchPromises)
        .then(results => {
            let errorsFound = false;
            results.forEach(result => {
                 if (result.status === 'rejected') {
                    errorsFound = true;
                    console.error(`[Stats Fetch] Settled Error for ${result.reason?.section}:`, result.reason?.reason?.message);
                    setError(prevError => prevError || `Error loading data for ${result.reason?.section}.`); 
                 }
            });
            isFetchingRef.current = false;
            setLoading(false);
        });
  }, [filters, residenceAddressFilters, filtersHydrated]);

  const totalVoters = useMemo(() => {
    if (!summaryData?.voting_info?.status) return 0;
    const activeCount = summaryData.voting_info.status.find((s: any) => s.label === 'ACTIVE')?.count || 0;
    const inactiveCount = summaryData.voting_info.status.find((s: any) => s.label === 'INACTIVE')?.count || 0;
    return activeCount + inactiveCount;
  }, [summaryData.voting_info]);

  const handleFilterChange = useCallback((fieldName: string, value: string | number) => {
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
    // Ignore selection of 'census' tab
    if (value === 'census') return;
    
    if (value && ALL_SECTIONS.includes(value as keyof SummaryData)) {
      // Update URL search param without page refresh
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      current.set("tab", value);
      const search = current.toString();
      const query = search ? `?${search}` : "";
      router.replace(`${pathname}${query}`, { scroll: false });
    }
  }, [pathname, router, searchParams]);

  return (
    <div className="w-full p-2 md:p-6 xl:p-8">
      <div className="mb-4 text-right text-sm text-muted-foreground">
        {!loading && summaryData.voting_info && (
           <span>Total Matching Voters: <span className="font-semibold text-foreground">{totalVoters.toLocaleString()}</span></span>
        )}
         {loading && !summaryData.voting_info && (
           <span className="animate-pulse">Loading Total...</span>
        )}
      </div>

      <Tabs defaultValue={defaultTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-6 mb-4">
          {ALL_SECTIONS.map(section => (
            <TabsTrigger key={section} value={section} disabled={section === 'census'}>
              {section.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {ALL_SECTIONS.map(section => (
            <TabsContent key={`${section}-content`} value={section}>
                <div className="mt-4">
                     {section === 'voting_info' && <VotingInfoSection data={summaryData.voting_info} loading={loading && !summaryData.voting_info} error={error} totalVoters={totalVoters} onFilterChange={handleFilterChange}/>}
                     {section === 'districts' && <DistrictsSection data={summaryData.districts} loading={loading && !summaryData.districts} error={error} totalVoters={totalVoters} onFilterChange={handleFilterChange}/>}
                     {section === 'demographics' && <DemographicsSection data={summaryData.demographics} loading={loading && !summaryData.demographics} error={error} totalVoters={totalVoters} onFilterChange={handleFilterChange}/>}
                     {section === 'voting_history' && <VotingHistorySection data={summaryData.voting_history} loading={loading && !summaryData.voting_history} error={error} totalVoters={totalVoters} onFilterChange={handleFilterChange}/>}
                     {section === 'census' && <CensusSection data={summaryData.census} loading={loading && !summaryData.census} error={error} totalVoters={totalVoters} onFilterChange={handleFilterChange}/>}
                     {section === 'precincts' && (
                        <PrecinctSectionContent 
                          data={summaryData.precincts}
                          loading={loading && !summaryData.precincts}
                          error={error}
                          totalVoters={totalVoters}
                          onFilterChange={handleFilterChange}
                        />
                     )}
                </div>
            </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

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

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[150px] text-muted-foreground text-sm">
        <span className="animate-pulse">Loading Precincts...</span>
      </div>
    );
  }
  
  if (!loading && error && !data) {
    return <div className="text-destructive text-sm p-4 border border-destructive rounded-md">Error loading Precincts: {error}</div>;
  }
  
  if (!data || (!data.county_precinct && !data.municipal_precinct)) {
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
      {data?.county_precinct && (
        <div className="mb-6">
          <AggregateFieldDisplay
            fieldName="County Precinct"
            data={formatDataForDisplay(data.county_precinct, "County Precinct")}
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
          />
        </div>
      )}
      
      {/* Municipal Precincts */}
      {data?.municipal_precinct && (
        <div className="mt-6">
          <AggregateFieldDisplay
            fieldName="Municipal Precinct"
            data={formatDataForDisplay(data.municipal_precinct, "Municipal Precinct")}
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
          />
        </div>
      )}
    </div>
  );
} 