"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Filter } from "lucide-react";
import { ResidenceAddressFilter } from '../ResidenceAddressFilter';
import { FilterState, ResidenceAddressFilterState } from '../types';
import CountyMultiSelect from './CountyMultiSelect';
import DistrictMultiSelect from './DistrictMultiSelect';
import MultiSelect from './MultiSelect';
import {
  CONGRESSIONAL_DISTRICTS,
  STATE_SENATE_DISTRICTS,
  STATE_HOUSE_DISTRICTS,
  VOTER_STATUS_OPTIONS,
  PARTY_OPTIONS,
  AGE_RANGE_OPTIONS,
  GENDER_OPTIONS,
  RACE_OPTIONS,
  INCOME_LEVEL_OPTIONS,
  EDUCATION_LEVEL_OPTIONS,
  ELECTION_TYPE_OPTIONS
} from '../constants';

interface FilterPanelProps {
  filters: FilterState;
  residenceAddressFilters: ResidenceAddressFilterState;
  updateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  updateResidenceAddressFilter: (key: keyof ResidenceAddressFilterState, value: string) => void;
  clearAllFilters: () => void;
}

export function FilterPanel({
  filters,
  residenceAddressFilters,
  updateFilter,
  updateResidenceAddressFilter,
  clearAllFilters
}: FilterPanelProps) {
  return (
    <Card className="w-full lg:w-1/4 lg:max-w-xs h-fit sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter size={20} />
          Filters
        </CardTitle>
        <CardDescription>Refine voter list results.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Geographic Filters */}
        <div>
          <div className="font-semibold text-xs text-muted-foreground mb-2">Geographic</div>
          <div className="space-y-3">
            <CountyMultiSelect 
              value={filters.county} 
              setValue={(value) => updateFilter('county', value)} 
            />
            <DistrictMultiSelect
              label="Congressional District"
              options={CONGRESSIONAL_DISTRICTS}
              value={filters.congressionalDistricts}
              setValue={(value) => updateFilter('congressionalDistricts', value)}
            />
            <DistrictMultiSelect
              label="State Senate District (Upper)"
              options={STATE_SENATE_DISTRICTS}
              value={filters.stateSenateDistricts}
              setValue={(value) => updateFilter('stateSenateDistricts', value)}
            />
            <DistrictMultiSelect
              label="State House District (Lower)"
              options={STATE_HOUSE_DISTRICTS}
              value={filters.stateHouseDistricts}
              setValue={(value) => updateFilter('stateHouseDistricts', value)}
            />
            {/* Residence Address Filter */}
            <ResidenceAddressFilter
              filters={residenceAddressFilters}
              setFilter={updateResidenceAddressFilter}
            />
          </div>
        </div>
        <Separator />
        {/* Voter Info Filters */}
        <div>
          <div className="font-semibold text-xs text-muted-foreground mb-2">Voter Info</div>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">First Name</label>
              <Input placeholder="Enter first name..." />
            </div>
            <div>
              <label className="text-sm font-medium">Last Name</label>
              <Input placeholder="Enter last name..." />
            </div>
            <MultiSelect
              label="Status"
              options={VOTER_STATUS_OPTIONS}
              value={filters.status}
              setValue={(value) => updateFilter('status', value)}
            />
            <MultiSelect
              label="Registered Voter Party"
              options={PARTY_OPTIONS}
              value={filters.party}
              setValue={(value) => updateFilter('party', value)}
            />
            <MultiSelect
              label="Voter History Party"
              options={PARTY_OPTIONS}
              value={filters.historyParty}
              setValue={(value) => updateFilter('historyParty', value)}
            />
            <MultiSelect
              label="Age Range"
              options={AGE_RANGE_OPTIONS}
              value={filters.age}
              setValue={(value) => updateFilter('age', value)}
            />
            <MultiSelect
              label="Gender"
              options={GENDER_OPTIONS}
              value={filters.gender}
              setValue={(value) => updateFilter('gender', value)}
            />
            <MultiSelect
              label="Race"
              options={RACE_OPTIONS}
              value={filters.race}
              setValue={(value) => updateFilter('race', value)}
            />
            <MultiSelect
              label="Income Level"
              options={INCOME_LEVEL_OPTIONS}
              value={filters.income}
              setValue={(value) => updateFilter('income', value)}
            />
            <MultiSelect
              label="Education Level"
              options={EDUCATION_LEVEL_OPTIONS}
              value={filters.education}
              setValue={(value) => updateFilter('education', value)}
            />
          </div>
        </div>
        <Separator />
        {/* Voting Behavior Filters */}
        <div>
          <div className="font-semibold text-xs text-muted-foreground mb-2">Voting Behavior</div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Registered But Never Voted</label>
              <input type="checkbox" className="form-checkbox h-4 w-4" />
            </div>
            <div>
              <label className="text-sm font-medium">Has Not Voted Since Year</label>
              <Input placeholder="e.g. 2020" type="number" min="1900" max="2100" />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Contacted (No Response)</label>
              <input type="checkbox" className="form-checkbox h-4 w-4" />
            </div>
            <MultiSelect
              label="Voted by Election Type"
              options={ELECTION_TYPE_OPTIONS}
              value={filters.electionType}
              setValue={(value) => updateFilter('electionType', value)}
            />
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Redistricting Affected</label>
              <input type="checkbox" className="form-checkbox h-4 w-4" />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button variant="outline" size="sm" onClick={clearAllFilters}>Clear Filters</Button>
      </CardFooter>
    </Card>
  );
}

export default FilterPanel; 