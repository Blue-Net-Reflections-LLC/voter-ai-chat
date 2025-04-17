"use client";

import React, { useState, useEffect } from 'react';
import { useAddressData, SelectOption } from './AddressDataProvider';
import type { AddressFilter } from './ResidenceAddressFilter';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
  const { 
    currentFilter, 
    updateField, 
    setSearch,
    searchField,
    searchQuery,
    options, 
    isLoading 
  } = useAddressData();
  
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState<string>('');
  
  // Get current value for this field (the confirmed selection)
  const value = currentFilter[fieldKey] as string || '';
  
  // Sync input with filter value for initialization
  useEffect(() => {
    if (value && !open) {
      setInputValue(value);
    }
  }, [value, open]);

  // Update input value when this field is being searched
  useEffect(() => {
    if (searchField === fieldKey) {
      setInputValue(searchQuery);
    }
  }, [searchField, searchQuery, fieldKey]);
  
  // Get options for this field
  const fieldOptions = options[fieldKey] || [];
  
  // Filter options based on input
  const filteredOptions = fieldOptions.filter(option => 
    !inputValue || option.label.toLowerCase().includes(inputValue.toLowerCase())
  );
  
  // Handle search input change - only updates search, doesn't update filter
  const handleInputChange = (search: string) => {
    setInputValue(search);
    
    // Update search in context - this doesn't affect other fields
    setSearch(fieldKey, search);
  };
  
  // Handle selection - THIS confirms the value and updates the filter
  const handleSelect = (selectedValue: string) => {
    // If selecting the same value, clear it
    if (selectedValue === value) {
      updateField(fieldKey, '');
      setInputValue('');
    } else {
      updateField(fieldKey, selectedValue);
      setInputValue(selectedValue);
    }
    setOpen(false);
  };
  
  // Handle clearing
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateField(fieldKey, '');
    setInputValue('');
    setSearch(null, '');
  };

  // Check if this field is currently being searched
  const isSearching = searchField === fieldKey && searchQuery !== '';

  return (
    <div className={cn("w-full", compact ? "mb-0" : "mb-2")}>
      {!hideLabel && (
        <div className="text-xs font-medium block mb-1">
          {label}
        </div>
      )}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              compact ? "h-8 text-xs" : "h-9"
            )}
          >
            <span className="truncate">
              {value || `Search ${label}...`}
            </span>
            <div className="flex items-center">
              {value && (
                <X 
                  className="mr-1 h-4 w-4 shrink-0 opacity-50 hover:opacity-100" 
                  onClick={handleClear} 
                />
              )}
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="p-0 w-full" 
          style={{ width: "var(--radix-popover-trigger-width)" }} // Match trigger width
          align="start"
        >
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder={`Search ${label}...`} 
              value={inputValue}
              onValueChange={handleInputChange}
              className={compact ? "h-8 text-xs" : ""}
            />
            <CommandList>
              <CommandEmpty>
                {isLoading ? "Loading..." : (filteredOptions.length === 0 ? "No matches found" : "Type to search")}
              </CommandEmpty>
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={handleSelect}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {isLoading && (
        <div className="text-xs mt-1 text-muted-foreground">Loading options...</div>
      )}
    </div>
  );
}; 