"use client";

import React, { useState } from 'react';
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

  // Add state for address filters
  const [addressFilters, setAddressFilters] = useState<AddressFilter[]>([]);

  // Add state for checkbox selections
  const [neverVoted, setNeverVoted] = useState(false);
  const [contactedNoResponse, setContactedNoResponse] = useState(false);
  const [redistrictingAffected, setRedistrictingAffected] = useState(false);

  // Add address filter handler
  const addAddressFilter = (filter?: AddressFilter) => {
    if (!filter) return;
    
    setAddressFilters(prev => [...prev, filter]);
    
    // Helper function to append to a URL parameter
    const appendToUrlParam = (key: string, value: string) => {
      const url = new URL(window.location.href);
      url.searchParams.append(key, value);
      
      // Update browser URL without reload
      window.history.pushState({}, '', url.toString());
    };
    
    // Update the address filter parameters in the URL for API consumption
    if (filter.residence_street_number) {
      appendToUrlParam('residenceStreetNumber', filter.residence_street_number);
      updateResidenceAddressFilter('residence_street_number', filter.residence_street_number);
    }
    if (filter.residence_pre_direction) {
      appendToUrlParam('residencePreDirection', filter.residence_pre_direction);
      updateResidenceAddressFilter('residence_pre_direction', filter.residence_pre_direction);
    }
    if (filter.residence_street_name) {
      appendToUrlParam('residenceStreetName', filter.residence_street_name);
      updateResidenceAddressFilter('residence_street_name', filter.residence_street_name);
    }
    if (filter.residence_street_type) {
      appendToUrlParam('residenceStreetSuffix', filter.residence_street_type);
      updateResidenceAddressFilter('residence_street_type', filter.residence_street_type);
    }
    if (filter.residence_post_direction) {
      appendToUrlParam('residencePostDirection', filter.residence_post_direction);
      updateResidenceAddressFilter('residence_post_direction', filter.residence_post_direction);
    }
    if (filter.residence_apt_unit_number) {
      appendToUrlParam('residenceAptUnitNumber', filter.residence_apt_unit_number);
      updateResidenceAddressFilter('residence_apt_unit_number', filter.residence_apt_unit_number);
    }
    if (filter.residence_zipcode) {
      appendToUrlParam('residenceZipcode', filter.residence_zipcode);
      updateResidenceAddressFilter('residence_zipcode', filter.residence_zipcode);
    }
    if (filter.residence_city) {
      appendToUrlParam('residenceCity', filter.residence_city);
      updateResidenceAddressFilter('residence_city', filter.residence_city);
    }
  };

  // Remove address filter handler
  const removeAddressFilter = (id: string) => {
    // Find the filter that's being removed
    const filterToRemove = addressFilters.find(filter => filter.id === id);
    
    if (filterToRemove) {
      // Get the current URL parameters
      const url = new URL(window.location.href);
      
      // Remove this filter's values from URL params
      // Note: This is a simplistic approach - more complex handling would be needed
      // for perfect URL param management with multiple overlapping filters
      if (filterToRemove.residence_street_number) {
        const allValues = url.searchParams.getAll('residenceStreetNumber');
        url.searchParams.delete('residenceStreetNumber');
        // Re-add all values except the one being removed
        allValues.filter(v => v !== filterToRemove.residence_street_number)
          .forEach(v => url.searchParams.append('residenceStreetNumber', v));
      }
      
      if (filterToRemove.residence_street_name) {
        const allValues = url.searchParams.getAll('residenceStreetName');
        url.searchParams.delete('residenceStreetName');
        allValues.filter(v => v !== filterToRemove.residence_street_name)
          .forEach(v => url.searchParams.append('residenceStreetName', v));
      }
      
      if (filterToRemove.residence_street_type) {
        const allValues = url.searchParams.getAll('residenceStreetSuffix');
        url.searchParams.delete('residenceStreetSuffix');
        allValues.filter(v => v !== filterToRemove.residence_street_type)
          .forEach(v => url.searchParams.append('residenceStreetSuffix', v));
      }
      
      if (filterToRemove.residence_city) {
        const allValues = url.searchParams.getAll('residenceCity');
        url.searchParams.delete('residenceCity');
        allValues.filter(v => v !== filterToRemove.residence_city)
          .forEach(v => url.searchParams.append('residenceCity', v));
      }
      
      if (filterToRemove.residence_zipcode) {
        const allValues = url.searchParams.getAll('residenceZipcode');
        url.searchParams.delete('residenceZipcode');
        allValues.filter(v => v !== filterToRemove.residence_zipcode)
          .forEach(v => url.searchParams.append('residenceZipcode', v));
      }
      
      // Update the URL without reloading
      window.history.pushState({}, '', url.toString());
    }
    
    setAddressFilters(prev => prev.filter(filter => filter.id !== id));
  };

  // Clear all address filters handler
  const clearAllAddressFilters = () => {
    // Remove all address parameters from the URL
    const url = new URL(window.location.href);
    
    // List of all address-related URL parameters
    const addressParams = [
      'residenceStreetNumber',
      'residenceStreetName',
      'residenceStreetSuffix',
      'residencePreDirection',
      'residencePostDirection',
      'residenceAptUnitNumber',
      'residenceCity',
      'residenceZipcode'
    ];
    
    // Clear all address params
    addressParams.forEach(param => {
      url.searchParams.delete(param);
    });
    
    // Update the URL without reloading
    window.history.pushState({}, '', url.toString());
    
    // Clear the address filters state
    setAddressFilters([]);
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
            filters={residenceAddressFilters}
            setFilter={updateResidenceAddressFilter}
            addressFilters={addressFilters}
            addAddressFilter={addAddressFilter}
            removeAddressFilter={removeAddressFilter}
            clearAllAddressFilters={clearAllAddressFilters}
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
              <label htmlFor="never-voted" className="text-xs font-medium">Registered But Never Voted</label>
              <input 
                id="never-voted"
                type="checkbox" 
                className="form-checkbox h-3 w-3"
                checked={neverVoted}
                onChange={() => setNeverVoted(!neverVoted)}
              />
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
            <div className="flex items-center justify-between">
              <label htmlFor="redistricting-affected" className="text-xs font-medium">Redistricting Affected</label>
              <input 
                id="redistricting-affected"
                type="checkbox" 
                className="form-checkbox h-3 w-3"
                checked={redistrictingAffected}
                onChange={() => setRedistrictingAffected(!redistrictingAffected)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default FilterPanel; 