"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
  INCOME_LEVEL_OPTIONS,
  EDUCATION_LEVEL_OPTIONS,
  UNEMPLOYMENT_RATE_OPTIONS
} from '../constants';

// Define section keys for consistent usage
type FilterSectionKey = 'participationScore' | 'counties' | 'geographic' | 'voterInfo' | 'demographics' | 'votingHistory' | 'census' | 'districts';

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
  counties: {
    badge: "bg-orange-100 dark:bg-orange-800 text-orange-700 dark:text-orange-200 border border-orange-300 dark:border-orange-600",
    accordionTriggerClasses: "bg-orange-100 dark:bg-orange-800 text-orange-700 dark:text-orange-200 hover:bg-orange-200 dark:hover:bg-orange-700 dark:hover:text-orange-100",
    countBubble: "bg-orange-500 dark:bg-orange-600 text-white dark:text-orange-100",
  },
  geographic: {
    badge: "bg-sky-100 dark:bg-sky-800 text-sky-700 dark:text-sky-200 border border-sky-300 dark:border-sky-600",
    accordionTriggerClasses: "bg-sky-100 dark:bg-sky-800 text-sky-700 dark:text-sky-200 hover:bg-sky-200 dark:hover:bg-sky-700 dark:hover:text-sky-100",
    countBubble: "bg-sky-500 dark:bg-sky-600 text-white dark:text-sky-100",
  },
  districts: {
    badge: "bg-rose-100 dark:bg-rose-800 text-rose-700 dark:text-rose-200 border border-rose-300 dark:border-rose-600",
    accordionTriggerClasses: "bg-rose-100 dark:bg-rose-800 text-rose-700 dark:text-rose-200 hover:bg-rose-200 dark:hover:bg-rose-700 dark:hover:text-rose-100",
    countBubble: "bg-rose-500 dark:bg-rose-600 text-white dark:text-rose-100",
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
  census: {
    badge: "bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-600",
    accordionTriggerClasses: "bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200 hover:bg-indigo-200 dark:hover:bg-indigo-700 dark:hover:text-indigo-100",
    countBubble: "bg-indigo-500 dark:bg-indigo-600 text-white dark:text-indigo-100",
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

  // Helper function to ensure filter values are always string arrays
  const ensureStringArray = (value: string | boolean | string[] | undefined): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return [];
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

  const getCountiesFilterCount = () => {
    let count = 0;
    if (Array.isArray(filters.county) && filters.county.length > 0) count++;
    if (Array.isArray(filters.countyPrecincts) && filters.countyPrecincts.length > 0) count++;
    if (Array.isArray(filters.municipalPrecincts) && filters.municipalPrecincts.length > 0) count++;
    return count;
  };

  const getGeographicFilterCount = () => {
    let count = 0;
    if (residenceAddressFilters.length > 0) count++;
    return count;
  };

  const getDistrictsFilterCount = () => {
    let count = 0;
    if (Array.isArray(filters.congressionalDistricts) && filters.congressionalDistricts.length > 0) count++;
    if (Array.isArray(filters.stateSenateDistricts) && filters.stateSenateDistricts.length > 0) count++;
    if (Array.isArray(filters.stateHouseDistricts) && filters.stateHouseDistricts.length > 0) count++;
    if (Array.isArray(filters.redistrictingType) && filters.redistrictingType.length > 0) count++;
    return count;
  };

  const getVoterInfoFilterCount = () => {
    let count = 0;
    if (filters.firstName) count++;
    if (filters.lastName) count++;
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
    if (filters.electionParticipation === 'satOut') count++;
    if (ensureStringArray(filters.ballotStyle).length > 0) count++;
    if (ensureStringArray(filters.eventParty).length > 0) count++;
    if (filters.voterEventMethod) count++;
    return count;
  };

  const getCensusFilterCount = () => {
    let count = 0;
    if (ensureStringArray(filters.income).length > 0) count++;
    if (ensureStringArray(filters.education).length > 0) count++;
    if (ensureStringArray(filters.unemployment).length > 0) count++;
    return count;
  };

  // Get counts for each section
  const participationScoreFilterCount = getParticipationScoreFilterCount();
  const countiesFilterCount = getCountiesFilterCount();
  const geographicFilterCount = getGeographicFilterCount();
  const districtsFilterCount = getDistrictsFilterCount();
  const voterInfoFilterCount = getVoterInfoFilterCount();
  const demographicsFilterCount = getDemographicsFilterCount();
  const votingHistoryFilterCount = getVotingHistoryFilterCount();
  const censusFilterCount = getCensusFilterCount();

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