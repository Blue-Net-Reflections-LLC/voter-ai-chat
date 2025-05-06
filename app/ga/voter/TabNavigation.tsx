"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { List, BarChart2, Map, PieChart, Landmark, Info } from "lucide-react";
import React, { useState, useEffect } from 'react';
import { useVoterFilterContext, buildQueryParams } from './VoterFilterProvider';
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
    label: "List",
    href: "/ga/voter/list",
    icon: List,
    enabled: true,
  },
  {
    label: "Stats",
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
    href: "/ga/voter/charts",
    icon: PieChart,
    enabled: true,
  },
  {
    label: "Census",
    href: "#",
    icon: Landmark,
    enabled: false,
  },
];

function useParticipationScore(
    filters: FilterState | null | undefined,
    filtersHydrated: boolean,
    registrationNumber: string | null | undefined,
    pathname: string
) {
  const [scoreData, setScoreData] = useState<{ score: number | null, voterCount?: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { residenceAddressFilters } = useVoterFilterContext() || { residenceAddressFilters: [] };

  useEffect(() => {
    if (pathname === '/ga/voter') {
      setScoreData(null);
      setLoading(false);
      setError(null);
      return;
    }

    const isIndividualFetch = typeof registrationNumber === 'string' && registrationNumber.length > 0;
    
    if (!isIndividualFetch && (!filtersHydrated || !filters)) {
        setScoreData(null);
        setLoading(false);
        setError(null);
        return;
    }

    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const signal = controller.signal;

    let queryString = '';
    if (isIndividualFetch) {
      const params = new URLSearchParams();
      params.set('registrationNumber', registrationNumber as string);
      queryString = params.toString();
      console.log(`[Score Fetch] Fetching individual score for: ${registrationNumber}`);
    } else {
      const relevantFilters = { ...(filters || {}) };
      delete (relevantFilters as any).page;
      delete (relevantFilters as any).pageSize;
      delete (relevantFilters as any).sortBy;
      delete (relevantFilters as any).sortOrder;

      const params = buildQueryParams(relevantFilters as FilterState, residenceAddressFilters);
      queryString = params.toString();
      console.log(`[Score Fetch] Fetching aggregate score with query: ${queryString || '(no filters - overall avg)'}`);
    }

    fetch(`/api/ga/voter/participation-score?${queryString}`, { signal })
      .then(async (res) => {
        if (!res.ok) {
            const errorBody = await res.text();
            throw new Error(`API error: ${res.status} - ${errorBody}`);
        }
        return res.json();
      })
      .then(data => {
        console.log(`[Score Fetch] Received ${isIndividualFetch ? 'individual' : 'aggregate'} score data:`, data);
        setScoreData(data);
        setLoading(false);
      })
      .catch(e => {
        if (e.name === 'AbortError') {
          console.log('Fetch aborted for participation score');
          return;
        }
        console.error(`Error fetching ${isIndividualFetch ? 'individual' : 'aggregate'} participation score:`, e);
        setError(e.message || 'An error occurred');
        setScoreData(null);
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [filtersHydrated, JSON.stringify(filters), JSON.stringify(residenceAddressFilters), registrationNumber, pathname]);

  return { scoreData, loading, error };
}

export default function TabNavigation() {
  const pathname = usePathname();
  const params = useParams();
  const voterFilterContext = useVoterFilterContext();
  const filters = voterFilterContext?.filters;
  const filtersHydrated = voterFilterContext?.filtersHydrated || false;

  const isProfilePage = pathname.startsWith('/ga/voter/profile/');
  const isLandingPage = pathname === '/ga/voter';
  const registrationNumber = isProfilePage && typeof params.registration_number === 'string' ? params.registration_number : null;

  const { 
    scoreData, 
    loading: scoreLoading, 
    error: scoreError 
  } = useParticipationScore(filters, filtersHydrated, registrationNumber, pathname);

  const scoreLabel = isProfilePage ? "Participation Score" : "Avg. Participation Score";

  return (
    <nav className="w-full border-b bg-background px-4 pt-2 pb-1 flex items-center justify-between gap-4">
      {!isLandingPage && (
        <div className="flex items-center gap-2 flex-shrink-0 pr-4 border-r">
          <span className="hidden sm:inline text-sm font-semibold text-muted-foreground whitespace-nowrap">{scoreLabel}</span>
          
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
      )}
      
      <div className={`flex-grow flex justify-end space-x-2 md:space-x-4 overflow-x-auto no-scrollbar ${isLandingPage ? 'w-full' : ''}`}>
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