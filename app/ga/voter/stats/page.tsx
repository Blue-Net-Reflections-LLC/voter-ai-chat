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
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 mb-4">
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
                </div>
            </TabsContent>
        ))}
      </Tabs>
    </div>
  );
} 