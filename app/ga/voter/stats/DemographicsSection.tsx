"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, User, BarChart2 } from "lucide-react";
import { useVoterFilterContext, buildQueryParams } from "../VoterFilterProvider";
import type { FilterState } from "../list/types";

// Helper function to convert text to Title Case (same as in useLookupData)
const toTitleCase = (text: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

function DemographicsSection() {
  const { filters, residenceAddressFilters, filtersHydrated, updateFilter } = useVoterFilterContext();
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
    const params = buildQueryParams(filters, residenceAddressFilters, { section: "demographics" });
    fetch(`/api/ga/voter/summary?${params.toString()}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch aggregates");
        return res.json();
      })
      .then(json => {
        setData(json.demographics || null);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, [filters, residenceAddressFilters, filtersHydrated]);

  function handleArrayFilterClick(filterKey: keyof FilterState, value: string) {
    // Value is already title-cased by the caller (GroupCard onClick)
    const prev = (filters[filterKey] as string[]) || [];
    if (prev.includes(value)) return;
    updateFilter(filterKey, [...prev, value]);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80px] text-muted-foreground text-sm">
        <span className="animate-pulse">Loading Demographics...</span>
      </div>
    );
  }
  if (error) {
    return <div className="text-red-500 text-sm">Error: {error}</div>;
  }
  if (!data || Object.values(data).every((arr: any) => !arr || arr.length === 0)) {
    return <div className="text-muted-foreground text-sm">No data available.</div>;
  }

  function GroupCard({ icon, title, items, filterKey }: { icon: React.ReactNode; title: string; items: any[]; filterKey: keyof FilterState }) {
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
              // Convert label to Title Case for display and click handler
              const displayLabel = toTitleCase(item.label); 
              return (
                <li key={item.label} className="flex items-center justify-between px-3 py-1.5 text-[11px]">
                  <button
                    type="button"
                    className="truncate text-blue-400 hover:underline focus:underline outline-none bg-transparent border-0 p-0 m-0 cursor-pointer text-left"
                    title={`Filter by ${displayLabel}`}
                    // Pass the title-cased label to the click handler
                    onClick={() => handleArrayFilterClick(filterKey, displayLabel)} 
                  >
                    {/* Display the title-cased label */}
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
      <GroupCard icon={<Users className="w-4 h-4 text-blue-500" />} title="Race" items={data.race} filterKey="race" />
      <GroupCard icon={<User className="w-4 h-4 text-pink-500" />} title="Gender" items={data.gender} filterKey="gender" />
      <GroupCard icon={<BarChart2 className="w-4 h-4 text-green-600" />} title="Age Range" items={data.age_range} filterKey="age" />
    </div>
  );
}

export default DemographicsSection; 