"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Filter, Printer, Download, ArrowUpDown } from "lucide-react";

// List of Georgia counties (from system-prompt.md)
const COUNTY_OPTIONS = [
  "Appling", "Atkinson", "Bacon", "Baker", "Baldwin", "Banks", "Barrow", "Bartow", "Ben Hill", "Berrien", "Bibb", "Bleckley", "Brantley", "Brooks", "Bryan", "Bulloch", "Burke", "Butts", "Calhoun", "Camden", "Candler", "Carroll", "Catoosa", "Charlton", "Chatham", "Chattahoochee", "Chattooga", "Cherokee", "Clarke", "Clay", "Clayton", "Clinch", "Cobb", "Coffee", "Colquitt", "Columbia", "Cook", "Coweta", "Crawford", "Crisp", "Dade", "Dawson", "Decatur", "DeKalb", "Dodge", "Dooly", "Dougherty", "Douglas", "Early", "Echols", "Effingham", "Elbert", "Emanuel", "Evans", "Fannin", "Fayette", "Floyd", "Forsyth", "Franklin", "Fulton", "Gilmer", "Glascock", "Glynn", "Gordon", "Grady", "Greene", "Gwinnett", "Habersham", "Hall", "Hancock", "Haralson", "Harris", "Hart", "Heard", "Henry", "Houston", "Irwin", "Jackson", "Jasper", "Jeff Davis", "Jefferson", "Jenkins", "Johnson", "Jones", "Lamar", "Lanier", "Laurens", "Lee", "Liberty", "Lincoln", "Long", "Lowndes", "Lumpkin", "McDuffie", "McIntosh", "Macon", "Madison", "Marion", "Meriwether", "Miller", "Mitchell", "Monroe", "Montgomery", "Morgan", "Murray", "Muscogee", "Newton", "Oconee", "Oglethorpe", "Paulding", "Peach", "Pickens", "Pierce", "Pike", "Polk", "Pulaski", "Putnam", "Quitman", "Rabun", "Randolph", "Richmond", "Rockdale", "Schley", "Screven", "Seminole", "Spalding", "Stephens", "Stewart", "Sumter", "Talbot", "Taliaferro", "Tattnall", "Taylor", "Telfair", "Terrell", "Thomas", "Tift", "Toombs", "Towns", "Treutlen", "Troup", "Turner", "Twiggs", "Union", "Upson", "Walker", "Walton", "Ware", "Warren", "Washington", "Wayne", "Webster", "Wheeler", "White", "Whitfield", "Wilcox", "Wilkes", "Wilkinson", "Worth"
];

// Mock district codes for demonstration
const CONGRESSIONAL_DISTRICTS = ["13001", "13002", "13003", "13004", "13005", "13006", "13007", "13008", "13009", "13010", "13011", "13012", "13013", "13014"];
const STATE_SENATE_DISTRICTS = ["13001", "13002", "13003", "13004", "13005", "13006", "13007", "13008", "13009", "13010", "13011", "13012", "13013", "13014", "13015", "13016", "13017", "13018", "13019", "13020", "13021", "13022", "13023", "13024", "13025", "13026", "13027", "13028", "13029", "13030", "13031", "13032", "13033", "13034", "13035", "13036", "13037", "13038", "13039", "13040", "13041", "13042", "13043", "13044", "13045", "13046", "13047", "13048", "13049", "13050", "13051"];
const STATE_HOUSE_DISTRICTS = ["13001", "13002", "13003", "13004", "13005", "13006", "13007", "13008", "13009", "13010", "13011", "13012", "13013", "13014", "13015", "13016", "13017", "13018", "13019", "13020", "13021", "13022", "13023", "13024", "13025", "13026", "13027", "13028", "13029", "13030", "13031", "13032", "13033", "13034", "13035", "13036", "13037", "13038", "13039", "13040", "13041", "13042", "13043", "13044", "13045", "13046", "13047", "13048", "13049", "13050", "13051", "13052", "13053", "13054", "13055", "13056", "13057", "13058", "13059", "13060", "13061", "13062", "13063", "13064", "13065", "13066", "13067", "13068", "13069", "13070", "13071", "13072", "13073", "13074", "13075", "13076", "13077", "13078", "13079", "13080", "13081", "13082", "13083", "13084", "13085", "13086", "13087", "13088", "13089", "13090", "13091", "13092", "13093", "13094", "13095", "13096", "13097", "13098", "13099", "13100", "13101", "13102", "13103", "13104", "13105", "13106", "13107", "13108", "13109", "13110", "13111", "13112", "13113", "13114", "13115", "13116", "13117", "13118", "13119", "13120", "13121", "13122", "13123", "13124", "13125", "13126", "13127", "13128", "13129", "13130", "13131", "13132", "13133", "13134", "13135", "13136", "13137", "13138", "13139", "13140", "13141", "13142", "13143", "13144", "13145", "13146", "13147", "13148", "13149", "13150", "13151", "13152", "13153", "13154", "13155", "13156", "13157", "13158", "13159", "13160", "13161", "13162", "13163", "13164", "13165", "13166", "13167", "13168", "13169", "13170", "13171", "13172", "13173", "13174", "13175", "13176", "13177", "13178", "13179", "13180", "13181", "13182", "13183", "13184", "13185", "13186", "13187", "13188", "13189", "13190", "13191", "13192", "13193", "13194", "13195", "13196", "13197", "13198", "13199", "13200", "13201", "13202", "13203", "13204", "13205", "13206", "13207", "13208", "13209", "13210", "13211", "13212", "13213", "13214", "13215", "13216", "13217", "13218", "13219", "13220", "13221", "13222", "13223", "13224", "13225", "13226", "13227", "13228", "13229", "13230", "13231", "13232", "13233", "13234", "13235", "13236", "13237", "13238", "13239", "13240", "13241", "13242", "13243", "13244", "13245", "13246", "13247", "13248", "13249", "13250", "13251", "13252", "13253", "13254", "13255", "13256", "13257", "13258", "13259", "13260", "13261", "13262", "13263", "13264", "13265", "13266", "13267", "13268", "13269", "13270", "13271", "13272", "13273", "13274", "13275", "13276", "13277", "13278", "13279", "13280", "13281", "13282", "13283", "13284", "13285", "13286", "13287", "13288", "13289", "13290", "13291", "13292", "13293", "13294", "13295", "13296", "13297", "13298", "13299", "13300", "13301", "13302", "13303", "13304", "13305", "13306", "13307", "13308", "13309", "13310", "13311", "13312", "13313", "13314", "13315", "13316", "13317", "13318", "13319", "13320", "13321", "13322", "13323", "13324", "13325", "13326", "13327", "13328", "13329", "13330", "13331", "13332", "13333", "13334", "13335", "13336", "13337", "13338", "13339", "13340", "13341", "13342", "13343", "13344", "13345", "13346", "13347", "13348", "13349", "13350", "13351", "13352", "13353", "13354", "13355", "13356", "13357", "13358", "13359", "13360", "13361", "13362", "13363", "13364", "13365", "13366", "13367", "13368", "13369", "13370", "13371", "13372", "13373", "13374", "13375", "13376", "13377", "13378", "13379", "13380", "13381", "13382", "13383", "13384", "13385", "13386", "13387", "13388", "13389", "13390", "13391", "13392", "13393", "13394", "13395", "13396", "13397", "13398", "13399", "13400", "13401", "13402", "13403", "13404", "13405", "13406", "13407", "13408", "13409", "13410", "13411", "13412", "13413", "13414", "13415", "13416", "13417", "13418", "13419", "13420", "13421", "13422", "13423", "13424", "13425", "13426", "13427", "13428", "13429", "13430", "13431", "13432", "13433", "13434", "13435", "13436", "13437", "13438", "13439", "13440", "13441", "13442", "13443", "13444", "13445", "13446", "13447", "13448", "13449", "13450", "13451", "13452", "13453", "13454", "13455", "13456", "13457", "13458", "13459", "13460", "13461", "13462", "13463", "13464", "13465", "13466", "13467", "13468", "13469", "13470", "13471", "13472", "13473", "13474", "13475", "13476", "13477", "13478", "13479", "13480", "13481", "13482", "13483", "13484", "13485", "13486", "13487", "13488", "13489", "13490", "13491", "13492", "13493", "13494", "13495", "13496", "13497", "13498", "13499"];

function CountyMultiSelect({ value, setValue }) {
  const [search, setSearch] = useState("");
  // Filtered options: all counties matching search
  const filtered = COUNTY_OPTIONS.filter(
    (c) => c.toLowerCase().includes(search.toLowerCase())
  );
  // For display: selected at top, then all filtered (with checked/unchecked)
  const selected = value.filter((c) => COUNTY_OPTIONS.includes(c));

  // Helper: render a county checkbox (checked if selected)
  function renderCountyCheckbox(county, keyPrefix = "") {
    const checked = value.includes(county);
    return (
      <label key={keyPrefix + county} className={`flex items-center gap-1 text-xs px-2 py-1 rounded cursor-pointer ${checked ? 'bg-muted' : 'hover:bg-muted'}`}
        style={{ marginBottom: '2px' }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={() => {
            if (checked) {
              setValue(value.filter((v) => v !== county));
            } else {
              setValue([...value, county]);
            }
          }}
          className="form-checkbox h-3 w-3"
        />
        {county}
      </label>
    );
  }

  return (
    <div>
      <label className="text-sm font-medium block mb-1">County</label>
      <div className="relative">
        <Input
          placeholder="Search counties..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="mb-2"
        />
        <div className="max-h-48 overflow-y-auto border rounded bg-background shadow p-2">
          {selected.length > 0 && (
            <>
              <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide px-1 pb-1">Selected</div>
              {selected.map(county => renderCountyCheckbox(county, "top-"))}
              <div className="border-t my-2" />
            </>
          )}
          {filtered.map(county => renderCountyCheckbox(county, "list-"))}
          {selected.length === 0 && filtered.length === 0 && <div className="text-xs text-muted-foreground px-2 py-1">No counties found</div>}
        </div>
        {selected.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full"
            onClick={() => setValue([])}
          >
            Clear All
          </Button>
        )}
      </div>
    </div>
  );
}

function DistrictMultiSelect({ label, options, value, setValue }) {
  const [search, setSearch] = useState("");
  // Filtered options: all districts matching search (by display number)
  const filtered = options.filter(
    (code) => {
      const display = code.slice(2).replace(/^0+/, "");
      return display.includes(search.replace(/^0+/, ""));
    }
  );
  const selected = value.filter((c) => options.includes(c));

  function renderDistrictCheckbox(code, keyPrefix = "") {
    const checked = value.includes(code);
    const display = code.slice(2).replace(/^0+/, "");
    return (
      <label key={keyPrefix + code} className={`flex items-center gap-1 text-xs px-2 py-1 rounded cursor-pointer ${checked ? 'bg-muted' : 'hover:bg-muted'}`}
        style={{ marginBottom: '2px' }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={() => {
            if (checked) {
              setValue(value.filter((v) => v !== code));
            } else {
              setValue([...value, code]);
            }
          }}
          className="form-checkbox h-3 w-3"
        />
        {display}
      </label>
    );
  }

  return (
    <div>
      <label className="text-sm font-medium block mb-1">{label}</label>
      <div className="relative">
        <Input
          placeholder={`Search ${label.toLowerCase()}...`}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="mb-2"
        />
        <div className="max-h-48 overflow-y-auto border rounded bg-background shadow p-2">
          {selected.length > 0 && (
            <>
              <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide px-1 pb-1">Selected</div>
              {selected.map(code => renderDistrictCheckbox(code, "top-"))}
              <div className="border-t my-2" />
            </>
          )}
          {filtered.map(code => renderDistrictCheckbox(code, "list-"))}
          {selected.length === 0 && filtered.length === 0 && <div className="text-xs text-muted-foreground px-2 py-1">No districts found</div>}
        </div>
        {selected.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full"
            onClick={() => setValue([])}
          >
            Clear All
          </Button>
        )}
      </div>
    </div>
  );
}

// Inline MultiSelect for non-county/district fields
function MultiSelect({ label, options, value, setValue }) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <label key={opt} className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded cursor-pointer">
            <input
              type="checkbox"
              checked={value.includes(opt)}
              onChange={() => {
                if (value.includes(opt)) {
                  setValue(value.filter((v) => v !== opt));
                } else {
                  setValue([...value, opt]);
                }
              }}
              className="form-checkbox h-3 w-3"
            />
            {opt}
          </label>
        ))}
      </div>
    </div>
  );
}

export default function VoterListPage() {

  // Mock data (placeholder for now)
  const mockVoters = [
    { id: "VOT-12345", name: "Jane Doe", county: "Fulton", status: "Active" },
    { id: "VOT-67890", name: "John Doe", county: "Fulton", status: "Active" },
    { id: "VOT-54321", name: "Emily Doe", county: "Fulton", status: "Inactive" },
    { id: "VOT-98765", name: "Michael Smith", county: "DeKalb", status: "Active" },
    // Add more mock voters as needed
  ];

  // Multi-select filter state (mock, for prototype)
  const [county, setCounty] = useState([]);
  const [congressionalDistricts, setCongressionalDistricts] = useState([]);
  const [stateSenateDistricts, setStateSenateDistricts] = useState([]);
  const [stateHouseDistricts, setStateHouseDistricts] = useState([]);
  const [zip, setZip] = useState([]);
  const [city, setCity] = useState([]);
  const [status, setStatus] = useState([]);
  const [party, setParty] = useState([]);
  const [historyParty, setHistoryParty] = useState([]);
  const [age, setAge] = useState([]);
  const [gender, setGender] = useState([]);
  const [race, setRace] = useState([]);
  const [income, setIncome] = useState([]);
  const [education, setEducation] = useState([]);
  const [electionType, setElectionType] = useState([]);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background p-4 gap-6">

      {/* Filter Panel (Sidebar on larger screens) */}
      <Card className="w-full lg:w-1/4 lg:max-w-xs h-fit sticky top-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter size={20} />
            Filters
          </CardTitle>
          <CardDescription>Refine voter list results.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Geographic Filters */}
          <div>
            <div className="font-semibold text-xs text-muted-foreground mb-2">Geographic</div>
            <div className="space-y-3">
              <CountyMultiSelect value={county} setValue={setCounty} />
              <DistrictMultiSelect
                label="Congressional District"
                options={CONGRESSIONAL_DISTRICTS}
                value={congressionalDistricts}
                setValue={setCongressionalDistricts}
              />
              <DistrictMultiSelect
                label="State Senate District (Upper)"
                options={STATE_SENATE_DISTRICTS}
                value={stateSenateDistricts}
                setValue={setStateSenateDistricts}
              />
              <DistrictMultiSelect
                label="State House District (Lower)"
                options={STATE_HOUSE_DISTRICTS}
                value={stateHouseDistricts}
                setValue={setStateHouseDistricts}
              />
              <div>
                <label className="text-sm font-medium">Street Address</label>
                <Input placeholder="Enter address..." />
              </div>
              <MultiSelect
                label="Zip Code"
                options={["30303", "30309", "30310", "30318"]}
                value={zip}
                setValue={setZip}
              />
              <MultiSelect
                label="City"
                options={["Atlanta", "Decatur", "Marietta", "Duluth"]}
                value={city}
                setValue={setCity}
              />
            </div>
          </div>
          <Separator />
          {/* Voter Info Filters */}
          <div>
            <div className="font-semibold text-xs text-muted-foreground mb-2">Voter Info</div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">First Name</label>
                <Input placeholder="Enter first name..." />
              </div>
              <div>
                <label className="text-sm font-medium">Last Name</label>
                <Input placeholder="Enter last name..." />
              </div>
              <MultiSelect
                label="Status"
                options={["Active", "Inactive"]}
                value={status}
                setValue={setStatus}
              />
              <MultiSelect
                label="Registered Voter Party"
                options={["Democrat", "Republican", "Independent"]}
                value={party}
                setValue={setParty}
              />
              <MultiSelect
                label="Voter History Party"
                options={["Democrat", "Republican", "Independent"]}
                value={historyParty}
                setValue={setHistoryParty}
              />
              <MultiSelect
                label="Age Range"
                options={["18-21", "22-30", "31-40", "41-50", "51-65", "65+"]}
                value={age}
                setValue={setAge}
              />
              <MultiSelect
                label="Gender"
                options={["Male", "Female", "Other"]}
                value={gender}
                setValue={setGender}
              />
              <MultiSelect
                label="Race"
                options={["White", "Black", "Hispanic", "Asian", "Other"]}
                value={race}
                setValue={setRace}
              />
              <MultiSelect
                label="Income Level"
                options={["< $25k", "$25k-$50k", "$50k-$100k", "> $100k"]}
                value={income}
                setValue={setIncome}
              />
              <MultiSelect
                label="Education Level"
                options={["High School", "Some College", "Bachelor's", "Graduate"]}
                value={education}
                setValue={setEducation}
              />
            </div>
          </div>
          <Separator />
          {/* Voting Behavior Filters */}
          <div>
            <div className="font-semibold text-xs text-muted-foreground mb-2">Voting Behavior</div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Registered But Never Voted</label>
                <input type="checkbox" className="form-checkbox h-4 w-4" />
              </div>
              <div>
                <label className="text-sm font-medium">Has Not Voted Since Year</label>
                <Input placeholder="e.g. 2020" type="number" min="1900" max="2100" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Contacted (No Response)</label>
                <input type="checkbox" className="form-checkbox h-4 w-4" />
              </div>
              <MultiSelect
                label="Voted by Election Type"
                options={["General", "Primary", "Runoff", "Special"]}
                value={electionType}
                setValue={setElectionType}
              />
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Redistricting Affected</label>
                <input type="checkbox" className="form-checkbox h-4 w-4" />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
            <Button variant="outline" size="sm">Clear Filters</Button>
        </CardFooter>
      </Card>

      {/* Results Area */}
      <div className="flex-1 flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Voter List Results</CardTitle>
            <CardDescription>Displaying {mockVoters.length} voters.</CardDescription>
            <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" disabled><Printer size={16} className="mr-1"/> Print</Button>
                <Button variant="outline" size="sm" disabled><Download size={16} className="mr-1"/> Download CSV</Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]"><Button variant="ghost" size="sm" disabled>ID <ArrowUpDown size={12} className="ml-1 inline"/></Button></TableHead>
                  <TableHead><Button variant="ghost" size="sm" disabled>Full Name <ArrowUpDown size={12} className="ml-1 inline"/></Button></TableHead>
                  <TableHead><Button variant="ghost" size="sm" disabled>County <ArrowUpDown size={12} className="ml-1 inline"/></Button></TableHead>
                  <TableHead className="text-right"><Button variant="ghost" size="sm" disabled>Status <ArrowUpDown size={12} className="ml-1 inline"/></Button></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockVoters.map((voter) => (
                  <TableRow key={voter.id}>
                    <TableCell className="font-mono text-xs">
                      <a href={`/ga/voter/profile/${voter.id}`} className="text-blue-600 hover:underline">
                        {voter.id}
                      </a>
                    </TableCell>
                    <TableCell className="font-medium">{voter.name}</TableCell>
                    <TableCell>{voter.county}</TableCell>
                    <TableCell className="text-right">{voter.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex items-center justify-between pt-4">
            <span className="text-xs text-muted-foreground">Page 1 of 1</span>
            <div className="flex items-center gap-1">
              <Select defaultValue="25" disabled>
                <SelectTrigger className="w-[70px] h-8">
                    <SelectValue/>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled>
                <ChevronLeft size={16} />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled>
                <ChevronRight size={16} />
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

    </div>
  );
} 