"use client";

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, LoaderCircle } from 'lucide-react';
import { useCampaignContext } from '@/app/ga/voter/CampaignContext';

// Mock campaign status data for prototype (same as in VoterTable)
const mockCampaignStatuses: Record<string, { 
  status: 'contacted' | 'pending' | 'not_contacted'; 
  campaignName?: string; 
  contactDate?: string;
  contactMethod?: 'phone' | 'door' | 'text' | 'email';
  sentiment?: 'positive' | 'neutral' | 'negative';
  notes?: string;
}> = {
  // More contacted voters with different methods and dates
  'voter-1': { 
    status: 'contacted', 
    campaignName: 'GOTV Drive 2024', 
    contactDate: '2024-10-15',
    contactMethod: 'phone',
    sentiment: 'positive',
    notes: 'Committed to vote'
  },
  'voter-2': { 
    status: 'contacted', 
    campaignName: 'GOTV Drive 2024', 
    contactDate: '2024-10-16',
    contactMethod: 'door',
    sentiment: 'positive',
    notes: 'Very engaged'
  },
  'voter-3': { 
    status: 'contacted', 
    campaignName: 'GOTV Drive 2024', 
    contactDate: '2024-10-14',
    contactMethod: 'text',
    sentiment: 'neutral',
    notes: 'Acknowledged message'
  },
  'voter-4': { 
    status: 'contacted', 
    campaignName: 'Phone Bank October', 
    contactDate: '2024-10-17',
    contactMethod: 'phone',
    sentiment: 'positive',
    notes: 'Requested voting info'
  },
  'voter-5': { 
    status: 'contacted', 
    campaignName: 'GOTV Drive 2024', 
    contactDate: '2024-10-13',
    contactMethod: 'email',
    sentiment: 'neutral',
    notes: 'Email opened'
  },
  'voter-6': { 
    status: 'contacted', 
    campaignName: 'Canvassing Cobb County', 
    contactDate: '2024-10-16',
    contactMethod: 'door',
    sentiment: 'positive',
    notes: 'Long conversation'
  },
  'voter-7': { status: 'pending', campaignName: 'GOTV Drive 2024' },
  'voter-8': { 
    status: 'contacted', 
    campaignName: 'Phone Bank October', 
    contactDate: '2024-10-15',
    contactMethod: 'phone',
    sentiment: 'negative',
    notes: 'Not interested'
  },
  'voter-9': { 
    status: 'contacted', 
    campaignName: 'GOTV Drive 2024', 
    contactDate: '2024-10-17',
    contactMethod: 'text',
    sentiment: 'positive',
    notes: 'Confirmed voting plan'
  },
  'voter-10': { 
    status: 'contacted', 
    campaignName: 'Canvassing Cobb County', 
    contactDate: '2024-10-14',
    contactMethod: 'door',
    sentiment: 'neutral',
    notes: 'Brief conversation'
  },
  'voter-11': { 
    status: 'contacted', 
    campaignName: 'GOTV Drive 2024', 
    contactDate: '2024-10-16',
    contactMethod: 'email',
    sentiment: 'positive',
    notes: 'Replied with questions'
  },
  'voter-12': { 
    status: 'contacted', 
    campaignName: 'Phone Bank October', 
    contactDate: '2024-10-16',
    contactMethod: 'phone',
    sentiment: 'positive',
    notes: 'Enthusiastic supporter'
  },
  'voter-13': { 
    status: 'contacted', 
    campaignName: 'GOTV Drive 2024', 
    contactDate: '2024-10-15',
    contactMethod: 'door',
    sentiment: 'neutral',
    notes: 'Left information'
  },
  'voter-14': { 
    status: 'contacted', 
    campaignName: 'Canvassing Cobb County', 
    contactDate: '2024-10-17',
    contactMethod: 'text',
    sentiment: 'positive',
    notes: 'Shared with family'
  },
  'voter-15': { status: 'pending', campaignName: 'GOTV Drive 2024' },
  'voter-16': { 
    status: 'contacted', 
    campaignName: 'Phone Bank October', 
    contactDate: '2024-10-14',
    contactMethod: 'phone',
    sentiment: 'neutral',
    notes: 'Voicemail left'
  },
  'voter-17': { 
    status: 'contacted', 
    campaignName: 'GOTV Drive 2024', 
    contactDate: '2024-10-17',
    contactMethod: 'email',
    sentiment: 'positive',
    notes: 'Forwarded to friends'
  },
  'voter-18': { 
    status: 'contacted', 
    campaignName: 'GOTV Drive 2024', 
    contactDate: '2024-10-13',
    contactMethod: 'door',
    sentiment: 'positive',
    notes: 'Yard sign requested'
  },
  'voter-19': { 
    status: 'contacted', 
    campaignName: 'Canvassing Cobb County', 
    contactDate: '2024-10-16',
    contactMethod: 'text',
    sentiment: 'neutral',
    notes: 'Read receipt only'
  },
  'voter-20': { 
    status: 'contacted', 
    campaignName: 'Phone Bank October', 
    contactDate: '2024-10-15',
    contactMethod: 'phone',
    sentiment: 'positive',
    notes: 'Volunteer interest'
  },
};

interface CampaignStatusBadgeProps {
  voterId: string;
  voterIndex: number;
  compact?: boolean;
}

export function CampaignStatusBadge({ voterId, voterIndex, compact = false }: CampaignStatusBadgeProps) {
  const { selectedCampaign } = useCampaignContext();
  const [isLoading, setIsLoading] = useState(true);
  const [campaignStatus, setCampaignStatus] = useState<{ 
    status: 'contacted' | 'pending' | 'not_contacted'; 
    campaignName?: string; 
    contactDate?: string;
    contactMethod?: 'phone' | 'door' | 'text' | 'email';
    sentiment?: 'positive' | 'neutral' | 'negative';
    notes?: string;
  } | null>(null);

  useEffect(() => {
    // Simulate XHR call to check campaign membership
    const checkCampaignStatus = async () => {
      setIsLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 100));
      
      // For prototype: Show first 5 voters as contacted when campaign is selected
      if (selectedCampaign) {
        // Use voterIndex (0-based) to determine status
        if (voterIndex < 5) {
          // First 5 voters are contacted with various methods and sentiments
          const contactMethods: ('phone' | 'door' | 'text' | 'email')[] = ['phone', 'door', 'text', 'email'];
          const sentiments: ('positive' | 'neutral' | 'negative')[] = ['positive', 'positive', 'positive', 'neutral', 'negative']; // More positive for demo
          const contactDates = [
            '2024-10-15', '2024-10-16', '2024-10-14', '2024-10-17', '2024-10-13'
          ];
          
          setCampaignStatus({
            status: 'contacted',
            campaignName: selectedCampaign.name,
            contactDate: contactDates[voterIndex] || '2024-10-15',
            contactMethod: contactMethods[voterIndex % contactMethods.length],
            sentiment: sentiments[voterIndex % sentiments.length]
          });
        } else if (voterIndex < 7) {
          // Voters 6-7 are pending
          setCampaignStatus({
            status: 'pending',
            campaignName: selectedCampaign.name
          });
        } else {
          // Rest are not contacted
          setCampaignStatus({ status: 'not_contacted' });
        }
      } else {
        setCampaignStatus({ status: 'not_contacted' });
      }
      
      setIsLoading(false);
    };

    checkCampaignStatus();
  }, [voterId, selectedCampaign, voterIndex]);

  // Helper function to get contact method icon
  const getContactMethodIcon = (method?: string) => {
    switch (method) {
      case 'phone': return '📞';
      case 'door': return '🚪';
      case 'text': return '💬';
      case 'email': return '📧';
      default: return '';
    }
  };

  // Helper function to get sentiment color
  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-600';
      case 'negative': return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-600';
      case 'neutral': return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-600';
      default: return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-600';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center">
        <LoaderCircle className="h-3 w-3 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!campaignStatus || campaignStatus.status === 'not_contacted') {
    return (
      <Badge variant="outline" className="text-[10px] text-muted-foreground dark:text-gray-400 dark:border-gray-600">
        Not Contacted
      </Badge>
    );
  }

  if (campaignStatus.status === 'contacted') {
    const methodIcon = getContactMethodIcon(campaignStatus.contactMethod);
    const sentimentColor = getSentimentColor(campaignStatus.sentiment);
    
    return (
      <Badge variant="outline" className={`text-[10px] ${sentimentColor}`}>
        <CheckCircle className="h-2 w-2 mr-1" />
        {methodIcon && <span className="mr-1">{methodIcon}</span>}
        {compact ? 'Contacted' : `Contacted ${campaignStatus.contactDate ? new Date(campaignStatus.contactDate).toLocaleDateString() : ''}`}
      </Badge>
    );
  }

  if (campaignStatus.status === 'pending') {
    return (
      <Badge variant="outline" className="text-[10px] bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-600">
        <Clock className="h-2 w-2 mr-1" />
        Pending
      </Badge>
    );
  }

  return null;
} 