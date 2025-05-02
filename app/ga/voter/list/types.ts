export interface Voter {
  id: string;
  name: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  nameSuffix?: string;
  status: string;
  gender?: string;
  race?: string;
  birthYear?: string;
  age?: number;
  registrationDate?: string;
  lastVoteDate?: string;
  county: string;
  address?: {
    streetNumber?: string;
    streetName?: string;
    streetSuffix?: string;
    preDirection?: string;
    postDirection?: string;
    unitType?: string;
    unitNumber?: string;
    city?: string;
    zipcode?: string;
    fullAddress?: string;
  };
  mailingAddress?: {
    line1?: string;
    line2?: string;
    line3?: string;
    city?: string;
    state?: string;
    zipcode?: string;
    country?: string;
  };
  districts?: {
    congressional?: string;
    stateSenate?: string;
    stateHouse?: string;
  };
  lastContactDate?: string;
}

export interface FilterState {
  county: string[];
  congressionalDistricts: string[];
  stateSenateDistricts: string[];
  stateHouseDistricts: string[];
  scoreRanges: string[];
  status: string[];
  party: string[];
  historyParty: string[];
  age: string[];
  gender: string[];
  race: string[];
  income: string[];
  education: string[];
  electionType: string[];
  electionYear: string[];
  electionDate: string[];
  ballotStyle: string[];
  eventParty: string[];
  voterEventMethod: string;
  firstName: string;
  lastName: string;
  neverVoted: boolean;
  notVotedSinceYear?: string;
  redistrictingAffectedTypes: string[];
  statusReason: string[];
  // Add more filter fields as needed
  [key: string]: string | boolean | string[] | undefined;
}

export interface ResidenceAddressFilterState {
  id: string;
  residence_street_number: string;
  residence_pre_direction: string;
  residence_street_name: string;
  residence_street_type: string;
  residence_post_direction: string;
  residence_apt_unit_number: string;
  residence_zipcode: string;
  residence_city: string;
}

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
}

export interface VoterListState {
  filters: FilterState;
  residenceAddressFilters: ResidenceAddressFilterState[];
  pagination: PaginationState;
  isLoading: boolean;
} 