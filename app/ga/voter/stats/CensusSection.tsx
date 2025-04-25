"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe } from "lucide-react";
import { useVoterFilterContext, buildQueryParams } from "../VoterFilterProvider";
import type { FilterState } from "../list/types";

function CensusSection() {
  const { filters, filtersHydrated, updateFilter } = useVoterFilterContext();
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const lastFetchKey = React.useRef<string>("");

  React.useEffect(() => {
    if (!filtersHydrated) return;
    const fetchKey = JSON.stringify({ filters });
    if (fetchKey === lastFetchKey.current) return;
    lastFetchKey.current = fetchKey;
    setLoading(true);
    setError(null);
    const params = buildQueryParams(filters, [], { section: "census" });
    fetch(`/api/ga/voter/summary?${params.toString()}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch aggregates");
        return res.json();
      })
      .then(json => {
        setData(json.census || null);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, [filters, filtersHydrated]);

  function handleArrayFilterClick(filterKey: keyof FilterState, value: string) {
    const prev = (filters[filterKey] as string[]) || [];
    if (prev.includes(value)) return;
    updateFilter(filterKey, [...prev, value]);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80px] text-muted-foreground text-sm">
        <span className="animate-pulse">Loading Census...</span>
      </div>
    );
  }
  if (error) {
    return <div className="text-red-500 text-sm">Error: {error}</div>;
  }
  if (!data || Object.values(data).every((arr: any) => !arr || arr.length === 0)) {
    return <div className="text-muted-foreground text-sm">No data available.</div>;
  }

  function GroupCard({ icon, title, items }: { icon: React.ReactNode; title: string; items: any[] }) {
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
            {items.map((item: any) => (
              <li key={item.label} className="flex items-center justify-between px-3 py-1.5 text-[11px]">
                <span className="truncate text-foreground" title={item.label}>{item.label}</span>
                <span className="font-mono text-[10px] text-muted-foreground font-light">
                  {item.count.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      <GroupCard icon={<Globe className="w-4 h-4 text-blue-500" />} title="Census Tract" items={data.census_tract} />
    </div>
  );
}

export default CensusSection; 