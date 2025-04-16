"use client";

import React from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, User, Vote, Users, Twitter, Facebook, Linkedin, Info, Calendar, Flag, Bookmark } from "lucide-react";

// Mock data (in real app, fetch by voterId)
const mockProfile = {
  id: "VOT-12345",
  name: "Jane Doe",
  avatarUrl: undefined,
  registrationDate: "2005-06-15",
  partyAffiliation: "Democratic",
  address: "123 Peachtree St, Atlanta, GA 30303",
  phone: "(404) 555-1234",
  email: "jane.doe@email.com",
  voterStatus: "Active",
  votingHistory: [
    { electionDate: "2022-11-08", electionType: "General Election", voted: true, method: "In-person" },
    { electionDate: "2022-05-24", electionType: "Primary Election", voted: true, method: "Mail-in" },
    { electionDate: "2020-11-03", electionType: "General Election", voted: true, method: "In-person" },
    { electionDate: "2018-11-06", electionType: "Midterm Election", voted: false, method: undefined },
  ],
  demographics: {
    age: 38,
    gender: "Female",
    ethnicity: "White",
    education: "Bachelor's Degree",
    occupation: "Engineer",
    income: "$80,000 - $100,000",
    languages: ["English", "Spanish"]
  },
  socialMedia: [
    { platform: "Twitter", username: "janedoe", url: "https://twitter.com/janedoe" },
    { platform: "Facebook", username: "jane.doe", url: "https://facebook.com/jane.doe" },
    { platform: "LinkedIn", username: "jane-doe", url: "https://linkedin.com/in/jane-doe" }
  ],
  notes: "Jane is interested in education and environmental policy. Attended the 2022 town hall.",
  tags: ["Tech Voter", "Environmental Issues"]
};

const mockDistrict = {
  name: "GA-05",
  representatives: [
    { name: "Rep. John Smith", role: "US House", party: "Democratic" },
    { name: "Sen. Jane Lee", role: "State Senate", party: "Democratic" },
    { name: "Rep. Mike Brown", role: "State House", party: "Republican" },
  ],
  turnoutRate: "68%",
  avgIncome: "$72,000",
  incomeLevels: [
    { bracket: "<$25k", percent: 12 },
    { bracket: "$25k-$50k", percent: 22 },
    { bracket: "$50k-$75k", percent: 28 },
    { bracket: "$75k-$100k", percent: 20 },
    { bracket: "$100k-$150k", percent: 12 },
    { bracket: "$150k+", percent: 6 },
  ],
  racialBreakdown: [
    { group: "White", percent: 40 },
    { group: "Black", percent: 45 },
    { group: "Hispanic", percent: 10 },
    { group: "Asian", percent: 4 },
    { group: "Other", percent: 1 },
  ],
  ageBreakdown: [
    { group: "18-29", percent: 18 },
    { group: "30-44", percent: 25 },
    { group: "45-64", percent: 35 },
    { group: "65+", percent: 22 },
  ],
  registeredVoters: 102345,
  detailUrl: "/districts/ga-05",
  redistricting: {
    affected: true,
    year: 2021,
    source: "census.gov",
    notes: "District boundaries were redrawn after the 2020 Census."
  }
};

const mockHousehold = [
  { id: "VOT-67890", firstName: "John", lastName: "Doe", age: 42, gender: "M" },
  { id: "VOT-54321", firstName: "Emily", lastName: "Doe", age: 16, gender: "F" },
];
const mockHouseholdIncome = "$120,000";

const SectionHeader = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
  <div className="flex items-center gap-2 mb-2 mt-6 text-primary">
    {icon}
    <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
  </div>
);

const InfoRow = ({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) => (
  <div className="flex items-center gap-2 py-1">
    {icon && <span className="text-muted-foreground">{icon}</span>}
    <span className="text-xs text-muted-foreground w-28 inline-block">{label}:</span>
    <span className="text-sm font-medium">{value}</span>
  </div>
);

export default function VoterProfilePage() {
  const params = useParams();
  const voterId = params?.voterId || mockProfile.id;

  // In a real app, fetch voter data by voterId
  const profile = { ...mockProfile, id: voterId };

  return (
    <div className="flex flex-col items-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-2xl mb-8">
        <CardHeader>
          <CardTitle>Voter Profile</CardTitle>
          <CardDescription>Voter Registration ID: <span className="font-mono text-primary">{voterId}</span></CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4 sm:flex-row">
            <Input
              placeholder="Enter name or address..."
              className="flex-1"
              disabled
            />
            <Button type="submit" disabled>Search</Button>
          </form>
        </CardContent>
      </Card>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Basic Info & Demographics */}
        <div className="space-y-6 lg:col-span-1">
          {/* Voter Info Card */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col gap-1">
                <CardTitle className="text-xl font-bold">{profile.name}</CardTitle>
                <span className="text-xs text-muted-foreground">Voter ID: {profile.id}</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">{profile.voterStatus}</Badge>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/20">{profile.partyAffiliation}</Badge>
                {profile.tags?.map((tag, i) => (
                  <Badge key={i} variant="outline" className="bg-gray-100 dark:bg-gray-800">{tag}</Badge>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <SectionHeader icon={<User size={18} />} title="Contact" />
              <InfoRow label="Address" value={profile.address} icon={<MapPin size={16} />} />
              <InfoRow label="Phone" value={profile.phone} icon={<Phone size={16} />} />
              <InfoRow label="Email" value={profile.email} icon={<Mail size={16} />} />
              <InfoRow label="Registered" value={profile.registrationDate} icon={<Calendar size={16} />} />
            </CardContent>
          </Card>

          {/* Demographics Card */}
          <Card>
            <CardHeader>
              <SectionHeader icon={<Users size={18} />} title="Demographics" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-4">
                <InfoRow label="Age" value={profile.demographics.age} />
                <InfoRow label="Gender" value={profile.demographics.gender} />
                <InfoRow label="Ethnicity" value={profile.demographics.ethnicity} />
                <InfoRow label="Education" value={profile.demographics.education} />
                <InfoRow label="Occupation" value={profile.demographics.occupation} />
                {profile.demographics.languages && (
                  <InfoRow label="Languages" value={profile.demographics.languages.join(", ")} />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Household Voters Card */}
          <Card>
            <CardHeader>
              <SectionHeader icon={<Users size={18} />} title="Household Voters" />
            </CardHeader>
            <CardContent>
              <div className="mb-2 text-sm text-muted-foreground">
                <span className="font-semibold text-primary">Household Income:</span> {mockHouseholdIncome}
              </div>
              {mockHousehold.length > 0 ? (
                <ul className="space-y-2">
                  {mockHousehold.map((voter) => (
                    <li key={voter.id}>
                      <a
                        href={`/ga/voter/profile/${voter.id}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {voter.firstName} {voter.lastName} ({voter.gender === 'M' ? 'Male' : voter.gender === 'F' ? 'Female' : voter.gender}, {voter.age})
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-xs text-muted-foreground">No other registered voters in this household.</span>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Voting History, District Data, Social, Notes */}
        <div className="space-y-6 lg:col-span-2">
          {/* Voting History Card */}
          <Card>
            <CardHeader>
              <SectionHeader icon={<Vote size={18} />} title="Voting History" />
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground">Date</th>
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground">Election</th>
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground">Voted</th>
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground">Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.votingHistory.map((record, i) => (
                      <tr key={i} className="border-b border-border/40 hover:bg-muted/50">
                        <td className="py-3 px-2">{record.electionDate}</td>
                        <td className="py-3 px-2">{record.electionType}</td>
                        <td className="py-3 px-2">{record.voted ? <span className="text-green-600">✓</span> : <span className="text-red-600">✗</span>}</td>
                        <td className="py-3 px-2">{record.method || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* District Data Card */}
          <Card>
            <CardHeader>
              <SectionHeader icon={<MapPin size={18} />} title="District Data" />
            </CardHeader>
            <CardContent>
              <div className="mb-2 flex flex-wrap gap-4 items-center">
                <span className="font-semibold text-primary">{mockDistrict.name}</span>
                <span className="text-xs text-muted-foreground">Registered Voters: {mockDistrict.registeredVoters.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">Turnout Rate: {mockDistrict.turnoutRate}</span>
                <span className="text-xs text-muted-foreground">Avg. Income: {mockDistrict.avgIncome}</span>
                <a href={mockDistrict.detailUrl} className="ml-auto text-xs text-blue-600 hover:underline">View Full District &rarr;</a>
              </div>
              <div className="mb-2">
                <span className="font-semibold text-sm">Representatives:</span>
                <ul className="ml-4 mt-1 list-disc text-sm">
                  {mockDistrict.representatives.map((rep, i) => (
                    <li key={i} className="flex gap-2 items-center">
                      <span>{rep.name}</span>
                      <span className="text-xs text-muted-foreground">({rep.role}, {rep.party})</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <span className="font-semibold text-sm">Racial Breakdown:</span>
                  <ul className="ml-4 mt-1 list-disc text-sm">
                    {mockDistrict.racialBreakdown.map((r, i) => (
                      <li key={i}>{r.group}: <span className="font-semibold">{r.percent}%</span></li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="font-semibold text-sm">Age Breakdown:</span>
                  <ul className="ml-4 mt-1 list-disc text-sm">
                    {mockDistrict.ageBreakdown.map((a, i) => (
                      <li key={i}>{a.group}: <span className="font-semibold">{a.percent}%</span></li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <span className="font-semibold text-sm">Income Levels:</span>
                  <ul className="ml-4 mt-1 list-disc text-sm">
                    {mockDistrict.incomeLevels.map((inc, i) => (
                      <li key={i}>{inc.bracket}: <span className="font-semibold">{inc.percent}%</span></li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-6 p-3 rounded-md border border-dashed border-amber-400 bg-amber-50 dark:bg-amber-900/10">
                <span className="font-semibold text-sm text-amber-700 dark:text-amber-300">Redistricting Info:</span>
                <div className="text-xs mt-1">
                  {mockDistrict.redistricting.affected ? (
                    <>
                      <span className="font-semibold">This district was redrawn in {mockDistrict.redistricting.year}.</span><br />
                      <span>Source: {mockDistrict.redistricting.source} — {mockDistrict.redistricting.notes}</span>
                    </>
                  ) : (
                    <span>No redistricting in the last 4 years.</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Media & Notes Tabs */}
          <Tabs defaultValue="social">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="social">Social Media</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            <TabsContent value="social">
              <Card>
                <CardHeader>
                  <SectionHeader icon={<Info size={18} />} title="Social Media" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.socialMedia.map((profile, i) => (
                      <div key={i} className="flex items-center p-3 rounded-md border border-border/60 hover:border-primary/50 cursor-pointer transition-colors gap-3">
                        <span className="bg-primary/10 p-2 rounded-md">
                          {profile.platform === "Twitter" && <Twitter className="h-4 w-4" />}
                          {profile.platform === "Facebook" && <Facebook className="h-4 w-4" />}
                          {profile.platform === "LinkedIn" && <Linkedin className="h-4 w-4" />}
                        </span>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{profile.platform}</span>
                          <a href={profile.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">@{profile.username}</a>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="notes">
              <Card>
                <CardHeader>
                  <SectionHeader icon={<Flag size={18} />} title="Notes" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-3 mb-4">
                    <span className="p-2 rounded-md bg-amber-500/10"><Bookmark className="h-4 w-4 text-amber-600" /></span>
                    <div>
                      <h4 className="font-medium text-sm">Important Information</h4>
                      <p className="text-sm text-muted-foreground">Notes about this voter's preferences, concerns, and interactions.</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-md border border-border bg-muted/30">
                    {profile.notes || "No notes available for this voter."}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 