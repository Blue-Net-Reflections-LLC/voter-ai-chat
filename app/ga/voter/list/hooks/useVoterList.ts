"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { FilterState, ResidenceAddressFilterState, PaginationState, Voter } from '../types';

// Mock voter data - will be replaced with actual API call
const MOCK_VOTERS: Voter[] = [
  { id: "VOT-12345", name: "Jane Doe", county: "Fulton", status: "Active" },
  { id: "VOT-67890", name: "John Doe", county: "Fulton", status: "Active" },
  { id: "VOT-54321", name: "Emily Doe", county: "Fulton", status: "Inactive" },
  { id: "VOT-98765", name: "Michael Smith", county: "DeKalb", status: "Active" },
  { id: "VOT-34567", name: "Sarah Johnson", county: "Cobb", status: "Active" },
  { id: "VOT-76543", name: "David Williams", county: "Gwinnett", status: "Inactive" },
  { id: "VOT-23456", name: "Jennifer Brown", county: "Fulton", status: "Active" },
  { id: "VOT-87654", name: "Robert Jones", county: "DeKalb", status: "Active" },
  { id: "VOT-45678", name: "Jessica Garcia", county: "Cobb", status: "Active" },
  { id: "VOT-65432", name: "Thomas Martinez", county: "Gwinnett", status: "Inactive" },
  { id: "VOT-34521", name: "Lisa Wilson", county: "Fulton", status: "Active" },
  { id: "VOT-89765", name: "James Anderson", county: "DeKalb", status: "Active" },
  { id: "VOT-56789", name: "Michelle Taylor", county: "Cobb", status: "Active" },
  { id: "VOT-54323", name: "Daniel Thomas", county: "Gwinnett", status: "Inactive" },
  { id: "VOT-12344", name: "Patricia Harris", county: "Fulton", status: "Active" }
];

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

export function useVoterList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // State initialization from URL if available
  const initStateFromURL = () => {
    // Pagination state from URL
    const pageParam = searchParams.get('page');
    const pageSizeParam = searchParams.get('pageSize');
    
    const paginationState = {
      currentPage: pageParam ? parseInt(pageParam, 10) : initialPaginationState.currentPage,
      pageSize: pageSizeParam ? parseInt(pageSizeParam, 10) : initialPaginationState.pageSize,
      totalItems: initialPaginationState.totalItems
    };
    
    // TODO: Initialize filter state from URL params
    
    return {
      paginationState
      // Add other state initialization as needed
    };
  };
  
  // State
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [residenceAddressFilters, setResidenceAddressFilters] = useState<ResidenceAddressFilterState>(initialAddressFilterState);
  const [pagination, setPagination] = useState<PaginationState>(() => initStateFromURL().paginationState);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Update URL when state changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Add pagination params
    params.set('page', pagination.currentPage.toString());
    params.set('pageSize', pagination.pageSize.toString());
    
    // TODO: Add other significant state params to URL
    
    // Update URL without refreshing the page
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pagination, router, pathname, searchParams]);
  
  // Fetch data when filters or pagination changes
  useEffect(() => {
    fetchVoters();
  }, [filters, residenceAddressFilters, pagination.currentPage, pagination.pageSize]);
  
  // Fetch voters (mock implementation)
  const fetchVoters = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Filter voters based on criteria
      let filteredData = MOCK_VOTERS;
      
      // Apply county filter
      if (filters.county.length > 0) {
        filteredData = filteredData.filter(voter => filters.county.includes(voter.county));
      }
      
      // Apply status filter
      if (filters.status.length > 0) {
        filteredData = filteredData.filter(voter => filters.status.includes(voter.status));
      }
      
      // Apply other filters...
      
      // Update total items count
      setPagination(prev => ({ ...prev, totalItems: filteredData.length }));
      
      // Apply pagination
      const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
      const paginatedData = filteredData.slice(startIndex, startIndex + pagination.pageSize);
      
      setVoters(paginatedData);
    } catch (error) {
      console.error('Error fetching voters:', error);
      setVoters([]);
    } finally {
      setIsLoading(false);
    }
  };
  
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
    voters,
    isLoading,
    
    // Actions
    updateFilter,
    updateResidenceAddressFilter,
    clearAllFilters,
    updatePage,
    updatePageSize,
    
    // Helpers
    hasActiveFilters: hasActiveFilters()
  };
} 