// List of Georgia counties
export const COUNTY_OPTIONS = [
  "Appling", "Atkinson", "Bacon", "Baker", "Baldwin", "Banks", "Barrow", "Bartow", "Ben Hill", "Berrien", "Bibb", "Bleckley", "Brantley", "Brooks", "Bryan", "Bulloch", "Burke", "Butts", "Calhoun", "Camden", "Candler", "Carroll", "Catoosa", "Charlton", "Chatham", "Chattahoochee", "Chattooga", "Cherokee", "Clarke", "Clay", "Clayton", "Clinch", "Cobb", "Coffee", "Colquitt", "Columbia", "Cook", "Coweta", "Crawford", "Crisp", "Dade", "Dawson", "Decatur", "DeKalb", "Dodge", "Dooly", "Dougherty", "Douglas", "Early", "Echols", "Effingham", "Elbert", "Emanuel", "Evans", "Fannin", "Fayette", "Floyd", "Forsyth", "Franklin", "Fulton", "Gilmer", "Glascock", "Glynn", "Gordon", "Grady", "Greene", "Gwinnett", "Habersham", "Hall", "Hancock", "Haralson", "Harris", "Hart", "Heard", "Henry", "Houston", "Irwin", "Jackson", "Jasper", "Jeff Davis", "Jefferson", "Jenkins", "Johnson", "Jones", "Lamar", "Lanier", "Laurens", "Lee", "Liberty", "Lincoln", "Long", "Lowndes", "Lumpkin", "McDuffie", "McIntosh", "Macon", "Madison", "Marion", "Meriwether", "Miller", "Mitchell", "Monroe", "Montgomery", "Morgan", "Murray", "Muscogee", "Newton", "Oconee", "Oglethorpe", "Paulding", "Peach", "Pickens", "Pierce", "Pike", "Polk", "Pulaski", "Putnam", "Quitman", "Rabun", "Randolph", "Richmond", "Rockdale", "Schley", "Screven", "Seminole", "Spalding", "Stephens", "Stewart", "Sumter", "Talbot", "Taliaferro", "Tattnall", "Taylor", "Telfair", "Terrell", "Thomas", "Tift", "Toombs", "Towns", "Treutlen", "Troup", "Turner", "Twiggs", "Union", "Upson", "Walker", "Walton", "Ware", "Warren", "Washington", "Wayne", "Webster", "Wheeler", "White", "Whitfield", "Wilcox", "Wilkes", "Wilkinson", "Worth"
].map(county => ({ value: county, label: county }));

// Mock district codes for demonstration
export const CONGRESSIONAL_DISTRICTS = ["13001", "13002", "13003", "13004", "13005", "13006", "13007", "13008", "13009", "13010", "13011", "13012", "13013", "13014"]
  .map(district => ({ value: district, label: district }));

export const STATE_SENATE_DISTRICTS = ["13001", "13002", "13003", "13004", "13005", "13006", "13007", "13008", "13009", "13010", "13011", "13012", "13013", "13014", "13015", "13016", "13017", "13018", "13019", "13020", "13021", "13022", "13023", "13024", "13025", "13026", "13027", "13028", "13029", "13030", "13031", "13032", "13033", "13034", "13035", "13036", "13037", "13038", "13039", "13040", "13041", "13042", "13043", "13044", "13045", "13046", "13047", "13048", "13049", "13050", "13051"]
  .map(district => ({ value: district, label: district }));

// For brevity, including just a subset of the state house districts
export const STATE_HOUSE_DISTRICTS = ["13001", "13002", "13003", "13004", "13005", "13006", "13007", "13008", "13009", "13010", "13011", "13012", "13013", "13014", "13015", "13016", "13017", "13018", "13019", "13020"]
  .map(district => ({ value: district, label: district }));

// Other constants
export const VOTER_STATUS_OPTIONS = ["Active", "Inactive"]
  .map(status => ({ value: status, label: status }));

export const PARTY_OPTIONS = ["Democrat", "Republican", "Independent"]
  .map(party => ({ value: party, label: party }));

export const AGE_RANGE_OPTIONS = [
  { value: '18-23', label: '18-23' },
  { value: '25-44', label: '25-44' },
  { value: '45-64', label: '45-64' },
  { value: '65-74', label: '65-74' },
  { value: '75+', label: '75+' },
];

export const GENDER_OPTIONS = ["Male", "Female", "Other"]
  .map(gender => ({ value: gender, label: gender }));

export const RACE_OPTIONS = ["White", "Black", "Hispanic", "Asian", "Other"]
  .map(race => ({ value: race, label: race }));

export const INCOME_LEVEL_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export const EDUCATION_LEVEL_OPTIONS = [
  { value: 'high_school', label: 'High School' },
  { value: 'some_college', label: 'Some College' },
  { value: 'bachelors', label: "Bachelor's" },
  { value: 'graduate', label: 'Graduate' },
];

// Define the hard-coded election type options
export const ELECTION_TYPE_OPTIONS = [
  { value: 'GENERAL', label: 'General' },
  { value: 'GENERAL ELECTION RUNOFF', label: 'General Election Runoff' },
  { value: 'GENERAL PRIMARY', label: 'General Primary' },
  { value: 'GENERAL PRIMARY RUNOFF', label: 'General Primary Runoff' },
  { value: 'NON- PARTISAN', label: 'Non-Partisan' }, // Note: Two variations exist in list
  { value: 'NON-PARTISAN', label: 'Non-Partisan' },
  { value: 'PPP', label: 'PPP' }, // Presidential Preference Primary?
  { value: 'RECALL', label: 'Recall' },
  { value: 'SPECIAL ELECTION', label: 'Special Election' },
  { value: 'SPECIAL ELECTION RUNOFF', label: 'Special Election Runoff' },
  { value: 'SPECIAL/NON-PARTISAN', label: 'Special/Non-Partisan' },
  { value: 'SPECIAL PRIMARY', label: 'Special Primary' },
  { value: 'SPECIAL PRIMARY RUNOFF', label: 'Special Primary Runoff' },
  { value: 'STATEWIDE', label: 'Statewide' },
].reduce((acc, current) => { // De-duplicate labels
  if (!acc.some(item => item.label === current.label)) {
    acc.push(current);
  }
  return acc;
}, [] as { value: string, label: string }[]);

export const REDISTRICTING_TYPE_OPTIONS = [
  { value: "congress", label: "Congress" },
  { value: "senate", label: "Senate" },
  { value: "house", label: "House" }
]; 