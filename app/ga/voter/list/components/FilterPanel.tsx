"use client";

import React, { useState, useEffect, useRef } from 'react';
import { cn } from "@/lib/utils";
import { FilterX, X, Info } from "lucide-react";
import { Button } from '@/components/ui/button';
import { useVoterFilterContext } from '../../VoterFilterProvider';
import { ResidenceAddressFilterState } from '../types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge";
import { useLookupData } from '../hooks/useLookupData';
import { ParticipationFilterControls } from './filters/ParticipationFilterControls';
import { CountiesFilterControls } from './filters/CountiesFilterControls';
import { DistrictsFilterControls } from './filters/DistrictsFilterControls';
import { GeographicFilterControls } from './filters/GeographicFilterControls';
import { VoterInfoFilterControls } from './filters/VoterInfoFilterControls';
import { DemographicsFilterControls } from './filters/DemographicsFilterControls';
import { ElectionsFilterControls } from './filters/ElectionsFilterControls';
import { CensusDataFilterControls } from './filters/CensusDataFilterControls';
import { getPrecinctLabel } from './PrecinctFilters';
import {
  ensureStringArray,
  formatDateLabel,
  getParticipationScoreFilterCount,
  getCountiesFilterCount,
  getGeographicFilterCount,
  getDistrictsFilterCount,
  getVoterInfoFilterCount,
  getDemographicsFilterCount,
  getVotingHistoryFilterCount,
  getCensusFilterCount
} from './filters/utils';
import {
  INCOME_LEVEL_OPTIONS,
  EDUCATION_LEVEL_OPTIONS,
  UNEMPLOYMENT_RATE_OPTIONS
} from '../constants';
import { sectionColorConfig } from './filters/colorConfig';
import { ActiveBadgeInfo } from './filters/types';

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
    counties,
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

  // State to track selected counties for precincts
  const [selectedCountiesForPrecincts, setSelectedCountiesForPrecincts] = useState<string[]>(
    Array.isArray(filters.county) ? filters.county : []
  );

  // Update selectedCountiesForPrecincts when filters.county changes
  useEffect(() => {
    setSelectedCountiesForPrecincts(Array.isArray(filters.county) ? filters.county : []);
  }, [filters.county]);

  // Handler for county selection changes
  const handleCountySelectionChange = (selectedCounties: string[]) => {
    setSelectedCountiesForPrecincts(selectedCounties);
  };

  // Add address filter handler (from ResidenceAddressFilter component)
  const addAddressFilter = (filter?: Partial<ResidenceAddressFilterState>) => {
    if (!filter) return;
    const newFilterId = filter.id || crypto.randomUUID();
    setResidenceAddressFilters((prev) => [...prev, { ...initialAddressFilterState, ...filter, id: newFilterId }]);
  };
  
  const initialAddressFilterState: ResidenceAddressFilterState = {
    id: '',
    residence_street_number: '',
    residence_pre_direction: '',
    residence_street_name: '',
    residence_street_type: '',
    residence_post_direction: '',
    residence_apt_unit_number: '',
    residence_zipcode: '',
    residence_city: ''
  };

  const removeAddressFilter = (id: string) => {
    setResidenceAddressFilters((prev) => prev.filter((f) => f.id !== id));
  };

  const clearAllAddressFilters = () => {
    setResidenceAddressFilters([]);
  };

  // Get counts for each section
  const participationScoreFilterCount = getParticipationScoreFilterCount(filters);
  const countiesFilterCount = getCountiesFilterCount(filters);
  const geographicFilterCount = getGeographicFilterCount(residenceAddressFilters);
  const districtsFilterCount = getDistrictsFilterCount(filters);
  const voterInfoFilterCount = getVoterInfoFilterCount(filters);
  const demographicsFilterCount = getDemographicsFilterCount(filters);
  const votingHistoryFilterCount = getVotingHistoryFilterCount(filters);
  const censusFilterCount = getCensusFilterCount(filters);

  const activeFiltersHeaderRef = useRef<HTMLDivElement>(null);
  const scrollableContainerRef = useRef<HTMLDivElement>(null);

  // Track which accordion items are open
  const [openItems, setOpenItems] = useState<string[]>(["participation-score"]);
  const previousOpenItems = useRef<string[]>(["participation-score"]);

  const handleAccordionChange = (values: string[]) => { setOpenItems(values); };

  useEffect(() => {
    const newlyOpenedItem = openItems.find(item => !previousOpenItems.current.includes(item));
    if (newlyOpenedItem) {
      const activeHeader = activeFiltersHeaderRef.current;
      const scrollContainer = scrollableContainerRef.current;

      if (!scrollContainer) return;

      const headerHeight = activeHeader ? activeHeader.offsetHeight : 0;
      const scrollPadding = 8;

      setTimeout(() => {
        const triggerElement = document.querySelector(`[data-accordion-id="${newlyOpenedItem}"] button[data-state="open"]`);
        if (triggerElement && triggerElement instanceof HTMLElement) {
          const triggerRect = triggerElement.getBoundingClientRect();
          const containerRect = scrollContainer.getBoundingClientRect();
          const estimatedScrollTop = scrollContainer.scrollTop + triggerRect.top - containerRect.top - headerHeight - scrollPadding;
          scrollContainer.scrollTop = estimatedScrollTop;
        }
      }, 50);

      setTimeout(() => {
        const accordionItemElement = document.querySelector(`[data-accordion-id="${newlyOpenedItem}"]`);
        if (accordionItemElement && accordionItemElement instanceof HTMLElement) {
          const itemTopRelativeToScrollContainer = accordionItemElement.offsetTop;
          const targetScrollTop = itemTopRelativeToScrollContainer - headerHeight - scrollPadding;

          scrollContainer.scrollTo({
            top: Math.max(0, targetScrollTop),
            behavior: 'smooth'
          });
        }
      }, 150);
    }
    previousOpenItems.current = [...openItems];
  }, [openItems]);

  // Function to generate active filter badges
  const getActiveFilterBadges = (): ActiveBadgeInfo[] => {
    const activeBadges: ActiveBadgeInfo[] = [];

    // Voter Info Filters
    if (filters.firstName) {
      activeBadges.push({
        id: 'firstName',
        label: `First Name: ${filters.firstName}`,
        onRemove: () => updateFilter('firstName', ''),
        sectionKey: 'voterInfo'
      });
    }
    if (filters.lastName) {
      activeBadges.push({
        id: 'lastName',
        label: `Last Name: ${filters.lastName}`,
        onRemove: () => updateFilter('lastName', ''),
        sectionKey: 'voterInfo'
      });
    }
    ensureStringArray(filters.status).forEach((value) => {
      activeBadges.push({
        id: `status-${value}`,
        label: `Status: ${value}`,
        onRemove: () => updateFilter('status', ensureStringArray(filters.status).filter(v => v !== value)),
        sectionKey: 'voterInfo'
      });
    });
    ensureStringArray(filters.statusReason).forEach((value) => {
      activeBadges.push({
        id: `statusReason-${value}`,
        label: `Status Reason: ${value}`,
        onRemove: () => updateFilter('statusReason', ensureStringArray(filters.statusReason).filter(v => v !== value)),
        sectionKey: 'voterInfo'
      });
    });
    ensureStringArray(filters.party).forEach((value) => {
      activeBadges.push({
        id: `party-${value}`,
        label: `Party: ${value}`,
        onRemove: () => updateFilter('party', ensureStringArray(filters.party).filter(v => v !== value)),
        sectionKey: 'voterInfo'
      });
    });

    // Residence Address Filters - Now part of Geographic section
    residenceAddressFilters.forEach((filter) => {
      activeBadges.push({
        id: `address-${filter.id}`,
        label: `Address: ${filter.residence_street_number || ''} ${filter.residence_street_name || ''} ${filter.residence_city || ''} ${filter.residence_zipcode || ''}`.trim().replace(/\s{2,}/g, ' '),
        onRemove: () => removeAddressFilter(filter.id),
        sectionKey: 'geographic'
      });
    });

    // Demographics Filters
    ensureStringArray(filters.age).forEach((value) => {
      activeBadges.push({
        id: `age-${value}`,
        label: `Age: ${value}`,
        onRemove: () => updateFilter('age', ensureStringArray(filters.age).filter(v => v !== value)),
        sectionKey: 'demographics'
      });
    });
    ensureStringArray(filters.gender).forEach((value) => {
      activeBadges.push({
        id: `gender-${value}`,
        label: `Gender: ${value}`,
        onRemove: () => updateFilter('gender', ensureStringArray(filters.gender).filter(v => v !== value)),
        sectionKey: 'demographics'
      });
    });
    ensureStringArray(filters.race).forEach((value) => {
      activeBadges.push({
        id: `race-${value}`,
        label: `Race: ${value}`,
        onRemove: () => updateFilter('race', ensureStringArray(filters.race).filter(v => v !== value)),
        sectionKey: 'demographics'
      });
    });

    // Participation Filters
    ensureStringArray(filters.scoreRanges).forEach((value) => activeBadges.push({ id: `scoreRanges-${value}`, label: `Score: ${value}`, onRemove: () => updateFilter('scoreRanges', ensureStringArray(filters.scoreRanges).filter(v => v !== value)), sectionKey: 'participationScore' }));
    if (filters.notVotedSinceYear) activeBadges.push({ id: 'notVotedSinceYear', label: `Not Voted Since: ${filters.notVotedSinceYear}`, onRemove: () => updateFilter('notVotedSinceYear', ''), sectionKey: 'participationScore' });
    if (filters.neverVoted) {
      activeBadges.push({
        id: 'neverVoted',
        label: 'Never Voted: Yes',
        onRemove: () => updateFilter('neverVoted', false),
        sectionKey: 'participationScore'
      });
    }

    // Counties Filters
    ensureStringArray(filters.county).forEach((value) => {
      const countyOption = counties.find((c: { value: string; label: string }) => c.value === value);
      const countyName = countyOption ? countyOption.label.split(' (')[0] : value;
      activeBadges.push({
        id: `county-${value}`,
        label: `County: ${countyName} (${value})`,
        onRemove: () => updateFilter('county', ensureStringArray(filters.county).filter(v => v !== value)),
        sectionKey: 'counties'
      });
    });
    
    ensureStringArray(filters.countyPrecincts).forEach((value) => {
      activeBadges.push({
        id: `countyPrecinct-${value}`,
        label: `County Precinct: ${getPrecinctLabel(value)}`,
        onRemove: () => updateFilter('countyPrecincts', ensureStringArray(filters.countyPrecincts).filter(v => v !== value)),
        sectionKey: 'counties'
      });
    });
    
    ensureStringArray(filters.municipalPrecincts).forEach((value) => {
      activeBadges.push({
        id: `municipalPrecinct-${value}`,
        label: `Municipal Precinct: ${getPrecinctLabel(value)}`,
        onRemove: () => updateFilter('municipalPrecincts', ensureStringArray(filters.municipalPrecincts).filter(v => v !== value)),
        sectionKey: 'counties'
      });
    });

    // District Filters
    ensureStringArray(filters.congressionalDistricts).forEach((value) => {
      activeBadges.push({
        id: `cd-${value}`,
        label: `Cong. District: ${value}`,
        onRemove: () => updateFilter('congressionalDistricts', ensureStringArray(filters.congressionalDistricts).filter(v => v !== value)),
        sectionKey: 'districts'
      });
    });
    ensureStringArray(filters.stateSenateDistricts).forEach((value) => {
      activeBadges.push({
        id: `ssd-${value}`,
        label: `State Senate: ${value}`,
        onRemove: () => updateFilter('stateSenateDistricts', ensureStringArray(filters.stateSenateDistricts).filter(v => v !== value)),
        sectionKey: 'districts'
      });
    });
    ensureStringArray(filters.stateHouseDistricts).forEach((value) => {
      activeBadges.push({
        id: `shd-${value}`,
        label: `State House: ${value}`,
        onRemove: () => updateFilter('stateHouseDistricts', ensureStringArray(filters.stateHouseDistricts).filter(v => v !== value)),
        sectionKey: 'districts'
      });
    });
    
    ensureStringArray(filters.redistrictingType).forEach((value) => {
      activeBadges.push({
        id: `redistrictingType-${value}`,
        label: `Redistricting: ${value}`,
        onRemove: () => updateFilter('redistrictingType', ensureStringArray(filters.redistrictingType).filter(v => v !== value)),
        sectionKey: 'districts'
      });
    });

    // Voting History / Elections Filters
    ensureStringArray(filters.electionType).forEach((value) => activeBadges.push({
      id: `electionType-${value}`,
      label: `Election Type: ${value}`,
      onRemove: () => updateFilter('electionType', ensureStringArray(filters.electionType).filter(v => v !== value)),
      sectionKey: 'votingHistory'
    }));
    ensureStringArray(filters.electionYear).forEach((value) => activeBadges.push({ id: `electionYear-${value}`, label: `Election Year: ${value}`, onRemove: () => updateFilter('electionYear', ensureStringArray(filters.electionYear).filter(v => v !== value)), sectionKey: 'votingHistory' }));
    ensureStringArray(filters.electionDate).forEach((value) => activeBadges.push({ id: `electionDate-${value}`, label: `Election Date: ${formatDateLabel(value)}`, onRemove: () => updateFilter('electionDate', ensureStringArray(filters.electionDate).filter(v => v !== value)), sectionKey: 'votingHistory' }));
    if (filters.electionParticipation === 'satOut' && ensureStringArray(filters.electionDate).length > 0) {
      activeBadges.push({ 
        id: 'electionParticipation', 
        label: 'Sat Out Selected Elections', 
        onRemove: () => updateFilter('electionParticipation', 'turnedOut'), 
        sectionKey: 'votingHistory' 
      });
    }
    ensureStringArray(filters.ballotStyle).forEach((value) => activeBadges.push({ id: `ballotStyle-${value}`, label: `Ballot Style: ${value}`, onRemove: () => updateFilter('ballotStyle', ensureStringArray(filters.ballotStyle).filter(v => v !== value)), sectionKey: 'votingHistory' }));
    ensureStringArray(filters.eventParty).forEach((value) => activeBadges.push({
      id: `eventParty-${value}`,
      label: `Selected Party: ${value}`,
      onRemove: () => updateFilter('eventParty', ensureStringArray(filters.eventParty).filter(v => v !== value)),
      sectionKey: 'votingHistory'
    }));
    if (filters.voterEventMethod) activeBadges.push({ id: 'voterEventMethod', label: `Ballot Cast: ${filters.voterEventMethod}`, onRemove: () => updateFilter('voterEventMethod', ''), sectionKey: 'votingHistory' });

    // Census Data Filters
    ensureStringArray(filters.income).forEach((value) => {
      const option = INCOME_LEVEL_OPTIONS.find((opt: { value: string; label: string }) => opt.value === value);
      activeBadges.push({
        id: `income-${value}`,
        label: `Income: ${option?.label || value}`,
        onRemove: () => updateFilter('income', ensureStringArray(filters.income).filter(v => v !== value)),
        sectionKey: 'census'
      });
    });

    ensureStringArray(filters.education).forEach((value) => {
      const option = EDUCATION_LEVEL_OPTIONS.find((opt: { value: string; label: string }) => opt.value === value);
      activeBadges.push({
        id: `education-${value}`,
        label: `Education: ${option?.label || value}`,
        onRemove: () => updateFilter('education', ensureStringArray(filters.education).filter(v => v !== value)),
        sectionKey: 'census'
      });
    });

    ensureStringArray(filters.unemployment).forEach((value) => {
      const option = UNEMPLOYMENT_RATE_OPTIONS.find((opt: { value: string; label: string }) => opt.value === value);
      activeBadges.push({
        id: `unemployment-${value}`,
        label: `Unemployment: ${option?.label || value}`,
        onRemove: () => updateFilter('unemployment', ensureStringArray(filters.unemployment).filter(v => v !== value)),
        sectionKey: 'census'
      });
    });

    return activeBadges;
  };

  const activeFilterBadges = getActiveFilterBadges();

  return (
    <div className="w-full h-full overflow-y-auto flex flex-col" ref={scrollableContainerRef}>
      <div
        className="px-3 py-3 border-b border-border dark:border-border sticky top-0 bg-background z-10"
        ref={activeFiltersHeaderRef}
      >
        {hasActiveFilters() ? (
          <>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold text-foreground">Active Filters</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                onClick={clearAllFilters}
              >
                <FilterX size={14} className="mr-1.5" />
                Clear All Filters
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeFilterBadges.map((badge) => (
                <Badge
                  key={badge.id}
                  className={cn(
                    "flex items-center gap-1 pr-1 py-0.5 text-xs",
                    sectionColorConfig[badge.sectionKey].badge
                  )}
                >
                  <span>{badge.label}</span>
                  <button
                    type="button"
                    className={cn(
                      "rounded-full p-0.5 focus:outline-none focus:ring-1 focus:ring-ring",
                      "hover:bg-black/10 dark:hover:bg-white/10"
                    )}
                    onClick={badge.onRemove}
                    aria-label={`Remove filter: ${badge.label}`}
                  >
                    <X size={12} className="block" />
                  </button>
                </Badge>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
            <Info size={24} className="mb-2 text-sky-500 dark:text-sky-400" />
            <p className="text-sm">Please select a filter below.</p>
          </div>
        )}
      </div>

      <div className={cn("flex-grow px-3")} >
        <Accordion
          type="multiple"
          className="w-full space-y-1"
          defaultValue={["participation-score"]}
          onValueChange={handleAccordionChange}
        >
          {/* Participation Section */}
          <AccordionItem value="participation-score" data-accordion-id="participation-score">
            <AccordionTrigger className={cn(
              "text-sm font-semibold flex justify-between items-center w-full py-2 px-3 rounded-sm hover:no-underline",
              sectionColorConfig.participationScore.accordionTriggerClasses
            )}>
              <span>Participation</span>
              {participationScoreFilterCount > 0 && (
                <span className={cn("text-xs px-2 py-0.5 rounded-full ml-auto mr-2", sectionColorConfig.participationScore.countBubble)}>
                  {participationScoreFilterCount}
                </span>
              )}
            </AccordionTrigger>
            <AccordionContent className="pt-1 pl-2 space-y-3">
              <ParticipationFilterControls
                filters={filters}
                updateFilter={updateFilter}
                isLoading={isLoading}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Counties Section */}
          <AccordionItem value="counties-filters" data-accordion-id="counties-filters">
            <AccordionTrigger className={cn(
              "text-sm font-semibold flex justify-between items-center w-full py-2 px-3 rounded-sm hover:no-underline",
              sectionColorConfig.counties.accordionTriggerClasses
            )}>
              <span>Counties</span>
              {countiesFilterCount > 0 && (
                <span className={cn("text-xs px-2 py-0.5 rounded-full ml-auto mr-2", sectionColorConfig.counties.countBubble)}>
                  {countiesFilterCount}
                </span>
              )}
            </AccordionTrigger>
            <AccordionContent className="pt-1 pl-2 space-y-3">
              <CountiesFilterControls
                filters={filters}
                updateFilter={updateFilter}
                isLoading={isLoading}
                selectedCounties={selectedCountiesForPrecincts}
                onSelectionChange={handleCountySelectionChange}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Districts Section */}
          <AccordionItem value="districts-filters" data-accordion-id="districts-filters">
            <AccordionTrigger className={cn(
              "text-sm font-semibold flex justify-between items-center w-full py-2 px-3 rounded-sm hover:no-underline",
              sectionColorConfig.districts.accordionTriggerClasses
            )}>
              <span>Districts</span>
              {districtsFilterCount > 0 && (
                <span className={cn("text-xs px-2 py-0.5 rounded-full ml-auto mr-2", sectionColorConfig.districts.countBubble)}>
                  {districtsFilterCount}
                </span>
              )}
            </AccordionTrigger>
            <AccordionContent className="pt-1 pl-2 space-y-3">
              <DistrictsFilterControls
                filters={filters}
                updateFilter={updateFilter}
                isLoading={isLoading}
                congressionalDistricts={congressionalDistricts}
                stateSenateDistricts={stateSenateDistricts}
                stateHouseDistricts={stateHouseDistricts}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Geographic Filters Section */}
          <AccordionItem value="geographic-filters" data-accordion-id="geographic-filters">
            <AccordionTrigger className={cn(
              "text-sm font-semibold flex justify-between items-center w-full py-2 px-3 rounded-sm hover:no-underline",
              sectionColorConfig.geographic.accordionTriggerClasses
            )}>
              <span>Geography</span>
              {geographicFilterCount > 0 && (
                <span className={cn("text-xs px-2 py-0.5 rounded-full ml-auto mr-2", sectionColorConfig.geographic.countBubble)}>
                  {geographicFilterCount}
                </span>
              )}
            </AccordionTrigger>
            <AccordionContent className="pt-1 pl-2 space-y-3">
              <GeographicFilterControls
                filters={filters}
                updateFilter={updateFilter}
                isLoading={isLoading}
                residenceAddressFilters={residenceAddressFilters}
                updateResidenceAddressFilter={updateResidenceAddressFilter}
                addAddressFilter={addAddressFilter}
                removeAddressFilter={removeAddressFilter}
                clearAllAddressFilters={clearAllAddressFilters}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Voter Info Filters */}
          <AccordionItem value="voter-info" data-accordion-id="voter-info">
            <AccordionTrigger className={cn(
              "text-sm font-semibold flex justify-between items-center w-full py-2 px-3 rounded-sm hover:no-underline",
              sectionColorConfig.voterInfo.accordionTriggerClasses
            )}>
              <span>Voter Info</span>
              {voterInfoFilterCount > 0 && (
                <span className={cn("text-xs px-2 py-0.5 rounded-full ml-auto mr-2", sectionColorConfig.voterInfo.countBubble)}>
                  {voterInfoFilterCount}
                </span>
              )}
            </AccordionTrigger>
            <AccordionContent className="pt-1 pl-2 space-y-3">
              <VoterInfoFilterControls
                filters={filters}
                updateFilter={updateFilter}
                isLoading={isLoading}
                statuses={statuses}
                statusReasons={statusReasons}
                parties={parties}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Demographic Filters */}
          <AccordionItem value="demographics" data-accordion-id="demographics">
            <AccordionTrigger className={cn(
              "text-sm font-semibold flex justify-between items-center w-full py-2 px-3 rounded-sm hover:no-underline",
              sectionColorConfig.demographics.accordionTriggerClasses
            )}>
              <span>Demographics</span>
              {demographicsFilterCount > 0 && (
                <span className={cn("text-xs px-2 py-0.5 rounded-full ml-auto mr-2", sectionColorConfig.demographics.countBubble)}>
                  {demographicsFilterCount}
                </span>
              )}
            </AccordionTrigger>
            <AccordionContent className="pt-1 pl-2 space-y-3">
              <DemographicsFilterControls
                filters={filters}
                updateFilter={updateFilter}
                isLoading={isLoading}
                genders={genders}
                races={races}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Elections Section (Formerly Voting History) */}
          <AccordionItem value="voting-history" data-accordion-id="voting-history">
            <AccordionTrigger className={cn(
              "text-sm font-semibold flex justify-between items-center w-full py-2 px-3 rounded-sm hover:no-underline",
              sectionColorConfig.votingHistory.accordionTriggerClasses
            )}>
              <span>Elections</span>
              {votingHistoryFilterCount > 0 && (
                <span className={cn("text-xs px-2 py-0.5 rounded-full ml-auto mr-2", sectionColorConfig.votingHistory.countBubble)}>
                  {votingHistoryFilterCount}
                </span>
              )}
            </AccordionTrigger>
            <AccordionContent className="pt-1 pl-2 space-y-3">
              <ElectionsFilterControls
                filters={filters}
                updateFilter={updateFilter}
                isLoading={isLoading}
                ballotStyles={ballotStyles}
                eventParties={eventParties}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Census Data Filters */}
          <AccordionItem value="census-data" data-accordion-id="census-data">
            <AccordionTrigger className={cn(
              "text-sm font-semibold flex justify-between items-center w-full py-2 px-3 rounded-sm hover:no-underline",
              sectionColorConfig.census.accordionTriggerClasses
            )}>
              <span>Census Data</span>
              {censusFilterCount > 0 && (
                <span className={cn("text-xs px-2 py-0.5 rounded-full ml-auto mr-2", sectionColorConfig.census.countBubble)}>
                  {censusFilterCount}
                </span>
              )}
            </AccordionTrigger>
            <AccordionContent className="pt-1 pl-2 space-y-3">
              <CensusDataFilterControls
                filters={filters}
                updateFilter={updateFilter}
                isLoading={isLoading}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}

export default FilterPanel; 