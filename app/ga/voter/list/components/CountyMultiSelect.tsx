"use client";

import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLookupData } from '../hooks/useLookupData';
import { Loader2 } from 'lucide-react';
import { MultiSelectOption } from './MultiSelect';

interface CountyMultiSelectProps {
  value: string[];
  setValue: (value: string[]) => void;
  isLoading?: boolean;
  compact?: boolean;
}

export function CountyMultiSelect({ value, setValue, isLoading: propIsLoading, compact = false }: CountyMultiSelectProps) {
  const [search, setSearch] = useState("");
  const { counties, isLoading: dataIsLoading, error } = useLookupData();
  
  // Use loader from props or from data hook
  const loading = propIsLoading !== undefined ? propIsLoading : dataIsLoading;
  
  // Filtered options: all counties matching search
  const filtered = counties?.filter(
    (c) => c.label.toLowerCase().includes(search.toLowerCase())
  ) || [];
  
  // For display: selected at top, then all filtered (with checked/unchecked)
  const selected = value.filter((v) => counties?.some(c => c.value === v) || false);

  // Helper: render a county checkbox (checked if selected)
  function renderCountyCheckbox(county: MultiSelectOption, keyPrefix = "") {
    const checked = value.includes(county.value);
    return (
      <label key={keyPrefix + county.value} className={`flex items-center gap-1 text-xs px-2 py-1 rounded cursor-pointer ${checked ? 'bg-muted' : 'hover:bg-muted'}`}
        style={{ marginBottom: '2px' }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={() => {
            if (checked) {
              setValue(value.filter((v) => v !== county.value));
            } else {
              setValue([...value, county.value]);
            }
          }}
          className="form-checkbox h-3 w-3"
        />
        {county.label}
      </label>
    );
  }

  return (
    <div>
      <label className="text-xs font-medium block mb-1">County</label>
      <div className="relative">
        <Input
          placeholder="Search counties..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={`mb-2 ${compact ? 'h-8 text-xs' : ''}`}
        />
        <div className="max-h-48 overflow-y-auto border rounded bg-background shadow p-2">
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-xs">Loading counties...</span>
            </div>
          ) : error ? (
            <div className="text-xs text-red-500 px-2 py-1">Error loading counties</div>
          ) : (
            <>
              {selected.length > 0 && (
                <>
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide px-1 pb-1">Selected</div>
                  {counties
                    ?.filter(county => value.includes(county.value))
                    .map(county => renderCountyCheckbox(county, "top-"))}
                  <div className="border-t my-2" />
                </>
              )}
              {filtered
                .filter(county => !value.includes(county.value))
                .map(county => renderCountyCheckbox(county, "list-"))}
              {selected.length === 0 && filtered.length === 0 && <div className="text-xs text-muted-foreground px-2 py-1">No counties found</div>}
            </>
          )}
        </div>
        {selected.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full text-xs"
            onClick={() => setValue([])}
          >
            Clear All
          </Button>
        )}
      </div>
    </div>
  );
}

export default CountyMultiSelect; 