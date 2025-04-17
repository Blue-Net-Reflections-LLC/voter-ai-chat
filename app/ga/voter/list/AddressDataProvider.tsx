"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { AddressFilter } from './ResidenceAddressFilter';

// For react-select components
export interface SelectOption {
  value: string;
  label: string;
}

// Interface for records returned from the API
export interface AddressRecord {
  residence_street_number: string | null;
  residence_pre_direction: string | null;
  residence_street_name: string | null;
  residence_street_type: string | null;
  residence_post_direction: string | null;
  residence_apt_unit_number: string | null;
  residence_zipcode: string | null;
  residence_city: string | null;
  [key: string]: string | null;
}

// List of all address fields we care about
export const ADDRESS_FIELDS = [
  'residence_street_number',
  'residence_pre_direction',
  'residence_street_name',
  'residence_street_type',
  'residence_post_direction',
  'residence_apt_unit_number',
  'residence_zipcode',
  'residence_city',
];

// Custom debounce function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

interface AddressDataContextType {
  // Current filter being edited (confirmed selections)
  currentFilter: Partial<AddressFilter>;
  // Update a single field in the confirmed filter
  updateField: (key: keyof Omit<AddressFilter, 'id'>, value: string) => void;
  // Current search field and query (for typing in a field before selection)
  searchField: keyof Omit<AddressFilter, 'id'> | null;
  searchQuery: string;
  // Set current search field and query
  setSearch: (field: keyof Omit<AddressFilter, 'id'> | null, query: string) => void;
  // Clear all fields
  clearAllFields: () => void;
  // Raw records returned from API
  records: AddressRecord[];
  // Options derived from records for each field
  options: Record<string, SelectOption[]>;
  // Loading state
  isLoading: boolean;
  // Last updated timestamp (for forcing re-renders)
  lastUpdated: number;
}

const AddressDataContext = createContext<AddressDataContextType | null>(null);

export const useAddressData = () => {
  const context = useContext(AddressDataContext);
  if (!context) throw new Error("useAddressData must be used within AddressDataProvider");
  return context;
};

export const AddressDataProvider: React.FC<{
  children: React.ReactNode;
  initialFilter?: Partial<AddressFilter>;
}> = ({ children, initialFilter = {} }) => {
  // Confirmed filter selections
  const [currentFilter, setCurrentFilter] = useState<Partial<AddressFilter>>(initialFilter);
  
  // Current search (typing before selection)
  const [searchField, setSearchField] = useState<keyof Omit<AddressFilter, 'id'> | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Data state
  const [records, setRecords] = useState<AddressRecord[]>([]);
  const [options, setOptions] = useState<Record<string, SelectOption[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const hasUserInteracted = useRef(false);
  
  // Single API call function - this is the ONLY function that calls the API
  const fetchRecords = useCallback(async (
    filterData: Partial<AddressFilter>, 
    activeSearchField: keyof Omit<AddressFilter, 'id'> | null = null,
    activeSearchQuery: string = ''
  ) => {
    // Skip if we have no filters and no search
    if (Object.values(filterData).every(v => !v) && !activeSearchQuery) {
      setRecords([]);
      setOptions({});
      return;
    }
    
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      
      // Add confirmed filter parameters
      Object.entries(filterData).forEach(([key, value]) => {
        if (value && key !== 'id') params.set(key, value);
      });
      
      // Add search parameter if present
      if (activeSearchField && activeSearchQuery) {
        params.set(activeSearchField as string, activeSearchQuery);
      }
      
      console.log("[AddressDataProvider] Fetching records with params:", params.toString());
      const response = await fetch(`/ga/api/voter-address/records?${params.toString()}`);
      
      if (!response.ok) throw new Error("API error");
      
      const data = await response.json();
      const fetchedRecords = data.records || [];
      setRecords(fetchedRecords);
      console.log(`[AddressDataProvider] Received ${fetchedRecords.length} records`);
      
      // Derive options for each field
      const newOptions: Record<string, SelectOption[]> = {};
      ADDRESS_FIELDS.forEach(field => {
        const uniqueValues = new Set<string>();
        fetchedRecords.forEach((record: AddressRecord) => {
          if (record[field]) uniqueValues.add(String(record[field]));
        });
        
        newOptions[field] = Array.from(uniqueValues)
          .sort((a, b) => a.localeCompare(b))
          .map(val => ({ value: val, label: val }));
          
        console.log(`[AddressDataProvider] Field ${field} has ${newOptions[field].length} options`);
      });
      
      setOptions(newOptions);
      
      // Auto-fill remaining fields if we get exactly one record
      if (fetchedRecords.length === 1) {
        const singleRecord = fetchedRecords[0];
        
        // Check if this is a complete match (has data for most fields)
        const hasEnoughFields = ADDRESS_FIELDS.filter(field => 
          singleRecord[field] && String(singleRecord[field]).trim() !== ''
        ).length >= 3; // Require at least 3 non-empty fields
        
        if (hasEnoughFields) {
          console.log('[AddressDataProvider] Found a single complete match - auto-filling fields');
          
          // Create a new filter with all available fields from the record
          const newFilter = { ...currentFilter };
          let changedFields = [];
          
          ADDRESS_FIELDS.forEach(field => {
            // Only update fields that:
            // 1. Have a value in the record
            // 2. Are not already set in the filter (or are different)
            if (singleRecord[field] && 
                (!newFilter[field] || newFilter[field] !== String(singleRecord[field]))) {
              newFilter[field] = String(singleRecord[field]);
              changedFields.push(field);
            }
          });
          
          if (changedFields.length > 0) {
            console.log(`[AddressDataProvider] Auto-filled fields: ${changedFields.join(', ')}`);
            setCurrentFilter(newFilter);
          }
        }
      }
      
      // Update timestamp to force re-renders if needed
      setLastUpdated(Date.now());
    } catch (error) {
      console.error("[AddressDataProvider] Error fetching address records:", error);
      setRecords([]);
      setOptions({});
    } finally {
      setIsLoading(false);
    }
  }, [currentFilter]);
  
  // Create stable debounced version
  const debouncedFetchRecords = useCallback(
    debounce((
      filterData: Partial<AddressFilter>, 
      activeSearchField: keyof Omit<AddressFilter, 'id'> | null,
      activeSearchQuery: string
    ) => {
      fetchRecords(filterData, activeSearchField, activeSearchQuery);
    }, 300),
    [fetchRecords]
  );
  
  // Set current search field and query
  const setSearch = useCallback((
    field: keyof Omit<AddressFilter, 'id'> | null, 
    query: string
  ) => {
    hasUserInteracted.current = true;
    setSearchField(field);
    setSearchQuery(query);
  }, []);
  
  // Handle confirmed field selection
  const updateField = useCallback((key: keyof Omit<AddressFilter, 'id'>, value: string) => {
    // Mark that user has interacted with the form
    hasUserInteracted.current = true;
    
    setCurrentFilter(prev => {
      // Don't update if value hasn't changed
      if (prev[key] === value) return prev;
      
      const newFilter = { ...prev, [key]: value };
      console.log(`[AddressDataProvider] Updated confirmed filter ${String(key)} to "${value}"`);
      return newFilter;
    });
    
    // Clear current search when a field is confirmed
    setSearchField(null);
    setSearchQuery('');
  }, []);
  
  // Clear all fields
  const clearAllFields = useCallback(() => {
    console.log("[AddressDataProvider] Clearing all fields and canceling pending requests");
    // Reset all state
    setCurrentFilter({});
    setSearchField(null);
    setSearchQuery('');
    setRecords([]);
    setOptions({});
    setIsLoading(false);
    hasUserInteracted.current = false;
    
    // Force a lastUpdated change to trigger re-renders
    setLastUpdated(Date.now());
  }, []);
  
  // Trigger API call when filter changes OR when search changes
  useEffect(() => {
    if (!hasUserInteracted.current) {
      console.log("[AddressDataProvider] Skipping initial API call - waiting for user interaction");
      return;
    }
    
    console.log("[AddressDataProvider] Filter or search changed, triggering debounced fetch");
    console.log("[AddressDataProvider] Current filter:", currentFilter);
    console.log("[AddressDataProvider] Search field:", searchField, "Search query:", searchQuery);
    
    debouncedFetchRecords(currentFilter, searchField, searchQuery);
  }, [currentFilter, searchField, searchQuery, debouncedFetchRecords]);
  
  const value = {
    currentFilter,
    updateField,
    searchField,
    searchQuery,
    setSearch,
    clearAllFields,
    records,
    options,
    isLoading,
    lastUpdated
  };
  
  return (
    <AddressDataContext.Provider value={value}>
      {children}
    </AddressDataContext.Provider>
  );
}; 