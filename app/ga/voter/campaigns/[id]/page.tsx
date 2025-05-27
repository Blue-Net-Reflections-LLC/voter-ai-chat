"use client";

import React, { useState } from 'react';
import { ArrowLeft, Users, Phone, MapPin, Mail, Monitor, Calendar, Target, TrendingUp, AlertCircle, CheckCircle, Clock, MessageSquare, BarChart3, Settings, Download, MoreVertical, Play, Pause, Edit, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

// Mock data for the in-flight campaign with 25% completion
const mockCampaignDetails = {
  id: '1',
  name: 'GOTV Drive 2024',
  description: 'Get out the vote campaign for November 2024 election targeting key demographics across metro Atlanta',
  type: 'GOTV',
  status: 'ACTIVE',
  campaignManager: 'Sarah Johnson',
  startDate: '2024-10-01',
  endDate: '2024-11-05',
  createdAt: '2024-09-25',
  
  // Progress metrics showing 25% completion
  targetContacts: 2552, // Total across all filter results (206 + 1456 + 890)
  completedContacts: 413, // 25% completion of first two filters
  contactRate: 16.2, // 413 / 2552
  
  // Response metrics
  positiveResponses: 68,
  neutralResponses: 22,
  negativeResponses: 10,
  
  // Team metrics
  totalVolunteers: 12,
  activeVolunteers: 8,
  totalVolunteerHours: 156,
  
  // Timeline
  daysRemaining: 8,
  daysElapsed: 27,
  totalDays: 35,
  
  // Filter results showing multiple voter groups with realistic complexity
  filterResults: [
    {
      id: 'filter-1',
      name: 'AI-Generated: "Working-Age Black Voters in GA-13/14"',
      description: 'Black voters aged 25-44, income $25k-$75k, never voted, in Congressional Districts 13 & 14',
      filterCriteria: {
        congressionalDistricts: ['GA-13', 'GA-14'],
        ageRange: '25-44',
        race: 'Black',
        income: ['$25k-$50k', '$50k-$75k'],
        neverVoted: true
      },
      filterUrl: '/ga/voter/list?congressionalDistricts=1314&ageRange=25-44&race=Black&income=50k_75k&income=25k_50k&neverVoted=true',
      totalVoters: 206,
      contactedVoters: 52, // 25% of 206
      contactRate: 25.2,
      positiveResponses: 71,
      lastUpdated: '2024-10-28T14:30:00Z',
      status: 'ACTIVE',
      aiGenerated: true
    },
    {
      id: 'filter-2', 
      name: 'Custom: "High-Turnout Suburban Families"',
      description: 'Families in Cobb/Gwinnett counties, ages 35-55, income $75k+, voted in last 2 elections',
      filterCriteria: {
        counties: ['Cobb', 'Gwinnett'],
        ageRange: '35-55',
        income: ['$75k-$100k', '$100k+'],
        votingHistory: 'consistent_recent',
        householdType: 'family'
      },
      filterUrl: '/ga/voter/list?counties=cobb,gwinnett&ageRange=35-55&income=75k_100k&income=100k_plus&votingPattern=consistent',
      totalVoters: 1456,
      contactedVoters: 361, // 25% of 1456  
      contactRate: 24.8,
      positiveResponses: 62,
      lastUpdated: '2024-10-28T16:15:00Z',
      status: 'ACTIVE',
      aiGenerated: false
    },
    {
      id: 'filter-3',
      name: 'AI-Generated: "Young Professional Persuadables"', 
      description: 'College-educated voters 22-35, mixed voting history, urban/suburban areas',
      filterCriteria: {
        ageRange: '22-35',
        education: 'college_plus',
        votingHistory: 'sporadic',
        residenceType: ['urban', 'suburban'],
        sentimentScore: 'neutral'
      },
      filterUrl: '/ga/voter/list?ageRange=22-35&education=college&votingPattern=sporadic&sentiment=neutral',
      totalVoters: 890,
      contactedVoters: 0, // Not started yet
      contactRate: 0,
      positiveResponses: 0,
      lastUpdated: '2024-10-28T10:00:00Z',
      status: 'PENDING',
      aiGenerated: true
    }
  ],
  
  // Recent activity
  recentActivity: [
    {
      id: '1',
      type: 'contact',
      message: 'Mike Chen completed 12 phone calls in Cobb County filter',
      timestamp: '2024-10-28T16:45:00Z',
      volunteer: 'Mike Chen',
      filterResult: 'Young voters in Cobb County'
    },
    {
      id: '2',
      type: 'milestone',
      message: 'Campaign reached 25% completion milestone',
      timestamp: '2024-10-28T15:30:00Z'
    },
    {
      id: '3',
      type: 'volunteer',
      message: 'Jessica Rodriguez joined the campaign team',
      timestamp: '2024-10-28T14:20:00Z',
      volunteer: 'Jessica Rodriguez'
    },
    {
      id: '4',
      type: 'contact',
      message: 'Lisa Park completed door-to-door visits in Fulton County',
      timestamp: '2024-10-28T13:15:00Z',
      volunteer: 'Lisa Park',
      filterResult: 'Never voted active voters'
    }
  ],
  
  // Contact methods breakdown
  contactMethods: {
    phone: { attempted: 645, successful: 423, rate: 65.6 },
    door: { attempted: 312, successful: 198, rate: 63.5 },
    email: { attempted: 156, successful: 89, rate: 57.1 },
    text: { attempted: 89, successful: 67, rate: 75.3 }
  },
  
  // Volunteer performance
  volunteerList: [
    {
      id: '1',
      name: 'Mike Chen',
      contactsToday: 12,
      contactsTotal: 89,
      successRate: 72,
      hoursWorked: 23,
      status: 'ACTIVE',
      lastActive: '2024-10-28T16:45:00Z'
    },
    {
      id: '2', 
      name: 'Sarah Williams',
      contactsToday: 8,
      contactsTotal: 156,
      successRate: 68,
      hoursWorked: 34,
      status: 'ACTIVE',
      lastActive: '2024-10-28T15:30:00Z'
    },
    {
      id: '3',
      name: 'David Rodriguez',
      contactsToday: 0,
      contactsTotal: 67,
      successRate: 71,
      hoursWorked: 18,
      status: 'OFFLINE',
      lastActive: '2024-10-27T19:20:00Z'
    },
    {
      id: '4',
      name: 'Lisa Park',
      contactsToday: 15,
      contactsTotal: 134,
      successRate: 74,
      hoursWorked: 28,
      status: 'ACTIVE',
      lastActive: '2024-10-28T13:15:00Z'
    }
  ]
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE': return 'bg-green-500';
    case 'DRAFT': return 'bg-gray-500';
    case 'PAUSED': return 'bg-yellow-500';
    case 'COMPLETED': return 'bg-blue-500';
    case 'ARCHIVED': return 'bg-gray-400';
    default: return 'bg-gray-500';
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'GOTV': return Users;
    case 'PHONE_BANK': return Phone;
    case 'CANVASSING': return MapPin;
    case 'MAIL': return Mail;
    case 'DIGITAL': return Monitor;
    default: return Target;
  }
};

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'contact': return MessageSquare;
    case 'milestone': return Target;
    case 'volunteer': return Users;
    case 'alert': return AlertCircle;
    default: return Clock;
  }
};

const formatTimeAgo = (timestamp: string) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return `${Math.floor(diffInHours / 24)}d ago`;
};

export default function CampaignDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [campaign] = useState(mockCampaignDetails);


  const TypeIcon = getTypeIcon(campaign.type);

  const handleCampaignAction = (action: string) => {
    console.log(`${action} campaign ${campaign.id}`);
    // In real implementation, this would call API endpoints
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center space-x-4">
            <Link href="/ga/voter/campaigns">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Campaigns
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TypeIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{campaign.name}</h1>
                <p className="text-muted-foreground">{campaign.description}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="solid" className={`${getStatusColor(campaign.status)} text-white`}>
              {campaign.status}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleCampaignAction('edit')}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Campaign
                </DropdownMenuItem>
                {campaign.status === 'ACTIVE' ? (
                  <DropdownMenuItem onClick={() => handleCampaignAction('pause')}>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause Campaign
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => handleCampaignAction('start')}>
                    <Play className="h-4 w-4 mr-2" />
                    Start Campaign
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => handleCampaignAction('export')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCampaignAction('archive')}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Campaign Progress Bar */}
        <div className="px-6 pb-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Campaign Progress</span>
              <span>{campaign.completedContacts.toLocaleString()} / {campaign.targetContacts.toLocaleString()} contacts ({campaign.contactRate}%)</span>
            </div>
            <Progress value={campaign.contactRate} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Started {new Date(campaign.startDate).toLocaleDateString()}</span>
              <span>{campaign.daysRemaining} days remaining</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="space-y-6">
          <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="volunteers">Volunteers</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{campaign.completedContacts.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    of {campaign.targetContacts.toLocaleString()} target
                  </p>
                  <div className="flex items-center pt-1">
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-xs text-green-500">25% complete</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Positive Responses</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{campaign.positiveResponses}%</div>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(campaign.completedContacts * campaign.positiveResponses / 100)} voters
                  </p>
                  <div className="flex items-center pt-1">
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-xs text-green-500">Above target</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Volunteers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{campaign.activeVolunteers}</div>
                  <p className="text-xs text-muted-foreground">
                    of {campaign.totalVolunteers} total
                  </p>
                  <div className="flex items-center pt-1">
                    <Clock className="h-3 w-3 text-blue-500 mr-1" />
                    <span className="text-xs text-blue-500">{campaign.totalVolunteerHours}h logged</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Days Remaining</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{campaign.daysRemaining}</div>
                  <p className="text-xs text-muted-foreground">
                    until {new Date(campaign.endDate).toLocaleDateString()}
                  </p>
                  <div className="flex items-center pt-1">
                    <AlertCircle className="h-3 w-3 text-orange-500 mr-1" />
                    <span className="text-xs text-orange-500">Final push needed</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filter Results Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Filter Results Progress</CardTitle>
                <CardDescription>
                  Contact progress across {campaign.filterResults.length} voter groups with complex targeting criteria
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {campaign.filterResults.map((filter) => (
                  <div key={filter.id} className="space-y-3 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{filter.name}</h3>
                          {filter.aiGenerated && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              AI Named
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{filter.description}</p>
                        
                        {/* Filter Criteria Tags */}
                        <div className="flex flex-wrap gap-1 mb-2">
                          {filter.filterCriteria.ageRange && (
                            <Badge variant="outline" className="text-xs">Age: {filter.filterCriteria.ageRange}</Badge>
                          )}
                          {filter.filterCriteria.race && (
                            <Badge variant="outline" className="text-xs">Race: {filter.filterCriteria.race}</Badge>
                          )}
                          {filter.filterCriteria.income && (
                            <Badge variant="outline" className="text-xs">
                              Income: {Array.isArray(filter.filterCriteria.income) ? filter.filterCriteria.income.join(', ') : filter.filterCriteria.income}
                            </Badge>
                          )}
                          {filter.filterCriteria.neverVoted && (
                            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">Never Voted</Badge>
                          )}
                          {filter.filterCriteria.congressionalDistricts && (
                            <Badge variant="outline" className="text-xs">
                              Districts: {filter.filterCriteria.congressionalDistricts.join(', ')}
                            </Badge>
                          )}
                          {filter.filterCriteria.counties && (
                            <Badge variant="outline" className="text-xs">
                              Counties: {filter.filterCriteria.counties.join(', ')}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Filter URL for reference */}
                        <div className="text-xs text-muted-foreground font-mono bg-muted/30 p-1 rounded">
                          {filter.filterUrl}
                        </div>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {filter.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Contact Progress</span>
                        <span>{filter.contactedVoters.toLocaleString()} / {filter.totalVoters.toLocaleString()} ({filter.contactRate}%)</span>
                      </div>
                      <Progress value={filter.contactRate} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-center text-sm">
                      <div>
                        <div className="font-semibold text-green-600">{filter.positiveResponses}%</div>
                        <div className="text-xs text-muted-foreground">Positive</div>
                      </div>
                      <div>
                        <div className="font-semibold">{filter.totalVoters.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Total Voters</div>
                      </div>
                      <div>
                        <div className="font-semibold">{formatTimeAgo(filter.lastUpdated)}</div>
                        <div className="text-xs text-muted-foreground">Last Updated</div>
                      </div>
                      <div className="flex space-x-1">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs" 
                          onClick={() => window.location.href = filter.filterUrl}
                        >
                          List
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs" 
                          onClick={() => window.location.href = filter.filterUrl.replace('/list', '/stats')}
                        >
                          Stats
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs" 
                          onClick={() => window.location.href = filter.filterUrl.replace('/list', '/map')}
                        >
                          Maps
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates from your campaign</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaign.recentActivity.map((activity) => {
                    const ActivityIcon = getActivityIcon(activity.type);
                    return (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className="p-2 bg-muted rounded-full">
                          <ActivityIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm">{activity.message}</p>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <span>{formatTimeAgo(activity.timestamp)}</span>
                            {activity.volunteer && (
                              <>
                                <span>•</span>
                                <span>{activity.volunteer}</span>
                              </>
                            )}
                            {activity.filterResult && (
                              <>
                                <span>•</span>
                                <span>{activity.filterResult}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Contact Methods Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Methods Performance</CardTitle>
                <CardDescription>Success rates by contact method across all filter results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(campaign.contactMethods).map(([method, data]) => (
                    <div key={method} className="text-center space-y-2">
                      <div className="text-lg font-semibold capitalize">{method}</div>
                      <div className="text-2xl font-bold text-green-600">{data.rate}%</div>
                      <div className="text-sm text-muted-foreground">
                        {data.successful} / {data.attempted} attempts
                      </div>
                      <Progress value={data.rate} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>



          {/* Volunteers Tab */}
          <TabsContent value="volunteers" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Volunteer Team</h2>
                <p className="text-muted-foreground">
                  {campaign.activeVolunteers} of {campaign.totalVolunteers} volunteers currently active
                </p>
              </div>
              <Button>
                <Users className="h-4 w-4 mr-2" />
                Invite Volunteers
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaign.volunteerList.map((volunteer) => (
                <Card key={volunteer.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{volunteer.name}</CardTitle>
                      <Badge variant={volunteer.status === 'ACTIVE' ? 'solid' : 'outline'}>
                        {volunteer.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-lg font-semibold">{volunteer.contactsToday}</div>
                        <div className="text-xs text-muted-foreground">Today</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold">{volunteer.contactsTotal}</div>
                        <div className="text-xs text-muted-foreground">Total</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Success Rate</span>
                        <span>{volunteer.successRate}%</span>
                      </div>
                      <Progress value={volunteer.successRate} className="h-2" />
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      {volunteer.hoursWorked}h worked • Last active {formatTimeAgo(volunteer.lastActive)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Advanced Analytics</h3>
              <p className="text-muted-foreground mb-4">
                Detailed analytics and reporting features coming soon
              </p>
              <Button variant="outline">
                Export Current Data
              </Button>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="text-center py-12">
              <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Campaign Settings</h3>
              <p className="text-muted-foreground mb-4">
                Campaign configuration and management options
              </p>
              <Button variant="outline">
                Edit Campaign
              </Button>
            </div>
          </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 