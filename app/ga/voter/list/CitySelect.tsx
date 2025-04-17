"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { AddressFilter } from './ResidenceAddressFilter'; // Import the filter type

// Debounce hook
function useDebounce(value: any, delay: number): any {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Only re-call effect if value or delay changes
  return debouncedValue;
}

// Helper to build query params from a single AddressFilter object
function buildCityQueryParams(filterData: AddressFilter): URLSearchParams {
  const params = new URLSearchParams();
  Object.entries(filterData).forEach(([key, value]) => {
    // Include all keys from the current filter except 'id' and 'residence_city'
    if (key !== 'id' && key !== 'residence_city' && value && typeof value === 'string') {
      params.set(key, value);
    }
  });
  params.set('field', 'residence_city'); // Explicitly ask for the city field
  return params;
}

interface CitySelectProps {
  label: string;
  value: string;
  currentFilterData: AddressFilter; // Pass the data for the specific filter this select belongs to
  onChange: (value: string) => void;
  disableAutoSelect?: boolean;
}

export const CitySelect: React.FC<CitySelectProps> = ({
  label,
  value,
  currentFilterData,
  onChange,
  disableAutoSelect = false,
}) => {
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const selectRef = useRef<HTMLSelectElement | null>(null);

  // Debounce the *entire* filter data object relevant for fetching cities
  const debouncedFilterData = useDebounce(currentFilterData, 300);

  // Fetch city options when debounced filter data changes
  useEffect(() => {
    const fetchCityOptions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Build query params using only the fields from the *current* debounced filter data
        const params = buildCityQueryParams(debouncedFilterData);

        const res = await fetch(`/ga/api/voter-address/fields?${params.toString()}`);
        if (!res.ok) throw new Error('API error fetching city options');
        const data = await res.json();
        // Sort cities alphabetically
        const sortedCities = (data.values || []).sort((a: string, b: string) => a.localeCompare(b));
        setCityOptions(sortedCities);
      } catch (e) {
        console.error("CitySelect Fetch Error:", e);
        setError('Failed to load cities');
        setCityOptions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCityOptions();
  }, [debouncedFilterData]); // Depend only on the debounced filter data

  // Auto-select logic (optional)
  useEffect(() => {
    if (disableAutoSelect || isLoading || error) return;
    // If only one city option is available and it's not the current value
    if (cityOptions.length === 1 && value !== cityOptions[0]) {
       // onChange(cityOptions[0]); // Auto-select the only option
    }
  }, [cityOptions, value, disableAutoSelect, isLoading, error, onChange]);

  return (
    <div>
      <label className="text-sm font-medium block mb-1" htmlFor={`city-select-${currentFilterData.id}`}>{label}</label>
      <select
        id={`city-select-${currentFilterData.id}`}
        ref={selectRef}
        value={value || ''} // Controlled component
        onChange={e => onChange(e.target.value)}
        disabled={isLoading}
        className={`w-full p-2 border rounded bg-[hsl(var(--input))] text-[hsl(var(--foreground))] border-[hsl(var(--border))] disabled:opacity-50 ${cityOptions.length === 1 ? 'border-primary' : ''}`}
        aria-label={label}
      >
        <option value="">{isLoading ? 'Loading...' : `Select ${label}`}</option>
        {error && <option value="" disabled>{error}</option>}
        {!isLoading && !error && cityOptions.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      {/* Optional: display loading/error state subtly if needed */}
      {/* {isLoading && <div className="text-xs text-muted-foreground">Loading cities...</div>} */}
      {/* {error && <div className="text-xs text-red-500">{error}</div>} */}
    </div>
  );
}; 