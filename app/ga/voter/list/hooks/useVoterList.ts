"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { FilterState, ResidenceAddressFilterState, PaginationState, Voter } from '../types';
import { useVoterFilterContext, buildQueryParams } from '../../VoterFilterProvider';
import { useVoterListContext } from '../../VoterListContext';

// Debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function (...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Initial filter state
const initialFilterState: FilterState = {
  county: [],
  congressionalDistricts: [],
  stateSenateDistricts: [],
  stateHouseDistricts: [],
  status: [],
  party: [],
  historyParty: [],
  age: [],
  gender: [],
  race: [],
  income: [],
  education: [],
  electionType: [],
  electionYear: [],
  electionDate: [],
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
  id: crypto.randomUUID(),
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
  pageSize: 25,
  totalItems: 0
};

// Available sort fields
export type SortField = 'name' | 'id' | 'county' | 'status' | 'address';
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
    pageSize: Number(searchParams.get('pageSize')) || 25,
    totalItems: 0,
  }));
  
  const [sort, setSort] = useState(() => ({
    field: (searchParams.get('sortField') as SortField) || initialSortState.field,
    direction: (searchParams.get('sortDirection') as SortDirection) || initialSortState.direction,
  }));
  
  const [isLoading, setIsLoading] = useState(false);
  
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
  
  // Fetch voters from API (no debounce)
  const fetchVoters = useCallback(async () => {
    if (!isMountedRef.current) return;
    if (isRequestInProgress.current) return;

    const paramsString = buildQueryParams(filters, residenceAddressFilters, {
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      sortField: sort.field,
      sortDirection: sort.direction
    }).toString();

    // Skip if same request is in progress or params haven't changed
    if (paramsString === requestParams.current) return;

    isRequestInProgress.current = true;
    requestParams.current = paramsString;
    setIsLoading(true);

    try {
      const response = await fetch(`/api/ga/voter/list?${paramsString}`);
      if (!isMountedRef.current) return;
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      if (!isMountedRef.current) return;
      setVoters(data.voters || []);
      setPagination(prev => ({ ...prev, totalItems: data.pagination?.totalItems || 0 }));
      lastQueryParams.current = paramsString;
    } catch (error) {
      if (isMountedRef.current) setVoters([]);
    } finally {
      if (isMountedRef.current) setIsLoading(false);
      setTimeout(() => {
        isRequestInProgress.current = false;
      }, 300);
    }
  }, [filters, residenceAddressFilters, pagination, sort]);
  
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
  }, [filtersHydrated, filters, residenceAddressFilters, pagination.currentPage, pagination.pageSize, sort.field, sort.direction, searchParams]);
  
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
    isLoading,
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