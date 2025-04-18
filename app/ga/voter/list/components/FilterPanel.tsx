"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ResidenceAddressFilter } from '../ResidenceAddressFilter';
import { FilterState, ResidenceAddressFilterState } from '../types';
import CountyMultiSelect from './CountyMultiSelect';
import DistrictMultiSelect from './DistrictMultiSelect';
import MultiSelect from './MultiSelect';
import { useLookupData } from '../hooks/useLookupData';
import {
  AGE_RANGE_OPTIONS,
  INCOME_LEVEL_OPTIONS,
  EDUCATION_LEVEL_OPTIONS,
  ELECTION_TYPE_OPTIONS
} from '../constants';
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

  return (
    <Card className="w-full h-full overflow-auto">
      <CardContent className="space-y-3 pt-2 px-3">
        {/* Geographic Filters */}
        <div>
          <div className="font-semibold text-xs text-muted-foreground mb-2 uppercase">Geographic</div>
          <div className="space-y-2">
            <div>
              <div className="text-xs font-medium mb-1">County</div>
              <Input 
                placeholder="Search..." 
                className="h-8 text-xs mb-2" 
              />
              <div className="flex items-center mb-1">
                <div className="text-xs ml-1 mr-2 text-muted-foreground">SELECT</div>
                <div className="flex-1 flex justify-end space-x-1">
                  <ChevronLeft className="h-4 w-4 text-gray-400" />
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center">
                  <input type="checkbox" className="mr-2 h-4 w-4" id="county-6" checked />
                  <label htmlFor="county-6" className="text-xs">6</label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" className="mr-2 h-4 w-4" id="county-11" />
                  <label htmlFor="county-11" className="text-xs">11</label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" className="mr-2 h-4 w-4" id="county-14" />
                  <label htmlFor="county-14" className="text-xs">14</label>
                </div>
              </div>
            </div>
            
            <div>
              <div className="text-xs font-medium mb-1">Congressional District</div>
              <Input 
                placeholder="Search..." 
                className="h-8 text-xs" 
              />
              <div className="flex items-center mt-1 mb-1">
                <div className="text-xs ml-1 mr-2 text-muted-foreground">SELECT</div>
                <div className="flex-1 flex justify-end space-x-1">
                  <ChevronLeft className="h-4 w-4 text-gray-400" />
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
            
            {/* More geographic filters can be added here */}
            
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
          <div className="font-semibold text-xs text-muted-foreground mb-2 uppercase">Voter Info</div>
          <div className="space-y-2">
            <div>
              <label className="text-xs font-medium">First Name</label>
              <Input 
                placeholder="Enter first name..." 
                className="h-8 text-xs" 
              />
            </div>
            <div>
              <label className="text-xs font-medium">Last Name</label>
              <Input 
                placeholder="Enter last name..." 
                className="h-8 text-xs" 
              />
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
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium">Registered But Never Voted</label>
              <input type="checkbox" className="form-checkbox h-3 w-3" />
            </div>
            <div>
              <label className="text-xs font-medium">Has Not Voted Since Year</label>
              <Input 
                placeholder="e.g. 2020" 
                type="number" 
                min="1900" 
                max="2100" 
                className="h-8 text-xs"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium">Contacted (No Response)</label>
              <input type="checkbox" className="form-checkbox h-3 w-3" />
            </div>
            <MultiSelect
              label="Voted by Election Type"
              options={ELECTION_TYPE_OPTIONS}
              value={filters.electionType}
              setValue={(value) => updateFilter('electionType', value)}
              compact={true}
            />
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium">Redistricting Affected</label>
              <input type="checkbox" className="form-checkbox h-3 w-3" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default FilterPanel; 