"use client";
import React, { createContext, useContext, useState } from 'react';
import { FilterState, ResidenceAddressFilterState } from './list/types';

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
}

const VoterFilterContext = createContext<VoterFilterContextType | undefined>(undefined);

export const VoterFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [residenceAddressFilters, setResidenceAddressFilters] = useState<ResidenceAddressFilterState[]>([]);

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
        clearAllFilters
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