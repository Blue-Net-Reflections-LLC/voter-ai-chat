"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VotingInfoSection from "./VotingInfoSection";
import DistrictsSection from "./DistrictsSection";
import DemographicsSection from "./DemographicsSection";
import VotingHistorySection from "./VotingHistorySection";
import CensusSection from "./CensusSection";
import { useVoterFilterContext, buildQueryParams } from "../VoterFilterProvider";
import type { FilterState, ResidenceAddressFilterState } from "../list/types";

// Define structure for the overall summary data if possible (adjust based on actual API response)
interface SummaryData {
  voting_info?: any; // Replace 'any' with specific type if known
  districts?: any;
  demographics?: any;
  voting_history?: any;
  census?: any;
}

// Helper function to convert text to Title Case (needed for filter handler)
const toTitleCase = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function StatsDashboardPage() {
  const { 
    filters, 
    residenceAddressFilters, 
    filtersHydrated, 
    setFilters, // Need setFilters and setResidenceAddressFilters for the handler
    setResidenceAddressFilters,
    updateFilter
  } = useVoterFilterContext();

  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchKey = React.useRef<string>("");

  // Fetch all summary data when filters change
  useEffect(() => {
    if (!filtersHydrated) return;

    const fetchKey = JSON.stringify({ filters, residenceAddressFilters });
    // Prevent refetch if filters haven't changed
    if (fetchKey === lastFetchKey.current && summaryData) return;
    lastFetchKey.current = fetchKey;

    setLoading(true);
    setError(null);

    // Fetch all sections - assuming API handles this when 'section' is omitted
    const params = buildQueryParams(filters, residenceAddressFilters); 
    fetch(`/api/ga/voter/summary?${params.toString()}`)
      .then(res => {
        if (!res.ok) {
          // Attempt to read error message from response body
          return res.text().then(text => { 
            throw new Error(text || "Failed to fetch summary data");
          });
        }
        return res.json();
      })
      .then(data => {
        setSummaryData(data);
        setLoading(false);
      })
      .catch(e => {
        console.error("Error fetching summary data:", e);
        setError(e.message || "An unknown error occurred");
        setLoading(false);
        setSummaryData(null); // Clear data on error
      });
  }, [filters, residenceAddressFilters, filtersHydrated, summaryData]); // Add summaryData to deps to avoid loop if fetchKey check fails initially

  // Calculate total voters based on fetched data
  const totalVoters = useMemo(() => {
    if (!summaryData?.voting_info?.status) return 0;
    const activeCount = summaryData.voting_info.status.find((s: any) => s.label === 'ACTIVE')?.count || 0;
    const inactiveCount = summaryData.voting_info.status.find((s: any) => s.label === 'INACTIVE')?.count || 0;
    return activeCount + inactiveCount;
  }, [summaryData]);

  // Unified filter handler to pass down to sections
  const handleFilterChange = useCallback((fieldName: string, value: string | number) => {
    console.log(`Stats Page: Filtering by ${fieldName}: ${value}`);
    const filterValue = String(value);

    // Map fieldName to the correct filter key and update method
    const arrayFilterMap: { [key: string]: keyof FilterState } = {
      'Status': 'status',
      'Status Reason': 'statusReason',
      'Race': 'race',
      'Gender': 'gender',
      // Districts
      'County': 'county',
      'Congressional District': 'congressionalDistricts',
      'State Senate District': 'stateSenateDistricts',
      'State House District': 'stateHouseDistricts',
      // Demographics
      'Age Range': 'age',
      // Voting History
      'Election Date': 'electionDate', // Expects YYYY-MM-DD from AggregateFieldDisplay
      'Election Year': 'electionYear',
      // ... add census filter keys if needed ...
    };

    const addressFilterMap: { [key: string]: keyof ResidenceAddressFilterState } = {
        'Residence City': 'residence_city',
        'Residence Zipcode': 'residence_zipcode',
    };

    if (arrayFilterMap[fieldName]) {
        const filterKey = arrayFilterMap[fieldName];
        const prev = (filters[filterKey] as string[]) || [];
        if (!prev.includes(filterValue)) {
            updateFilter(filterKey, [...prev, filterValue]);
        }
    } else if (addressFilterMap[fieldName]) {
        const addressKey = addressFilterMap[fieldName];
        // Title case only for city
        const processedValue = addressKey === 'residence_city' ? toTitleCase(filterValue) : filterValue;
        
        setResidenceAddressFilters((prevAddrFilters: ResidenceAddressFilterState[]) => {
            const updatedFilters = [...prevAddrFilters];
            let targetFilter = updatedFilters[0];
            // Initialize first filter if none exist
            if (!targetFilter) {
                // Initialize with all required fields as empty strings
                targetFilter = { 
                    id: crypto.randomUUID(),
                    residence_street_number: '',
                    residence_pre_direction: '',
                    residence_street_name: '',
                    residence_street_type: '',
                    residence_post_direction: '',
                    residence_apt_unit_number: '',
                    residence_city: '',
                    residence_zipcode: ''
                }; 
                updatedFilters[0] = targetFilter;
            }
            // Update only if value is different
            if (targetFilter[addressKey] !== processedValue) {
                updatedFilters[0] = { ...targetFilter, [addressKey]: processedValue };
                return updatedFilters;
            }
            return prevAddrFilters; // Return unchanged if value is the same
        });
    } else {
        console.warn("Unhandled filter field in StatsDashboardPage:", fieldName);
    }

  }, [filters, setFilters, setResidenceAddressFilters, updateFilter]); // Include updateFilter if it's stable

  return (
    <div className="w-full p-2 md:p-6 xl:p-8">
      {/* Display Total Voters Above Tabs */} 
      <div className="mb-4 text-right text-sm text-muted-foreground">
        {filtersHydrated && !loading && (
           <span>Total Matching Voters: <span className="font-semibold text-foreground">{totalVoters.toLocaleString()}</span></span>
        )}
         {filtersHydrated && loading && (
           <span className="animate-pulse">Calculating Total...</span>
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

        {/* Pass shared data and handlers to each section */} 
        <TabsContent value="voting_info">
          <VotingInfoSection 
            data={summaryData?.voting_info}
            loading={loading}
            error={error}
            totalVoters={totalVoters}
            onFilterChange={handleFilterChange}
          />
        </TabsContent>
        <TabsContent value="districts">
          <DistrictsSection
             data={summaryData?.districts}
             loading={loading}
             error={error}
             totalVoters={totalVoters} // Pass total for context/consistency if needed
             onFilterChange={handleFilterChange}
          />
        </TabsContent>
        <TabsContent value="demographics">
          <DemographicsSection 
             data={summaryData?.demographics}
             loading={loading}
             error={error}
             totalVoters={totalVoters}
             onFilterChange={handleFilterChange}
          />
        </TabsContent>
        <TabsContent value="voting_history">
          <VotingHistorySection 
            data={summaryData?.voting_history}
            loading={loading}
            error={error}
            totalVoters={totalVoters}
            onFilterChange={handleFilterChange}
          />
        </TabsContent>
        <TabsContent value="census">
          <CensusSection 
             data={summaryData?.census}
             loading={loading}
             error={error}
             totalVoters={totalVoters}
             onFilterChange={handleFilterChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
} 