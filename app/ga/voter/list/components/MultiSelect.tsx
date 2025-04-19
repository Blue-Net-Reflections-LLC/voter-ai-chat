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
      {isLoading ? (
        <div className="text-xs text-muted-foreground">Loading options...</div>
      ) : normalizedOptions.length === 0 ? (
        <div className="text-xs text-muted-foreground">No options available</div>
      ) : (
        <div className="flex flex-wrap gap-2 py-1">
          {normalizedOptions.map((option) => (
            <label 
              key={option.value}
              className={cn(
                "flex items-center gap-1 text-xs px-2 py-1 rounded cursor-pointer",
                value.includes(option.value) ? 'bg-muted' : 'bg-muted/50 hover:bg-muted'
              )}
            >
              <input
                type="checkbox"
                checked={value.includes(option.value)}
                onChange={() => toggleValue(option.value)}
                className={cn("form-checkbox", compact ? "h-3 w-3" : "h-4 w-4")}
              />
              {option.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default MultiSelect; 