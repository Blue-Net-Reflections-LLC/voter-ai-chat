"use client";

import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';

interface DistrictMultiSelectProps {
  label: string;
  options: string[];
  value: string[];
  setValue: (value: string[]) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function DistrictMultiSelect({ 
  label, 
  options, 
  value, 
  setValue,
  isLoading = false,
  error = null
}: DistrictMultiSelectProps) {
  const [search, setSearch] = useState("");
  
  // Format the district numbers for display (remove state prefix and leading zeros)
  const formatDistrict = (code: string): string => {
    if (code.length >= 2) {
      return code.slice(2).replace(/^0+/, "") || "0";
    }
    return code;
  };

  // Filtered options: all districts matching search (by display number)
  const filtered = options.filter(
    (code) => {
      const display = formatDistrict(code);
      return display.includes(search.replace(/^0+/, ""));
    }
  );
  
  const selected = value.filter((c) => options.includes(c));

  function renderDistrictCheckbox(code: string, keyPrefix = "") {
    const checked = value.includes(code);
    const display = formatDistrict(code);
    return (
      <label key={keyPrefix + code} className={`flex items-center gap-1 text-xs px-2 py-1 rounded cursor-pointer ${checked ? 'bg-muted' : 'hover:bg-muted'}`}
        style={{ marginBottom: '2px' }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={() => {
            if (checked) {
              setValue(value.filter((v) => v !== code));
            } else {
              setValue([...value, code]);
            }
          }}
          className="form-checkbox h-3 w-3"
        />
        {display}
      </label>
    );
  }

  return (
    <div>
      <label className="text-sm font-medium block mb-1">{label}</label>
      <div className="relative">
        <Input
          placeholder={`Search ${label.toLowerCase()}...`}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="mb-2"
        />
        <div className="max-h-48 overflow-y-auto border rounded bg-background shadow p-2">
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-xs">Loading {label.toLowerCase()}...</span>
            </div>
          ) : error ? (
            <div className="text-xs text-red-500 px-2 py-1">Error loading {label.toLowerCase()}</div>
          ) : (
            <>
              {selected.length > 0 && (
                <>
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide px-1 pb-1">Selected</div>
                  {selected.map(code => renderDistrictCheckbox(code, "top-"))}
                  <div className="border-t my-2" />
                </>
              )}
              {filtered.map(code => renderDistrictCheckbox(code, "list-"))}
              {selected.length === 0 && filtered.length === 0 && <div className="text-xs text-muted-foreground px-2 py-1">No districts found</div>}
            </>
          )}
        </div>
        {selected.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full"
            onClick={() => setValue([])}
          >
            Clear All
          </Button>
        )}
      </div>
    </div>
  );
}

export default DistrictMultiSelect; 