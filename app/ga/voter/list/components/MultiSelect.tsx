"use client";

import React from 'react';

interface MultiSelectProps {
  label: string;
  options: string[];
  value: string[];
  setValue: (value: string[]) => void;
  isLoading?: boolean;
}

export function MultiSelect({ label, options, value, setValue, isLoading = false }: MultiSelectProps) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1">{label}</label>
      {isLoading ? (
        <div className="text-xs text-muted-foreground">Loading options...</div>
      ) : options.length === 0 ? (
        <div className="text-xs text-muted-foreground">No options available</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => (
            <label key={opt} className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded cursor-pointer">
              <input
                type="checkbox"
                checked={value.includes(opt)}
                onChange={() => {
                  if (value.includes(opt)) {
                    setValue(value.filter((v) => v !== opt));
                  } else {
                    setValue([...value, opt]);
                  }
                }}
                className="form-checkbox h-3 w-3"
              />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default MultiSelect; 