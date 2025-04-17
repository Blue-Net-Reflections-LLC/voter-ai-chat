"use client";

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
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

  const [dialogOpen, setDialogOpen] = useState(false);
  // Local state for the new filter being created in the dialog
  const [newFilter, setNewFilter] = useState<AddressFilter>({ id: uuidv4() });

  // Handler for updating fields in the new filter (in the dialog)
  const handleNewFilterChange = useCallback(
    (key: keyof Omit<AddressFilter, 'id'>, value: string) => {
      // Directly update the filter state without clearing other fields
      const updatedFilter = { ...newFilter, [key]: value };
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
      setDialogOpen(false);
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

      {/* Add Filter Button and Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <PlusIcon className="mr-2 h-4 w-4" /> Add Address Filter
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[750px] w-full">
          <DialogHeader className="pb-2">
            <DialogTitle>Add Address Filter</DialogTitle>
          </DialogHeader>
          {/* Address fields grid */}
          <div className="w-full grid grid-cols-12 gap-2 mb-3">
            {/* Row 1: Street Number, Pre Direction, Street Name, Type, Post Direction */}
            <div className="col-span-2 min-w-[80px]">
              <div className="text-xs font-medium mb-1">Street #</div>
              <ReactSelectAutocomplete
                label="Street #"
                fieldKey="residence_street_number"
                value={newFilter['residence_street_number'] || null}
                filters={newFilter}
                setFilter={handleNewFilterChange}
                compact
                hideLabel
              />
            </div>
            <div className="col-span-1 min-w-[50px]">
              <div className="text-xs font-medium mb-1">Dir.</div>
              <ReactSelectAutocomplete
                label="Dir."
                fieldKey="residence_pre_direction"
                value={newFilter['residence_pre_direction'] || null}
                filters={newFilter}
                setFilter={handleNewFilterChange}
                compact
                hideLabel
              />
            </div>
            <div className="col-span-6 min-w-[180px]">
              <div className="text-xs font-medium mb-1">Street Name</div>
              <ReactSelectAutocomplete
                label="Street Name"
                fieldKey="residence_street_name"
                value={newFilter['residence_street_name'] || null}
                filters={newFilter}
                setFilter={handleNewFilterChange}
                hideLabel
              />
            </div>
            <div className="col-span-2 min-w-[80px]">
              <div className="text-xs font-medium mb-1">Type</div>
              <ReactSelectAutocomplete
                label="Type"
                fieldKey="residence_street_type"
                value={newFilter['residence_street_type'] || null}
                filters={newFilter}
                setFilter={handleNewFilterChange}
                compact
                hideLabel
              />
            </div>
            <div className="col-span-1 min-w-[60px]">
              <div className="text-xs font-medium mb-1">Dir.</div>
              <ReactSelectAutocomplete
                label="Dir."
                fieldKey="residence_post_direction"
                value={newFilter['residence_post_direction'] || null}
                filters={newFilter}
                setFilter={handleNewFilterChange}
                compact
                hideLabel
              />
            </div>
            {/* Row 2: Apt/Unit Number (full width) */}
            <div className="col-span-12 mt-1">
              <div className="text-xs font-medium mb-1">Apt/Unit Number</div>
              <ReactSelectAutocomplete
                label="Apt/Unit Number"
                fieldKey="residence_apt_unit_number"
                value={newFilter['residence_apt_unit_number'] || null}
                filters={newFilter}
                setFilter={handleNewFilterChange}
                hideLabel
              />
            </div>
            {/* Row 3: City (dropdown, flex), Zipcode (right portion) */}
            <div className="col-span-8 mt-1">
              <div className="text-xs font-medium mb-1">City</div>
              <CitySelect
                label="City"
                value={newFilter['residence_city'] || ''}
                currentFilterData={newFilter}
                onChange={(valueUpdate) => handleNewFilterChange('residence_city', valueUpdate)}
                disableAutoSelect={disableAutoSelect}
                hideLabel
              />
            </div>
            <div className="col-span-4 mt-1 min-w-[120px]">
              <div className="text-xs font-medium mb-1">Zipcode</div>
              <ReactSelectAutocomplete
                label="Zipcode"
                fieldKey="residence_zipcode"
                value={newFilter['residence_zipcode'] || null}
                filters={newFilter}
                setFilter={handleNewFilterChange}
                compact
                hideLabel
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button size="sm" className="w-40 mx-auto" onClick={handleAddNewFilter} disabled={!ADDRESS_FIELDS_CONFIG.some(({ key }) => newFilter[key])}>
              Confirm Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear All Button */}
      {addressFilters.length > 0 && (
        <Button variant="secondary" size="sm" className="w-full mt-2" onClick={clearAllAddressFilters}>
          Clear All Address Filters
        </Button>
      )}
    </div>
  );
}; 