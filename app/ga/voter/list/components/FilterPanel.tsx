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
import { FilterX, X } from "lucide-react";
import { Button } from '@/components/ui/button';
import { useVoterFilterContext } from '../../VoterFilterProvider';
import { ResidenceAddressFilterState } from '../types';
import { SCORE_RANGES } from '@/lib/participation-score/constants';
import PrecinctFilters from './PrecinctFilters';
import CollapsibleSection from './CollapsibleSection';

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

  // Helper function to ensure filter values are always string arrays
  const ensureStringArray = (value: string | boolean | string[] | undefined): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return [];
  };

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

  // Calculate filter counts for each section
  const getParticipationScoreFilterCount = () => {
    return Array.isArray(filters.scoreRanges) && filters.scoreRanges.length > 0 ? 1 : 0;
  };

  const getGeographicFilterCount = () => {
    let count = 0;
    if (Array.isArray(filters.county) && filters.county.length > 0) count++;
    if (Array.isArray(filters.congressionalDistricts) && filters.congressionalDistricts.length > 0) count++;
    if (Array.isArray(filters.stateSenateDistricts) && filters.stateSenateDistricts.length > 0) count++;
    if (Array.isArray(filters.stateHouseDistricts) && filters.stateHouseDistricts.length > 0) count++;
    if (Array.isArray(filters.countyPrecincts) && filters.countyPrecincts.length > 0) count++;
    if (Array.isArray(filters.municipalPrecincts) && filters.municipalPrecincts.length > 0) count++;
    if (Array.isArray(filters.redistrictingType) && filters.redistrictingType.length > 0) count++;
    return count;
  };

  const getVoterInfoFilterCount = () => {
    let count = 0;
    if (filters.firstName) count++;
    if (filters.lastName) count++;
    if (residenceAddressFilters.length > 0) count++;
    if (Array.isArray(filters.status) && filters.status.length > 0) count++;
    if (Array.isArray(filters.statusReason) && filters.statusReason.length > 0) count++;
    if (Array.isArray(filters.party) && filters.party.length > 0) count++;
    return count;
  };

  const getDemographicsFilterCount = () => {
    let count = 0;
    if (Array.isArray(filters.age) && filters.age.length > 0) count++;
    if (Array.isArray(filters.gender) && filters.gender.length > 0) count++;
    if (Array.isArray(filters.race) && filters.race.length > 0) count++;
    return count;
  };

  const getVotingHistoryFilterCount = () => {
    let count = 0;
    if (Array.isArray(filters.electionType) && filters.electionType.length > 0) count++;
    if (Array.isArray(filters.electionYear) && filters.electionYear.length > 0) count++;
    if (Array.isArray(filters.electionDate) && filters.electionDate.length > 0) count++;
    if (filters.notVotedSinceYear) count++;
    if (Array.isArray(filters.ballotStyle) && filters.ballotStyle.length > 0) count++;
    if (Array.isArray(filters.eventParty) && filters.eventParty.length > 0) count++;
    if (filters.voterEventMethod) count++;
    return count;
  };

  // Get counts for each section
  const participationScoreFilterCount = getParticipationScoreFilterCount();
  const geographicFilterCount = getGeographicFilterCount();
  const voterInfoFilterCount = getVoterInfoFilterCount();
  const demographicsFilterCount = getDemographicsFilterCount();
  const votingHistoryFilterCount = getVotingHistoryFilterCount();

  return (
    <div className="w-full h-full overflow-y-auto">
      {hasActiveFilters() && (
        <div className="px-3 py-2 pt-4 border-b">
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
      
      <div className="space-y-2 pt-2 px-3">
        {/* Participation Score Filter */}
        <CollapsibleSection 
          title="Participation Score" 
          defaultOpen={true}
          filterCount={participationScoreFilterCount}
        >
          <MultiSelect
            label="Participation Score Range"
            options={SCORE_RANGES.map(range => ({ value: range.label, label: range.label }))}
            value={ensureStringArray(filters.scoreRanges)}
            setValue={(value) => updateFilter('scoreRanges', value)}
            compact={true}
          />
        </CollapsibleSection>

        <Separator />
        
        {/* Geographic Filters */}
        <CollapsibleSection 
          title="Geographic Filters" 
          defaultOpen={true}
          filterCount={geographicFilterCount}
        >
          {/* County Filter */}
          <div className="space-y-2">
            <CountyMultiSelect
              value={ensureStringArray(filters.county)}
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
              value={ensureStringArray(filters.congressionalDistricts)}
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
              value={ensureStringArray(filters.stateSenateDistricts)}
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
              value={ensureStringArray(filters.stateHouseDistricts)}
              setValue={(value) => updateFilter('stateHouseDistricts', value)}
              isLoading={isLoading}
              compact={true}
            />
          </div>

          <MultiSelect
            label="Redistricting Type"
            options={REDISTRICTING_TYPE_OPTIONS}
            value={ensureStringArray(filters.redistrictingType)}
            setValue={(value) => updateFilter('redistrictingType', value)}
            compact={true}
          />
        </CollapsibleSection>
        
        <Separator />
        
        {/* Voter Info Filters */}
        <CollapsibleSection 
          title="Voter Info" 
          defaultOpen={true}
          filterCount={voterInfoFilterCount}
        >
          <div className="space-y-3">
            <MultiSelect
              label="Status"
              options={statuses.length > 0 ? statuses : []}
              value={ensureStringArray(filters.status)}
              setValue={(value) => updateFilter('status', value)}
              isLoading={isLoading}
              compact={true}
            />
            
            <MultiSelect
              label="Inactive Status Reasons"
              options={statusReasons.length > 0 ? statusReasons : []}
              value={ensureStringArray(filters.statusReason)}
              setValue={(value) => updateFilter('statusReason', value)}
              isLoading={isLoading}
              compact={true}
            />
            
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
            
            <MultiSelect
              label="Registered Voter Party"
              options={parties.length > 0 ? parties : []}
              value={ensureStringArray(filters.party)}
              setValue={(value) => updateFilter('party', value)}
              isLoading={isLoading}
              compact={true}
            />
          </div>
        </CollapsibleSection>

        <Separator />

        {/* Demographic Filters */}
        <CollapsibleSection 
          title="Demographics" 
          defaultOpen={false}
          filterCount={demographicsFilterCount}
        >
          <div className="space-y-3">
            <MultiSelect
              label="Age Range"
              options={AGE_RANGE_OPTIONS}
              value={ensureStringArray(filters.age)}
              setValue={(value) => updateFilter('age', value)}
              compact={true}
            />
            
            <MultiSelect
              label="Gender"
              options={genders.length > 0 ? genders : []}
              value={ensureStringArray(filters.gender)}
              setValue={(value) => updateFilter('gender', value)}
              isLoading={isLoading}
              compact={true}
            />

            <MultiSelect
              label="Race"
              options={races.length > 0 ? races : []}
              value={ensureStringArray(filters.race)}
              setValue={(value) => updateFilter('race', value)}
              isLoading={isLoading}
              compact={true}
            />
          </div>
        </CollapsibleSection>

        <Separator />

        {/* Voting History Filters */}
        <CollapsibleSection 
          title="Voting History" 
          defaultOpen={false}
          filterCount={votingHistoryFilterCount}
        >
          <div className="space-y-3">
            <MultiSelect
              label="Voted by Election Type"
              options={ELECTION_TYPE_OPTIONS}
              value={ensureStringArray(filters.electionType)}
              setValue={(value) => updateFilter('electionType', value)}
              compact={true}
            />

            <MultiSelect
              label="Election Year"
              options={ELECTION_YEAR_OPTIONS}
              value={ensureStringArray(filters.electionYear)}
              setValue={(value) => updateFilter('electionYear', value)}
              compact={true}
            />

            <DistrictMultiSelect
              label="Election Date"
              options={ELECTION_DATE_OPTIONS}
              value={ensureStringArray(filters.electionDate)}
              setValue={(value) => updateFilter('electionDate', value)}
              compact={true}
              formatLabel={formatDateLabel}
            />

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

            <MultiSelect
              label="Ballot Style"
              options={ballotStyles.length > 0 ? ballotStyles : []}
              value={ensureStringArray(filters.ballotStyle)}
              setValue={(value) => updateFilter('ballotStyle', value)}
              isLoading={isLoading}
              compact={true}
            />

            <MultiSelect
              label="Event Party"
              options={eventParties.length > 0 ? eventParties : []}
              value={ensureStringArray(filters.eventParty)}
              setValue={(value) => updateFilter('eventParty', value)}
              isLoading={isLoading}
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
        </CollapsibleSection>
      </div>
    </div>
  );
}

export default FilterPanel; 