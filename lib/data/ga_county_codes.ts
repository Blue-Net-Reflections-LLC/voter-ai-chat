/**
 * Georgia County FIPS Codes
 * Source: Based on FIPS codes (last 3 digits) - e.g., https://www2.census.gov/programs-surveys/decennial/2010/partners/pdf/FIPS_StateCounty_Code.pdf
 * Key: Numeric 3-digit FIPS code
 * Value: County Name
 */
export const gaCountyCodeToNameMap = {
	1: "Appling",
	3: "Atkinson",
	5: "Bacon",
	7: "Baker",
	9: "Baldwin",
	11: "Banks",
	13: "Barrow",
	15: "Bartow",
	17: "Ben Hill",
	19: "Berrien",
	21: "Bibb",
	23: "Bleckley",
	25: "Brantley",
	27: "Brooks",
	29: "Bryan",
	31: "Bulloch",
	33: "Burke",
	35: "Butts",
	37: "Calhoun",
	39: "Camden",
	43: "Candler",
	45: "Carroll",
	47: "Catoosa",
	49: "Charlton",
	51: "Chatham",
	53: "Chattahoochee",
	55: "Chattooga",
	57: "Cherokee",
	59: "Clarke",
	61: "Clay",
	63: "Clayton",
	65: "Clinch",
	67: "Cobb",
	69: "Coffee",
	71: "Colquitt",
	73: "Columbia",
	75: "Cook",
	77: "Coweta",
	79: "Crawford",
	81: "Crisp",
	83: "Dade",
	85: "Dawson",
	87: "Decatur",
	89: "DeKalb",
	91: "Dodge",
	93: "Dooly",
	95: "Dougherty",
	97: "Douglas",
	99: "Early",
	101: "Echols",
	103: "Effingham",
	105: "Elbert",
	107: "Emanuel",
	109: "Evans",
	111: "Fannin",
	113: "Fayette",
	115: "Floyd",
	117: "Forsyth",
	119: "Franklin",
	121: "Fulton",
	123: "Gilmer",
	125: "Glascock",
	127: "Glynn",
	129: "Gordon",
	131: "Grady",
	133: "Greene",
	135: "Gwinnett",
	137: "Habersham",
	139: "Hall",
	141: "Hancock",
	143: "Haralson",
	145: "Harris",
	147: "Hart",
	149: "Heard",
	151: "Henry",
	153: "Houston",
	155: "Irwin",
	157: "Jackson",
	159: "Jasper",
	161: "Jeff Davis",
	163: "Jefferson",
	165: "Jenkins",
	167: "Johnson",
	169: "Jones",
	171: "Lamar",
	173: "Lanier",
	175: "Laurens",
	177: "Lee",
	179: "Liberty",
	181: "Lincoln",
	183: "Long",
	185: "Lowndes",
	187: "Lumpkin",
	189: "McDuffie",
	191: "McIntosh",
	193: "Macon",
	195: "Madison",
	197: "Marion",
	199: "Meriwether",
	201: "Miller",
	205: "Mitchell",
	207: "Monroe",
	209: "Montgomery",
	211: "Morgan",
	213: "Murray",
	215: "Muscogee",
	217: "Newton",
	219: "Oconee",
	221: "Oglethorpe",
	223: "Paulding",
	225: "Peach",
	227: "Pickens",
	229: "Pierce",
	231: "Pike",
	233: "Polk",
	235: "Pulaski",
	237: "Putnam",
	239: "Quitman",
	241: "Rabun",
	243: "Randolph",
	245: "Richmond",
	247: "Rockdale",
	249: "Schley",
	251: "Screven",
	253: "Seminole",
	255: "Spalding",
	257: "Stephens",
	259: "Stewart",
	261: "Sumter",
	263: "Talbot",
	265: "Taliaferro",
	267: "Tattnall",
	269: "Taylor",
	271: "Telfair",
	273: "Terrell",
	275: "Thomas",
	277: "Tift",
	279: "Toombs",
	281: "Towns",
	283: "Treutlen",
	285: "Troup",
	287: "Turner",
	289: "Twiggs",
	291: "Union",
	293: "Upson",
	295: "Walker",
	297: "Walton",
	299: "Ware",
	301: "Warren",
	303: "Washington",
	305: "Wayne",
	307: "Webster",
	309: "Wheeler",
	311: "White",
	313: "Whitfield",
	315: "Wilcox",
	317: "Wilkes",
	319: "Wilkinson",
	321: "Worth"
} as const;

// Optional: Create an inverse map (Name -> Code) if needed elsewhere
// export const gaCountyNameToCodeMap = Object.entries(gaCountyCodeToNameMap)
//  .reduce((acc, [code, name]) => {
//    acc[name.toUpperCase().replace(/\s+/g, '')] = code.padStart(3, '0');
//    return acc;
//  }, {} as Record<string, string>); 