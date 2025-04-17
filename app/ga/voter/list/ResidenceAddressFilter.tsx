"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import type { VoterFilters } from './useVoterFilters';
import { ReactSelectAutocomplete } from './ReactSelectAutocomplete'; // Import the react-select wrapper

// Address fields configuration
const ADDRESS_FIELDS: { key: keyof VoterFilters; label: string; type: 'autocomplete' | 'select' }[] = [
  { key: 'residence_street_number', label: 'Street Number', type: 'autocomplete' },
  { key: 'residence_pre_direction', label: 'Pre Direction', type: 'autocomplete' },
  { key: 'residence_street_name', label: 'Street Name', type: 'autocomplete' },
  { key: 'residence_street_type', label: 'Street Type', type: 'autocomplete' },
  { key: 'residence_post_direction', label: 'Post Direction', type: 'autocomplete' },
  { key: 'residence_apt_unit_number', label: 'Apt/Unit Number', type: 'autocomplete' },
  { key: 'residence_zipcode', label: 'Zipcode', type: 'autocomplete' },
  { key: 'residence_city', label: 'City', type: 'select' },
];

// Props for the ResidenceAddressFilter
interface ResidenceAddressFilterProps {
  filters: VoterFilters;
  setFilter: (key: keyof VoterFilters, value: string) => void;
  disableAutoSelect?: boolean;
}

// Debounce hook (needed for city fetch)
function useDebounce(value: any, delay: number): any {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delay]);
  return debouncedValue;
}

// Helper to build query params (needed for city fetch)
function buildQueryParams(filters: VoterFilters, excludeKey?: keyof VoterFilters): URLSearchParams {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (
        key.startsWith('residence_') &&
        key !== excludeKey &&
        value &&
        typeof value === 'string'
       ) {
      params.set(key, value);
    }
  });
  return params;
}

/**
 * ResidenceAddressFilter using React Select
 * Uses ReactSelectAutocomplete for type-ahead fields and standard select for City.
 */
export const ResidenceAddressFilter: React.FC<ResidenceAddressFilterProps> = ({ filters, setFilter, disableAutoSelect = false }) => {
  // State and fetching logic *only* for the City select
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [isCityLoading, setIsCityLoading] = useState<boolean>(false);
  const [cityError, setCityError] = useState<string | null>(null);
  const citySelectRef = useRef<HTMLSelectElement | null>(null);
  const debouncedAddressFilters = useDebounce(filters, 300);

  useEffect(() => {
    const fetchCityOptions = async () => {
      setIsCityLoading(true);
      setCityError(null);
      try {
        const params = buildQueryParams(debouncedAddressFilters, 'residence_city');
        params.set('field', 'residence_city');
        const res = await fetch(`/ga/api/voter-address/fields?${params.toString()}`);
        if (!res.ok) throw new Error('API error fetching city options');
        const data = await res.json();
        setCityOptions(data.values || []);
      } catch (e) {
        setCityError('Failed to load city options');
        setCityOptions([]);
      } finally {
        setIsCityLoading(false);
      }
    };
    fetchCityOptions();
  }, [debouncedAddressFilters]);

  // Auto-select logic for City (optional)
  useEffect(() => {
    if (disableAutoSelect || isCityLoading || cityError) return;
    if (cityOptions.length === 1 && filters.residence_city !== cityOptions[0]) {
      // setFilter('residence_city', cityOptions[0]); // Optionally auto-select
    }
  }, [cityOptions, filters.residence_city, disableAutoSelect, isCityLoading, cityError, setFilter]);

  // Handler to manage dependent clearing
  const handleFilterChange = useCallback((key: keyof VoterFilters, value: string) => {
    const currentIndex = ADDRESS_FIELDS.findIndex(f => f.key === key);
    let needsUpdate = false;
    const updatedFilters = { ...filters, [key]: value };

    // Clear dependent fields
    ADDRESS_FIELDS.slice(currentIndex + 1).forEach(({ key: depKey }) => {
      if (updatedFilters[depKey]) {
        updatedFilters[depKey] = '';
        needsUpdate = true;
      }
    });
    
    // Apply the primary change
    setFilter(key, value);
    
    // Apply dependent changes if any occurred
    if (needsUpdate) {
       ADDRESS_FIELDS.slice(currentIndex + 1).forEach(({ key: depKey }) => {
         if (filters[depKey] !== '') { // Check if it actually had a value before
            setFilter(depKey, '');
         }
       });
    }
  }, [filters, setFilter]);

  return (
    <div className="space-y-2">
      {ADDRESS_FIELDS.map(({ key, label, type }) => (
        <div key={key}>
          {type === 'autocomplete' ? (
            <ReactSelectAutocomplete
              label={label}
              fieldKey={key}
              value={filters[key] || null} // Pass null for empty
              filters={filters} // Pass all other filters
              setFilter={handleFilterChange} // Use the wrapper handler
            />
          ) : (
            // Render the standard select for City
            <div>
              <label className="text-sm font-medium" htmlFor={String(key)}>{label}</label>
              <select
                id={String(key)}
                ref={citySelectRef}
                value={filters[key] || ''}
                onChange={e => handleFilterChange(key, e.target.value)} // Use wrapper handler
                disabled={isCityLoading}
                className={`w-full bg-muted p-2 border rounded ${cityOptions.length === 1 ? 'border-primary' : 'border-input'}`} // Basic styling
                aria-label={label}
              >
                <option value="">Select {label}</option>
                {cityOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              {isCityLoading && <div className="text-xs text-muted-foreground">Loading cities...</div>}
              {cityError && <div className="text-xs text-red-500">{cityError}</div>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}; 