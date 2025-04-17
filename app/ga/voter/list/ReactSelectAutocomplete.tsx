"use client";

import React, { useState, useEffect, useRef } from 'react';
import AsyncSelect from 'react-select/async';
import { useAddressData, SelectOption } from './AddressDataProvider';
import type { AddressFilter } from './ResidenceAddressFilter';

// Custom debounce function 
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

export interface ReactSelectAutocompleteProps {
  label: string;
  fieldKey: keyof Omit<AddressFilter, 'id'>;
  compact?: boolean;
  hideLabel?: boolean;
}

export const ReactSelectAutocomplete: React.FC<ReactSelectAutocompleteProps> = ({
  label,
  fieldKey,
  compact = false,
  hideLabel = false,
}) => {
  const { currentFilter, updateField, options, isLoading } = useAddressData();
  const [menuIsOpen, setMenuIsOpen] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>('');
  const debouncedInputValue = useDebounce(inputValue, 500); // 500ms delay
  
  // Get current value for this field
  const value = currentFilter[fieldKey] ? 
    { value: currentFilter[fieldKey] as string, label: currentFilter[fieldKey] as string } : 
    null;
  
  // Get options for this field
  const fieldOptions = options[fieldKey] || [];
  
  // Handle selection
  const handleChange = (selectedOption: SelectOption | null) => {
    updateField(fieldKey, selectedOption ? selectedOption.value : '');
  };
  
  // Handle input change - just update local state without immediately triggering API calls
  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    return newValue;
  };
  
  // Effect to update the filter after debounce period
  useEffect(() => {
    // Only update if the input value has content and is different from the current filter
    if (debouncedInputValue !== '' && debouncedInputValue !== currentFilter[fieldKey]) {
      updateField(fieldKey, debouncedInputValue);
    }
  }, [debouncedInputValue, fieldKey, updateField, currentFilter]);
  
  // This just loads options from the context, filtered by the current input
  const loadOptions = (
    inputValue: string,
    callback: (options: SelectOption[]) => void
  ) => {
    // Filter options by input value for better UX
    const filtered = fieldOptions.filter(option => 
      !inputValue || option.label.toLowerCase().includes(inputValue.toLowerCase())
    );
    callback(filtered);
  };
  
  return (
    <div className={compact ? "mb-0" : "mb-1"}>
      {!hideLabel && (
        <label htmlFor={`async-select-${String(fieldKey)}`} className="text-xs font-medium block mb-1">
          {label}
        </label>
      )}
      <AsyncSelect
        inputId={`async-select-${String(fieldKey)}`}
        aria-label={label}
        cacheOptions={true}
        defaultOptions={fieldOptions}
        loadOptions={loadOptions}
        value={value}
        onChange={handleChange}
        onInputChange={handleInputChange}
        inputValue={inputValue}
        isLoading={isLoading}
        menuIsOpen={menuIsOpen}
        onMenuOpen={() => setMenuIsOpen(true)}
        onMenuClose={() => setMenuIsOpen(false)}
        noOptionsMessage={() => fieldOptions.length === 0 ? "No options available" : null}
        isClearable
        placeholder={isLoading ? 'Loading...' : `Search ${label}...`}
        styles={{
          control: (base) => ({
            ...base,
            backgroundColor: 'hsl(var(--input))',
            minHeight: compact ? '32px' : undefined,
            height: compact ? '32px' : undefined,
            fontSize: compact ? '0.85rem' : undefined,
          }),
          input: (base) => ({
            ...base,
            color: 'hsl(var(--foreground))',
            fontSize: compact ? '0.85rem' : undefined,
          }),
          valueContainer: (base) => ({
            ...base,
            padding: compact ? '0 6px' : undefined,
            height: compact ? '32px' : undefined,
          }),
          indicatorsContainer: (base) => ({
            ...base,
            height: compact ? '32px' : undefined,
          }),
          menu: (base) => ({
            ...base,
            backgroundColor: 'hsl(var(--popover))',
            fontSize: compact ? '0.85rem' : undefined,
          }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isFocused ? 'hsl(var(--accent))' : 'hsl(var(--popover))',
            color: 'hsl(var(--popover-foreground))',
            cursor: 'pointer',
            fontSize: compact ? '0.85rem' : undefined,
            padding: compact ? '6px 8px' : undefined,
          }),
          singleValue: (base) => ({
            ...base,
            color: 'hsl(var(--foreground))',
            fontSize: compact ? '0.85rem' : undefined,
          }),
        }}
        classNamePrefix="react-select"
      />
    </div>
  );
}; 