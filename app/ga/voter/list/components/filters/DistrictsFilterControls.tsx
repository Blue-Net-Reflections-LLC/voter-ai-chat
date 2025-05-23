import React from "react";
import { DistrictMultiSelect } from '../DistrictMultiSelect';
import { MultiSelect } from '../MultiSelect';
import { Separator } from "@/components/ui/separator";
import { REDISTRICTING_TYPE_OPTIONS } from '../../constants'; // Adjusted path
import { ensureStringArray } from "./utils";
import { DistrictsFilterControlsProps, OptionType } from "./types";

export function DistrictsFilterControls({
  filters,
  updateFilter,
  isLoading,
  congressionalDistricts,
  stateSenateDistricts,
  stateHouseDistricts
}: DistrictsFilterControlsProps) {
  return (
    <>
      <div className="space-y-2">
        <DistrictMultiSelect
          label="Congressional District"
          options={congressionalDistricts as OptionType[]}
          value={ensureStringArray(filters.congressionalDistricts)}
          setValue={(value) => updateFilter('congressionalDistricts', value)}
          isLoading={isLoading}
          compact={true}
        />
      </div>
      <div>
        <Separator className="my-3 mt-5" />
      </div>
      <div className="space-y-2">
        <DistrictMultiSelect
          label="State Senate District"
          options={stateSenateDistricts as OptionType[]}
          value={ensureStringArray(filters.stateSenateDistricts)}
          setValue={(value) => updateFilter('stateSenateDistricts', value)}
          isLoading={isLoading}
          compact={true}
        />
      </div>
      <div>
        <Separator className="my-3 mt-5" />
      </div>
      <div className="space-y-2">
        <DistrictMultiSelect
          label="State House District"
          options={stateHouseDistricts as OptionType[]}
          value={ensureStringArray(filters.stateHouseDistricts)}
          setValue={(value) => updateFilter('stateHouseDistricts', value)}
          isLoading={isLoading}
          compact={true}
        />
      </div>
      <div>
        <Separator className="my-3 mt-5" />
      </div>
      <MultiSelect
        label="Redistricting Type"
        options={REDISTRICTING_TYPE_OPTIONS as OptionType[]}
        value={ensureStringArray(filters.redistrictingAffectedTypes)}
        setValue={(value) => updateFilter('redistrictingAffectedTypes', value)}
        compact={true}
      />
    </>
  );
} 