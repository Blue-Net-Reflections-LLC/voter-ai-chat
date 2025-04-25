"use client";
import React, { createContext, useContext, useState } from 'react';
import { FilterState, ResidenceAddressFilterState } from './list/types';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

// Initial filter state (copied from useVoterList)
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

const initialAddressFilterState: ResidenceAddressFilterState = {
  id: '',
  residence_street_number: '',
  residence_pre_direction: '',
  residence_street_name: '',
  residence_street_type: '',
  residence_post_direction: '',
  residence_apt_unit_number: '',
  residence_zipcode: '',
  residence_city: ''
};

interface VoterFilterContextType {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  residenceAddressFilters: ResidenceAddressFilterState[];
  setResidenceAddressFilters: React.Dispatch<React.SetStateAction<ResidenceAddressFilterState[]>>;
  updateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  updateResidenceAddressFilter: (id: string, key: keyof Omit<ResidenceAddressFilterState, 'id'>, value: string) => void;
  clearAllFilters: () => void;
  addUrlParams: (extraParams: Record<string, string | number>) => void;
  hasActiveFilters: () => boolean;
}

const VoterFilterContext = createContext<VoterFilterContextType | undefined>(undefined);

// --- Filter URL Key Constants ---
export const FILTER_TO_URL_PARAM_MAP: Record<string, string> = {
  county: 'county',
  congressionalDistricts: 'congressionalDistricts',
  stateSenateDistricts: 'stateSenateDistricts',
  stateHouseDistricts: 'stateHouseDistricts',
  status: 'status',
  party: 'party',
  historyParty: 'historyParty',
  age: 'ageRange',
  gender: 'gender',
  race: 'race',
  income: 'income',
  education: 'education',
  electionType: 'electionType',
  electionYear: 'electionYear',
  electionDate: 'electionDate',
  ballotStyle: 'ballotStyle',
  eventParty: 'eventParty',
  voterEventMethod: 'voterEventMethod',
  firstName: 'firstName',
  lastName: 'lastName',
  neverVoted: 'neverVoted',
  notVotedSinceYear: 'notVotedSinceYear',
  redistrictingAffectedTypes: 'redistrictingAffectedTypes',
  statusReason: 'statusReason',
  resident_address: 'resident_address',
};

export const FILTER_URL_KEYS = Object.values(FILTER_TO_URL_PARAM_MAP);

// Helper to build query params (filters + address filters + extra)
export function buildQueryParams(
  filters: FilterState,
  residenceAddressFilters: ResidenceAddressFilterState[],
  extraParams?: Record<string, string | number>
) {
  const params = new URLSearchParams();
  // Use the mapping for all filter keys
  Object.entries(FILTER_TO_URL_PARAM_MAP).forEach(([filterKey, urlKey]) => {
    const value = (filters as any)[filterKey];
    if (Array.isArray(value) && value.length > 0) {
      value.forEach((v: string) => params.append(urlKey, v));
    } else if (typeof value === 'string' && value) {
      params.set(urlKey, value);
    } else if (typeof value === 'boolean' && value) {
      params.set(urlKey, 'true');
    }
  });
  // Special handling for address filters
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
      params.append(FILTER_TO_URL_PARAM_MAP['resident_address'], addressParts.join(','));
    });
  }
  // Add extra params (pagination, sort, etc)
  if (extraParams) {
    Object.entries(extraParams).forEach(([key, value]) => {
      params.set(key, String(value));
    });
  }
  return params;
}

export const VoterFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [residenceAddressFilters, setResidenceAddressFilters] = useState<ResidenceAddressFilterState[]>([]);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const updateResidenceAddressFilter = (
    id: string,
    key: keyof Omit<ResidenceAddressFilterState, 'id'>,
    value: string
  ) => {
    setResidenceAddressFilters(prev =>
      prev.map(f => (f.id === id ? { ...f, [key]: value } : f))
    );
  };

  const clearAllFilters = () => {
    setFilters(initialFilterState);
    setResidenceAddressFilters([]);
    // Update URL to initial state (no filters)
    // const params = buildQueryParams(initialFilterState, []);
    // router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Update URL with filter params when filters or address filters change
  React.useEffect(() => {
    const params = buildQueryParams(filters, residenceAddressFilters);
    const currentParams = new URLSearchParams(searchParams.toString());
    // Remove all filter keys from currentParams using the constant
    FILTER_URL_KEYS.forEach(key => currentParams.delete(key));
    // Add updated filter params
    params.forEach((value, key) => currentParams.append(key, value));
    const newParamsString = currentParams.toString();
    router.replace(`${pathname}?${newParamsString}`, { scroll: false });
  }, [filters, residenceAddressFilters, router, pathname]);

  // Expose a function for other panels to add their own params
  const addUrlParams = (extraParams: Record<string, string | number>) => {
    const params = buildQueryParams(filters, residenceAddressFilters, extraParams);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Determine if any filters are active
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

  return (
    <VoterFilterContext.Provider
      value={{
        filters,
        setFilters,
        residenceAddressFilters,
        setResidenceAddressFilters,
        updateFilter,
        updateResidenceAddressFilter,
        clearAllFilters,
        addUrlParams,
        hasActiveFilters
      }}
    >
      {children}
    </VoterFilterContext.Provider>
  );
};

export function useVoterFilterContext() {
  const ctx = useContext(VoterFilterContext);
  if (!ctx) throw new Error('useVoterFilterContext must be used within a VoterFilterProvider');
  return ctx;
} 