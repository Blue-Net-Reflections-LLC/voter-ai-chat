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

function CountyMultiSelect({ value, setValue }) {
  const [search, setSearch] = useState("");
  // Filtered options: selected at top, then divider, then unselected filtered
  const filtered = COUNTY_OPTIONS.filter(
    (c) => c.toLowerCase().includes(search.toLowerCase()) || value.includes(c)
  );
  const selected = value.filter((c) => COUNTY_OPTIONS.includes(c));
  const unselected = filtered.filter((c) => !selected.includes(c));

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
              {selected.map((county) => (
                <label key={county} className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded cursor-pointer mb-1">
                  <input
                    type="checkbox"
                    checked
                    onChange={() => setValue(value.filter((v) => v !== county))}
                    className="form-checkbox h-3 w-3"
                  />
                  {county}
                </label>
              ))}
              <div className="border-t my-2" />
            </>
          )}
          {unselected.map((county) => (
            <label key={county} className="flex items-center gap-1 text-xs hover:bg-muted px-2 py-1 rounded cursor-pointer">
              <input
                type="checkbox"
                checked={false}
                onChange={() => setValue([...value, county])}
                className="form-checkbox h-3 w-3"
              />
              {county}
            </label>
          ))}
          {filtered.length === 0 && <div className="text-xs text-muted-foreground px-2 py-1">No counties found</div>}
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
  const [district, setDistrict] = useState([]);
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

  // Helper for rendering multi-select checkboxes
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
              <MultiSelect
                label="District"
                options={["State Senate 39", "State House 58", "Congressional 5"]}
                value={district}
                setValue={setDistrict}
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