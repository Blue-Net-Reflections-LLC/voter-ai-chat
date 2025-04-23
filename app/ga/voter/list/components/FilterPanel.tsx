"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ResidenceAddressFilter, AddressFilter } from '../ResidenceAddressFilter';
import { FilterState, ResidenceAddressFilterState } from '../types';
import CountyMultiSelect from './CountyMultiSelect';
import DistrictMultiSelect from './DistrictMultiSelect';
import MultiSelect from './MultiSelect';
import { useLookupData } from '../hooks/useLookupData';
import {
  AGE_RANGE_OPTIONS,
  INCOME_LEVEL_OPTIONS,
  EDUCATION_LEVEL_OPTIONS,
  ELECTION_TYPE_OPTIONS,
  REDISTRICTING_TYPE_OPTIONS
} from '../constants';
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from '@/components/ui/button';

interface FilterPanelProps {
  filters: FilterState;
  residenceAddressFilters: ResidenceAddressFilterState[];
  updateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  updateResidenceAddressFilter: (id: string, key: keyof Omit<ResidenceAddressFilterState, 'id'>, value: string) => void;
  setResidenceAddressFilters: React.Dispatch<React.SetStateAction<ResidenceAddressFilterState[]>>;
  clearAllFilters: () => void;
}

export function FilterPanel({
  filters,
  residenceAddressFilters,
  updateFilter,
  updateResidenceAddressFilter,
  setResidenceAddressFilters,
  clearAllFilters
}: FilterPanelProps) {
  const { 
    isLoading, 
    error, 
    congressionalDistricts, 
    stateSenateDistricts, 
    stateHouseDistricts,
    parties,
    statuses,
    genders,
    races
  } = useLookupData();

  // Local state for name inputs (for Apply button)
  const [firstNameInput, setFirstNameInput] = useState(filters.firstName || '');
  const [lastNameInput, setLastNameInput] = useState(filters.lastName || '');

  // Add state for checkbox selections
  const [neverVoted, setNeverVoted] = useState(false);
  const [contactedNoResponse, setContactedNoResponse] = useState(false);
  const [notVotedYearInput, setNotVotedYearInput] = useState(filters.notVotedSinceYear || '');

  // When filters prop changes (e.g., Clear All), sync local inputs
  useEffect(() => {
    setFirstNameInput(filters.firstName || '');
    setLastNameInput(filters.lastName || '');
    setNotVotedYearInput(filters.notVotedSinceYear || '');
  }, [filters.firstName, filters.lastName, filters.notVotedSinceYear]);

  // Add address filter handler (from ResidenceAddressFilter component)
  const addAddressFilter = (filter?: AddressFilter) => {
    if (!filter) return;
    setResidenceAddressFilters(prev => [...prev, filter as ResidenceAddressFilterState]);
  };

  const removeAddressFilter = (id: string) => {
    setResidenceAddressFilters(prev => prev.filter(f => f.id !== id));
  };

  const clearAllAddressFilters = () => {
    setResidenceAddressFilters([]);
  };

  return (
    <Card className="w-full h-full overflow-auto">
      <CardContent className="space-y-3 pt-2 px-3">
        {/* Geographic Filters */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Geographic Filters</h3>

          {/* County Filter */}
          <div className="space-y-2">
            <CountyMultiSelect
              value={filters.county}
              setValue={(value) => updateFilter('county', value)}
              isLoading={isLoading}
              compact={true}
            />
          </div>

          {/* Congressional District Filter */}
          <div className="space-y-2">
            <DistrictMultiSelect
              label="Congressional District"
              options={congressionalDistricts.length > 0 ? congressionalDistricts : []}
              value={filters.congressionalDistricts}
              setValue={(value) => updateFilter('congressionalDistricts', value)}
              isLoading={isLoading}
              compact={true}
            />
          </div>

          {/* State Senate District Filter */}
          <div className="space-y-2">
            <DistrictMultiSelect
              label="State Senate District"
              options={stateSenateDistricts.length > 0 ? stateSenateDistricts : []}
              value={filters.stateSenateDistricts}
              setValue={(value) => updateFilter('stateSenateDistricts', value)}
              isLoading={isLoading}
              compact={true}
            />
          </div>

          {/* State House District Filter */}
          <div className="space-y-2">
            <DistrictMultiSelect
              label="State House District"
              options={stateHouseDistricts.length > 0 ? stateHouseDistricts : []}
              value={filters.stateHouseDistricts}
              setValue={(value) => updateFilter('stateHouseDistricts', value)}
              isLoading={isLoading}
              compact={true}
            />
          </div>

          {/* Residence Address Filter */}
          <ResidenceAddressFilter
            addressFilters={residenceAddressFilters}
            addAddressFilter={addAddressFilter}
            removeAddressFilter={removeAddressFilter}
            clearAllAddressFilters={clearAllAddressFilters}
            updateAddressFilter={(id, field, value) => {
              updateResidenceAddressFilter(id, field as keyof Omit<ResidenceAddressFilterState, 'id'>, value);
            }}
          />
        </div>
        <Separator />
        
        {/* Voter Info Filters */}
        <div>
          <div className="font-semibold text-xs text-muted-foreground mb-2 uppercase">Voter Info</div>
          <div className="space-y-2">
            <div>
              <label className="text-xs font-medium">First Name</label>
              <Input
                placeholder="Enter first name..."
                className="h-8 text-xs"
                value={firstNameInput}
                onChange={(e)=>setFirstNameInput(e.target.value)}
                onBlur={() => updateFilter('firstName', firstNameInput.trim())}
              />
            </div>
            <div>
              <label className="text-xs font-medium">Last Name</label>
              <Input
                placeholder="Enter last name..."
                className="h-8 text-xs"
                value={lastNameInput}
                onChange={(e)=>setLastNameInput(e.target.value)}
                onBlur={() => updateFilter('lastName', lastNameInput.trim())}
              />
              {/* Apply button visible on mobile or always */}
              <Button
                size="sm"
                className="mt-2"
                onClick={() => {
                  updateFilter('firstName', firstNameInput.trim());
                  updateFilter('lastName', lastNameInput.trim());
                }}
              >
                Apply Name Filter
              </Button>
            </div>
            <MultiSelect
              label="Status"
              options={statuses.length > 0 ? statuses : []}
              value={filters.status}
              setValue={(value) => updateFilter('status', value)}
              isLoading={isLoading}
              compact={true}
            />
            <MultiSelect
              label="Registered Voter Party"
              options={parties.length > 0 ? parties : []}
              value={filters.party}
              setValue={(value) => updateFilter('party', value)}
              isLoading={isLoading}
              compact={true}
            />
            <MultiSelect
              label="Voter History Party"
              options={parties.length > 0 ? parties : []}
              value={filters.historyParty}
              setValue={(value) => updateFilter('historyParty', value)}
              isLoading={isLoading}
              compact={true}
            />
            <MultiSelect
              label="Age Range"
              options={AGE_RANGE_OPTIONS}
              value={filters.age}
              setValue={(value) => updateFilter('age', value)}
              compact={true}
            />
            <MultiSelect
              label="Gender"
              options={genders.length > 0 ? genders : []}
              value={filters.gender}
              setValue={(value) => updateFilter('gender', value)}
              isLoading={isLoading}
              compact={true}
            />
            <MultiSelect
              label="Race"
              options={races.length > 0 ? races : []}
              value={filters.race}
              setValue={(value) => updateFilter('race', value)}
              isLoading={isLoading}
              compact={true}
            />
            <MultiSelect
              label="Income Level"
              options={INCOME_LEVEL_OPTIONS}
              value={filters.income}
              setValue={(value) => updateFilter('income', value)}
              compact={true}
            />
            <MultiSelect
              label="Education Level"
              options={EDUCATION_LEVEL_OPTIONS}
              value={filters.education}
              setValue={(value) => updateFilter('education', value)}
              compact={true}
            />
          </div>
        </div>
        <Separator />
        
        {/* Voting Behavior Filters */}
        <div>
          <div className="font-semibold text-xs text-muted-foreground mb-2 uppercase">Voting Behavior</div>
          <div className="space-y-2">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="never-voted" className="text-xs font-medium">Registered But Never Voted</label>
                <input
                  id="never-voted"
                  type="checkbox"
                  className="form-checkbox h-3 w-3"
                  checked={neverVoted}
                  onChange={() => {
                    setNeverVoted(!neverVoted);
                    updateFilter('neverVoted', !neverVoted);
                  }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground italic">Note: this filter is resource‑intensive and may take several seconds to load.</span>
            </div>
            <div>
              <label className="text-xs font-medium">Has Not Voted Since Year</label>
              <Input
                placeholder="e.g. 2020"
                type="number"
                min="1900"
                max="2100"
                value={notVotedYearInput}
                onChange={(e) => setNotVotedYearInput(e.target.value)}
                onBlur={() => updateFilter('notVotedSinceYear', notVotedYearInput.trim())}
                className="h-8 text-xs"
              />
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="contacted-no-response" className="text-xs font-medium">Contacted (No Response)</label>
              <input 
                id="contacted-no-response"
                type="checkbox" 
                className="form-checkbox h-3 w-3"
                checked={contactedNoResponse}
                onChange={() => setContactedNoResponse(!contactedNoResponse)}
              />
            </div>
            <MultiSelect
              label="Voted by Election Type"
              options={ELECTION_TYPE_OPTIONS}
              value={filters.electionType}
              setValue={(value) => updateFilter('electionType', value)}
              compact={true}
            />
            <MultiSelect
              label="Redistricting Affected"
              options={REDISTRICTING_TYPE_OPTIONS}
              value={filters.redistrictingAffectedTypes}
              setValue={(value) => {
                if (value.includes('any')) {
                  updateFilter('redistrictingAffectedTypes', ['any']);
                } else {
                  const filtered = value.filter(v => v !== 'any');
                  updateFilter('redistrictingAffectedTypes', filtered);
                }
              }}
              compact={true}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default FilterPanel; 