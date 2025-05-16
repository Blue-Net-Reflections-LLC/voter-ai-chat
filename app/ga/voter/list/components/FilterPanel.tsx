"use client";

import React, { useState, useEffect, useRef } from 'react';
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
import { FilterX, X, Info } from "lucide-react";
import { Button } from '@/components/ui/button';
import { useVoterFilterContext } from '../../VoterFilterProvider';
import { ResidenceAddressFilterState } from '../types';
import { SCORE_RANGES } from '@/lib/participation-score/constants';
import PrecinctFilters from './PrecinctFilters';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

// Define section keys for consistent usage
type FilterSectionKey = 'participationScore' | 'geographic' | 'voterInfo' | 'demographics' | 'votingHistory';

// Color Configuration for Filter Sections
const sectionColorConfig: Record<FilterSectionKey, {
  badge: string;
  accordionTriggerClasses: string;
  countBubble: string;
}> = {
  participationScore: {
    badge: "bg-teal-100 dark:bg-teal-800 text-teal-700 dark:text-teal-200 border border-teal-300 dark:border-teal-600",
    accordionTriggerClasses: "bg-teal-100 dark:bg-teal-800 text-teal-700 dark:text-teal-200 hover:bg-teal-200 dark:hover:bg-teal-700 dark:hover:text-teal-100",
    countBubble: "bg-teal-500 dark:bg-teal-600 text-white dark:text-teal-100",
  },
  geographic: {
    badge: "bg-sky-100 dark:bg-sky-800 text-sky-700 dark:text-sky-200 border border-sky-300 dark:border-sky-600",
    accordionTriggerClasses: "bg-sky-100 dark:bg-sky-800 text-sky-700 dark:text-sky-200 hover:bg-sky-200 dark:hover:bg-sky-700 dark:hover:text-sky-100",
    countBubble: "bg-sky-500 dark:bg-sky-600 text-white dark:text-sky-100",
  },
  voterInfo: {
    badge: "bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-600",
    accordionTriggerClasses: "bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-200 hover:bg-emerald-200 dark:hover:bg-emerald-700 dark:hover:text-emerald-100",
    countBubble: "bg-emerald-500 dark:bg-emerald-600 text-white dark:text-emerald-100",
  },
  demographics: {
    badge: "bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 border border-purple-300 dark:border-purple-600",
    accordionTriggerClasses: "bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-700 dark:hover:text-purple-100",
    countBubble: "bg-purple-500 dark:bg-purple-600 text-white dark:text-purple-100",
  },
  votingHistory: {
    badge: "bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-200 border border-amber-300 dark:border-amber-600",
    accordionTriggerClasses: "bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-700 dark:hover:text-amber-100",
    countBubble: "bg-amber-500 dark:bg-amber-600 text-white dark:text-amber-100",
  },
};

interface ActiveBadgeInfo {
  id: string;
  label: string;
  onRemove: () => void;
  sectionKey: FilterSectionKey;
}

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
    let count = 0;
    if (ensureStringArray(filters.scoreRanges).length > 0) count++;
    if (filters.notVotedSinceYear) count++;
    if (filters.neverVoted) count++;
    return count;
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
    if (ensureStringArray(filters.electionType).length > 0) count++;
    if (ensureStringArray(filters.electionYear).length > 0) count++;
    if (ensureStringArray(filters.electionDate).length > 0) count++;
    if (ensureStringArray(filters.ballotStyle).length > 0) count++;
    if (ensureStringArray(filters.eventParty).length > 0) count++;
    if (filters.voterEventMethod) count++;
    return count;
  };

  // Get counts for each section
  const participationScoreFilterCount = getParticipationScoreFilterCount();
  const geographicFilterCount = getGeographicFilterCount();
  const voterInfoFilterCount = getVoterInfoFilterCount();
  const demographicsFilterCount = getDemographicsFilterCount();
  const votingHistoryFilterCount = getVotingHistoryFilterCount();

  const activeFiltersHeaderRef = useRef<HTMLDivElement>(null);
  const scrollableContainerRef = useRef<HTMLDivElement>(null);

  // Track which accordion items are open
  const [openItems, setOpenItems] = useState<string[]>(["participation-score", "geographic-filters", "voter-info"]);
  const previousOpenItems = useRef<string[]>(["participation-score", "geographic-filters", "voter-info"]);
  
  const handleAccordionChange = (values: string[]) => { setOpenItems(values); };

  useEffect(() => {
    const newlyOpenedItem = openItems.find(item => !previousOpenItems.current.includes(item));
    if (newlyOpenedItem) {
      const activeHeader = activeFiltersHeaderRef.current;
      const scrollContainer = scrollableContainerRef.current;
      
      if (!scrollContainer) return;

      const headerHeight = activeHeader ? activeHeader.offsetHeight : 0;
      const scrollPadding = 8; // Small padding

      // Phase 1: Attempt to quickly position near the target
      setTimeout(() => {
        const triggerElement = document.querySelector(`[data-accordion-id="${newlyOpenedItem}"] button[data-state="open"]`);
        if (triggerElement && triggerElement instanceof HTMLElement) {
          const triggerRect = triggerElement.getBoundingClientRect();
          const containerRect = scrollContainer.getBoundingClientRect();
          // Estimate scroll position to bring trigger top to just below sticky header
          const estimatedScrollTop = scrollContainer.scrollTop + triggerRect.top - containerRect.top - headerHeight - scrollPadding;
          scrollContainer.scrollTop = estimatedScrollTop;
        }
      }, 50); // Short delay for this phase
      
      // Phase 2: More precise smooth scrolling to the accordion item itself
      setTimeout(() => {
        const accordionItemElement = document.querySelector(`[data-accordion-id="${newlyOpenedItem}"]`);
        if (accordionItemElement && accordionItemElement instanceof HTMLElement) {
          const itemTopRelativeToScrollContainer = accordionItemElement.offsetTop;
          const targetScrollTop = itemTopRelativeToScrollContainer - headerHeight - scrollPadding;

          scrollContainer.scrollTo({
            top: Math.max(0, targetScrollTop), // Ensure not scrolling to negative values
            behavior: 'smooth'
          });
        }
      }, 150); // Reduced delay slightly, ensure it's after accordion animation starts but before phase 1 might be too jarring
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

    // Residence Address Filters
    residenceAddressFilters.forEach((filter) => {
      activeBadges.push({
        id: `address-${filter.id}`,
        label: `Address: ${filter.residence_street_number || ''} ${filter.residence_street_name || ''} ${filter.residence_city || ''} ${filter.residence_zipcode || ''}`.trim().replace(/\s{2,}/g, ' '),
        onRemove: () => removeAddressFilter(filter.id),
        sectionKey: 'voterInfo'
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

    // Geographic Filters
    ensureStringArray(filters.county).forEach((value) => {
      activeBadges.push({
        id: `county-${value}`,
        label: `County: ${value}`,
        onRemove: () => updateFilter('county', ensureStringArray(filters.county).filter(v => v !== value)),
        sectionKey: 'geographic'
      });
    });
    ensureStringArray(filters.congressionalDistricts).forEach((value) => {
       activeBadges.push({
        id: `cd-${value}`,
        label: `Cong. District: ${value}`,
        onRemove: () => updateFilter('congressionalDistricts', ensureStringArray(filters.congressionalDistricts).filter(v => v !== value)),
        sectionKey: 'geographic'
      });
    });
     ensureStringArray(filters.stateSenateDistricts).forEach((value) => {
       activeBadges.push({
        id: `ssd-${value}`,
        label: `State Senate: ${value}`,
        onRemove: () => updateFilter('stateSenateDistricts', ensureStringArray(filters.stateSenateDistricts).filter(v => v !== value)),
        sectionKey: 'geographic'
      });
    });
    ensureStringArray(filters.stateHouseDistricts).forEach((value) => {
       activeBadges.push({
        id: `shd-${value}`,
        label: `State House: ${value}`,
        onRemove: () => updateFilter('stateHouseDistricts', ensureStringArray(filters.stateHouseDistricts).filter(v => v !== value)),
        sectionKey: 'geographic'
      });
    });
     ensureStringArray(filters.redistrictingType).forEach((value) => {
      activeBadges.push({
        id: `redistrictingType-${value}`,
        label: `Redistricting: ${value}`,
        onRemove: () => updateFilter('redistrictingType', ensureStringArray(filters.redistrictingType).filter(v => v !== value)),
        sectionKey: 'geographic'
      });
    });
     // countyPrecincts and municipalPrecincts might be more complex if they are { county: string, precincts: string[] }
     // For now, assuming they are simple string arrays for precinct names/IDs if directly filterable this way.
     // If they are structured, this part needs adjustment.
    ensureStringArray(filters.countyPrecincts).forEach((value) => {
      activeBadges.push({
        id: `countyPrecinct-${value}`,
        label: `County Precinct: ${value}`, // Adjust label if needed
        onRemove: () => updateFilter('countyPrecincts', ensureStringArray(filters.countyPrecincts).filter(v => v !== value)),
        sectionKey: 'geographic'
      });
    });
    ensureStringArray(filters.municipalPrecincts).forEach((value) => {
      activeBadges.push({
        id: `municipalPrecinct-${value}`,
        label: `Municipal Precinct: ${value}`, // Adjust label if needed
        onRemove: () => updateFilter('municipalPrecincts', ensureStringArray(filters.municipalPrecincts).filter(v => v !== value)),
        sectionKey: 'geographic'
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
    ensureStringArray(filters.ballotStyle).forEach((value) => activeBadges.push({ id: `ballotStyle-${value}`, label: `Ballot Style: ${value}`, onRemove: () => updateFilter('ballotStyle', ensureStringArray(filters.ballotStyle).filter(v => v !== value)), sectionKey: 'votingHistory' }));
    ensureStringArray(filters.eventParty).forEach((value) => activeBadges.push({ 
        id: `eventParty-${value}`,
        label: `Selected Party: ${value}`,
        onRemove: () => updateFilter('eventParty', ensureStringArray(filters.eventParty).filter(v => v !== value)), 
        sectionKey: 'votingHistory' 
    }));
    if (filters.voterEventMethod) activeBadges.push({ id: 'voterEventMethod', label: `Ballot Cast: ${filters.voterEventMethod}`, onRemove: () => updateFilter('voterEventMethod', ''), sectionKey: 'votingHistory' });
    
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
          defaultValue={["participation-score", "geographic-filters", "voter-info"]}
          onValueChange={handleAccordionChange}
        >
          {/* Participation Section - Renamed Header and Input Label, Moved Filter In */}
          <AccordionItem value="participation-score" data-accordion-id="participation-score">
            <AccordionTrigger className={cn(
              "text-sm font-semibold flex justify-between items-center w-full py-3 px-1 rounded-sm hover:no-underline",
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
              {/* Never Voted Switch */}
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
            </AccordionContent>
          </AccordionItem>

          {/* Geographic Filters Section - Renamed Header */}
          <AccordionItem value="geographic-filters" data-accordion-id="geographic-filters">
            <AccordionTrigger className={cn(
              "text-sm font-semibold flex justify-between items-center w-full py-3 px-1 rounded-sm hover:no-underline",
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
              {/* County Filter */}
              <div className="space-y-2">
                <CountyMultiSelect
                  value={ensureStringArray(filters.county)}
                  setValue={(value) => updateFilter('county', value)}
                  isLoading={isLoading}
                  compact={true}
                />
              </div>
              <Separator className="my-3" />

              {/* Add Precinct Filters component */}
              <PrecinctFilters />
              <Separator className="my-3" />

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
              <Separator className="my-3" />

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
              <Separator className="my-3" />

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
              <Separator className="my-3" />

              <MultiSelect
                label="Redistricting Type"
                options={REDISTRICTING_TYPE_OPTIONS}
                value={ensureStringArray(filters.redistrictingType)}
                setValue={(value) => updateFilter('redistrictingType', value)}
                compact={true}
              />
            </AccordionContent>
          </AccordionItem>
          
          {/* Voter Info Filters */}
          <AccordionItem value="voter-info" data-accordion-id="voter-info">
            <AccordionTrigger className={cn(
              "text-sm font-semibold flex justify-between items-center w-full py-3 px-1 rounded-sm hover:no-underline",
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
              <div className="space-y-3">
                <MultiSelect
                  label="Status"
                  options={statuses.length > 0 ? statuses : []}
                  value={ensureStringArray(filters.status)}
                  setValue={(value) => updateFilter('status', value)}
                  isLoading={isLoading}
                  compact={true}
                />
                                <Separator className="my-3" />

                <MultiSelect
                  label="Inactive Status Reasons"
                  options={statusReasons.length > 0 ? statusReasons : []}
                  value={ensureStringArray(filters.statusReason)}
                  setValue={(value) => updateFilter('statusReason', value)}
                  isLoading={isLoading}
                  compact={true}
                />
                                <Separator className="my-3" />

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
                <Separator className="my-3" />
                <ResidenceAddressFilter
                  addressFilters={residenceAddressFilters}
                  addAddressFilter={addAddressFilter}
                  removeAddressFilter={removeAddressFilter}
                  clearAllAddressFilters={clearAllAddressFilters}
                  updateAddressFilter={(id, field, value) => {
                    updateResidenceAddressFilter(id, field as keyof Omit<ResidenceAddressFilterState, 'id'>, value);
                  }}
                />
                        <Separator className="my-3" />
        
                <MultiSelect
                  label="Registered Voter Party"
                  options={parties.length > 0 ? parties : []}
                  value={ensureStringArray(filters.party)}
                  setValue={(value) => updateFilter('party', value)}
                  isLoading={isLoading}
                  compact={true}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Demographic Filters */}
          <AccordionItem value="demographics" data-accordion-id="demographics">
            <AccordionTrigger className={cn(
              "text-sm font-semibold flex justify-between items-center w-full py-3 px-1 rounded-sm hover:no-underline",
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
              <div className="space-y-3">
                <MultiSelect
                  label="Age Range"
                  options={AGE_RANGE_OPTIONS}
                  value={ensureStringArray(filters.age)}
                  setValue={(value) => updateFilter('age', value)}
                  compact={true}
                />
                                <Separator className="my-3" />

                <MultiSelect
                  label="Gender"
                  options={genders.length > 0 ? genders : []}
                  value={ensureStringArray(filters.gender)}
                  setValue={(value) => updateFilter('gender', value)}
                  isLoading={isLoading}
                  compact={true}
                />
                <Separator className="my-3" />

                <MultiSelect
                  label="Race"
                  options={races.length > 0 ? races : []}
                  value={ensureStringArray(filters.race)}
                  setValue={(value) => updateFilter('race', value)}
                  isLoading={isLoading}
                  compact={true}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Elections Section (Formerly Voting History) - Renamed Header, Reordered Filters, Renamed Label */}
          <AccordionItem value="voting-history" data-accordion-id="voting-history">
            <AccordionTrigger className={cn(
                "text-sm font-semibold flex justify-between items-center w-full py-3 px-1 rounded-sm hover:no-underline",
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
              <div className="space-y-3">
                <DistrictMultiSelect 
                  label="Election Date" 
                  options={ELECTION_DATE_OPTIONS} 
                  value={ensureStringArray(filters.electionDate)} 
                  setValue={(value) => updateFilter('electionDate', value)} 
                  compact={true} 
                  formatLabel={formatDateLabel}
                />
                                <Separator className="my-3" />

                <MultiSelect 
                  label="Election Type"
                  options={ELECTION_TYPE_OPTIONS} 
                  value={ensureStringArray(filters.electionType)} 
                  setValue={(value) => updateFilter('electionType', value)} 
                  compact={true}
                />
                                <Separator className="my-3" />

                <MultiSelect 
                  label="Election Year" 
                  options={ELECTION_YEAR_OPTIONS} 
                  value={ensureStringArray(filters.electionYear)} 
                  setValue={(value) => updateFilter('electionYear', value)} 
                  compact={true}
                />
                                <Separator className="my-3" />

                <MultiSelect 
                  label="Selected Party"
                  options={eventParties.length > 0 ? eventParties : []} 
                  value={ensureStringArray(filters.eventParty)} 
                  setValue={(value) => updateFilter('eventParty', value)} 
                  isLoading={isLoading} 
                  compact={true}
                />
                                <Separator className="my-3" />

                <MultiSelect 
                  label="Ballot Style" 
                  options={ballotStyles.length > 0 ? ballotStyles : []} 
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
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}

export default FilterPanel; 