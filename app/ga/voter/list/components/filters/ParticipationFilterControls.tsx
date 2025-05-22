import React, { useState, useEffect } from "react";
import { MultiSelect } from "../MultiSelect";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { SCORE_RANGES } from '@/lib/participation-score/constants';
import { ensureStringArray } from "./utils";
import { ParticipationFilterControlsProps } from "./types";

export function ParticipationFilterControls({ filters, updateFilter }: ParticipationFilterControlsProps) {
  const [notVotedYearInput, setNotVotedYearInput] = useState(filters.notVotedSinceYear || '');

  useEffect(() => {
    setNotVotedYearInput(filters.notVotedSinceYear || '');
  }, [filters.notVotedSinceYear]);

  return (
    <>
      <MultiSelect
        label="Voter Ratings"
        options={SCORE_RANGES.map(range => ({ value: range.label, label: range.label }))}
        value={ensureStringArray(filters.scoreRanges)}
        setValue={(value) => updateFilter('scoreRanges', value)}
        compact={true}
      />
      <Separator className="my-3" />
      <div>
        <label className="text-xs font-medium">Has Not Voted Since Year</label>
        <Input
          placeholder="Enter year (e.g. 2020)..."
          className="h-8 text-xs"
          value={notVotedYearInput}
          onChange={(e) => setNotVotedYearInput(e.target.value)}
          onBlur={() => {
            const year = notVotedYearInput.trim();
            if (year && !isNaN(Number(year))) {
              updateFilter('notVotedSinceYear', year);
            } else {
              setNotVotedYearInput(filters.notVotedSinceYear || '');
            }
          }}
        />
      </div>
      <div>
        <Separator className="my-3 mt-5" />
      </div>
      <div className="flex items-center justify-between space-x-2 pt-1">
        <label htmlFor="never-voted-switch" className="text-xs font-medium">
          Never Voted
        </label>
        <Switch
          id="never-voted-switch"
          checked={filters.neverVoted || false}
          onCheckedChange={(checked) => updateFilter('neverVoted', checked)}
          className="data-[state=checked]:bg-teal-500 dark:data-[state=checked]:bg-teal-600"
        />
      </div>
    </>
  );
} 