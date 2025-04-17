"use client";

import React, { useCallback } from 'react';
import AsyncSelect from 'react-select/async';
import type { GroupBase, OptionsOrGroups } from 'react-select';
import type { VoterFilters } from './useVoterFilters'; // Assuming this type exists
import type { AddressFilter } from './ResidenceAddressFilter'; // Import AddressFilter

export interface ReactSelectAutocompleteProps {
  label: string;
  fieldKey: keyof Omit<AddressFilter, 'id'>; // Use specific address keys
  value: string | null; // react-select prefers null for empty value
  filters: Omit<AddressFilter, 'id' | keyof ReactSelectAutocompleteProps['fieldKey']>; // Adjust filters type based on new fieldKey
  setFilter: (key: keyof Omit<AddressFilter, 'id'>, value: string) => void; // Use specific address keys
  compact?: boolean; // New prop for compact styling
  hideLabel?: boolean; // New prop to hide the label (when using external label)
}

// Define the structure of the options react-select expects
interface SelectOption {
  value: string;
  label: string;
}

export const ReactSelectAutocomplete: React.FC<ReactSelectAutocompleteProps> = ({
  label,
  fieldKey,
  value,
  filters,
  setFilter,
  compact = false,
  hideLabel = false,
}) => {

  // Function that react-select calls to load options asynchronously
  const loadOptions = useCallback(
    // The function can directly return a Promise resolving to the options
    async (inputValue: string): Promise<OptionsOrGroups<SelectOption, GroupBase<SelectOption>>> => {
      try {
        const params = new URLSearchParams();
        params.set('field', String(fieldKey));
        params.set('query', inputValue); // Send user input as query

        // Add other filters to the query
        Object.entries(filters).forEach(([key, filterValue]) => {
          // Include only address-related keys that have a value
          if (
            key.startsWith('residence_') &&
            key !== fieldKey &&
            filterValue &&
            typeof filterValue === 'string'
          ) {
            params.set(key, filterValue);
          }
          // Add logic for other filter types (arrays like county) if needed
        });

        const response = await fetch(`/ga/api/voter-address/fields?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch options');
        }
        const data = await response.json();

        // Map the results to the { value, label } format react-select expects
        const options: SelectOption[] = (data.values || []).map((val: string) => ({
          value: val,
          label: val, // Use the value itself as the label, or format if needed
        }));

        return options; // Return the options array directly
      } catch (error) {
        console.error(`Error fetching options for ${fieldKey}:`, error);
        return []; // Return empty array on error
      }
    },
    [fieldKey, filters] // Dependencies: re-create if fieldKey or other filters change
  );

  // Handle selection change
  const handleChange = (selectedOption: SelectOption | null) => {
    setFilter(fieldKey, selectedOption ? selectedOption.value : ''); 
  };

  // Determine the current selected option object for react-select
  const selectedValue = value ? { value: value, label: value } : null;

  // Generate a key based on fieldKey and filters to force remount on dependency change
  const selectKey = `${fieldKey}-${JSON.stringify(filters)}`;

  return (
    <div>
      {!hideLabel && (
        <label className={`text-xs font-medium block mb-1 ${compact ? 'leading-tight' : ''}`} id={`${String(fieldKey)}-label`}>
          {label}
        </label>
      )}
      <AsyncSelect
        key={selectKey}
        aria-labelledby={hideLabel ? undefined : `${String(fieldKey)}-label`}
        inputId={String(fieldKey)} // id for the internal input
        cacheOptions // Cache results for the same search term
        defaultOptions={true} // Load options on mount/focus
        loadOptions={loadOptions} // The function to fetch options
        value={selectedValue} // Controlled component value
        onChange={handleChange} // Handler for when an option is selected
        isClearable // Allow clearing the selection
        placeholder={compact ? '' : `Search ${label}...`}
        styles={{
          control: (base) => ({
            ...base,
            backgroundColor: 'hsl(var(--input))',
            minHeight: '32px',
            height: '32px',
            fontSize: '0.85rem',
            padding: 0,
            borderColor: 'hsl(var(--border))',
          }),
          input: (base) => ({
            ...base,
            color: 'hsl(var(--foreground))',
            fontSize: '0.85rem',
            margin: 0,
            padding: 0,
          }),
          valueContainer: (base) => ({
            ...base,
            padding: compact ? '0 6px' : '0 8px',
            height: '32px',
          }),
          indicatorsContainer: (base) => ({
            ...base,
            height: '32px',
          }),
          menu: (base) => ({
            ...base,
            backgroundColor: 'hsl(var(--popover))',
            fontSize: '0.85rem',
          }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isFocused ? 'hsl(var(--accent))' : 'hsl(var(--popover))',
            color: 'hsl(var(--popover-foreground))',
            cursor: 'pointer',
            fontSize: '0.85rem',
            padding: '6px 8px',
          }),
          singleValue: (base) => ({
            ...base,
            color: 'hsl(var(--foreground))',
            fontSize: '0.85rem',
          }),
          dropdownIndicator: (base) => ({
            ...base,
            padding: compact ? '0 4px' : '0 6px',
            width: compact ? '24px' : '30px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '& svg': {
              width: '16px',
              height: '16px'
            }
          }),
          clearIndicator: (base) => ({
            ...base,
            padding: compact ? '0 4px' : '0 6px',
            width: compact ? '24px' : '30px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '& svg': {
              width: '14px',
              height: '14px'
            }
          }),
          indicatorSeparator: (base) => ({
            ...base,
            margin: '4px 0',
          }),
        }}
        classNamePrefix="react-select"
      />
    </div>
  );
}; 