"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCampaignContext, Campaign } from '../CampaignContext';
import { Target, Users, Calendar, CheckCircle, Pause, Play, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CampaignSelectorProps {
  className?: string;
  compact?: boolean;
}

const getCampaignTypeIcon = (type: Campaign['type']) => {
  switch (type) {
    case 'GOTV': return Users;
    case 'PHONE_BANK': return Target;
    case 'CANVASSING': return Users;
    case 'MAIL': return Target;
    case 'DIGITAL': return Target;
    default: return Target;
  }
};

const getStatusColor = (status: Campaign['status']) => {
  switch (status) {
    case 'ACTIVE': return 'bg-green-600 text-white dark:bg-green-500 dark:text-white';
    case 'PAUSED': return 'bg-yellow-600 text-white dark:bg-yellow-500 dark:text-black';
    case 'COMPLETED': return 'bg-blue-600 text-white dark:bg-blue-500 dark:text-white';
    case 'DRAFT': return 'bg-gray-600 text-white dark:bg-gray-400 dark:text-black';
    default: return 'bg-gray-600 text-white dark:bg-gray-400 dark:text-black';
  }
};

export function CampaignSelector({ className, compact = false }: CampaignSelectorProps) {
  const { selectedCampaign, campaigns, selectCampaign, isLoading } = useCampaignContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCampaignSelect = (campaign: Campaign) => {
    selectCampaign(campaign);
    setIsDialogOpen(false);
  };

  const handleClearSelection = () => {
    selectCampaign(null);
    setIsDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className={cn("animate-pulse", className)}>
        <div className="h-10 bg-muted rounded-md"></div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        {selectedCampaign ? (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-600">
            {selectedCampaign.name}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground dark:text-gray-400 dark:border-gray-600">
            No Campaign
          </Badge>
        )}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="dark:border-gray-600 dark:hover:bg-gray-700">
              {selectedCampaign ? 'Change' : 'Select'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Select Campaign</DialogTitle>
              <DialogDescription>
                Choose a campaign to add filters and track voter contacts
              </DialogDescription>
            </DialogHeader>
            <CampaignSelectionContent 
              campaigns={campaigns}
              selectedCampaign={selectedCampaign}
              onSelect={handleCampaignSelect}
              onClear={handleClearSelection}
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <Card className={cn("w-full dark:bg-gray-800/50 dark:border-gray-700", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium dark:text-gray-200">Campaign Selection</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {selectedCampaign ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(selectedCampaign.status)}>
                  {selectedCampaign.status}
                </Badge>
                <span className="font-medium dark:text-gray-200">{selectedCampaign.name}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClearSelection} className="dark:hover:bg-gray-700">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground dark:text-gray-400">
              {selectedCampaign.description}
            </div>
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <Target className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                <span className="dark:text-gray-300">{selectedCampaign.completedContacts.toLocaleString()} / {selectedCampaign.targetContacts.toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3 text-green-500 dark:text-green-400" />
                <span className="dark:text-gray-300">{selectedCampaign.contactRate}%</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground dark:text-gray-400 mb-3">
              No campaign selected
            </p>
            <p className="text-xs text-muted-foreground dark:text-gray-500 mb-3">
              Select a campaign to add filters and track voter contacts
            </p>
          </div>
        )}
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full dark:border-gray-600 dark:hover:bg-gray-700" size="sm">
              {selectedCampaign ? 'Change Campaign' : 'Select Campaign'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Select Campaign</DialogTitle>
              <DialogDescription>
                Choose a campaign to add filters and track voter contacts
              </DialogDescription>
            </DialogHeader>
            <CampaignSelectionContent 
              campaigns={campaigns}
              selectedCampaign={selectedCampaign}
              onSelect={handleCampaignSelect}
              onClear={handleClearSelection}
            />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

interface CampaignSelectionContentProps {
  campaigns: Campaign[];
  selectedCampaign: Campaign | null;
  onSelect: (campaign: Campaign) => void;
  onClear: () => void;
}

function CampaignSelectionContent({ campaigns, selectedCampaign, onSelect, onClear }: CampaignSelectionContentProps) {
  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE');
  const otherCampaigns = campaigns.filter(c => c.status !== 'ACTIVE');

  return (
    <div className="space-y-4">
      {selectedCampaign && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg dark:bg-gray-800/50 dark:border dark:border-gray-700">
          <div>
            <div className="font-medium dark:text-gray-200">Currently Selected</div>
            <div className="text-sm text-muted-foreground dark:text-gray-400">{selectedCampaign.name}</div>
          </div>
          <Button variant="outline" size="sm" onClick={onClear} className="dark:border-gray-600 dark:hover:bg-gray-700">
            Clear Selection
          </Button>
        </div>
      )}

      {activeCampaigns.length > 0 && (
        <div>
          <h4 className="font-medium mb-2 text-green-700 dark:text-green-400">Active Campaigns</h4>
          <div className="space-y-2">
            {activeCampaigns.map((campaign) => (
              <CampaignCard 
                key={campaign.id} 
                campaign={campaign} 
                isSelected={selectedCampaign?.id === campaign.id}
                onSelect={() => onSelect(campaign)}
              />
            ))}
          </div>
        </div>
      )}

      {otherCampaigns.length > 0 && (
        <div>
          <h4 className="font-medium mb-2 text-muted-foreground dark:text-gray-400">Other Campaigns</h4>
          <div className="space-y-2">
            {otherCampaigns.map((campaign) => (
              <CampaignCard 
                key={campaign.id} 
                campaign={campaign} 
                isSelected={selectedCampaign?.id === campaign.id}
                onSelect={() => onSelect(campaign)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface CampaignCardProps {
  campaign: Campaign;
  isSelected: boolean;
  onSelect: () => void;
}

function CampaignCard({ campaign, isSelected, onSelect }: CampaignCardProps) {
  const TypeIcon = getCampaignTypeIcon(campaign.type);
  
  return (
    <div 
      className={cn(
        "p-3 border rounded-lg cursor-pointer transition-colors",
        isSelected 
          ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/30" 
          : "border-border hover:bg-muted dark:border-gray-700 dark:hover:bg-gray-800/50"
      )}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg dark:bg-primary/20">
            <TypeIcon className="h-4 w-4 text-primary dark:text-primary" />
          </div>
          <div>
            <div className="font-medium dark:text-gray-200">{campaign.name}</div>
            <div className="text-sm text-muted-foreground dark:text-gray-400">{campaign.description}</div>
          </div>
        </div>
        <div className="text-right">
          <Badge className={getStatusColor(campaign.status)}>
            {campaign.status}
          </Badge>
          <div className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
            {campaign.contactRate}% complete
          </div>
        </div>
      </div>
    </div>
  );
} 