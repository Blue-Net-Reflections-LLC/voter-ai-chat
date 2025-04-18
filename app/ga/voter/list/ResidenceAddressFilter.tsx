"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { XIcon, PlusIcon } from 'lucide-react';
import { ReactSelectAutocomplete } from './ReactSelectAutocomplete';
import { CitySelect } from './CitySelect';
import { AddressDataProvider, useAddressData } from './AddressDataProvider';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';
import { ResidenceAddressFilterState } from './types';

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
const ADDRESS_FIELDS_CONFIG: { key: keyof Omit<AddressFilter, 'id'>; label: string; type: 'autocomplete' | 'city' }[] = [
  { key: 'residence_street_number', label: 'Street Number', type: 'autocomplete' },
  { key: 'residence_pre_direction', label: 'Pre Direction', type: 'autocomplete' },
  { key: 'residence_street_name', label: 'Street Name', type: 'autocomplete' },
  { key: 'residence_street_type', label: 'Street Type', type: 'autocomplete' },
  { key: 'residence_post_direction', label: 'Post Direction', type: 'autocomplete' },
  { key: 'residence_apt_unit_number', label: 'Apt/Unit Number', type: 'autocomplete' },
  { key: 'residence_zipcode', label: 'Zipcode', type: 'autocomplete' },
  { key: 'residence_city', label: 'City', type: 'city' }, // City uses the dedicated select component
];

// Props for the main filter component
interface ResidenceAddressFilterProps {
  filters?: ResidenceAddressFilterState;
  setFilter?: (key: keyof ResidenceAddressFilterState, value: string) => void;
  addressFilters?: AddressFilter[]; // Expects an array of filters
  addAddressFilter?: (filter?: AddressFilter) => void; // Function to add a new empty filter
  updateAddressFilter?: (id: string, field: keyof Omit<AddressFilter, 'id'>, value: string) => void; // Function to update a field in a specific filter
  removeAddressFilter?: (id: string) => void; // Function to remove a specific filter
  clearAllAddressFilters?: () => void; // Function to clear all filters
  compact?: boolean;
}

/**
 * ResidenceAddressFilter component that manages multiple address filters.
 */
export const ResidenceAddressFilter: React.FC<ResidenceAddressFilterProps> = ({ 
  filters,
  setFilter,
  addressFilters = [],
  addAddressFilter,
  updateAddressFilter,
  removeAddressFilter,
  clearAllAddressFilters,
  compact = false,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newFilterId, setNewFilterId] = useState(() => uuidv4());

  // Callback when 'Add' button is clicked in dialog
  const handleAddNewFilter = () => {
    // Extract filter values from the context
    const addFilterElement = document.getElementById('add-filter-button');
    if (addFilterElement) {
      addFilterElement.click(); // Trigger the hidden button
    }
  };

  // Callback to clear all fields in the dialog
  const handleClearAllFields = () => {
    const resetButton = document.getElementById('reset-filter-button');
    if (resetButton) {
      resetButton.click(); // Trigger the hidden reset button
    }
  };

  // Hidden callback that is triggered when the user confirms the filter in the dialog
  const handleFilterConfirmed = (filter: Partial<AddressFilter>) => {
    // Check if any values exist in the filter
    const hasValue = Object.values(filter).some(val => val);
    if (hasValue && addAddressFilter) {
      addAddressFilter({ ...filter, id: newFilterId });
      setDialogOpen(false);
    }
  };

  return (
    <div className={cn("space-y-3", compact ? "space-y-2" : "space-y-4")}>
      {/* Display existing filters */}
      {addressFilters.map((filter, index) => (
        <div key={filter.id} className="p-3 border rounded-md space-y-2 relative bg-background/50">
           <Button 
             variant="ghost" 
             size="icon" 
             className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-destructive" 
             onClick={() => removeAddressFilter && removeAddressFilter(filter.id)}
             aria-label={`Remove address filter ${index + 1}`}
           >
             <XIcon size={16} />
           </Button>
           <p className="text-xs font-medium text-muted-foreground mb-2">Address Filter #{index + 1}</p>
           {ADDRESS_FIELDS_CONFIG.map(({ key, label }) => (
            <div key={key}>
              <div className="text-sm p-2 h-8 border rounded bg-muted/50 truncate">
                {filter[key] || <span className="text-muted-foreground italic">Not set</span>}
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Add Filter Button and Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (open) {
          // Generate a new ID when opening the dialog
          setNewFilterId(uuidv4());
        } else {
          // Reset dialog state when closing
          setTimeout(() => {
            // Reset the AddressDataProvider state
            const resetButton = document.getElementById('reset-filter-button');
            if (resetButton) {
              resetButton.click(); // Trigger reset
            }
          }, 0);
        }
        setDialogOpen(open);
      }}>
        <DialogTrigger asChild>
          <Button variant="outline" className={cn("w-full", compact ? "h-8 text-xs" : "")}>
            <PlusIcon className="mr-2 h-4 w-4" /> Add Address Filter
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[750px] w-full">
          <DialogHeader className="pb-2">
            <DialogTitle>Add Address Filter</DialogTitle>
          </DialogHeader>
          
          {/* Wrap dialog content with AddressDataProvider */}
          <AddressDataProvider 
            initialFilter={{ id: newFilterId }}
          >
            {/* Address fields grid */}
            <div className="w-full grid grid-cols-12 gap-2 mb-3">
              {/* Row 1: Street Number, Pre Direction, Street Name, Type, Post Direction */}
              <div className="col-span-2 min-w-[80px]">
                <div className="text-xs font-medium mb-1">Street #</div>
                <ReactSelectAutocomplete
                  label="Street #"
                  fieldKey="residence_street_number"
                  compact
                  hideLabel
                />
              </div>
              <div className="col-span-1 min-w-[50px]">
                <div className="text-xs font-medium mb-1">Dir.</div>
                <ReactSelectAutocomplete
                  label="Dir."
                  fieldKey="residence_pre_direction"
                  compact
                  hideLabel
                />
              </div>
              <div className="col-span-6 min-w-[180px]">
                <div className="text-xs font-medium mb-1">Street Name</div>
                <ReactSelectAutocomplete
                  label="Street Name"
                  fieldKey="residence_street_name"
                  hideLabel
                />
              </div>
              <div className="col-span-2 min-w-[80px]">
                <div className="text-xs font-medium mb-1">Type</div>
                <ReactSelectAutocomplete
                  label="Type"
                  fieldKey="residence_street_type"
                  compact
                  hideLabel
                />
              </div>
              <div className="col-span-1 min-w-[60px]">
                <div className="text-xs font-medium mb-1">Dir.</div>
                <ReactSelectAutocomplete
                  label="Dir."
                  fieldKey="residence_post_direction"
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
                  hideLabel
                />
              </div>
              {/* Row 3: City (dropdown, flex), Zipcode (right portion) */}
              <div className="col-span-8 mt-1">
                <div className="text-xs font-medium mb-1">City</div>
                <CitySelect
                  label="City"
                  hideLabel
                />
              </div>
              <div className="col-span-4 mt-1 min-w-[120px]">
                <div className="text-xs font-medium mb-1">Zipcode</div>
                <ReactSelectAutocomplete
                  label="Zipcode"
                  fieldKey="residence_zipcode"
                  compact
                  hideLabel
                />
              </div>
            </div>
            
            {/* Hidden component to extract values when needed */}
            <AddressDataConsumer onConfirm={handleFilterConfirmed} />
          </AddressDataProvider>
          
          <DialogFooter className="pt-2">
            <div className="flex justify-between w-full gap-3">
              <Button 
                variant="outline"
                size="sm" 
                className="flex-1 text-muted-foreground hover:text-destructive"
                onClick={handleClearAllFields}
              >
                Clear All Fields
              </Button>
              <Button 
                size="sm" 
                className="flex-1" 
                onClick={handleAddNewFilter}
              >
                Confirm Add
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backward compatibility for new filters and setFilter props */}
      {filters && setFilter && (
        <div className="mt-2">
          <div className="text-xs font-medium mb-1">Custom Filter (Legacy)</div>
          <div className="p-2 border rounded-md text-xs">
            Using legacy filter system
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component to extract filter values
const AddressDataConsumer: React.FC<{
  onConfirm: (filter: Partial<AddressFilter>) => void;
}> = ({ onConfirm }) => {
  const { currentFilter, clearAllFields } = useAddressData();

  // Use this component to wrap currentFilter access
  return (
    <>
      <button 
        id="add-filter-button" 
        type="button" 
        className="hidden" 
        onClick={() => onConfirm(currentFilter)}
      />
      <button 
        id="reset-filter-button" 
        type="button" 
        className="hidden" 
        onClick={clearAllFields}
      />
    </>
  );
}; 