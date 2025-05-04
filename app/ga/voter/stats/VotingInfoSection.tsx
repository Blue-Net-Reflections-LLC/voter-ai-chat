"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, BadgeCheck, AlertCircle, MapPin, Mail, ListChecks } from "lucide-react";
import { useVoterFilterContext, buildQueryParams } from "../VoterFilterProvider";
import { cn } from "@/lib/utils";
import type { FilterState, ResidenceAddressFilterState } from "../list/types";

// Helper function to convert text to Title Case (same as in useLookupData)
const toTitleCase = (text: string): string => {
  if (!text) return '';
  // Simple title case for now, handles single words and basic cases
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

function StatsSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  return (
    <Card className="w-full mb-4">
      <CardHeader
        className="flex flex-row items-center justify-between cursor-pointer select-none py-1.5 px-4"
        onClick={() => setIsCollapsed(prev => !prev)}
      >
        <CardTitle className="text-sm capitalize">{title}</CardTitle>
        <Button variant="ghost" size="icon" tabIndex={-1} aria-label={isCollapsed ? `Expand ${title}` : `Collapse ${title}`}>
          {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
        </Button>
      </CardHeader>
      <CardContent className={cn(isCollapsed && "hidden")}>{children}</CardContent>
    </Card>
  );
}

function VotingInfoSection() {
  const { filters, residenceAddressFilters, filtersHydrated, setFilters, setResidenceAddressFilters, updateFilter } = useVoterFilterContext();
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const lastFetchKey = React.useRef<string>("");

  React.useEffect(() => {
    if (!filtersHydrated) return;
    const fetchKey = JSON.stringify({ filters, residenceAddressFilters });
    if (fetchKey === lastFetchKey.current) return;
    lastFetchKey.current = fetchKey;
    setLoading(true);
    setError(null);
    const params = buildQueryParams(filters, residenceAddressFilters, { section: "voting_info" });
    fetch(`/api/ga/voter/summary?${params.toString()}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch aggregates");
        return res.json();
      })
      .then(json => {
        setData(json.voting_info || null);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, [filters, residenceAddressFilters, filtersHydrated]);

  // Calculate total voters (ACTIVE + INACTIVE)
  const totalVoters = React.useMemo(() => {
    if (!data?.status) return 0;
    const activeCount = data.status.find((s: any) => s.label === 'ACTIVE')?.count || 0;
    const inactiveCount = data.status.find((s: any) => s.label === 'INACTIVE')?.count || 0;
    return activeCount + inactiveCount;
  }, [data]);

  // Handler for simple array filters (status, statusReason)
  function handleArrayFilterClick(filterKey: keyof FilterState, value: string) {
    // Value is already title-cased by the caller (GroupCard onClick)
    const prev = (filters[filterKey] as string[]) || [];
    if (prev.includes(value)) return; // Prevent duplicates
    updateFilter(filterKey, [...prev, value]);
  }

  // Handler for address filters (city, zipcode) - Updates the first address filter
  function handleAddressFilterClick(addressKey: 'residence_city' | 'residence_zipcode', value: string) {
    // Title case only for city
    const processedValue = addressKey === 'residence_city' ? toTitleCase(value) : value;
    
    setResidenceAddressFilters((prevFilters: ResidenceAddressFilterState[]) => {
      const updatedFilters = [...prevFilters];
      let targetFilter = updatedFilters[0];
      if (!targetFilter) {
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
      if (targetFilter[addressKey] !== processedValue) {
        updatedFilters[0] = { ...targetFilter, [addressKey]: processedValue };
        return updatedFilters;
      }
      return prevFilters;
    });
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80px] text-muted-foreground text-sm">
        <span className="animate-pulse">Loading Voting Info...</span>
      </div>
    );
  }
  if (error) {
    return <div className="text-red-500 text-sm">Error: {error}</div>;
  }
  if (!data || Object.values(data).every((arr: any) => !arr || arr.length === 0)) {
    return <div className="text-muted-foreground text-sm">No data available.</div>;
  }

  function GroupCard({ 
    icon, 
    title, 
    items, 
    onItemClick, 
    // Add a flag to control title casing for display/click
    titleCaseValue = true 
  }: { 
    icon: React.ReactNode; 
    title: string; 
    items: any[]; 
    onItemClick: (value: string) => void; 
    titleCaseValue?: boolean; 
  }) {
    if (!items || items.length === 0) return null;
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center gap-2 py-3 px-3">
          <CardTitle className="text-xs font-semibold text-primary tracking-tight flex items-center gap-1.5">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {items.map((item: any) => {
              // Apply title casing based on the flag for display and click value
              const valueToUse = titleCaseValue ? toTitleCase(item.label) : item.label;
              const displayLabel = valueToUse; // Display the processed value
              return (
                <li key={item.label} className="flex items-center justify-between px-3 py-1.5 text-[11px]">
                  <button
                    type="button"
                    className="truncate text-blue-400 hover:underline focus:underline outline-none bg-transparent border-0 p-0 m-0 cursor-pointer text-left"
                    title={`Filter by ${displayLabel}`}
                    // Pass the correctly cased value
                    onClick={() => onItemClick(valueToUse)} 
                  >
                    {displayLabel}
                  </button>
                  <span className="font-mono text-[10px] text-muted-foreground font-light">
                    {item.count.toLocaleString()}
                  </span>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div className="flex flex-col gap-4">
        {totalVoters > 0 && (
          <Card className="w-full">
            <CardHeader className="flex flex-row items-center gap-2 py-3 px-3">
              <ListChecks className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-xs font-semibold text-primary tracking-tight">Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                <li className="flex items-center justify-between px-3 py-1.5 text-[11px]">
                  <span className="truncate font-semibold" title="Total Matching Voters">Total Matching Voters</span>
                  <span className="font-mono text-[10px] text-muted-foreground font-light">{totalVoters.toLocaleString()}</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        )}
        <GroupCard
          icon={<BadgeCheck className="w-4 h-4 text-green-600" />}
          title="Status"
          items={data.status}
          onItemClick={(value) => handleArrayFilterClick('status', value)}
          // titleCaseValue is true by default
        />
        <GroupCard
          icon={<AlertCircle className="w-4 h-4 text-yellow-500" />}
          title="Status Reason"
          items={data.status_reason}
          onItemClick={(value) => handleArrayFilterClick('statusReason', value)}
          // titleCaseValue is true by default
        />
      </div>
      <GroupCard
        icon={<MapPin className="w-4 h-4 text-blue-500" />}
        title="Residence City"
        items={data.residence_city}
        onItemClick={(value) => handleAddressFilterClick('residence_city', value)}
        // titleCaseValue is true by default
      />
      <GroupCard
        icon={<Mail className="w-4 h-4 text-purple-500" />}
        title="Residence Zipcode"
        items={data.residence_zipcode}
        onItemClick={(value) => handleAddressFilterClick('residence_zipcode', value)}
        titleCaseValue={false} // Explicitly disable for Zipcode
      />
    </div>
  );
}

export default VotingInfoSection; 