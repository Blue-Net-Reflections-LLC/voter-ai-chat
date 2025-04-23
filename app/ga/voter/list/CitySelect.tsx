"use client";

import React, { useRef } from 'react';
import { useAddressData } from './AddressDataProvider';
import type { AddressFilter } from './ResidenceAddressFilter';

interface CitySelectProps {
  label: string;
  hideLabel?: boolean;
}

export const CitySelect: React.FC<CitySelectProps> = ({
  label,
  hideLabel = false
}) => {
  const { currentFilter, updateField, options, isLoading } = useAddressData();
  const selectRef = useRef<HTMLSelectElement | null>(null);
  
  // Get current value
  const value = currentFilter.residence_city || '';
  
  // Get city options
  const cityOptions = options['residence_city'] || [];
  
  // Handle change
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateField('residence_city', e.target.value);
  };
  
  // Generate unique ID for accessibility
  const selectId = `city-select-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div>
      {!hideLabel && (
        <label className="text-xs font-medium block mb-1" htmlFor={selectId}>{label}</label>
      )}
      <select
        id={selectId}
        ref={selectRef}
        value={value}
        onChange={handleChange}
        disabled={isLoading}
        className={`w-full py-1 px-2 h-8 border rounded text-sm bg-[hsl(var(--input))] text-[hsl(var(--foreground))] border-[hsl(var(--border))] disabled:opacity-50 ${cityOptions.length === 1 ? 'border-primary' : ''}`}
        aria-label={label}
      >
        <option value="">{isLoading ? 'Loading...' : `Select ${label}`}</option>
        {cityOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}; 