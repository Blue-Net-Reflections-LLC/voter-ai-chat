import React from "react";
import { CountyMultiSelect } from '../CountyMultiSelect';
import { PrecinctFilters } from '../PrecinctFilters';
import { Separator } from "@/components/ui/separator";
import { ensureStringArray } from "./utils";
import { CountiesFilterControlsProps } from "./types";

export function CountiesFilterControls({ 
  filters, 
  updateFilter, 
  isLoading, 
  selectedCounties, 
  onSelectionChange 
}: CountiesFilterControlsProps) {
  return (
    <>
      <div className="space-y-2">
        <CountyMultiSelect
          value={ensureStringArray(filters.county)}
          setValue={(value) => updateFilter('county', value)}
          isLoading={isLoading}
          compact={true}
          onSelectionChange={onSelectionChange}
        />
      </div>
      <div>
        <Separator className="my-3 mt-5" />
      </div>
      <PrecinctFilters selectedCounties={selectedCounties} />
    </>
  );
} 