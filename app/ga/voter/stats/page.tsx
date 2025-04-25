"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, BadgeCheck, AlertCircle, MapPin, Mail, ListChecks } from "lucide-react";
import { useVoterFilterContext, buildQueryParams, FILTER_TO_URL_PARAM_MAP } from "../VoterFilterProvider";
import { cn } from "@/lib/utils";
import type { FilterState } from "../list/types";

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
      <CardContent className={cn(isCollapsed && "hidden")}>
        {children}
      </CardContent>
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

  // Helper to handle filter click for array filters
  function handleArrayFilterClick(filterKey: keyof FilterState, value: string) {
    const prev = (filters[filterKey] as string[]) || [];
    if (prev.includes(value)) return; // Prevent duplicates
    const newValue = [...prev, value];
    updateFilter(filterKey, newValue);
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

  // Helper to render a group card
  function GroupCard({ icon, title, items, groupKey }: { icon: React.ReactNode; title: string; items: any[]; groupKey: keyof FilterState }) {
    if (!items || items.length === 0) return null;
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center gap-2 py-1.5 px-3">
          <CardTitle className="text-xs font-semibold text-primary tracking-tight">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {items.map((item: any) => (
              <li key={item.label} className="flex items-center justify-between px-3 py-1.5 text-[11px]">
                <button
                  type="button"
                  className="truncate text-blue-400 hover:underline focus:underline outline-none bg-transparent border-0 p-0 m-0 cursor-pointer"
                  title={`Filter by ${item.label}`}
                  onClick={() => handleArrayFilterClick(groupKey, item.label)}
                >
                  {item.label}
                </button>
                <span className="font-mono text-[10px] text-muted-foreground font-light">{item.count.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      {/* Left column: Summary, Status and Status Reason stacked */}
      <div className="flex flex-col gap-4">
        {/* Total Voters as a group card */}
        {totalVoters > 0 && (
          <Card className="w-full">
            <CardHeader className="flex flex-row items-center gap-2 py-1.5 px-3">
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
        <GroupCard icon={<BadgeCheck className="w-4 h-4 text-green-600" />} title="Status" items={data.status} groupKey="status" />
        <GroupCard icon={<AlertCircle className="w-4 h-4 text-yellow-500" />} title="Status Reason" items={data.status_reason} groupKey="status_reason" />
      </div>
      {/* Middle column: Residence City */}
      <GroupCard icon={<MapPin className="w-4 h-4 text-blue-500" />} title="Residence City" items={data.residence_city} groupKey="residence_city" />
      {/* Right column: Residence Zipcode */}
      <GroupCard icon={<Mail className="w-4 h-4 text-purple-500" />} title="Residence Zipcode" items={data.residence_zipcode} groupKey="residence_zipcode" />
    </div>
  );
}

export default function StatsDashboardPage() {
  return (
    <div className="w-full h-full flex flex-col gap-6 p-2 md:p-6 xl:p-8">
      <StatsSection title="VOTER INFO">
        <VotingInfoSection />
      </StatsSection>
      <StatsSection title="DISTRICTS">
        <div className="flex flex-col items-center justify-center min-h-[80px] text-muted-foreground text-sm">
          <span className="animate-pulse">Loading Districts...</span>
        </div>
      </StatsSection>
      <StatsSection title="DEMOGRAPHICS">
        <div className="flex flex-col items-center justify-center min-h-[80px] text-muted-foreground text-sm">
          <span className="animate-pulse">Loading Demographics...</span>
        </div>
      </StatsSection>
      <StatsSection title="VOTING HISTORY">
        <div className="flex flex-col items-center justify-center min-h-[80px] text-muted-foreground text-sm">
          <span className="animate-pulse">Loading Voting History...</span>
        </div>
      </StatsSection>
      <StatsSection title="CENSUS">
        <div className="flex flex-col items-center justify-center min-h-[80px] text-muted-foreground text-sm">
          <span className="animate-pulse">Loading Census...</span>
        </div>
      </StatsSection>
    </div>
  );
} 