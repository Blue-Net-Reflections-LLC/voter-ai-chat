"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, BarChart2, Map, PieChart, Landmark, Info } from "lucide-react";
import React, { useState, useEffect } from 'react';
import { useVoterFilterContext } from './VoterFilterProvider';
import { FilterState } from './list/types';
import { ParticipationScoreWidget } from '@/components/voter/ParticipationScoreWidget';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const tabs = [
  {
    label: "Voter List",
    href: "/ga/voter/list",
    icon: List,
    enabled: true,
  },
  {
    label: "Stats/Aggregate",
    href: "/ga/voter/stats",
    icon: BarChart2,
    enabled: true,
  },
  {
    label: "Maps",
    href: "/ga/voter/map",
    icon: Map,
    enabled: true,
  },
  {
    label: "Charts",
    href: "#",
    icon: PieChart,
    enabled: false,
  },
  {
    label: "Census Tract",
    href: "#",
    icon: Landmark,
    enabled: false,
  },
];

function useAggregateParticipationScore(filters: FilterState | null | undefined) {
  const [scoreData, setScoreData] = useState<{ score: number | null, voterCount?: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!filters) {
        setScoreData(null);
        setLoading(false);
        setError(null);
        return;
    }
    
    const { page, pageSize, ...relevantFilters } = filters;
    const filterKey = JSON.stringify(relevantFilters);

    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const signal = controller.signal;

    const params = new URLSearchParams();
    Object.entries(relevantFilters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          params.set(key, value.join(','));
        } else {
          params.set(key, String(value));
        }
      }
    });

    const queryString = params.toString();

    fetch(`/api/ga/voter/participation-score?${queryString}`, { signal })
      .then(async (res) => {
        if (!res.ok) {
            const errorBody = await res.text();
            throw new Error(`API error: ${res.status} - ${errorBody}`);
        }
        return res.json();
      })
      .then(data => {
        setScoreData(data); 
        setLoading(false);
      })
      .catch(e => {
        if (e.name === 'AbortError') {
          console.log('Fetch aborted for aggregate participation score');
          return;
        }
        console.error('Error fetching aggregate participation score:', e);
        setError(e.message || 'An error occurred');
        setScoreData(null);
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [filters]);

  return { scoreData, loading, error };
}

export default function TabNavigation() {
  const pathname = usePathname();
  const voterFilterContext = useVoterFilterContext();
  const filters = voterFilterContext?.filters;

  const { 
    scoreData, 
    loading: scoreLoading, 
    error: scoreError 
  } = useAggregateParticipationScore(filters);

  return (
    <nav className="w-full border-b bg-background px-4 pt-2 pb-1 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 flex-shrink-0 pr-4 border-r">
         <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">Avg. Participation Score</span>
         
         <ParticipationScoreWidget 
           score={scoreData?.score}
           isLoading={scoreLoading} 
           size="small"
         />
          {scoreError && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                   <Info className="h-4 w-4 text-red-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Error: {scoreError}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
           )}
      </div>
      
      <div className="flex-grow flex justify-end space-x-2 md:space-x-4 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = tab.enabled && pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return tab.enabled ? (
            <Link
              key={tab.label}
              href={tab.href}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs md:text-sm font-medium transition-colors whitespace-nowrap
                ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              <Icon className="w-3 h-3 md:w-4 md:h-4 mr-1 flex-shrink-0" />
              <span className="hidden md:inline">{tab.label}</span>
            </Link>
          ) : (
            <span
              key={tab.label}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs md:text-sm font-medium text-muted-foreground opacity-50 cursor-not-allowed whitespace-nowrap"
            >
              <Icon className="w-3 h-3 md:w-4 md:h-4 mr-1 flex-shrink-0" />
               <span className="hidden md:inline">{tab.label}</span>
            </span>
          );
        })}
      </div>
    </nav>
  );
} 