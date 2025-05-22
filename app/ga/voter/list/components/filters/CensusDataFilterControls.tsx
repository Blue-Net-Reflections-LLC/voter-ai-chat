import React from "react";
import { MultiSelect } from "../MultiSelect";
import { Separator } from "@/components/ui/separator";
import {
  INCOME_LEVEL_OPTIONS,
  EDUCATION_LEVEL_OPTIONS,
  UNEMPLOYMENT_RATE_OPTIONS
} from "../../constants"; // Adjusted import path
import { ensureStringArray } from "./utils";
import { CensusDataFilterControlsProps, OptionType } from "./types";

export function CensusDataFilterControls({
  filters,
  updateFilter
  // isLoading is not used here, so it can be removed if not needed by BaseFilterControlsProps
}: CensusDataFilterControlsProps) {
  return (
    <>
      <MultiSelect
        label="Income Brackets"
        options={INCOME_LEVEL_OPTIONS as OptionType[]}
        value={ensureStringArray(filters.income)}
        setValue={(value) => updateFilter('income', value)}
        compact={true}
      />
      <Separator className="my-3" />
      <MultiSelect
        label="Bachelor's Degree Rates"
        options={EDUCATION_LEVEL_OPTIONS as OptionType[]}
        value={ensureStringArray(filters.education)}
        setValue={(value) => updateFilter('education', value)}
        compact={true}
      />
      <Separator className="my-3" />
      <MultiSelect
        label="Unemployment Rate"
        options={UNEMPLOYMENT_RATE_OPTIONS as OptionType[]}
        value={ensureStringArray(filters.unemployment)}
        setValue={(value) => updateFilter('unemployment', value)}
        compact={true}
      />
    </>
  );
} 