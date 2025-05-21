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

export const GENDER_OPTIONS = ["MALE", "FEMALE", "UNKNOWN", "X"]
  .map(gender => ({ value: gender, label: gender }));

export const RACE_OPTIONS = ["White", "Black", "Hispanic", "Asian", "Other"]
  .map(race => ({ value: race, label: race }));

// Import the new census brackets
import { INCOME_BRACKETS, EDUCATION_BRACKETS, UNEMPLOYMENT_BRACKETS } from '@/lib/census/constants';

// Use the INCOME_BRACKETS to create select options
export const INCOME_LEVEL_OPTIONS = INCOME_BRACKETS.map(bracket => ({
  value: bracket.value,
  label: bracket.label
}));

// Use the EDUCATION_BRACKETS to create select options
export const EDUCATION_LEVEL_OPTIONS = EDUCATION_BRACKETS.map(bracket => ({
  value: bracket.value,
  label: bracket.label
}));

// Create the unemployment rate options
export const UNEMPLOYMENT_RATE_OPTIONS = UNEMPLOYMENT_BRACKETS.map(bracket => ({
  value: bracket.value,
  label: bracket.label
}));

// Define the hard-coded election type options
export const ELECTION_TYPE_OPTIONS = [
  { value: 'GENERAL', label: 'GENERAL' },
  { value: 'GENERAL ELECTION RUNOFF', label: 'GENERAL ELECTION RUNOFF' },
  { value: 'GENERAL PRIMARY', label: 'GENERAL PRIMARY' },
  { value: 'GENERAL PRIMARY RUNOFF', label: 'GENERAL PRIMARY RUNOFF' },
  { value: 'NON- PARTISAN', label: 'NON- PARTISAN' },
  { value: 'NON-PARTISAN', label: 'NON-PARTISAN' },
  { value: 'PPP', label: 'PPP' },
  { value: 'RECALL', label: 'RECALL' },
  { value: 'SPECIAL ELECTION', label: 'SPECIAL ELECTION' },
  { value: 'SPECIAL ELECTION RUNOFF', label: 'SPECIAL ELECTION RUNOFF' },
  { value: 'SPECIAL/NON-PARTISAN', label: 'SPECIAL/NON-PARTISAN' },
  { value: 'SPECIAL PRIMARY', label: 'SPECIAL PRIMARY' },
  { value: 'SPECIAL PRIMARY RUNOFF', label: 'SPECIAL PRIMARY RUNOFF' },
  { value: 'STATEWIDE', label: 'STATEWIDE' }
];

export const REDISTRICTING_TYPE_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "congress", label: "Congress" },
  { value: "senate", label: "Senate" },
  { value: "house", label: "House" }
];

export const EVENT_PARTY_OPTIONS = [
  "DEMOCRAT",
  "DEMOCRATIC",
  "N",
  "NON-PARTISAN",
  "REPUBLICAN"
].map(p => ({ value: p, label: p }));

// All election dates in reverse chronological order
export const ELECTION_DATES = [
  "2024-12-03","2024-11-05","2024-10-01","2024-09-24","2024-09-17","2024-06-18","2024-05-21","2024-05-07","2024-04-18","2024-04-09","2024-03-15","2024-03-12","2024-02-14","2024-02-13","2024-01-02",
  "2023-12-15","2023-12-05","2023-11-07","2023-10-31","2023-10-17","2023-09-19","2023-09-05","2023-06-20","2023-06-13","2023-05-16","2023-04-18","2023-03-21","2023-02-28","2023-02-15","2023-01-31","2023-01-03",
  "2022-12-20","2022-12-06","2022-11-08","2022-06-21","2022-05-24","2022-05-03","2022-04-12","2022-04-05","2022-03-15","2022-03-08",
  "2021-11-30","2021-11-02","2021-10-19","2021-09-21","2021-07-13","2021-06-15","2021-04-13","2021-03-16","2021-03-09","2021-02-09","2021-01-05",
  "2020-12-04","2020-12-01","2020-11-03","2020-09-29","2020-08-11","2020-06-09","2020-05-19","2020-03-24","2020-03-03","2020-02-04","2020-01-28",
  "2019-12-03","2019-11-05","2019-10-15","2019-10-01","2019-09-17","2019-09-03","2019-07-16","2019-06-18","2019-04-16","2019-04-09","2019-03-19","2019-03-12","2019-02-12","2019-02-05","2019-01-08",
  "2018-12-18","2018-12-04","2018-11-06","2018-08-21","2018-07-24","2018-06-19","2018-05-22","2018-04-17","2018-03-20","2018-02-13","2018-01-30","2018-01-09",
  "2017-12-05","2017-11-07","2017-09-19","2017-07-18","2017-06-20","2017-05-16","2017-04-18","2017-03-21","2017-01-10",
  "2016-11-08","2016-01-19","2016-01-05",
  "2015-12-01","2015-11-03","2015-10-13","2015-09-15","2015-08-11","2015-07-14","2015-06-16","2015-04-14","2015-03-17","2015-02-03","2015-01-06",
  "2014-12-02","2014-11-04","2014-09-09","2014-07-22","2014-05-20","2014-05-13","2014-04-15","2014-03-18","2014-02-04","2014-01-14","2014-01-07",
  "2013-12-03","2013-11-05","2013-10-15","2013-09-17","2013-06-18","2013-04-16","2013-03-19","2013-03-12","2013-03-05","2013-02-05","2013-01-08",
  "2012-12-04","2012-11-06","2012-08-21","2012-07-31","2012-04-03","2012-03-06","2012-02-07","2012-01-10","2012-01-03",
  "2011-12-06","2011-11-08","2011-10-18","2011-09-20","2011-08-16","2011-07-19","2011-06-21","2011-04-12","2011-03-15","2011-02-15","2011-01-18",
  "2010-12-28","2010-12-07","2010-11-30","2010-11-02","2010-09-21","2010-08-10","2010-07-20","2010-06-08","2010-05-11","2010-04-13","2010-03-16","2010-02-23","2010-02-02","2010-01-05",
  "2009-12-29","2009-12-01","2009-11-03","2009-10-13","2009-09-15","2009-07-14","2009-06-16","2009-04-14","2009-03-17","2009-02-23","2009-01-27",
  "2008-12-30","2008-12-03","2008-12-02","2008-11-18","2008-11-04","2008-10-14","2008-09-30","2008-09-16","2008-08-26","2008-08-05","2008-07-15","2008-06-10","2008-05-13","2008-03-04","2008-02-05","2008-01-08",
  "2007-12-18","2007-12-04","2007-11-06","2007-10-16","2007-09-18","2007-08-14","2007-07-17","2007-06-19","2007-04-17","2007-03-20",
  "2006-12-06","2006-12-05","2006-11-07","2006-09-19","2006-09-12","2006-08-08","2006-07-18","2006-04-18","2006-03-21","2006-01-03",
  "2005-12-06","2005-11-08","2005-10-18","2005-09-27","2005-09-20","2005-08-30","2005-07-12","2005-06-21","2005-04-05","2005-03-15","2004-12-01","2004-11-23","2004-11-02","2004-10-12","2004-09-21","2004-08-24","2004-08-10","2004-07-20","2004-03-23","2004-03-02","2004-02-10","2004-01-20","2004-01-04"
];

// Month names for formatting
const MONTH_NAMES = [
  'January','February','March','April','May','June','July','August','September','October','November','December'
];

export const ELECTION_DATE_OPTIONS = ELECTION_DATES.map(date => {
  const [year, month, day] = date.split('-');
  const mIndex = parseInt(month, 10) - 1;
  const monthName = MONTH_NAMES[mIndex] || month;
  const dayNumber = parseInt(day, 10);
  const label = `${monthName}, ${dayNumber}, ${year}`;
  return { value: date, label };
});

export const ELECTION_YEAR_OPTIONS = Array.from(
  new Set(ELECTION_DATES.map(date => date.split('-')[0]))
)
  .sort((a, b) => Number(b) - Number(a))
  .map(year => ({ value: year, label: year }));

// Ballot Style & Event Party continue
export const BALLOT_STYLE_OPTIONS = [
  "ABSENTEE",
  "ABSENTEE BY MAIL",
  "EARLY",
  "EARLY IN-PERSON",
  "ELECTION DAY (BMD)",
  "ELECTION DAY (PROVISIONAL)",
  "ELECTRONIC BALLOT DELIVERY",
  "IN ELECTRONICALLY",
  "IN PERSON",
  "MAIL IN",
  "MUNICIPAL PAPER BALLOT ELECTIONS",
  "REGULAR"
].map(style => ({ value: style, label: style })); 