import React from "react";
import { MultiSelect } from "../MultiSelect";
import { DistrictMultiSelect } from "../DistrictMultiSelect"; // Assuming this is the correct path for DistrictMultiSelect
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  ELECTION_TYPE_OPTIONS,
  ELECTION_YEAR_OPTIONS,
  ELECTION_DATE_OPTIONS
} from "../../constants"; // Adjusted import path
import { ensureStringArray, formatDateLabel } from "./utils";
import { ElectionsFilterControlsProps, OptionType } from "./types";

export function ElectionsFilterControls({
  filters,
  updateFilter,
  isLoading,
  ballotStyles,
  eventParties
}: ElectionsFilterControlsProps) {
  return (
    <>
      <DistrictMultiSelect
        label="Election Date"
        options={ELECTION_DATE_OPTIONS as OptionType[]} // ELECTION_DATE_OPTIONS might need to be {value: string, label: string}[]
        value={ensureStringArray(filters.electionDate)}
        setValue={(value) => updateFilter('electionDate', value)}
        compact={true}
        formatLabel={formatDateLabel}
      />
      <div className="pl-1 pt-1">
        <div className="text-xs font-medium mb-2">Election Participation</div>
        <div className="flex items-center space-x-2">
          <Button
            variant={filters.electionParticipation === 'turnedOut' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateFilter('electionParticipation', 'turnedOut')}
            className="text-xs py-1 px-2 h-auto"
            disabled={ensureStringArray(filters.electionDate).length === 0}
          >
            Turned Out
          </Button>
          <Button
            variant={filters.electionParticipation === 'satOut' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateFilter('electionParticipation', 'satOut')}
            className="text-xs py-1 px-2 h-auto"
            disabled={ensureStringArray(filters.electionDate).length === 0}
          >
            Sat Out
          </Button>
        </div>
        {ensureStringArray(filters.electionDate).length === 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Select election date(s) above to enable this filter
          </p>
        )}
      </div>
      <Separator className="my-3" />
      <MultiSelect
        label="Election Type"
        options={ELECTION_TYPE_OPTIONS as OptionType[]}
        value={ensureStringArray(filters.electionType)}
        setValue={(value) => updateFilter('electionType', value)}
        compact={true}
      />
      <Separator className="my-3" />
      <MultiSelect
        label="Election Year"
        options={ELECTION_YEAR_OPTIONS as OptionType[]}
        value={ensureStringArray(filters.electionYear)}
        setValue={(value) => updateFilter('electionYear', value)}
        compact={true}
      />
      <Separator className="my-3" />
      <MultiSelect
        label="Selected Party"
        options={eventParties as OptionType[]}
        value={ensureStringArray(filters.eventParty)}
        setValue={(value) => updateFilter('eventParty', value)}
        isLoading={isLoading}
        compact={true}
      />
      <Separator className="my-3" />
      <MultiSelect
        label="Ballot Style"
        options={ballotStyles as OptionType[]}
        value={ensureStringArray(filters.ballotStyle)}
        setValue={(value) => updateFilter('ballotStyle', value)}
        isLoading={isLoading}
        compact={true}
      />
      <Separator className="my-3" />
      <div>
        <div className="text-xs font-medium mb-1">Ballot Cast</div>
        <div className="flex flex-wrap gap-2">
          {[{ value: '', label: 'Any' }, { value: 'absentee', label: 'Absentee' }, { value: 'provisional', label: 'Provisional' }, { value: 'supplemental', label: 'Supplemental' }].map(opt => (
            <Button key={opt.value} variant={filters.voterEventMethod === opt.value ? 'default' : 'outline'} size="sm" onClick={() => updateFilter('voterEventMethod', opt.value)} className="text-xs py-1 px-2 h-auto">{opt.label}</Button>
          ))}
        </div>
      </div>
    </>
  );
} 