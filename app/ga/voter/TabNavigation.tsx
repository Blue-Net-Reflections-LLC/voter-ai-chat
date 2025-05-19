"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { usePathname, useParams } from "next/navigation";
import { Info } from "lucide-react";
import { useVoterFilterContext, buildQueryParams } from './VoterFilterProvider';
import { FilterState } from './list/types';
import { ParticipationScoreWidget } from '@/components/voter/ParticipationScoreWidget';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function useParticipationScore(
    filters: FilterState | null | undefined,
    filtersHydrated: boolean,
    registrationNumber: string | null | undefined,
    pathname: string
) {
  const [scoreData, setScoreData] = useState<{ score: number | null, voterCount?: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Reference to track the latest request
  const latestRequestRef = useRef<string>('');

  const { residenceAddressFilters } = useVoterFilterContext() || { residenceAddressFilters: [] };

  // Create stable filter references for the effect dependency
  const filterString = useMemo(() => {
    return JSON.stringify(filters);
  }, [filters]);
  
  const residenceFilterString = useMemo(() => {
    return JSON.stringify(residenceAddressFilters);
  }, [residenceAddressFilters]);

  useEffect(() => {
    if (pathname === '/ga/voter' || pathname.startsWith('/ga/voter/turnout')) {
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
    } else {
      const relevantFilters = { ...(filters || {}) };
      delete (relevantFilters as any).page;
      delete (relevantFilters as any).pageSize;
      delete (relevantFilters as any).sortBy;
      delete (relevantFilters as any).sortOrder;

      const params = buildQueryParams(relevantFilters as FilterState, residenceAddressFilters);
      queryString = params.toString();
    }
    
    // Generate a unique request ID and store it as the latest
    const requestId = Date.now().toString();
    latestRequestRef.current = requestId;
    
    fetch(`/api/ga/voter/participation-score?${queryString}`, { signal })
      .then(async (res) => {
        if (!res.ok) {
            const errorBody = await res.text();
            throw new Error(`API error: ${res.status} - ${errorBody}`);
        }
        return res.json();
      })
      .then(data => {
        // Only update state if this is still the latest request
        if (requestId === latestRequestRef.current) {
          setScoreData(data);
          setLoading(false);
        }
      })
      .catch(e => {
        if (e.name === 'AbortError') {
          return;
        }
        
        // Only update state if this is still the latest request
        if (requestId === latestRequestRef.current) {
          console.error(`Error fetching participation score:`, e);
          setError(e.message || 'An error occurred');
          setScoreData(null);
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [filtersHydrated, filterString, residenceFilterString, registrationNumber, pathname]);

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
  const isTurnoutPage = pathname.startsWith('/ga/voter/turnout');
  const registrationNumber = isProfilePage && typeof params.registration_number === 'string' ? params.registration_number : null;

  const { 
    scoreData, 
    loading: scoreLoading, 
    error: scoreError 
  } = useParticipationScore(filters, filtersHydrated, registrationNumber, pathname);

  const scoreLabel = isProfilePage ? "Score" : "Score";

  if (isLandingPage || isTurnoutPage) {
    return null;
  }

  return (
    <div className="w-full bg-background flex items-center py-1 px-4 border-b">
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">{scoreLabel}</span>
        
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

      {/* The filters component will expand to fill remaining space */}
      <div className="flex-grow"></div>
    </div>
  );
} 