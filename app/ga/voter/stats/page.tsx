"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VotingInfoSection from "./VotingInfoSection";
import DistrictsSection from "./DistrictsSection";
import DemographicsSection from "./DemographicsSection";
import VotingHistorySection from "./VotingHistorySection";
import CensusSection from "./CensusSection";
import { useVoterFilterContext, buildQueryParams } from "../VoterFilterProvider";
import type { FilterState, ResidenceAddressFilterState } from "../list/types";

// Structure for all summary data
interface SummaryData {
  voting_info?: any;
  districts?: any;
  demographics?: any;
  voting_history?: any;
  census?: any;
}

// Helper function to convert text to Title Case (needed for filter handler)
const toTitleCase = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  return text.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export default function StatsDashboardPage() {
  const { filters, residenceAddressFilters, filtersHydrated, setFilters, setResidenceAddressFilters, updateFilter } = useVoterFilterContext();

  // State for all data sections
  const [summaryData, setSummaryData] = useState<SummaryData>({}); 
  // Separate loading states
  const [initialLoading, setInitialLoading] = useState(true);
  const [backgroundLoading, setBackgroundLoading] = useState<Record<string, boolean>>({
    districts: false,
    demographics: false,
    voting_history: false,
    census: false,
  });
  const [error, setError] = useState<string | null>(null);
  const backgroundFetchedRef = useRef<boolean>(false); // Ref to track if background fetch started
  const lastFetchKey = useRef<string>(""); // Track filter changes for refetching

  const sectionsToBackgroundFetch: (keyof SummaryData)[] = ['districts', 'demographics', 'voting_history', 'census'];

  // Effect 1: Fetch initial data (Voting Info) and trigger background fetch
  useEffect(() => {
    if (!filtersHydrated) return;

    const currentFetchKey = JSON.stringify({ filters, residenceAddressFilters });
    // If filters change, reset everything and restart the process
    if (currentFetchKey !== lastFetchKey.current) {
        console.log("Filters changed, refetching initial data...");
        lastFetchKey.current = currentFetchKey;
        setInitialLoading(true);
        setError(null);
        setSummaryData({}); // Clear old data
        backgroundFetchedRef.current = false; // Reset background fetch trigger
        setBackgroundLoading({ districts: false, demographics: false, voting_history: false, census: false });

        const params = buildQueryParams(filters, residenceAddressFilters, { section: "voting_info" });
        fetch(`/api/ga/voter/summary?${params.toString()}`)
          .then(res => {
            if (!res.ok) { return res.text().then(text => { throw new Error(text || "Failed to fetch initial aggregates"); }); }
            return res.json();
          })
          .then(data => {
            console.log("Initial data fetched.");
            setSummaryData(prev => ({ ...prev, voting_info: data.voting_info || data }));
          })
          .catch(e => {
            console.error("Error fetching initial data:", e);
            setError(e.message || "An unknown error occurred during initial fetch");
            setSummaryData({}); // Clear on error
          })
          .finally(() => {
            setInitialLoading(false);
            // Don't trigger background fetch immediately here, let the next effect handle it
          });
    } else if (!initialLoading && !backgroundFetchedRef.current && summaryData.voting_info) {
        // If initial load is done, voting_info is present, and background fetch hasn't started, start it
         console.log("Initial load done, starting background fetches...");
         backgroundFetchedRef.current = true; // Mark as started
         sectionsToBackgroundFetch.forEach(section => {
             if (!summaryData[section]) { // Only fetch if not already fetched (e.g., by a quick refetch)
                 setBackgroundLoading(prev => ({ ...prev, [section]: true }));
                 const params = buildQueryParams(filters, residenceAddressFilters, { section });
                 fetch(`/api/ga/voter/summary?${params.toString()}`)
                     .then(res => {
                         if (!res.ok) { return res.text().then(text => { throw new Error(`Failed to fetch ${section} aggregates: ${text}`); }); }
                         return res.json();
                     })
                     .then(data => {
                         console.log(`Background data fetched for: ${section}`);
                         setSummaryData(prev => ({ ...prev, [section]: data[section] || data }));
                     })
                     .catch(e => {
                         console.error(`Error fetching background data for ${section}:`, e);
                         // Optionally set a per-section error state or just log it
                     })
                     .finally(() => {
                         setBackgroundLoading(prev => ({ ...prev, [section]: false }));
                     });
             }
         });
    }

  // Dependencies: Run when filters change, or when initial loading finishes to trigger background
  }, [filters, residenceAddressFilters, filtersHydrated, initialLoading, summaryData]); 

  // Calculate total voters (remains the same, depends on voting_info)
  const totalVoters = useMemo(() => {
    if (!summaryData?.voting_info?.status) return 0;
    const activeCount = summaryData.voting_info.status.find((s: any) => s.label === 'ACTIVE')?.count || 0;
    const inactiveCount = summaryData.voting_info.status.find((s: any) => s.label === 'INACTIVE')?.count || 0;
    return activeCount + inactiveCount;
  }, [summaryData.voting_info]);

  // Restore unified filter handler (triggers refetch of initial, which then triggers background)
  const handleFilterChange = useCallback((fieldName: string, value: string | number) => {
    // ... (Filter logic mapping fieldName to filterKey/addressKey remains the same) ...
    const filterValue = String(value);
    const arrayFilterMap: { [key: string]: keyof FilterState } = { 'Status': 'status', 'Status Reason': 'statusReason', 'Race': 'race', 'Gender': 'gender', 'County': 'county', 'Congressional District': 'congressionalDistricts', 'State Senate District': 'stateSenateDistricts', 'State House District': 'stateHouseDistricts', 'Age Range': 'age', 'Election Date': 'electionDate', 'Election Year': 'electionYear' };
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

  return (
    <div className="w-full p-2 md:p-6 xl:p-8">
      <div className="mb-4 text-right text-sm text-muted-foreground">
        {/* Show total based on initial loading state */}
        {!initialLoading && summaryData.voting_info && (
           <span>Total Matching Voters: <span className="font-semibold text-foreground">{totalVoters.toLocaleString()}</span></span>
        )}
         {initialLoading && (
           <span className="animate-pulse">Loading Total...</span>
        )}
      </div>

      <Tabs defaultValue="voting_info">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 mb-4"> 
          <TabsTrigger value="voting_info">Voting Info</TabsTrigger>
          <TabsTrigger value="districts">Districts</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="voting_history">Voting History</TabsTrigger>
          <TabsTrigger value="census">Census</TabsTrigger>
        </TabsList>
        
        {/* Pass relevant props down */}
        {/* Note: We pass initialLoading state to all. Sections can show their own subtle loading for background data if needed, or just wait for data prop */}
        <TabsContent value="voting_info">
          <VotingInfoSection 
            data={summaryData.voting_info} 
            loading={initialLoading} 
            error={error} // Pass general error for now
            totalVoters={totalVoters}
            onFilterChange={handleFilterChange}
          />
        </TabsContent>
        <TabsContent value="districts">
          <DistrictsSection
             data={summaryData.districts}
             loading={initialLoading || backgroundLoading.districts}
             error={error}
             totalVoters={totalVoters} 
             onFilterChange={handleFilterChange}
          />
        </TabsContent>
         <TabsContent value="demographics">
          <DemographicsSection 
             data={summaryData.demographics}
             loading={initialLoading || backgroundLoading.demographics}
             error={error}
             totalVoters={totalVoters}
             onFilterChange={handleFilterChange}
          />
        </TabsContent>
        <TabsContent value="voting_history">
          <VotingHistorySection 
            data={summaryData.voting_history}
            loading={initialLoading || backgroundLoading.voting_history}
            error={error}
            totalVoters={totalVoters}
            onFilterChange={handleFilterChange}
          />
        </TabsContent>
        <TabsContent value="census">
          <CensusSection 
             data={summaryData.census}
             loading={initialLoading || backgroundLoading.census}
             error={error}
             totalVoters={totalVoters}
             onFilterChange={handleFilterChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
} 