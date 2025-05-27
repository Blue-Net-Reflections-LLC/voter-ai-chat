"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Users, Target, TrendingUp, MoreVertical, Play, Pause, Archive, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Link from 'next/link';

// Mock data for prototyping
const mockCampaigns = [
  {
    id: '1',
    name: 'GOTV Drive 2024',
    description: 'Get out the vote campaign for November 2024 election',
    type: 'GOTV',
    status: 'ACTIVE',
    targetContacts: 2500,
    completedContacts: 1247,
    positiveResponses: 68,
    volunteers: 12,
    daysRemaining: 8,
    startDate: '2024-10-01',
    endDate: '2024-11-05',
    filterResults: [
      { description: 'Young voters in Cobb County', count: 2847 },
      { description: 'Never voted active voters in Fulton County', count: 1456 }
    ]
  },
  {
    id: '2',
    name: 'Phone Bank October',
    description: 'Phone banking campaign to reach undecided voters',
    type: 'PHONE_BANK',
    status: 'ACTIVE',
    targetContacts: 1500,
    completedContacts: 892,
    positiveResponses: 54,
    volunteers: 8,
    daysRemaining: 12,
    startDate: '2024-10-15',
    endDate: '2024-10-31',
    filterResults: [
      { description: 'Undecided voters in metro Atlanta', count: 1500 }
    ]
  },
  {
    id: '3',
    name: 'Canvassing Cobb County',
    description: 'Door-to-door canvassing in Cobb County neighborhoods',
    type: 'CANVASSING',
    status: 'DRAFT',
    targetContacts: 800,
    completedContacts: 0,
    positiveResponses: 0,
    volunteers: 0,
    daysRemaining: 15,
    startDate: '2024-11-01',
    endDate: '2024-11-04',
    filterResults: [
      { description: 'High-turnout neighborhoods in Cobb County', count: 800 }
    ]
  }
];

const mockStats = {
  totalVotersContacted: 3847,
  averageResponseRate: 61,
  totalVolunteerHours: 284,
  activeCampaigns: 2
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
    case 'GOTV': return '🗳️';
    case 'PHONE_BANK': return '📞';
    case 'CANVASSING': return '🚪';
    case 'MAIL': return '📮';
    case 'DIGITAL': return '💻';
    default: return '📋';
  }
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState(mockCampaigns);
  const [stats, setStats] = useState(mockStats);

  const handleCampaignAction = (campaignId: string, action: string) => {
    console.log(`${action} campaign ${campaignId}`);
    // In real implementation, this would call API endpoints
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Campaign Dashboard</h1>
          <p className="text-muted-foreground">Manage your voter outreach campaigns</p>
        </div>
        <Link href="/ga/voter/campaigns/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Campaign
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Voters Contacted</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVotersContacted.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all campaigns</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageResponseRate}%</div>
            <p className="text-xs text-muted-foreground">Average across campaigns</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volunteer Hours</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVolunteerHours}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Active Campaigns</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getTypeIcon(campaign.type)}</span>
                    <div>
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                      <CardDescription className="text-sm">{campaign.description}</CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                        <Link href={`/ga/voter/campaigns/${campaign.id}`} className="flex items-center w-full">
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      {campaign.status === 'ACTIVE' ? (
                        <DropdownMenuItem onClick={() => handleCampaignAction(campaign.id, 'pause')}>
                          <Pause className="h-4 w-4 mr-2" />
                          Pause Campaign
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleCampaignAction(campaign.id, 'start')}>
                          <Play className="h-4 w-4 mr-2" />
                          Start Campaign
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleCampaignAction(campaign.id, 'clone')}>
                        <Copy className="h-4 w-4 mr-2" />
                        Clone Campaign
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCampaignAction(campaign.id, 'archive')}>
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="solid" className={`${getStatusColor(campaign.status)} text-white`}>
                    {campaign.status}
                  </Badge>
                  <Badge variant="outline">{campaign.type.replace('_', ' ')}</Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Contact Progress</span>
                    <span>{campaign.completedContacts} / {campaign.targetContacts}</span>
                  </div>
                  <Progress 
                    value={(campaign.completedContacts / campaign.targetContacts) * 100} 
                    className="h-2"
                  />
                </div>
                
                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-green-600">{campaign.positiveResponses}%</div>
                    <div className="text-xs text-muted-foreground">Positive</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold">{campaign.volunteers}</div>
                    <div className="text-xs text-muted-foreground">Volunteers</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold">{campaign.daysRemaining}</div>
                    <div className="text-xs text-muted-foreground">Days Left</div>
                  </div>
                </div>
                
                {/* Filter Results */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Target Groups:</div>
                  {campaign.filterResults.map((filter, index) => (
                    <div key={index} className="text-xs text-muted-foreground bg-muted p-2 rounded">
                      {filter.description} ({filter.count.toLocaleString()} voters)
                    </div>
                  ))}
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Link href={`/ga/voter/campaigns/${campaign.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </Link>
                  <Link href={`/ga/voter/campaigns/${campaign.id}/analytics`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      Analytics
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates from your campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-muted-foreground">2 hours ago</span>
              <span>Sarah completed 15 phone calls in GOTV Drive 2024</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-muted-foreground">4 hours ago</span>
              <span>New volunteer joined Phone Bank October campaign</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-muted-foreground">6 hours ago</span>
              <span>Canvassing Cobb County campaign moved to draft status</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 