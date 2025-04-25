"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, History } from "lucide-react";
import { useVoterFilterContext, buildQueryParams } from "../VoterFilterProvider";
import type { FilterState } from "../list/types";

function VotingHistorySection() {
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
    const params = buildQueryParams(filters, [], { section: "voting_history" });
    fetch(`/api/ga/voter/summary?${params.toString()}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch aggregates");
        return res.json();
      })
      .then(json => {
        setData(json.voting_history || null);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, [filters, filtersHydrated]);

  function handleYearFilterClick(year: string) {
    // Add to electionYear filter (array)
    const prev = (filters.electionYear as string[]) || [];
    if (prev.includes(year)) return;
    updateFilter("electionYear", [...prev, year]);
  }

  function handleLastVoteDateClick(date: string) {
    // Add to notVotedSinceYear filter (string)
    updateFilter("notVotedSinceYear", date);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80px] text-muted-foreground text-sm">
        <span className="animate-pulse">Loading Voting History...</span>
      </div>
    );
  }
  if (error) {
    return <div className="text-red-500 text-sm">Error: {error}</div>;
  }
  if (!data || Object.values(data).every((arr: any) => !arr || arr.length === 0)) {
    return <div className="text-muted-foreground text-sm">No data available.</div>;
  }

  function GroupCard({ icon, title, items, onItemClick, isDate }: { icon: React.ReactNode; title: string; items: any[]; onItemClick: (value: string) => void; isDate?: boolean }) {
    if (!items || items.length === 0) return null;
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center gap-2 py-1.5 px-3">
          <CardTitle className="text-xs font-semibold text-primary tracking-tight flex items-center gap-1.5">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {items.map((item: any) => {
              let displayLabel = item.label;
              if (isDate && item.label) {
                const dateObj = new Date(item.label);
                if (!isNaN(dateObj.getTime())) {
                  displayLabel = dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
                }
              }
              return (
                <li key={item.label} className="flex items-center justify-between px-3 py-1.5 text-[11px]">
                  <button
                    type="button"
                    className="truncate text-blue-400 hover:underline focus:underline outline-none bg-transparent border-0 p-0 m-0 cursor-pointer text-left"
                    title={`Filter by ${displayLabel}`}
                    onClick={() => onItemClick(item.label)}
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
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <GroupCard icon={<Calendar className="w-4 h-4 text-blue-500" />} title="Last Vote Date" items={data.derived_last_vote_date} onItemClick={handleLastVoteDateClick} isDate />
      <GroupCard icon={<History className="w-4 h-4 text-green-600" />} title="Election Years" items={data.participated_election_years} onItemClick={handleYearFilterClick} />
    </div>
  );
}

export default VotingHistorySection; 