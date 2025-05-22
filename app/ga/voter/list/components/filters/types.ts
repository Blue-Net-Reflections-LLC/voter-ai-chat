import { FilterState, ResidenceAddressFilterState } from '../../types';

export type { ResidenceAddressFilterState, FilterState };

// Define section keys for consistent usage
export type FilterSectionKey = 'participationScore' | 'counties' | 'geographic' | 'voterInfo' | 'demographics' | 'votingHistory' | 'census' | 'districts';

// Color configuration for filter sections
export interface SectionColorConfigValue {
  badge: string;
  accordionTriggerClasses: string;
  countBubble: string;
}
export type SectionColorConfig = Record<FilterSectionKey, SectionColorConfigValue>;

export interface ActiveBadgeInfo {
  id: string;
  label: string;
  onRemove: () => void;
  sectionKey: FilterSectionKey;
}

// Base props for all filter control section components
export interface BaseFilterControlsProps {
  filters: FilterState;
  updateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  isLoading?: boolean;
  // sectionColorConfig will be used by FilterPanel.tsx for AccordionTrigger, not passed to these controls
  // sectionKey will be used by FilterPanel.tsx, not passed to these controls
}

// Example for a specific section, others will extend or use BaseFilterControlsProps
export interface ParticipationFilterControlsProps extends BaseFilterControlsProps {
  // Add any specific props for Participation, e.g., SCORE_RANGES if not imported directly
}

export interface CountiesFilterControlsProps extends BaseFilterControlsProps {
  selectedCounties: string[];
  onSelectionChange: (selectedCounties: string[]) => void;
  // countyPrecincts and municipalPrecincts are part of filters: FilterState
}

export interface DistrictsFilterControlsProps extends BaseFilterControlsProps {
  congressionalDistricts: Array<{ value: string; label: string }>;
  stateSenateDistricts: Array<{ value: string; label: string }>;
  stateHouseDistricts: Array<{ value: string; label: string }>;
}

export interface GeographicFilterControlsProps extends BaseFilterControlsProps {
  residenceAddressFilters: ResidenceAddressFilterState[];
  updateResidenceAddressFilter: (id: string, key: keyof Omit<ResidenceAddressFilterState, 'id'>, value: string) => void;
  addAddressFilter: (filter?: Partial<ResidenceAddressFilterState>) => void;
  removeAddressFilter: (id: string) => void;
  clearAllAddressFilters: () => void;
}

export interface VoterInfoFilterControlsProps extends BaseFilterControlsProps {
  statuses: Array<{ value: string; label: string }>;
  statusReasons: Array<{ value: string; label: string }>;
  parties: Array<{ value: string; label: string }>;
}

export interface DemographicsFilterControlsProps extends BaseFilterControlsProps {
  genders: Array<{ value: string; label: string }>;
  races: Array<{ value: string; label: string }>;
}

export interface ElectionsFilterControlsProps extends BaseFilterControlsProps {
  ballotStyles: Array<{ value: string; label: string }>;
  eventParties: Array<{ value: string; label: string }>;
}

export interface CensusDataFilterControlsProps extends BaseFilterControlsProps {}

// Option type for MultiSelect components
export interface OptionType {
  value: string;
  label: string;
}