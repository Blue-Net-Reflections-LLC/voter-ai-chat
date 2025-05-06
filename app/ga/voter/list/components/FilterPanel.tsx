"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ResidenceAddressFilter } from '../ResidenceAddressFilter';
import CountyMultiSelect from './CountyMultiSelect';
import DistrictMultiSelect from './DistrictMultiSelect';
import MultiSelect from './MultiSelect';
import { useLookupData } from '../hooks/useLookupData';
import {
  AGE_RANGE_OPTIONS,
  INCOME_LEVEL_OPTIONS,
  EDUCATION_LEVEL_OPTIONS,
  REDISTRICTING_TYPE_OPTIONS,
  ELECTION_TYPE_OPTIONS,
  ELECTION_YEAR_OPTIONS,
  ELECTION_DATE_OPTIONS
} from '../constants';
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, FilterX } from "lucide-react";
import { Button } from '@/components/ui/button';
import { useVoterFilterContext } from '../../VoterFilterProvider';
import { ResidenceAddressFilterState } from '../types';
import { SCORE_RANGES } from '@/lib/participation-score/constants';
import PrecinctFilters from './PrecinctFilters';

export function FilterPanel() {
  const {
    filters,
    residenceAddressFilters,
    updateFilter,
    updateResidenceAddressFilter,
    setResidenceAddressFilters,
    clearAllFilters,
    hasActiveFilters
  } = useVoterFilterContext();

  const {
    isLoading,
    error,
    congressionalDistricts,
    stateSenateDistricts,
    stateHouseDistricts,
    parties,
    statuses,
    genders,
    races,
    ballotStyles,
    eventParties,
    statusReasons
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
  const addAddressFilter = (filter?: any) => {
    if (!filter) return;
    setResidenceAddressFilters((prev: any) => [...prev, filter]);
  };

  const removeAddressFilter = (id: string) => {
    setResidenceAddressFilters((prev: any) => prev.filter((f: any) => f.id !== id));
  };

  const clearAllAddressFilters = () => {
    setResidenceAddressFilters([]);
  };

  // Helper function to format YYYY-MM-DD to Month D, YYYY
  const formatDateLabel = (dateString: string): string => {
    try {
      const [year, month, day] = dateString.split('-');
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return dateString; // Fallback to original string on error
    }
  };

  return (
    <Card className="w-full h-full overflow-auto pr-2 custom-scrollbar">
      {hasActiveFilters() && (
        <div className="px-3 py-2 border-b">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 text-xs text-blue-600 hover:text-blue-800 w-full justify-start"
            onClick={clearAllFilters}
          >
            <FilterX size={14} className="mr-1.5" />
            Clear All Filters
          </Button>
        </div>
      )}
      <CardContent className="space-y-3 pt-2 px-3">
        {/* Participation Score Filter */}
        <div className="space-y-2">
          <MultiSelect
            label="Participation Score Range"
            options={SCORE_RANGES.map(range => ({ value: range.label, label: range.label }))}
            value={filters.scoreRanges}
            setValue={(value) => updateFilter('scoreRanges', value)}
            compact={true}
          />
        </div>

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

          {/* Add Precinct Filters component */}
          <PrecinctFilters />

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
            <MultiSelect
              label="Inactive Reasons"
              options={statusReasons}
              value={filters.statusReason}
              setValue={(value) => updateFilter('statusReason', value)}
              isLoading={isLoading}
              compact={true}
            />
            <MultiSelect
              label="Redistricting Affected"
              options={REDISTRICTING_TYPE_OPTIONS}
              value={filters.redistrictingAffectedTypes}
              setValue={(value) => updateFilter('redistrictingAffectedTypes', value)}
              compact={true}
            />
          </div>
        </div>
        <Separator />
        
        {/* Voter Events Filters */}
        <div>
          <div className="font-semibold text-xs text-muted-foreground mb-2 uppercase">Voter Events</div>
          <div className="space-y-2">
            <MultiSelect
              label="Voted by Election Type"
              options={ELECTION_TYPE_OPTIONS}
              value={filters.electionType}
              setValue={(value) => updateFilter('electionType', value)}
              compact={true}
            />
            <MultiSelect
              label="Election Year"
              options={ELECTION_YEAR_OPTIONS}
              value={filters.electionYear}
              setValue={(value) => updateFilter('electionYear', value)}
              compact={true}
            />
            <DistrictMultiSelect
              label="Election Date"
              options={ELECTION_DATE_OPTIONS}
              value={filters.electionDate}
              setValue={(value) => updateFilter('electionDate', value)}
              compact={true}
              formatLabel={formatDateLabel}
            />
            <MultiSelect
              label="Ballot Style"
              options={ballotStyles}
              value={filters.ballotStyle}
              setValue={(value) => updateFilter('ballotStyle', value)}
              compact={true}
            />
            <MultiSelect
              label="Event Party"
              options={eventParties}
              value={filters.eventParty}
              setValue={(value) => updateFilter('eventParty', value)}
              compact={true}
            />
            <div>
              <div className="text-xs font-medium mb-1">Ballot Cast</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: '', label: 'Any' },
                  { value: 'absentee', label: 'Absentee' },
                  { value: 'provisional', label: 'Provisional' },
                  { value: 'supplemental', label: 'Supplemental' }
                ].map(opt => (
                  <Button
                    key={opt.value}
                    variant={filters.voterEventMethod === opt.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('voterEventMethod', opt.value)}
                    className="text-xs py-1 px-2 h-auto"
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default FilterPanel; 