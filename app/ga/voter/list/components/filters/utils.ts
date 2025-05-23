import { FilterState, ResidenceAddressFilterState } from './types'; // Ensure types are imported

export const ensureStringArray = (value: string | boolean | string[] | number | undefined): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value as string[];
  if (typeof value === 'string') return [value];
  if (typeof value === 'number') return [value.toString()];
  return []; // Should not happen with proper FilterState types, but good for safety
};

export const formatDateLabel = (dateString: string): string => {
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
export const getParticipationScoreFilterCount = (filters: FilterState) => {
  let count = 0;
  if (ensureStringArray(filters.scoreRanges).length > 0) count++;
  if (filters.notVotedSinceYear) count++;
  if (filters.neverVoted) count++;
  return count;
};

export const getCountiesFilterCount = (filters: FilterState) => {
  let count = 0;
  if (Array.isArray(filters.county) && filters.county.length > 0) count++;
  if (Array.isArray(filters.countyPrecincts) && filters.countyPrecincts.length > 0) count++;
  if (Array.isArray(filters.municipalPrecincts) && filters.municipalPrecincts.length > 0) count++;
  return count;
};

export const getGeographicFilterCount = (residenceAddressFilters: ResidenceAddressFilterState[], filters: FilterState) => {
  let count = 0;
  if (residenceAddressFilters.length > 0) count++;
  // Check if radius filter is active
  if (filters.radiusFilter && filters.radiusFilter.trim().length > 0) {
    count++;
  }
  return count;
};

export const getDistrictsFilterCount = (filters: FilterState) => {
  let count = 0;
  if (Array.isArray(filters.congressionalDistricts) && filters.congressionalDistricts.length > 0) count++;
  if (Array.isArray(filters.stateSenateDistricts) && filters.stateSenateDistricts.length > 0) count++;
  if (Array.isArray(filters.stateHouseDistricts) && filters.stateHouseDistricts.length > 0) count++;
  // Ensure 'redistrictingAffectedTypes' is used here if that's the correct filter key
  if (Array.isArray(filters.redistrictingAffectedTypes) && filters.redistrictingAffectedTypes.length > 0) count++;
  return count;
};

export const getVoterInfoFilterCount = (filters: FilterState) => {
  let count = 0;
  if (filters.firstName) count++;
  if (filters.lastName) count++;
  if (Array.isArray(filters.status) && filters.status.length > 0) count++;
  if (Array.isArray(filters.statusReason) && filters.statusReason.length > 0) count++;
  if (Array.isArray(filters.party) && filters.party.length > 0) count++;
  return count;
};

export const getDemographicsFilterCount = (filters: FilterState) => {
  let count = 0;
  if (Array.isArray(filters.age) && filters.age.length > 0) count++;
  if (Array.isArray(filters.gender) && filters.gender.length > 0) count++;
  if (Array.isArray(filters.race) && filters.race.length > 0) count++;
  return count;
};

export const getVotingHistoryFilterCount = (filters: FilterState) => {
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

export const getCensusFilterCount = (filters: FilterState) => {
  let count = 0;
  if (ensureStringArray(filters.income).length > 0) count++;
  if (ensureStringArray(filters.education).length > 0) count++;
  if (ensureStringArray(filters.unemployment).length > 0) count++;
  return count;
}; 