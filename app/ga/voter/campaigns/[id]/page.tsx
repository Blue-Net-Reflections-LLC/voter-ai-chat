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
            <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
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
          <TabsContent value="sentiment" className="space-y-6">
            {/* Analytics Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Sentiment Analysis</h2>
                <p className="text-muted-foreground">
                  AI-powered sentiment tracking and voter engagement insights for {campaign.name}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                <Button variant="outline" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            </div>

            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Contact Coverage</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{campaign.contactRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    {campaign.completedContacts.toLocaleString()} of {campaign.targetContacts.toLocaleString()} voters
                  </p>
                  <Progress value={campaign.contactRate} className="h-2 mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Positive Sentiment</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{campaign.positiveResponses}%</div>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(campaign.completedContacts * campaign.positiveResponses / 100)} positive responses
                  </p>
                  <div className="flex items-center pt-1">
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-xs text-green-500">+12% vs target</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Volunteer Efficiency</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">18.2</div>
                  <p className="text-xs text-muted-foreground">
                    contacts per volunteer per hour
                  </p>
                  <div className="flex items-center pt-1">
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-xs text-green-500">Above benchmark</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">AI Prediction Accuracy</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">87%</div>
                  <p className="text-xs text-muted-foreground">
                    sentiment predictions vs actual
                  </p>
                  <div className="flex items-center pt-1">
                    <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-xs text-green-500">High confidence</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sentiment Analysis Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sentiment Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Sentiment Analysis Breakdown</CardTitle>
                  <CardDescription>
                    Voter sentiment distribution across all contacts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Very Positive</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">28%</span>
                        <span className="text-xs text-muted-foreground">(116 voters)</span>
                      </div>
                    </div>
                    <Progress value={28} className="h-2" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-300 rounded-full"></div>
                        <span className="text-sm">Positive</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">40%</span>
                        <span className="text-xs text-muted-foreground">(165 voters)</span>
                      </div>
                    </div>
                    <Progress value={40} className="h-2" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <span className="text-sm">Neutral</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">22%</span>
                        <span className="text-xs text-muted-foreground">(91 voters)</span>
                      </div>
                    </div>
                    <Progress value={22} className="h-2" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-300 rounded-full"></div>
                        <span className="text-sm">Negative</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">7%</span>
                        <span className="text-xs text-muted-foreground">(29 voters)</span>
                      </div>
                    </div>
                    <Progress value={7} className="h-2" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm">Very Negative</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">3%</span>
                        <span className="text-xs text-muted-foreground">(12 voters)</span>
                      </div>
                    </div>
                    <Progress value={3} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Contact Method Effectiveness */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Method Effectiveness</CardTitle>
                  <CardDescription>
                    Success rates and sentiment by contact method
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(campaign.contactMethods).map(([method, data]) => (
                      <div key={method} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {method === 'phone' && <Phone className="h-4 w-4" />}
                            {method === 'door' && <MapPin className="h-4 w-4" />}
                            {method === 'email' && <Mail className="h-4 w-4" />}
                            {method === 'text' && <MessageSquare className="h-4 w-4" />}
                            <span className="text-sm capitalize font-medium">{method}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{data.rate}% success</div>
                            <div className="text-xs text-muted-foreground">
                              {data.successful}/{data.attempted} contacts
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <div className="text-green-600 font-medium">
                              {method === 'phone' ? '72%' : method === 'door' ? '68%' : method === 'email' ? '45%' : '81%'}
                            </div>
                            <div className="text-muted-foreground">Positive</div>
                          </div>
                          <div className="text-center">
                            <div className="text-yellow-600 font-medium">
                              {method === 'phone' ? '21%' : method === 'door' ? '25%' : method === 'email' ? '42%' : '15%'}
                            </div>
                            <div className="text-muted-foreground">Neutral</div>
                          </div>
                          <div className="text-center">
                            <div className="text-red-600 font-medium">
                              {method === 'phone' ? '7%' : method === 'door' ? '7%' : method === 'email' ? '13%' : '4%'}
                            </div>
                            <div className="text-muted-foreground">Negative</div>
                          </div>
                        </div>
                        <Progress value={data.rate} className="h-1" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Geographic Sentiment Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Geographic Sentiment Distribution</CardTitle>
                <CardDescription>
                  Sentiment patterns across filter results and geographic areas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaign.filterResults.map((filter) => (
                    <div key={filter.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{filter.name}</h4>
                          <p className="text-sm text-muted-foreground">{filter.description}</p>
                        </div>
                        <Badge variant="outline">
                          {filter.contactedVoters} contacts
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-5 gap-2 text-center text-xs">
                        <div>
                          <div className="text-green-600 font-bold text-lg">
                            {filter.id === 'filter-1' ? '71%' : filter.id === 'filter-2' ? '62%' : '0%'}
                          </div>
                          <div className="text-muted-foreground">Positive</div>
                        </div>
                        <div>
                          <div className="text-yellow-600 font-bold text-lg">
                            {filter.id === 'filter-1' ? '19%' : filter.id === 'filter-2' ? '28%' : '0%'}
                          </div>
                          <div className="text-muted-foreground">Neutral</div>
                        </div>
                        <div>
                          <div className="text-red-600 font-bold text-lg">
                            {filter.id === 'filter-1' ? '10%' : filter.id === 'filter-2' ? '10%' : '0%'}
                          </div>
                          <div className="text-muted-foreground">Negative</div>
                        </div>
                        <div>
                          <div className="text-blue-600 font-bold text-lg">
                            {filter.id === 'filter-1' ? '8.2' : filter.id === 'filter-2' ? '7.8' : 'N/A'}
                          </div>
                          <div className="text-muted-foreground">Avg Score</div>
                        </div>
                        <div>
                          <div className="text-purple-600 font-bold text-lg">
                            {filter.id === 'filter-1' ? '89%' : filter.id === 'filter-2' ? '84%' : 'N/A'}
                          </div>
                          <div className="text-muted-foreground">Turnout Pred.</div>
                        </div>
                      </div>

                      {filter.contactedVoters > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Sentiment Distribution</span>
                            <span>Positive: {filter.id === 'filter-1' ? '71%' : '62%'}</span>
                          </div>
                          <Progress 
                            value={filter.id === 'filter-1' ? 71 : filter.id === 'filter-2' ? 62 : 0} 
                            className="h-2" 
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Real-Time Issue Extraction & Sentiment Bubbling */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Real-Time Issue Intelligence</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    AI-Powered
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Live extraction of voter concerns and sentiment from conversations using multimodal AI analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Real-Time Processing Status */}
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-green-800">Live Processing Active</span>
                    </div>
                    <div className="text-xs text-green-700">
                      Last update: 2 minutes ago • 23 conversations analyzed today
                    </div>
                  </div>

                  {/* Trending Issues from Conversations */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3 flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4" />
                        <span>Trending Issues (Last 24 Hours)</span>
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-sm">School Safety & Education Funding</div>
                            <div className="text-xs text-muted-foreground">Mentioned in 67% of conversations</div>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                Positive: 78%
                              </Badge>
                              <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                                Concerned: 22%
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">+15%</div>
                            <div className="text-xs text-muted-foreground">vs yesterday</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-sm">Healthcare Costs</div>
                            <div className="text-xs text-muted-foreground">Mentioned in 54% of conversations</div>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                                Frustrated: 68%
                              </Badge>
                              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
                                Hopeful: 32%
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-orange-600">+8%</div>
                            <div className="text-xs text-muted-foreground">vs yesterday</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-sm">Local Transportation</div>
                            <div className="text-xs text-muted-foreground">Mentioned in 41% of conversations</div>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                Supportive: 85%
                              </Badge>
                              <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700">
                                Neutral: 15%
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-600">+23%</div>
                            <div className="text-xs text-muted-foreground">vs yesterday</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3 flex items-center space-x-2">
                        <BarChart3 className="h-4 w-4" />
                        <span>AI Conversation Analysis</span>
                      </h4>
                      <div className="space-y-3">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <Monitor className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-800">Multimodal Processing</span>
                          </div>
                          <div className="text-sm text-blue-700 space-y-1">
                            <div>• Voice tone analysis: 89% accuracy</div>
                            <div>• Facial expression detection: 92% accuracy</div>
                            <div>• Real-time transcription: 96% accuracy</div>
                            <div>• Sentiment extraction: 87% confidence</div>
                          </div>
                        </div>

                        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <MessageSquare className="h-4 w-4 text-purple-600" />
                            <span className="font-medium text-purple-800">Conversation Insights</span>
                          </div>
                          <div className="text-sm text-purple-700 space-y-1">
                            <div>• Average conversation: 4.2 minutes</div>
                            <div>• Issues per conversation: 2.8 avg</div>
                            <div>• Follow-up requests: 34% of calls</div>
                            <div>• Positive sentiment shift: +12% during calls</div>
                          </div>
                        </div>

                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-green-800">Real-Time Alerts</span>
                          </div>
                          <div className="text-sm text-green-700 space-y-1">
                            <div>• New issue detected: "Traffic Safety"</div>
                            <div>• Sentiment spike: Education (+15%)</div>
                            <div>• Geographic pattern: Cobb County concerns</div>
                            <div>• Volunteer coaching: 3 suggestions sent</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent AI-Extracted Insights */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>Recent AI-Extracted Insights</span>
                      <Badge variant="outline" className="text-xs">
                        Live Feed
                      </Badge>
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      <div className="flex items-start space-x-3 p-2 bg-muted/30 rounded">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div className="flex-1 text-sm">
                          <div className="font-medium">Voter in Marietta expressed strong support for school bond</div>
                          <div className="text-muted-foreground text-xs">
                            2 min ago • Phone call • Sentiment: +8.5 • Issues: Education, Taxes
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 p-2 bg-muted/30 rounded">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                        <div className="flex-1 text-sm">
                          <div className="font-medium">Concerns about healthcare costs affecting voting decision</div>
                          <div className="text-muted-foreground text-xs">
                            5 min ago • Door visit • Sentiment: -2.1 • Issues: Healthcare, Economy
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 p-2 bg-muted/30 rounded">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1 text-sm">
                          <div className="font-medium">Young professional interested in transportation improvements</div>
                          <div className="text-muted-foreground text-xs">
                            8 min ago • Text conversation • Sentiment: +6.2 • Issues: Transportation, Environment
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 p-2 bg-muted/30 rounded">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div className="flex-1 text-sm">
                          <div className="font-medium">Retiree praised candidate's stance on senior services</div>
                          <div className="text-muted-foreground text-xs">
                            12 min ago • Phone call • Sentiment: +7.8 • Issues: Senior Services, Healthcare
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 p-2 bg-muted/30 rounded">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                        <div className="flex-1 text-sm">
                          <div className="font-medium">Parent concerned about school safety measures</div>
                          <div className="text-muted-foreground text-xs">
                            15 min ago • Door visit • Sentiment: -1.5 • Issues: Education, Safety
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Technical Implementation Preview */}
                  <div className="border-t pt-4">
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center space-x-2">
                        <Settings className="h-4 w-4" />
                        <span>AI Processing Pipeline</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                        <div className="text-center">
                          <div className="font-medium text-blue-600">Audio/Video Capture</div>
                          <div className="text-muted-foreground">TTS, Image Recognition</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-purple-600">Real-Time Analysis</div>
                          <div className="text-muted-foreground">LLM Processing, Sentiment</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-green-600">Issue Extraction</div>
                          <div className="text-muted-foreground">Topic Modeling, Trends</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-orange-600">Live Dashboard</div>
                          <div className="text-muted-foreground">XHR Updates, Alerts</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Insights and Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>AI-Powered Insights & Recommendations</CardTitle>
                <CardDescription>
                  Machine learning analysis of sentiment patterns and optimization suggestions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-green-800">High Performance Insight</h4>
                          <p className="text-sm text-green-700 mt-1">
                            Text messaging shows 81% positive sentiment rate - 15% higher than phone calls. 
                            Consider shifting 30% of phone bank resources to text outreach.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-800">Sentiment Trend</h4>
                          <p className="text-sm text-blue-700 mt-1">
                            "Working-Age Black Voters" segment shows 71% positive sentiment - highest among all groups. 
                            Predicted turnout likelihood: 89%.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-orange-800">Optimization Opportunity</h4>
                          <p className="text-sm text-orange-700 mt-1">
                            Email outreach has lowest positive sentiment (45%). AI suggests personalizing 
                            subject lines with local issues to improve engagement.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <BarChart3 className="h-5 w-5 text-purple-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-purple-800">Predictive Forecast</h4>
                          <p className="text-sm text-purple-700 mt-1">
                            At current pace, campaign will reach 2,100 contacts by election day. 
                            AI predicts 73% overall positive sentiment at completion.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Top AI Recommendations</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Prioritize text outreach for "Young Professional Persuadables" segment (predicted 85% positive response)</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Schedule door-to-door visits in Cobb County between 6-8 PM for optimal sentiment scores</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span>Deploy top-performing volunteers (Mike Chen, Lisa Park) to neutral sentiment areas</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Prototype Disclaimer */}
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <div>
                    <h4 className="font-medium text-orange-800">Sentiment Analysis Prototype</h4>
                    <p className="text-sm text-orange-700 mt-1">
                      This sentiment dashboard demonstrates real-time AI-powered conversation analysis and issue extraction capabilities for stakeholder review. 
                      Data shown represents the system's potential using multimodal AI processing (TTS, image capture, LLM analysis) 
                      to capture voter concerns and sentiment patterns in real-time during campaign conversations.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
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