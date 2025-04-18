"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { FilterState, ResidenceAddressFilterState, PaginationState, Voter } from '../types';

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
  electionType: []
};

// Initial address filter state
const initialAddressFilterState: ResidenceAddressFilterState = {
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
  
  // State
  const [filters, setFilters] = useState<FilterState>(() => {
    // Initialize from URL if available
    const filterState = { ...initialFilterState };
    
    // Handle array filter params
    const countyParams = searchParams.getAll('county');
    if (countyParams.length > 0) filterState.county = countyParams;
    
    const congressionalParams = searchParams.getAll('congressionalDistricts');
    if (congressionalParams.length > 0) filterState.congressionalDistricts = congressionalParams;
    
    const senateParams = searchParams.getAll('stateSenateDistricts');
    if (senateParams.length > 0) filterState.stateSenateDistricts = senateParams;
    
    const houseParams = searchParams.getAll('stateHouseDistricts');
    if (houseParams.length > 0) filterState.stateHouseDistricts = houseParams;
    
    const statusParams = searchParams.getAll('status');
    if (statusParams.length > 0) filterState.status = statusParams;
    
    const partyParams = searchParams.getAll('party');
    if (partyParams.length > 0) filterState.party = partyParams;
    
    const ageParams = searchParams.getAll('ageRange');
    if (ageParams.length > 0) filterState.age = ageParams;
    
    const genderParams = searchParams.getAll('gender');
    if (genderParams.length > 0) filterState.gender = genderParams;
    
    const raceParams = searchParams.getAll('race');
    if (raceParams.length > 0) filterState.race = raceParams;
    
    return filterState;
  });
  
  const [residenceAddressFilters, setResidenceAddressFilters] = useState<ResidenceAddressFilterState>(() => {
    // Initialize from URL if available
    const addressFilterState = { ...initialAddressFilterState };
    
    ADDRESS_FIELDS.forEach(field => {
      const value = searchParams.get(field);
      if (value) addressFilterState[field] = value;
    });
    
    return addressFilterState;
  });
  
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
    
    // Add county filter
    if (filters.county.length > 0) {
      params.set('county', filters.county[0]); // API only supports one county at a time
    }
    
    // Add congressional districts
    if (filters.congressionalDistricts.length > 0) {
      filters.congressionalDistricts.forEach(district => 
        params.append('congressionalDistricts', district)
      );
    }
    
    // Add state senate districts
    if (filters.stateSenateDistricts.length > 0) {
      filters.stateSenateDistricts.forEach(district => 
        params.append('stateSenateDistricts', district)
      );
    }
    
    // Add state house districts
    if (filters.stateHouseDistricts.length > 0) {
      filters.stateHouseDistricts.forEach(district => 
        params.append('stateHouseDistricts', district)
      );
    }
    
    // Add status filter
    if (filters.status.length > 0) {
      filters.status.forEach(status => 
        params.append('status', status)
      );
    }
    
    // Add party filter
    if (filters.party.length > 0) {
      filters.party.forEach(partyValue => 
        params.append('party', partyValue)
      );
    }
    
    // Add age filter
    if (filters.age.length > 0) {
      filters.age.forEach(value => params.append('ageRange', value));
    }
    
    // Add gender filter
    if (filters.gender.length > 0) {
      filters.gender.forEach(value => params.append('gender', value));
    }
    
    // Add race filter
    if (filters.race.length > 0) {
      filters.race.forEach(value => params.append('race', value));
    }
    
    // Add address filters
    if (residenceAddressFilters.residence_street_number) {
      params.set('residenceStreetNumber', residenceAddressFilters.residence_street_number);
    }
    
    if (residenceAddressFilters.residence_pre_direction) {
      params.set('residencePreDirection', residenceAddressFilters.residence_pre_direction);
    }
    
    if (residenceAddressFilters.residence_street_name) {
      params.set('residenceStreetName', residenceAddressFilters.residence_street_name);
    }
    
    if (residenceAddressFilters.residence_street_type) {
      params.set('residenceStreetSuffix', residenceAddressFilters.residence_street_type);
    }
    
    if (residenceAddressFilters.residence_post_direction) {
      params.set('residencePostDirection', residenceAddressFilters.residence_post_direction);
    }
    
    if (residenceAddressFilters.residence_zipcode) {
      params.set('residenceZipcode', residenceAddressFilters.residence_zipcode);
    }
    
    if (residenceAddressFilters.residence_city) {
      params.set('residenceCity', residenceAddressFilters.residence_city);
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
    
    // Add address filter params
    ADDRESS_FIELDS.forEach(field => {
      const value = residenceAddressFilters[field];
      if (value) params.set(field, value);
    });
    
    // Get current URL params
    const currentParams = new URLSearchParams(searchParams.toString());
    const newParamsString = params.toString();
    const currentParamsString = currentParams.toString();
    
    // Only update URL if params actually changed
    if (newParamsString !== currentParamsString) {
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
  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    // Reset to first page when filters change
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };
  
  const updateResidenceAddressFilter = (key: keyof ResidenceAddressFilterState, value: string) => {
    setResidenceAddressFilters(prev => ({ ...prev, [key]: value }));
    // Reset to first page when filters change
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };
  
  const clearAllFilters = () => {
    setFilters(initialFilterState);
    setResidenceAddressFilters(initialAddressFilterState);
    // Reset to first page when filters are cleared
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };
  
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
    const hasActiveArrayFilters = Object.values(filters).some(
      filter => Array.isArray(filter) && filter.length > 0
    );
    
    const hasActiveAddressFilters = Object.values(residenceAddressFilters).some(
      value => !!value
    );
    
    return hasActiveArrayFilters || hasActiveAddressFilters;
  };
  
  return {
    // State
    filters,
    residenceAddressFilters,
    pagination,
    sort,
    voters,
    isLoading,
    
    // Actions
    updateFilter,
    updateResidenceAddressFilter,
    clearAllFilters,
    updatePage,
    updatePageSize,
    updateSort,
    
    // Helpers
    hasActiveFilters: hasActiveFilters()
  };
} 