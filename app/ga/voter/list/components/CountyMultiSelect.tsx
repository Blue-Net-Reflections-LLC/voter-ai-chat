"use client";

import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { COUNTY_OPTIONS } from '../constants';

interface CountyMultiSelectProps {
  value: string[];
  setValue: (value: string[]) => void;
}

export function CountyMultiSelect({ value, setValue }: CountyMultiSelectProps) {
  const [search, setSearch] = useState("");
  
  // Filtered options: all counties matching search
  const filtered = COUNTY_OPTIONS.filter(
    (c) => c.toLowerCase().includes(search.toLowerCase())
  );
  
  // For display: selected at top, then all filtered (with checked/unchecked)
  const selected = value.filter((c) => COUNTY_OPTIONS.includes(c));

  // Helper: render a county checkbox (checked if selected)
  function renderCountyCheckbox(county: string, keyPrefix = "") {
    const checked = value.includes(county);
    return (
      <label key={keyPrefix + county} className={`flex items-center gap-1 text-xs px-2 py-1 rounded cursor-pointer ${checked ? 'bg-muted' : 'hover:bg-muted'}`}
        style={{ marginBottom: '2px' }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={() => {
            if (checked) {
              setValue(value.filter((v) => v !== county));
            } else {
              setValue([...value, county]);
            }
          }}
          className="form-checkbox h-3 w-3"
        />
        {county}
      </label>
    );
  }

  return (
    <div>
      <label className="text-sm font-medium block mb-1">County</label>
      <div className="relative">
        <Input
          placeholder="Search counties..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="mb-2"
        />
        <div className="max-h-48 overflow-y-auto border rounded bg-background shadow p-2">
          {selected.length > 0 && (
            <>
              <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide px-1 pb-1">Selected</div>
              {selected.map(county => renderCountyCheckbox(county, "top-"))}
              <div className="border-t my-2" />
            </>
          )}
          {filtered.map(county => renderCountyCheckbox(county, "list-"))}
          {selected.length === 0 && filtered.length === 0 && <div className="text-xs text-muted-foreground px-2 py-1">No counties found</div>}
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

export default CountyMultiSelect; 