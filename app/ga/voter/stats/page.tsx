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

interface SummaryData {
  voting_info?: any;
  districts?: any;
  demographics?: any;
  voting_history?: any;
  census?: any;
}

const toTitleCase = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  return text.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const ALL_SECTIONS: (keyof SummaryData)[] = ['voting_info', 'districts', 'demographics', 'voting_history', 'census'];

export default function StatsDashboardPage() {
  const { filters, residenceAddressFilters, filtersHydrated, setFilters, setResidenceAddressFilters, updateFilter } = useVoterFilterContext();

  const [summaryData, setSummaryData] = useState<SummaryData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchKey = useRef<string | null>(null);
  const isFetchingRef = useRef<boolean>(false);

  useEffect(() => {
    const effectId = Math.random().toString(36).substring(7);
    console.log(`[Effect ${effectId}] Running effect. Hydrated: ${filtersHydrated}`);

    if (!filtersHydrated) {
        console.log(`[Effect ${effectId}] Skipping: Filters not hydrated.`);
        return;
    }

    const currentFetchKey = JSON.stringify({ filters, residenceAddressFilters });

    if (isFetchingRef.current) {
      console.log(`[Effect ${effectId}] Skipping: Fetch already in progress (isFetchingRef=true).`);
      return;
    }

    if (currentFetchKey === lastFetchKey.current) {
      console.log(`[Effect ${effectId}] Skipping: Fetch key matches last started key. Key: ${currentFetchKey}`);
      if (loading) setLoading(false);
      return;
    }

    console.log(`[Effect ${effectId}] Proceeding with fetch. New Key: ${currentFetchKey}`);
    
    isFetchingRef.current = true;
    lastFetchKey.current = currentFetchKey;
    setLoading(true);
    setError(null);
    setSummaryData({});

    console.log(`[Effect ${effectId}] Fetch lock set, state cleared. Mapping fetch promises...`);

    const fetchPromises = ALL_SECTIONS.map(sectionKey => {
      const fetchId = `${effectId}-${sectionKey}`;
      console.log(`[Fetch ${fetchId}] Creating promise.`);
      const params = buildQueryParams(filters, residenceAddressFilters, { section: sectionKey });
      const url = `/api/ga/voter/summary?${params.toString()}`;
      console.log(`[Fetch ${fetchId}] URL: ${url}`);

      return fetch(url)
          .then(async (res) => {
              console.log(`[Fetch ${fetchId}] Received response status: ${res.status}`);
              if (!res.ok) {
                  const errorText = await res.text();
                  console.error(`[Fetch ${fetchId}] Error response: ${errorText}`);
                  throw { section: sectionKey, status: res.status, message: errorText || `Failed to fetch ${sectionKey}` };
              }
              const data = await res.json();
              const sectionData = data[sectionKey] || data;
              console.log(`[Fetch ${fetchId}] Success, updating state.`);
              setSummaryData(prev => ({ ...prev, [sectionKey]: sectionData }));
              return { section: sectionKey, status: 'fulfilled' };
          })
          .catch(err => {
              const errorPayload = {
                  section: sectionKey,
                  message: err.message || `Network error fetching ${sectionKey}`,
                  isNetworkError: !err.status
              };
              console.error(`[Fetch ${fetchId}] Catch block error:`, errorPayload);
              return Promise.reject({ section: sectionKey, status: 'rejected', reason: errorPayload });
          });
    });

    console.log(`[Effect ${effectId}] Promises created. Waiting for allSettled...`);

    Promise.allSettled(fetchPromises)
        .then(results => {
            console.log(`[Effect ${effectId}] All fetches settled.`);
            let errorsFound = false;
            results.forEach(result => {
                 if (result.status === 'rejected') {
                    errorsFound = true;
                    console.error(`[Effect ${effectId}] Settled Error for ${result.reason?.section}:`, result.reason?.reason?.message);
                    setError(prevError => prevError || `Error loading data for ${result.reason?.section}.`); 
                 }
            });
            console.log(`[Effect ${effectId}] Releasing fetch lock and setting loading false.`);
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
        {!loading && summaryData.voting_info && (
           <span>Total Matching Voters: <span className="font-semibold text-foreground">{totalVoters.toLocaleString()}</span></span>
        )}
         {loading && !summaryData.voting_info && (
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
        
        <TabsContent value="voting_info">
          <VotingInfoSection 
            data={summaryData.voting_info} 
            loading={loading && !summaryData.voting_info} 
            error={error}
            totalVoters={totalVoters}
            onFilterChange={handleFilterChange}
          />
        </TabsContent>
        <TabsContent value="districts">
          <DistrictsSection
             data={summaryData.districts}
             loading={loading && !summaryData.districts}
             error={error}
             totalVoters={totalVoters} 
             onFilterChange={handleFilterChange}
          />
        </TabsContent>
         <TabsContent value="demographics">
          <DemographicsSection 
             data={summaryData.demographics}
             loading={loading && !summaryData.demographics}
             error={error}
             totalVoters={totalVoters}
             onFilterChange={handleFilterChange}
          />
        </TabsContent>
        <TabsContent value="voting_history">
          <VotingHistorySection 
            data={summaryData.voting_history}
            loading={loading && !summaryData.voting_history}
            error={error}
            totalVoters={totalVoters}
            onFilterChange={handleFilterChange}
          />
        </TabsContent>
        <TabsContent value="census">
          <CensusSection 
             data={summaryData.census}
             loading={loading && !summaryData.census}
             error={error}
             totalVoters={totalVoters}
             onFilterChange={handleFilterChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
} 