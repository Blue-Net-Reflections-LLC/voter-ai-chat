"use client";

import React, { useState } from 'react';
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
  addressFilters: AddressFilter[]; // Expects an array of filters
  addAddressFilter: (filter?: AddressFilter) => void; // Function to add a new empty filter
  updateAddressFilter: (id: string, field: keyof Omit<AddressFilter, 'id'>, value: string) => void; // Function to update a field in a specific filter
  removeAddressFilter: (id: string) => void; // Function to remove a specific filter
  clearAllAddressFilters: () => void; // Function to clear all filters
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
    if (hasValue) {
      addAddressFilter({ ...filter, id: newFilterId });
      setDialogOpen(false);
    } else {
      // Optional: Handle case where confirm is clicked with no value (e.g., show a message)
      // Currently, the button will be disabled, so this branch might not be reachable
      console.log("Confirm clicked with no filter values.");
    }
  };

  // Helper function to format address
  const formatAddress = (filter: AddressFilter) => {
    // Line 1: Street number, pre-direction, street name, street type, post-direction
    const line1Parts = [
      filter.residence_street_number,
      filter.residence_pre_direction,
      filter.residence_street_name,
      filter.residence_street_type,
      filter.residence_post_direction
    ].filter(Boolean);
    const line1 = line1Parts.join(' ');
    
    // Line 2: Apt/Unit if exists
    let line2 = '';
    if (filter.residence_apt_unit_number) {
      line2 = `Apt: ${filter.residence_apt_unit_number}`;
    }
    
    // Line 3: City, State, Zipcode
    const line3Parts = [];
    if (filter.residence_city) {
      line3Parts.push(filter.residence_city);
    }
    
    if (line3Parts.length > 0) {
      line3Parts.push('GA'); // Always add state code for Georgia
    }
    
    if (filter.residence_zipcode) {
      line3Parts.push(filter.residence_zipcode);
    }
    
    const line3 = line3Parts.join(', ');
    
    // Combine all lines that have content
    return [line1, line2, line3].filter(line => line.trim() !== '').join('\n');
  };

  return (
    <div className="space-y-4">
      {/* Display existing filters */}
      {addressFilters.map((filter, index) => (
        <div key={filter.id} className="p-3 rounded-md relative bg-background/50">
           <Button 
             variant="ghost" 
             size="icon" 
             className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-destructive" 
             onClick={() => removeAddressFilter(filter.id)}
             aria-label={`Remove address filter ${index + 1}`}
           >
             <XIcon size={16} />
           </Button>
           <div className="pr-6"> {/* Add padding-right to avoid text overlapping with the X button */}
             <p className="text-xs font-medium text-muted-foreground mb-2">Address Filter #{index + 1}</p>
             <div className="whitespace-pre-line text-sm">
               {formatAddress(filter)}
             </div>
           </div>
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
          <Button variant="outline" className="w-full">
            <PlusIcon className="mr-2 h-4 w-4" /> Add Address Filter
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[850px] w-full">
          <DialogHeader className="pb-2">
            <DialogTitle>Add Address Filter</DialogTitle>
          </DialogHeader>
          
          {/* Wrap dialog content with AddressDataProvider */}
          <AddressDataProvider 
            initialFilter={{ id: newFilterId }}
          >
            {/* Address fields grid - now responsive */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-12 gap-1 mb-3 pb-6">
              {/* Row 1: Street Number, Pre Direction, Street Name, Type, Post Direction */}
              <div className="col-span-1 sm:col-span-2 min-w-[80px] pb-4">
                <div className="text-xs font-medium mb-1">Street #</div>
                <ReactSelectAutocomplete
                  label="Street #"
                  fieldKey="residence_street_number"
                  compact
                  hideLabel
                />
              </div>
              <div className="col-span-1 sm:col-span-2 min-w-[50px] pb-4">
                <div className="text-xs font-medium mb-1">Dir.</div>
                <ReactSelectAutocomplete
                  label="Dir."
                  fieldKey="residence_pre_direction"
                  compact
                  hideLabel
                />
              </div>
              <div className="col-span-1 sm:col-span-4 pb-4">
                <div className="text-xs font-medium mb-1">Street Name</div>
                <ReactSelectAutocomplete
                  label="Street Name"
                  fieldKey="residence_street_name"
                  hideLabel
                />
              </div>
              <div className="col-span-1 sm:col-span-2 min-w-[80px] pb-4">
                <div className="text-xs font-medium mb-1">Type</div>
                <ReactSelectAutocomplete
                  label="Type"
                  fieldKey="residence_street_type"
                  compact
                  hideLabel
                />
              </div>
              <div className="col-span-1 sm:col-span-2 pb-4">
                <div className="text-xs font-medium mb-1">Dir.</div>
                <ReactSelectAutocomplete
                  label="Dir."
                  fieldKey="residence_post_direction"
                  compact
                  hideLabel
                />
              </div>
              {/* Row 2: Apt/Unit Number (full width) */}
              <div className="col-span-1 sm:col-span-12 mt-1 pb-4">
                <div className="text-xs font-medium mb-1">Apt/Unit Number</div>
                <ReactSelectAutocomplete
                  label="Apt/Unit Number"
                  fieldKey="residence_apt_unit_number"
                  hideLabel
                />
              </div>
              {/* Row 3: City (dropdown, flex), Zipcode (right portion) */}
              <div className="col-span-1 sm:col-span-8 mt-1 pb-4 pr-4">
                <div className="text-xs font-medium mb-1">City</div>
                <CitySelect
                  label="City"
                  hideLabel
                />
              </div>
              <div className="col-span-1 sm:col-span-4 mt-1 min-w-[120px] pb-4">
                <div className="text-xs font-medium mb-1">Zipcode</div>
                <ReactSelectAutocomplete
                  label="Zipcode"
                  fieldKey="residence_zipcode"
                  compact
                  hideLabel
                />
              </div>
            </div>
            
            {/* MOVE DialogFooter INSIDE AddressDataProvider */}
            <DialogFooter className="pt-2">
              {/* Render the consumer which now contains the buttons */}
              <AddressDataConsumer onConfirm={handleFilterConfirmed} />
            </DialogFooter>
          </AddressDataProvider>
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

// Helper component to extract values from context AND RENDER BUTTONS
const AddressDataConsumer: React.FC<{
  onConfirm: (filter: Partial<AddressFilter>) => void;
}> = ({ onConfirm }) => {
  const { currentFilter, clearAllFields } = useAddressData();

  // Determine if there are any values in the current filter, IGNORING the 'id' field
  const hasValue = Object.entries(currentFilter)
    .filter(([key]) => key !== 'id') // Exclude the 'id' key
    .some(([, value]) => !!value); // Check if any remaining value is truthy
  
  return (
    // Use the same flex container as the original DialogFooter
    <div className="flex justify-between w-full gap-3">
      <Button 
        variant="outline"
        size="sm" 
        className="flex-1 text-muted-foreground hover:text-destructive"
        onClick={clearAllFields} // Directly call clearAllFields
        disabled={!hasValue} // Disable if no values exist
        aria-disabled={!hasValue}
      >
        Clear All Fields
      </Button>
      <Button 
        size="sm" 
        className="flex-1" 
        onClick={() => onConfirm(currentFilter)} // Directly call onConfirm
        disabled={!hasValue} // Disable if no values exist
        aria-disabled={!hasValue}
      >
        Confirm Add
      </Button>
      {/* REMOVED hidden buttons */}
    </div>
  );
}; 