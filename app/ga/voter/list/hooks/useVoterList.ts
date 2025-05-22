"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { FilterState, ResidenceAddressFilterState, PaginationState, Voter } from '../types';
import { useVoterFilterContext, buildQueryParams } from '../../VoterFilterProvider';
import { useVoterListContext } from '../../VoterListContext';


// Initial filter state
const initialFilterState: FilterState = {
  county: [],
  congressionalDistricts: [],
  stateSenateDistricts: [],
  stateHouseDistricts: [],
  scoreRanges: [],
  status: [],
  party: [],
  historyParty: [],
  age: [],
  gender: [],
  race: [],
  income: [],
  education: [],
  unemployment: [],
  electionType: [],
  electionYear: [],
  electionDate: [],
  electionParticipation: 'turnedOut',
  ballotStyle: [],
  eventParty: [],
  voterEventMethod: '',
  firstName: '',
  lastName: '',
  neverVoted: false,
  notVotedSinceYear: '',
  redistrictingAffectedTypes: [],
  statusReason: []
};

// Initial address filter state
const initialAddressFilterState: ResidenceAddressFilterState = {
  id: uuidv4(),
  residence_street_number: '',
  residence_pre_direction: '',
  residence_street_name: '',
  residence_street_type: '',
  residence_post_direction: '',
  residence_apt_unit_number: '',
  residence_zipcode: '',
  residence_city: ''
};

// Initial pagination state
const initialPaginationState: PaginationState = {
  currentPage: 1,
  pageSize: 24,
  totalItems: 0
};

// Available sort fields
export type SortField = 'name' | 'id' | 'county' | 'status' | 'address' | 'score';
export type SortDirection = 'asc' | 'desc';

// Initial sort state
const initialSortState = {
  field: 'name' as SortField,
  direction: 'asc' as SortDirection
};

// List of address fields for URL params
const ADDRESS_FIELDS = [
  'residence_street_number',
  'residence_pre_direction',
  'residence_street_name',
  'residence_street_type',
  'residence_post_direction',
  'residence_apt_unit_number',
  'residence_zipcode',
  'residence_city'
] as const;

export function useVoterList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Use filter context for all filter state and logic
  const {
    filters,
    setFilters,
    residenceAddressFilters,
    setResidenceAddressFilters,
    updateFilter,
    updateResidenceAddressFilter,
    clearAllFilters,
    addUrlParams,
    hasActiveFilters,
    filtersHydrated
  } = useVoterFilterContext();
  
  // Use voter list context for voters
  const { voters, setVoters } = useVoterListContext();
  
  // Hydrate pagination and sort from URL on first render
  const [pagination, setPagination] = useState<PaginationState>(() => ({
    currentPage: Number(searchParams.get('page')) || 1,
    pageSize: Number(searchParams.get('pageSize')) || 24,
    totalItems: 0,
  }));
  
  const [sort, setSort] = useState(() => ({
    field: (searchParams.get('sortField') as SortField) || initialSortState.field,
    direction: (searchParams.get('sortDirection') as SortDirection) || initialSortState.direction,
  }));
  
  const [isLoading, setIsLoading] = useState(true);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
  
  // Refs for request lock and URL updates
  const isUpdatingUrl = useRef(false);
  const isRequestInProgress = useRef(false);
  const requestParams = useRef('');
  const initialRenderRef = useRef(true);
  
  // Track if component is mounted
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Track last query params to prevent unnecessary fetches
  const lastQueryParams = useRef<string | null>(null);
  
  // Only auto-reset page to 1 on filter change after hydration and if filters actually changed
  const lastFilters = useRef<FilterState>(filters);
  useEffect(() => {
    if (!filtersHydrated) {
      lastFilters.current = filters;
      return;
    }
    if (
      JSON.stringify(filters) !== JSON.stringify(lastFilters.current) &&
      pagination.currentPage !== 1
    ) {
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }
    lastFilters.current = filters;
    // eslint-disable-next-line
  }, [filters, filtersHydrated]);
  
  // Use addUrlParams from filter context to update URL with pagination and sort only
  useEffect(() => {
    addUrlParams({
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      sortField: sort.field,
      sortDirection: sort.direction
    });
    // eslint-disable-next-line
  }, [pagination.currentPage, pagination.pageSize, sort.field, sort.direction]);
  
  // Track current active request controller
  const currentControllerRef = useRef<AbortController | null>(null);

  // Safely abort the current request if one exists
  const safelyAbortCurrentRequest = useCallback(() => {
    if (currentControllerRef.current && !currentControllerRef.current.signal.aborted) {
      try {
        currentControllerRef.current.abort();
      } catch (err) {
        console.error('[Voter List] Error aborting previous request:', err);
      } finally {
        currentControllerRef.current = null;
      }
    }
  }, []);

  // Fetch voters from API (no debounce)
  const fetchVoters = useCallback(async () => {
    if (!isMountedRef.current) return;

    const paramsString = buildQueryParams(filters, residenceAddressFilters, {
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      sortField: sort.field,
      sortDirection: sort.direction
    }).toString();

    // Generate a unique request ID for tracking
    const requestId = Date.now().toString();
    
    // If a request is in progress, abort it before starting a new one
    if (isRequestInProgress.current) {
      safelyAbortCurrentRequest();
    }
    
    isRequestInProgress.current = true;
    requestParams.current = paramsString;
    setIsLoading(true);

    try {
      // Create a controller so we can abort if needed
      const controller = new AbortController();
      
      // Store the current controller so it can be aborted if needed
      currentControllerRef.current = controller;
      
      // Make the actual fetch request
      let response;
      try {
        response = await fetch(`/api/ga/voter/list?${paramsString}`, { 
          signal: controller.signal 
        });
      } catch (fetchError) {
        // Handle fetch errors especially AbortError
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          return; // Just return, don't throw
        }
        throw fetchError; // Re-throw other errors
      }
      
      // If component unmounted during request, abort and return
      if (!isMountedRef.current) {
        safelyAbortCurrentRequest();
        return;
      }
      
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      
      // Parse JSON with error handling
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        if (!isMountedRef.current || requestParams.current !== paramsString) {
          return; // Just return, no need to throw
        }
        throw jsonError; // Re-throw for other JSON parsing errors
      }
      
      // Check again after JSON parsing
      if (!isMountedRef.current) {
        return;
      }
      
      // Compare with latest query to see if this is stale
      if (requestParams.current !== paramsString) {
        return;
      }
      
      setVoters(data.voters || []);
      setPagination(prev => ({ ...prev, totalItems: data.pagination?.totalItems || 0 }));
      lastQueryParams.current = paramsString;
      setHasFetchedOnce(true);
      
    } catch (error) {
      if (!isMountedRef.current) return;
      
      // Log but don't throw for AbortError
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      
      console.error(`[Voter List] Error:`, error);
      
      // Only update UI if this is still current
      if (requestParams.current === paramsString) {
        setVoters([]);
      }
    } finally {
      // Always update UI state if component is mounted AND this was the latest request
      if (isMountedRef.current && requestParams.current === paramsString) {
        setIsLoading(false);
      }
      
      // Clear this controller reference if it matches the current one
      if (currentControllerRef.current && 
          (currentControllerRef.current.signal.aborted || requestParams.current !== paramsString)) {
        currentControllerRef.current = null;
      }
      
      // Release the request lock if this was the most recent request
      if (requestParams.current === paramsString) {
        isRequestInProgress.current = false;
      }
    }
  }, [filters, residenceAddressFilters, pagination, sort, safelyAbortCurrentRequest]);
  
  useEffect(() => {
    if (!filtersHydrated) return;
    const paramsString = buildQueryParams(filters, residenceAddressFilters, {
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      sortField: sort.field,
      sortDirection: sort.direction
    }).toString();
    if (lastQueryParams.current !== paramsString) {
      fetchVoters();
    }
    // eslint-disable-next-line
  }, [filtersHydrated, filters, residenceAddressFilters, pagination.currentPage, pagination.pageSize, sort.field, sort.direction]);
  
  // Helper functions for state updates
  const updatePage = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };
  
  const updatePageSize = (size: number) => {
    setPagination(prev => ({ ...prev, pageSize: size, currentPage: 1 }));
  };
  
  // Update sort state - toggles direction if clicking on current sort field
  const updateSort = (field: SortField) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    // Reset to first page when sort changes
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };
  
  const currentQueryParams = useMemo(() =>
    buildQueryParams(filters, residenceAddressFilters, {
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      sortField: sort.field,
      sortDirection: sort.direction
    }).toString(),
    [filters, residenceAddressFilters, pagination.currentPage, pagination.pageSize, sort.field, sort.direction]
  );
  
  return {
    filters,
    residenceAddressFilters,
    pagination,
    sort,
    voters,
    isLoading: isLoading || !filtersHydrated,
    hasFetchedOnce,
    setFilters,
    setResidenceAddressFilters,
    updateFilter,
    updateResidenceAddressFilter,
    clearAllFilters,
    updatePage,
    updatePageSize,
    updateSort,
    hasActiveFilters: hasActiveFilters(),
    buildQueryParams,
    currentQueryParams
  };
} 