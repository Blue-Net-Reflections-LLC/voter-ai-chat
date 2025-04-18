"use client";

import React from 'react';
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  label: string;
  options: MultiSelectOption[] | string[];
  value: string[];
  setValue: (value: string[]) => void;
  isLoading?: boolean;
  compact?: boolean;
}

export function MultiSelect({
  label,
  options,
  value,
  setValue,
  isLoading = false,
  compact = false,
}: MultiSelectProps) {
  // Toggle a value in the array
  const toggleValue = (optionValue: string) => {
    if (value.includes(optionValue)) {
      setValue(value.filter(v => v !== optionValue));
    } else {
      setValue([...value, optionValue]);
    }
  };

  // Normalize options to always have the same format
  const normalizedOptions = options.map(option => {
    if (typeof option === 'string') {
      return { value: option, label: option };
    }
    return option;
  });

  return (
    <div className="w-full">
      <label className={cn("font-medium block", compact ? "text-xs mb-1" : "text-sm mb-2")}>
        {label}
      </label>
      <div className={cn(
        "border border-border rounded-md max-h-32 overflow-y-auto bg-background",
        compact ? "p-1.5 max-h-28" : "p-2 max-h-32"
      )}>
        {isLoading ? (
          <div className="text-xs text-muted-foreground">Loading...</div>
        ) : normalizedOptions.length === 0 ? (
          <div className="text-xs text-muted-foreground">No options available</div>
        ) : (
          normalizedOptions.map((option) => (
            <div 
              key={option.value} 
              className={cn(
                "flex items-center mb-1 last:mb-0", 
                compact ? "mb-0.5" : "mb-1"
              )}
            >
              <input
                type="checkbox"
                id={`${label}-${option.value}`}
                checked={value.includes(option.value)}
                onChange={() => toggleValue(option.value)}
                className={cn(
                  "form-checkbox mr-2", 
                  compact ? "h-3 w-3" : "h-4 w-4"
                )}
              />
              <label 
                htmlFor={`${label}-${option.value}`} 
                className={compact ? "text-xs" : "text-sm"}
              >
                {option.label}
              </label>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default MultiSelect; 