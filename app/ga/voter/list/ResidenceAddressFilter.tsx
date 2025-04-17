"use client";

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { XIcon, PlusIcon } from 'lucide-react'; // Import icons

import { ReactSelectAutocomplete, ReactSelectAutocompleteProps } from './ReactSelectAutocomplete';
import { CitySelect } from './CitySelect'; // Import the new CitySelect component
import { v4 as uuidv4 } from 'uuid'; // For unique filter IDs

// Type for a single address filter object
export interface AddressFilter {
  id: string; // Unique ID for React key prop and state management
  residence_street_number?: string;
  residence_pre_direction?: string;
  residence_street_name?: string;
  residence_street_type?: string;
  residence_post_direction?: string;
  residence_apt_unit_number?: string;
  residence_city?: string;
  residence_zipcode?: string;
}

// Define the order and configuration of address fields
const ADDRESS_FIELDS_CONFIG: { key: keyof Omit<AddressFilter, 'id'>; label: string; type: 'autocomplete' | 'select' }[] = [
  { key: 'residence_street_number', label: 'Street Number', type: 'autocomplete' },
  { key: 'residence_pre_direction', label: 'Pre Direction', type: 'autocomplete' },
  { key: 'residence_street_name', label: 'Street Name', type: 'autocomplete' },
  { key: 'residence_street_type', label: 'Street Type', type: 'autocomplete' },
  { key: 'residence_post_direction', label: 'Post Direction', type: 'autocomplete' },
  { key: 'residence_apt_unit_number', label: 'Apt/Unit Number', type: 'autocomplete' },
  { key: 'residence_zipcode', label: 'Zipcode', type: 'autocomplete' },
  { key: 'residence_city', label: 'City', type: 'select' }, // City uses the dedicated select component
];

// Props for the main filter component
interface ResidenceAddressFilterProps {
  addressFilters: AddressFilter[]; // Expects an array of filters
  addAddressFilter: (filter?: AddressFilter) => void; // Function to add a new empty filter
  updateAddressFilter: (id: string, field: keyof Omit<AddressFilter, 'id'>, value: string) => void; // Function to update a field in a specific filter
  removeAddressFilter: (id: string) => void; // Function to remove a specific filter
  clearAllAddressFilters: () => void; // Function to clear all filters
  disableAutoSelect?: boolean;
}

/**
 * ResidenceAddressFilter component that manages multiple address filters.
 */
export const ResidenceAddressFilter: React.FC<ResidenceAddressFilterProps> = ({ 
  addressFilters = [],
  addAddressFilter,
  updateAddressFilter,
  removeAddressFilter,
  clearAllAddressFilters,
  disableAutoSelect = false 
}) => {

  const [popoverOpen, setPopoverOpen] = useState(false);
  // Local state for the new filter being created in the popover
  const [newFilter, setNewFilter] = useState<AddressFilter>({ id: uuidv4() });

  // Handler for updating fields in the new filter (in the popover)
  const handleNewFilterChange = useCallback(
    (key: keyof Omit<AddressFilter, 'id'>, value: string) => {
      // Clear dependent fields in the new filter
      const currentIndex = ADDRESS_FIELDS_CONFIG.findIndex(f => f.key === key);
      const updatedFilter = { ...newFilter, [key]: value };
      ADDRESS_FIELDS_CONFIG.slice(currentIndex + 1).forEach(({ key: depKey }) => {
        if (updatedFilter[depKey]) {
          updatedFilter[depKey] = '';
        }
      });
      setNewFilter(updatedFilter);
    },
    [newFilter]
  );

  // Handler for confirming add
  const handleAddNewFilter = () => {
    // Only add if at least one field is filled
    const hasValue = ADDRESS_FIELDS_CONFIG.some(({ key }) => newFilter[key]);
    if (hasValue) {
      addAddressFilter({ ...newFilter });
      setNewFilter({ id: uuidv4() }); // Reset for next add
      setPopoverOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Display existing filters */}
      {addressFilters.map((filter, index) => (
        <div key={filter.id} className="p-3 border rounded-md space-y-2 relative bg-background/50">
           <Button 
             variant="ghost" 
             size="icon" 
             className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-destructive" 
             onClick={() => removeAddressFilter(filter.id)}
             aria-label={`Remove address filter ${index + 1}`}
           >
             <XIcon size={16} />
           </Button>
           <p className="text-xs font-medium text-muted-foreground mb-2">Address Filter #{index + 1}</p>
           {ADDRESS_FIELDS_CONFIG.map(({ key, label, type }) => (
            <div key={key}>
              {type === 'autocomplete' ? (
                <ReactSelectAutocomplete
                  label={label}
                  fieldKey={key}
                  value={filter[key] || null}
                  filters={filter}
                  setFilter={(fieldKeyUpdate: keyof Omit<AddressFilter, 'id'>, valueUpdate: string) => 
                    updateAddressFilter(filter.id, fieldKeyUpdate, valueUpdate)
                  }
                />
              ) : (
                <CitySelect
                  label={label}
                  value={filter[key] || ''}
                  currentFilterData={filter}
                  onChange={(valueUpdate) => updateAddressFilter(filter.id, key, valueUpdate)}
                  disableAutoSelect={disableAutoSelect}
                />
              )}
            </div>
          ))}
        </div>
      ))}

      {/* Add Filter Button and Popover */}
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
            <Button variant="outline" className="w-full">
                 <PlusIcon className="mr-2 h-4 w-4" /> Add Address Filter
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 min-w-[320px]">
           <div className="p-4 text-sm">
               <div className="mb-2 font-medium">Add Address Filter</div>
               {ADDRESS_FIELDS_CONFIG.map(({ key, label, type }) => (
                 <div key={key} className="mb-2">
                   {type === 'autocomplete' ? (
                     <ReactSelectAutocomplete
                       label={label}
                       fieldKey={key}
                       value={newFilter[key] || null}
                       filters={newFilter}
                       setFilter={handleNewFilterChange}
                     />
                   ) : (
                     <CitySelect
                       label={label}
                       value={newFilter[key] || ''}
                       currentFilterData={newFilter}
                       onChange={(valueUpdate) => handleNewFilterChange(key, valueUpdate)}
                       disableAutoSelect={disableAutoSelect}
                     />
                   )}
                 </div>
               ))}
           </div>
           <div className="p-2 border-t">
             <Button size="sm" className="w-full" onClick={handleAddNewFilter} disabled={!ADDRESS_FIELDS_CONFIG.some(({ key }) => newFilter[key])}>
               Confirm Add
             </Button>
           </div>
        </PopoverContent>
      </Popover>

      {/* Clear All Button */}
      {addressFilters.length > 0 && (
        <Button variant="secondary" size="sm" className="w-full mt-2" onClick={clearAllAddressFilters}>
          Clear All Address Filters
        </Button>
      )}
    </div>
  );
}; 