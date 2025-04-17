export interface Voter {
  id: string;
  name: string;
  county: string;
  status: string;
  // Add more fields as needed for actual data model
}

export interface FilterState {
  county: string[];
  congressionalDistricts: string[];
  stateSenateDistricts: string[];
  stateHouseDistricts: string[];
  status: string[];
  party: string[];
  historyParty: string[];
  age: string[];
  gender: string[];
  race: string[];
  income: string[];
  education: string[];
  electionType: string[];
  // Add more filter fields as needed
}

export interface ResidenceAddressFilterState {
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
  residenceAddressFilters: ResidenceAddressFilterState;
  pagination: PaginationState;
  isLoading: boolean;
} 