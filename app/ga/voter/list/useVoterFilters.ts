import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Define the filter state shape
export type VoterFilters = {
  county: string[];
  congressionalDistricts: string[];
  stateSenateDistricts: string[];
  stateHouseDistricts: string[];
  residence_street_number: string;
  residence_pre_direction: string;
  residence_street_name: string;
  residence_street_type: string;
  residence_post_direction: string;
  residence_apt_unit_number: string;
  residence_zipcode: string;
  residence_city: string;
  // Add other filters as needed
  [key: string]: any;
};

// Default filter state
const defaultFilters: VoterFilters = {
  county: [],
  congressionalDistricts: [],
  stateSenateDistricts: [],
  stateHouseDistricts: [],
  residence_street_number: '',
  residence_pre_direction: '',
  residence_street_name: '',
  residence_street_type: '',
  residence_post_direction: '',
  residence_apt_unit_number: '',
  residence_zipcode: '',
  residence_city: '',
};

// Helper to parse array params from URL
function parseArrayParam(param: string | null): string[] {
  if (!param) return [];
  return param.split(',').filter(Boolean);
}

// Custom hook for voter filters
export function useVoterFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize filter state from URL
  const initialFilters = useMemo(() => {
    const filters: VoterFilters = { ...defaultFilters };
    Object.keys(defaultFilters).forEach((key) => {
      const value = searchParams.get(key);
      if (Array.isArray(defaultFilters[key])) {
        filters[key] = parseArrayParam(value);
      } else {
        filters[key] = value || '';
      }
    });
    return filters;
    // eslint-disable-next-line
  }, []);

  const [filters, setFilters] = useState<VoterFilters>(initialFilters);

  // Sync filter state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        params.set(key, value.join(','));
      } else if (typeof value === 'string' && value) {
        params.set(key, value);
      }
    });
    router.replace(`?${params.toString()}`);
    // eslint-disable-next-line
  }, [filters]);

  // Update a single filter
  const setFilter = useCallback((key: keyof VoterFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  return [filters, setFilters, setFilter] as const;
} 