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
  // Current filter being edited
  currentFilter: Partial<AddressFilter>;
  // Update a single field in the filter
  updateField: (key: keyof Omit<AddressFilter, 'id'>, value: string) => void;
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
  const [currentFilter, setCurrentFilter] = useState<Partial<AddressFilter>>(initialFilter);
  const [records, setRecords] = useState<AddressRecord[]>([]);
  const [options, setOptions] = useState<Record<string, SelectOption[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const hasUserInteracted = useRef(false);
  
  // Single API call function - this is the ONLY function that calls the API
  const fetchRecords = useCallback(async (filterData: Partial<AddressFilter>) => {
    // Skip empty filters
    if (Object.values(filterData).every(v => !v)) {
      setRecords([]);
      setOptions({});
      return;
    }
    
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filterData).forEach(([key, value]) => {
        if (value && key !== 'id') params.set(key, value);
      });
      
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
      // Update timestamp to force re-renders if needed
      setLastUpdated(Date.now());
    } catch (error) {
      console.error("[AddressDataProvider] Error fetching address records:", error);
      setRecords([]);
      setOptions({});
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Create stable debounced version
  const debouncedFetchRecords = useCallback(
    debounce((filterData: Partial<AddressFilter>) => {
      fetchRecords(filterData);
    }, 300),
    [fetchRecords]
  );
  
  // Handle field updates
  const updateField = useCallback((key: keyof Omit<AddressFilter, 'id'>, value: string) => {
    // Mark that user has interacted with the form
    hasUserInteracted.current = true;
    
    setCurrentFilter(prev => {
      // Don't update if value hasn't changed
      if (prev[key] === value) return prev;
      
      const newFilter = { ...prev, [key]: value };
      console.log(`[AddressDataProvider] Updated field ${String(key)} to "${value}"`);
      return newFilter;
    });
  }, []);
  
  // Clear all fields
  const clearAllFields = useCallback(() => {
    console.log("[AddressDataProvider] Clearing all fields and canceling pending requests");
    // Reset all state
    setCurrentFilter({});
    setRecords([]);
    setOptions({});
    setIsLoading(false);
    hasUserInteracted.current = false;
    
    // Force a lastUpdated change to trigger re-renders
    setLastUpdated(Date.now());
  }, []);
  
  // Trigger API call when filter changes but ONLY if user has interacted
  useEffect(() => {
    if (!hasUserInteracted.current) {
      console.log("[AddressDataProvider] Skipping initial API call - waiting for user interaction");
      return;
    }
    
    console.log("[AddressDataProvider] Filter changed, triggering debounced fetch");
    debouncedFetchRecords(currentFilter);
  }, [currentFilter, debouncedFetchRecords]);
  
  const value = {
    currentFilter,
    updateField,
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