"use client";

import React, { useState, useEffect, useRef } from 'react';
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
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState<string>('');
  const debouncedInputValue = useDebounce(inputValue, 400);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Get current value for this field
  const value = currentFilter[fieldKey] as string || '';
  
  // Get options for this field
  const fieldOptions = options[fieldKey] || [];
  
  // Filter options based on input
  const filteredOptions = fieldOptions.filter(option => 
    !inputValue || option.label.toLowerCase().includes(inputValue.toLowerCase())
  );
  
  // Effect to update the filter after debounce period
  useEffect(() => {
    if (debouncedInputValue !== '' && debouncedInputValue !== currentFilter[fieldKey]) {
      updateField(fieldKey, debouncedInputValue);
    }
  }, [debouncedInputValue, fieldKey, updateField, currentFilter]);
  
  // Handle selection
  const handleSelect = (selectedValue: string) => {
    updateField(fieldKey, selectedValue);
    setInputValue(selectedValue);
    setOpen(false);
  };
  
  // Handle input change
  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    
    // Open dropdown when typing
    if (newValue.length > 0) {
      setOpen(true);
    }
  };
  
  // Handle clearing the input
  const handleClear = () => {
    updateField(fieldKey, '');
    setInputValue('');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  return (
    <div className={compact ? "mb-0" : "mb-2"}>
      {!hideLabel && (
        <label htmlFor={`command-input-${String(fieldKey)}`} className="text-xs font-medium block mb-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        <Command 
          className="rounded-md border border-input bg-transparent overflow-visible" 
          shouldFilter={false}
        >
          <div className="flex items-center border-b px-3">
            <CommandInput
              ref={inputRef}
              id={`command-input-${String(fieldKey)}`}
              value={inputValue}
              onValueChange={handleInputChange}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 200)}
              placeholder={isLoading ? 'Loading...' : `Search ${label}...`}
              className={cn(
                "flex h-9 w-full rounded-md bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
                compact ? "h-8 py-1 text-xs" : ""
              )}
            />
            {inputValue && (
              <button
                type="button"
                onClick={handleClear}
                className="h-4 w-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear</span>
              </button>
            )}
          </div>
          {open && (
            <div className="relative z-50">
              <CommandList className="absolute w-full top-0 max-h-[200px] overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
                <CommandEmpty>{isLoading ? "Loading..." : "No results found."}</CommandEmpty>
                <CommandGroup>
                  {filteredOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      onSelect={() => handleSelect(option.value)}
                      className="cursor-pointer data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                    >
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </div>
          )}
        </Command>
        
        {value && !open && (
          <div className="absolute top-0 left-0 flex items-center h-9 px-3 pointer-events-none">
            <span className="text-sm truncate">{value}</span>
          </div>
        )}
      </div>
      
      {isLoading && (
        <div className="text-xs mt-1 text-muted-foreground">Loading options...</div>
      )}
    </div>
  );
}; 