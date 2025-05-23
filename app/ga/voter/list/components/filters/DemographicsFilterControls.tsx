import React from "react";
import { MultiSelect } from "../MultiSelect";
import { Separator } from "@/components/ui/separator";
import { AGE_RANGE_OPTIONS } from "../../constants"; // Adjusted import path
import { ensureStringArray } from "./utils";
import { DemographicsFilterControlsProps, OptionType } from "./types";

export function DemographicsFilterControls({
  filters,
  updateFilter,
  isLoading,
  genders,
  races
}: DemographicsFilterControlsProps) {
  return (
    <>
      <MultiSelect
        label="Age Range"
        options={AGE_RANGE_OPTIONS}
        value={ensureStringArray(filters.age)}
        setValue={(value) => updateFilter('age', value)}
        compact={true}
      />
      <Separator className="my-3" />
      <MultiSelect
        label="Gender"
        options={genders as OptionType[]}
        value={ensureStringArray(filters.gender)}
        setValue={(value) => updateFilter('gender', value)}
        isLoading={isLoading}
        compact={true}
      />
      <Separator className="my-3" />
      <MultiSelect
        label="Race"
        options={races as OptionType[]}
        value={ensureStringArray(filters.race)}
        setValue={(value) => updateFilter('race', value)}
        isLoading={isLoading}
        compact={true}
      />
    </>
  );
} 