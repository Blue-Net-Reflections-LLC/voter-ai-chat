"use client";

import React, { useCallback } from 'react';
import AsyncSelect from 'react-select/async';
import type { GroupBase, OptionsOrGroups } from 'react-select';
import type { VoterFilters } from './useVoterFilters'; // Assuming this type exists

interface ReactSelectAutocompleteProps {
  label: string;
  fieldKey: keyof VoterFilters;
  value: string | null; // react-select prefers null for empty value
  filters: Omit<VoterFilters, keyof ReactSelectAutocompleteProps['fieldKey']>;
  setFilter: (key: keyof VoterFilters, value: string) => void;
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
    setFilter(fieldKey, selectedOption ? selectedOption.value : ''); // Update parent state, use empty string if cleared
  };

  // Determine the current selected option object for react-select
  const selectedValue = value ? { value: value, label: value } : null;

  return (
    <div>
      <label className="text-sm font-medium block mb-1" id={`${String(fieldKey)}-label`}>
        {label}
      </label>
      <AsyncSelect
        aria-labelledby={`${String(fieldKey)}-label`}
        inputId={String(fieldKey)} // id for the internal input
        cacheOptions // Cache results for the same search term
        defaultOptions // Load default options on mount (can be true or an array)
        loadOptions={loadOptions} // The function to fetch options
        value={selectedValue} // Controlled component value
        onChange={handleChange} // Handler for when an option is selected
        isClearable // Allow clearing the selection
        placeholder={`Search ${label}...`}
        // Basic styling (can be extensively customized)
        styles={{
          control: (base) => ({ ...base, backgroundColor: 'hsl(var(--input))' }),
          input: (base) => ({ ...base, color: 'hsl(var(--foreground))'}),
          menu: (base) => ({ ...base, backgroundColor: 'hsl(var(--popover))' }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isFocused ? 'hsl(var(--accent))' : 'hsl(var(--popover))',
            color: 'hsl(var(--popover-foreground))',
            cursor: 'pointer',
          }),
          singleValue: (base) => ({ ...base, color: 'hsl(var(--foreground))' }),
          // Add more styles as needed
        }}
        // Ensure class names match Tailwind/Shadcn conventions if possible
        classNamePrefix="react-select"
      />
    </div>
  );
}; 