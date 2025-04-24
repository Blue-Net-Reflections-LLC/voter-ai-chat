"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { FilterState, ResidenceAddressFilterState, PaginationState, Voter } from '../types';
import { useVoterFilterContext } from '../../VoterFilterProvider';

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
    clearAllFilters
  } = useVoterFilterContext();
  
  const [pagination, setPagination] = useState<PaginationState>(() => {
    // Initialize from URL if available
    const pageParam = searchParams.get('page');
    const pageSizeParam = searchParams.get('pageSize');
    
    return {
      currentPage: pageParam ? parseInt(pageParam, 10) : initialPaginationState.currentPage,
      pageSize: pageSizeParam ? parseInt(pageSizeParam, 10) : initialPaginationState.pageSize,
      totalItems: initialPaginationState.totalItems
    };
  });
  
  const [sort, setSort] = useState(() => {
    // Initialize from URL if available
    const sortField = searchParams.get('sortField') as SortField;
    const sortDirection = searchParams.get('sortDirection') as SortDirection;
    
    return {
      field: sortField || initialSortState.field,
      direction: sortDirection || initialSortState.direction
    };
  });
  
  const [voters, setVoters] = useState<Voter[]>([]);
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
  
  // Build query params for API call
  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    
    // Add pagination params
    params.set('page', pagination.currentPage.toString());
    params.set('pageSize', pagination.pageSize.toString());
    
    // Add sort params
    params.set('sortField', sort.field);
    params.set('sortDirection', sort.direction);
    
    // Add array filter params
    if (filters.county.length > 0) {
      filters.county.forEach(value => params.append('county', value));
    }
    
    if (filters.congressionalDistricts.length > 0) {
      filters.congressionalDistricts.forEach(value => params.append('congressionalDistricts', value));
    }
    
    if (filters.stateSenateDistricts.length > 0) {
      filters.stateSenateDistricts.forEach(value => params.append('stateSenateDistricts', value));
    }
    
    if (filters.stateHouseDistricts.length > 0) {
      filters.stateHouseDistricts.forEach(value => params.append('stateHouseDistricts', value));
    }
    
    if (filters.status.length > 0) {
      filters.status.forEach(value => params.append('status', value));
    }
    
    if (filters.party.length > 0) {
      filters.party.forEach(value => params.append('party', value));
    }
    
    if (filters.age.length > 0) {
      filters.age.forEach(value => params.append('ageRange', value));
    }
    
    if (filters.gender.length > 0) {
      filters.gender.forEach(value => params.append('gender', value));
    }
    
    if (filters.race.length > 0) {
      filters.race.forEach(value => params.append('race', value));
    }

    if (filters.redistrictingAffectedTypes.length > 0) {
      filters.redistrictingAffectedTypes.forEach(value => params.append('redistrictingAffectedTypes', value));
    }
    
    if (filters.voterEventMethod) {
      params.set('voterEventMethod', filters.voterEventMethod);
    }
    
    // Add name filters
    if (filters.firstName) params.set('firstName', filters.firstName);
    if (filters.lastName)  params.set('lastName',  filters.lastName);
    
    if (filters.neverVoted) params.set('neverVoted', 'true');
    if (filters.notVotedSinceYear) params.set('notVotedSinceYear', filters.notVotedSinceYear);
    
    // Add election type filter
    if (filters.electionType.length > 0) {
      filters.electionType.forEach(value => params.append('electionType', value));
    }
    
    // Add address filters
    if (residenceAddressFilters.length > 0) {
      residenceAddressFilters.forEach(filter => {
        const addressParts = [
          filter.residence_street_number || '',
          filter.residence_pre_direction || '',
          filter.residence_street_name || '',
          filter.residence_street_type || '',
          filter.residence_post_direction || '',
          filter.residence_apt_unit_number || '',
          filter.residence_city || '',
          filter.residence_zipcode || ''
        ];
        params.append('resident_address', addressParts.join(','));
      });
    }
    
    // Add voter events filters
    if (filters.ballotStyle.length > 0) {
      filters.ballotStyle.forEach(value => params.append('ballotStyle', value));
    }
    if (filters.eventParty.length > 0) {
      filters.eventParty.forEach(value => params.append('eventParty', value));
    }
    if (filters.voterEventMethod) {
      params.append('voterEventMethod', filters.voterEventMethod);
    }
    
    // Election date filters
    if (filters.electionYear.length > 0) {
      filters.electionYear.forEach(value => params.append('electionYear', value));
    }
    if (filters.electionDate.length > 0) {
      filters.electionDate.forEach(value => params.append('electionDate', value));
    }
    
    // Add statusReason params
    if (filters.statusReason.length > 0) {
      filters.statusReason.forEach(value => params.append('statusReason', value));
    }
    
    return params;
  }, [filters, residenceAddressFilters, pagination, sort]);
  
  // Update URL with current state
  const updateUrl = useCallback(debounce(() => {
    if (isUpdatingUrl.current) return;
    isUpdatingUrl.current = true;
    
    const params = new URLSearchParams();
    
    // Add pagination params
    params.set('page', pagination.currentPage.toString());
    params.set('pageSize', pagination.pageSize.toString());
    
    // Add sort params
    params.set('sortField', sort.field);
    params.set('sortDirection', sort.direction);
    
    // Add array filter params
    if (filters.county.length > 0) {
      filters.county.forEach(value => params.append('county', value));
    }
    
    if (filters.congressionalDistricts.length > 0) {
      filters.congressionalDistricts.forEach(value => params.append('congressionalDistricts', value));
    }
    
    if (filters.stateSenateDistricts.length > 0) {
      filters.stateSenateDistricts.forEach(value => params.append('stateSenateDistricts', value));
    }
    
    if (filters.stateHouseDistricts.length > 0) {
      filters.stateHouseDistricts.forEach(value => params.append('stateHouseDistricts', value));
    }
    
    if (filters.status.length > 0) {
      filters.status.forEach(value => params.append('status', value));
    }
    
    if (filters.party.length > 0) {
      filters.party.forEach(value => params.append('party', value));
    }
    
    if (filters.age.length > 0) {
      filters.age.forEach(value => params.append('ageRange', value));
    }
    
    if (filters.gender.length > 0) {
      filters.gender.forEach(value => params.append('gender', value));
    }
    
    if (filters.race.length > 0) {
      filters.race.forEach(value => params.append('race', value));
    }
    
    // Add voter events to URL
    if (filters.ballotStyle.length > 0) {
      filters.ballotStyle.forEach(value => params.append('ballotStyle', value));
    }
    if (filters.eventParty.length > 0) {
      filters.eventParty.forEach(value => params.append('eventParty', value));
    }
    if (filters.voterEventMethod) {
      params.append('voterEventMethod', filters.voterEventMethod);
    }
    
    // Add redistricting affected types filter to URL
    if (filters.redistrictingAffectedTypes.length > 0) {
      filters.redistrictingAffectedTypes.forEach(value => params.append('redistrictingAffectedTypes', value));
    }
    
    // Add name filters
    if (filters.firstName) params.set('firstName', filters.firstName);
    if (filters.lastName)  params.set('lastName',  filters.lastName);
    
    if (filters.neverVoted) params.set('neverVoted', 'true');
    if (filters.notVotedSinceYear) params.set('notVotedSinceYear', filters.notVotedSinceYear);
    
    // Add election type filter
    if (filters.electionType.length > 0) {
      filters.electionType.forEach(value => params.append('electionType', value));
    }
    
    // Add composite address filters
    residenceAddressFilters.forEach(filter => {
      const addressParts = [
        filter.residence_street_number || '',
        filter.residence_pre_direction || '',
        filter.residence_street_name || '',
        filter.residence_street_type || '',
        filter.residence_post_direction || '',
        filter.residence_apt_unit_number || '',
        filter.residence_city || '',
        filter.residence_zipcode || ''
      ];
      params.append('resident_address', addressParts.join(','));
    });
    
    // Add election date filters to URL
    if (filters.electionYear.length > 0) {
      filters.electionYear.forEach(value => params.append('electionYear', value));
    }
    if (filters.electionDate.length > 0) {
      filters.electionDate.forEach(value => params.append('electionDate', value));
    }
    
    // Add statusReason to URL
    if (filters.statusReason.length > 0) {
      filters.statusReason.forEach(value => params.append('statusReason', value));
    }
    
    // Get current URL params
    const currentParams = new URLSearchParams(searchParams.toString());
    const newParamsString = params.toString();
    const currentParamsString = currentParams.toString();
    
    // Only update URL if params actually changed
    if (newParamsString !== currentParamsString) {
      debugger
      router.replace(`${pathname}?${newParamsString}`, { scroll: false });
    }
    
    setTimeout(() => {
      isUpdatingUrl.current = false;
    }, 100);
  }, 300), [filters, residenceAddressFilters, pagination, sort, router, pathname, searchParams]);
  
  // Fetch voters from API with debounce
  const fetchVotersDebounced = useCallback(debounce(async () => {
    if (!isMountedRef.current) return;
    if (isRequestInProgress.current) return;
    
    const params = buildQueryParams();
    const paramsString = params.toString();
    
    // Skip if same request is in progress or params haven't changed
    if (paramsString === requestParams.current) return;
    
    isRequestInProgress.current = true;
    requestParams.current = paramsString;
    setIsLoading(true);
    
    try {
      console.log('Fetching voters with params:', paramsString);
      const response = await fetch(`/api/ga/voter/list?${paramsString}`);
      
      if (!isMountedRef.current) return;
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!isMountedRef.current) return;
      
      // Update voters and pagination state
      setVoters(data.voters || []);
      setPagination(prev => ({
        ...prev,
        totalItems: data.pagination?.totalItems || 0
      }));
      
      console.log(`Fetched ${data.voters?.length || 0} voters out of ${data.pagination?.totalItems || 0} total`);
    } catch (error) {
      console.error('Error fetching voters:', error);
      if (isMountedRef.current) {
        setVoters([]);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
      setTimeout(() => {
        isRequestInProgress.current = false;
      }, 300); // Add a small delay before allowing new requests
    }
  }, 300), [buildQueryParams]);
  
  // Trigger URL update when state changes
  useEffect(() => {
    updateUrl();
  }, [filters, residenceAddressFilters, pagination, sort, updateUrl]);
  
  // Trigger data fetch on mount and when state changes
  useEffect(() => {
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      
      // If URL has params, fetch on mount
      const hasParams = searchParams.toString().length > 0;
      if (hasParams) {
        fetchVotersDebounced();
      }
    } else {
      fetchVotersDebounced();
    }
  }, [filters, residenceAddressFilters, pagination.currentPage, pagination.pageSize, sort.field, sort.direction, fetchVotersDebounced, searchParams]);
  
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
  
  // Check if any filters are active
  const hasActiveFilters = () => {
    // Arrays like counties, age ranges, etc.
    const hasActiveArrayFilters = Object.values(filters).some(
      value => Array.isArray(value) && value.length > 0
    );

    // Primitive (string) filters: firstName / lastName
    const hasActiveNameFilters =
      (filters.firstName && filters.firstName.trim().length > 0) ||
      (filters.lastName && filters.lastName.trim().length > 0);

    const hasNeverVoted = filters.neverVoted;
    const hasNotVotedYear = !!(filters.notVotedSinceYear && filters.notVotedSinceYear.trim().length > 0);

    // Composite address filters
    const hasActiveAddressFilters = residenceAddressFilters.length > 0;

    // Voter Events: Ballot Cast selection
    const hasVoterEventMethod = !!(filters.voterEventMethod && filters.voterEventMethod.trim().length > 0);

    return (
      hasActiveArrayFilters ||
      hasActiveNameFilters ||
      hasNeverVoted ||
      hasNotVotedYear ||
      hasActiveAddressFilters ||
      hasVoterEventMethod
    );
  };
  
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
    buildQueryParams
  };
} 