"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Campaign interface for the context
export interface Campaign {
  id: string;
  name: string;
  type: 'GOTV' | 'PHONE_BANK' | 'CANVASSING' | 'MAIL' | 'DIGITAL';
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'DRAFT';
  description?: string;
  startDate: string;
  endDate?: string;
  targetContacts: number;
  completedContacts: number;
  contactRate: number;
  filterUrl?: string; // Stored filter URL for this campaign's target voters
}

// Mock campaigns for prototype
const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'GOTV Drive 2024',
    type: 'GOTV',
    status: 'ACTIVE',
    description: 'Get out the vote campaign for November 2024 election',
    startDate: '2024-10-01',
    endDate: '2024-11-05',
    targetContacts: 2552,
    completedContacts: 413,
    contactRate: 16.2,
    filterUrl: '/ga/voter/list?scoreRanges=High%2CMedium&status=Active&ageRange=18-34%2C35-54&eventParty=DEMOCRAT'
  },
  {
    id: '2',
    name: 'Phone Bank October',
    type: 'PHONE_BANK',
    status: 'ACTIVE',
    description: 'October phone banking campaign for voter outreach',
    startDate: '2024-10-15',
    endDate: '2024-10-31',
    targetContacts: 1200,
    completedContacts: 890,
    contactRate: 74.2,
    filterUrl: '/ga/voter/list?status=Active&scoreRanges=Medium,Low&ageRange=35-54,55-74&gender=Female'
  },
  {
    id: '3',
    name: 'Canvassing Cobb County',
    type: 'CANVASSING',
    status: 'PAUSED',
    description: 'Door-to-door canvassing in Cobb County neighborhoods',
    startDate: '2024-09-20',
    endDate: '2024-11-01',
    targetContacts: 800,
    completedContacts: 245,
    contactRate: 30.6,
    filterUrl: '/ga/voter/list?county=067&status=Active&scoreRanges=High,Medium'
  }
];

// Context interface
interface CampaignContextType {
  selectedCampaign: Campaign | null;
  campaigns: Campaign[];
  isLoading: boolean;
  selectCampaign: (campaign: Campaign | null) => void;
  addFilterToCampaign: (filterName: string, voterCount: number, filterCriteria: any) => Promise<boolean>;
}

// Create context
const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

// Session storage key
const SELECTED_CAMPAIGN_KEY = 'voter-ai-selected-campaign';

// Provider component
export function CampaignProvider({ children }: { children: ReactNode }) {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaigns] = useState<Campaign[]>(mockCampaigns);
  const [isLoading, setIsLoading] = useState(true);

  // Load selected campaign from session storage on mount
  useEffect(() => {
    const savedCampaignId = sessionStorage.getItem(SELECTED_CAMPAIGN_KEY);
    if (savedCampaignId) {
      const campaign = campaigns.find(c => c.id === savedCampaignId);
      if (campaign) {
        setSelectedCampaign(campaign);
      }
    }
    setIsLoading(false);
  }, [campaigns]);

  // Save selected campaign to session storage
  const selectCampaign = (campaign: Campaign | null) => {
    setSelectedCampaign(campaign);
    if (campaign) {
      sessionStorage.setItem(SELECTED_CAMPAIGN_KEY, campaign.id);
      // Navigate to the campaign's stored filter URL with page reload
      if (campaign.filterUrl) {
        window.location.href = campaign.filterUrl;
      }
    } else {
      sessionStorage.removeItem(SELECTED_CAMPAIGN_KEY);
      // When clearing campaign, navigate to clean voter list with page reload
      window.location.href = '/ga/voter/list';
    }
  };

  // Add filter to campaign (prototype implementation)
  const addFilterToCampaign = async (filterName: string, voterCount: number, filterCriteria: any): Promise<boolean> => {
    if (!selectedCampaign) {
      return false;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In real implementation, this would make an API call to add the filter to the campaign
      console.log('Adding filter to campaign:', {
        campaignId: selectedCampaign.id,
        filterName,
        voterCount,
        filterCriteria
      });

      return true;
    } catch (error) {
      console.error('Failed to add filter to campaign:', error);
      return false;
    }
  };

  const value: CampaignContextType = {
    selectedCampaign,
    campaigns,
    isLoading,
    selectCampaign,
    addFilterToCampaign
  };

  return (
    <CampaignContext.Provider value={value}>
      {children}
    </CampaignContext.Provider>
  );
}

// Hook to use campaign context
export function useCampaignContext() {
  const context = useContext(CampaignContext);
  if (context === undefined) {
    throw new Error('useCampaignContext must be used within a CampaignProvider');
  }
  return context;
} 