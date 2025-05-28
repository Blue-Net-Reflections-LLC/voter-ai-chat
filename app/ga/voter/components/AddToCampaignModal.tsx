"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCampaignContext } from '../CampaignContext';
import { useVoterFilterContext } from '../VoterFilterProvider';
import { Sparkles, Edit3, Save, X, Users, Target, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface AddToCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  voterCount: number;
  currentQueryParams: string;
}

// Mock AI filter name generation
const generateAIFilterName = (filterCriteria: any): string => {
  const names = [
    "AI-Generated: High-Engagement Suburban Voters",
    "AI-Generated: Young Professional Persuadables", 
    "AI-Generated: Working-Age Black Voters in GA-13/14",
    "AI-Generated: Never-Voted College Graduates",
    "AI-Generated: Rural Conservative Base",
    "AI-Generated: Urban Progressive Coalition"
  ];
  return names[Math.floor(Math.random() * names.length)];
};

export function AddToCampaignModal({ isOpen, onClose, voterCount, currentQueryParams }: AddToCampaignModalProps) {
  const { selectedCampaign, addFilterToCampaign } = useCampaignContext();
  const { filters, hasActiveFilters } = useVoterFilterContext();
  const { toast } = useToast();
  
  const [filterName, setFilterName] = useState('');
  const [isGeneratingName, setIsGeneratingName] = useState(false);
  const [isAddingToCampaign, setIsAddingToCampaign] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setFilterName('');
      setIsEditingName(false);
      setIsGeneratingName(false);
      setIsAddingToCampaign(false);
    }
  }, [isOpen]);

  const handleGenerateAIName = async () => {
    setIsGeneratingName(true);
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    const aiName = generateAIFilterName(filters);
    setFilterName(aiName);
    setIsGeneratingName(false);
  };

  const handleAddToCampaign = async () => {
    if (!selectedCampaign || !filterName.trim()) {
      return;
    }

    setIsAddingToCampaign(true);
    
    try {
      const success = await addFilterToCampaign(
        filterName.trim(),
        voterCount,
        { filters, queryParams: currentQueryParams }
      );

      if (success) {
        toast({
          title: "Filter Added to Campaign",
          description: `"${filterName.trim()}" has been added to ${selectedCampaign.name}`,
        });
        onClose();
      } else {
        toast({
          title: "Failed to Add Filter",
          description: "There was an error adding the filter to the campaign. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingToCampaign(false);
    }
  };

  const getActiveFilterSummary = () => {
    const summary = [];
    
    if (filters.county?.length) {
      summary.push(`${filters.county.length} counties`);
    }
    if (filters.congressionalDistricts?.length) {
      summary.push(`${filters.congressionalDistricts.length} congressional districts`);
    }
    if (filters.age?.length) {
      summary.push(`Age: ${filters.age.join(', ')}`);
    }
    if (filters.race?.length) {
      summary.push(`Race: ${filters.race.join(', ')}`);
    }
    if (filters.income?.length) {
      summary.push(`Income: ${filters.income.length} levels`);
    }
    if (filters.neverVoted) {
      summary.push('Never voted');
    }
    if (filters.notVotedSinceYear) {
      summary.push(`Not voted since ${filters.notVotedSinceYear}`);
    }
    
    return summary.length > 0 ? summary.join(', ') : 'No active filters';
  };

  if (!selectedCampaign) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>No Campaign Selected</DialogTitle>
            <DialogDescription>
              Please select a campaign first to add filters.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!hasActiveFilters) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>No Filters Applied</DialogTitle>
            <DialogDescription>
              Please apply at least one filter before adding to a campaign.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Filter to Campaign</DialogTitle>
          <DialogDescription>
            Add the current filter criteria to your selected campaign
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Campaign Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center space-x-2">
                <Target className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                <span className="dark:text-gray-200">Target Campaign</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="dark:bg-gray-800/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium dark:text-gray-200">{selectedCampaign.name}</div>
                  <div className="text-sm text-muted-foreground dark:text-gray-400">{selectedCampaign.description}</div>
                </div>
                <Badge className="bg-green-600 text-white dark:bg-green-500 dark:text-white">
                  {selectedCampaign.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Filter Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center space-x-2">
                <Users className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                <span className="dark:text-gray-200">Filter Results</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="dark:bg-gray-800/30">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium dark:text-gray-200">Matching Voters:</span>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-600">
                    {voterCount.toLocaleString()}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm font-medium dark:text-gray-200">Filter Criteria:</span>
                  <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1">
                    {getActiveFilterSummary()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filter Name */}
          <div className="space-y-3">
            <Label htmlFor="filter-name" className="dark:text-gray-200">Filter Name</Label>
            <div className="space-y-2">
              {!filterName && !isGeneratingName && (
                <Button 
                  variant="outline" 
                  onClick={handleGenerateAIName}
                  className="w-full dark:border-gray-600 dark:hover:bg-gray-700 dark:bg-gray-800/50"
                  disabled={isGeneratingName}
                >
                  <Sparkles className="h-4 w-4 mr-2 text-yellow-500 dark:text-yellow-400" />
                  Generate AI Name
                </Button>
              )}
              
              {isGeneratingName && (
                <div className="flex items-center justify-center p-4 border border-dashed rounded-lg dark:border-gray-600 dark:bg-gray-800/30">
                  <Loader2 className="h-4 w-4 animate-spin mr-2 text-blue-500 dark:text-blue-400" />
                  <span className="text-sm text-muted-foreground dark:text-gray-400">Generating intelligent filter name...</span>
                </div>
              )}
              
              {filterName && !isEditingName && (
                <div className="flex items-center space-x-2">
                  <div className="flex-1 p-3 bg-muted rounded-lg dark:bg-gray-800/50 dark:border dark:border-gray-700">
                    <span className="text-sm dark:text-gray-200">{filterName}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setIsEditingName(true)} className="dark:border-gray-600 dark:hover:bg-gray-700">
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {(isEditingName || (!filterName && !isGeneratingName)) && (
                <div className="space-y-2">
                  <Input
                    id="filter-name"
                    placeholder="Enter a custom filter name..."
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    maxLength={255}
                    className="w-full dark:bg-gray-800/50 dark:border-gray-600 dark:text-gray-200"
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground dark:text-gray-400">
                    <span>Maximum 255 characters</span>
                    <span>{filterName.length}/255</span>
                  </div>
                  {isEditingName && (
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={() => setIsEditingName(false)} className="dark:bg-blue-600 dark:hover:bg-blue-700">
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        setFilterName('');
                        setIsEditingName(false);
                      }} className="dark:border-gray-600 dark:hover:bg-gray-700">
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t dark:border-gray-700">
            <Button variant="outline" onClick={onClose} disabled={isAddingToCampaign} className="dark:border-gray-600 dark:hover:bg-gray-700">
              Cancel
            </Button>
            <Button 
              onClick={handleAddToCampaign}
              disabled={!filterName.trim() || isAddingToCampaign}
              className="dark:bg-green-600 dark:hover:bg-green-700"
            >
              {isAddingToCampaign ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Add to Campaign
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 