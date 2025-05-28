"use client";

import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, ArrowUp, ArrowDown, LoaderCircle, CheckCircle, Clock, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Voter } from '../types';
import { SortField, SortDirection } from '../hooks/useVoterList';
import { cn } from "@/lib/utils";
import { VoterQuickview } from "@/components/ga/voter/quickview/VoterQuickview";
import { ParticipationScoreWidget } from "@/components/voter/ParticipationScoreWidget";
import { useCampaignContext } from '../../CampaignContext';

// Mock campaign status data for prototype - Enhanced to show more contacted voters
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

// Campaign Status Cell Component
function CampaignStatusCell({ voterId, voterIndex }: { voterId: string; voterIndex: number }) {
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
      await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));
      
      // For prototype: Show first 5 voters as contacted when campaign is selected
      if (selectedCampaign) {
        // Use voterIndex (0-based) to determine status
        if (voterIndex < 5) {
          // First 5 voters are contacted with various methods and sentiments
          const contactMethods: ('phone' | 'door' | 'text' | 'email')[] = ['phone', 'door', 'text', 'email'];
          const sentiments: ('positive' | 'neutral' | 'negative')[] = ['positive', 'positive', 'positive', 'neutral', 'negative']; // More positive for demo
          const notes = [
            'Committed to vote',
            'Very engaged',
            'Acknowledged message', 
            'Requested voting info',
            'Email opened'
          ];
          
          const contactDates = [
            '2024-10-15', '2024-10-16', '2024-10-14', '2024-10-17', '2024-10-13'
          ];
          
          setCampaignStatus({
            status: 'contacted',
            campaignName: selectedCampaign.name,
            contactDate: contactDates[voterIndex] || '2024-10-15',
            contactMethod: contactMethods[voterIndex % contactMethods.length],
            sentiment: sentiments[voterIndex % sentiments.length],
            notes: notes[voterIndex] || 'Contact made'
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
      <div className="flex flex-col space-y-1">
        <Badge variant="outline" className={`text-[10px] ${sentimentColor}`}>
          <CheckCircle className="h-2 w-2 mr-1" />
          {methodIcon && <span className="mr-1">{methodIcon}</span>}
          Contacted
        </Badge>
        {campaignStatus.contactDate && (
          <span className="text-[9px] text-muted-foreground dark:text-gray-400">
            {new Date(campaignStatus.contactDate).toLocaleDateString()}
          </span>
        )}
        {campaignStatus.notes && (
          <span className="text-[8px] text-muted-foreground dark:text-gray-500 truncate max-w-[100px]" title={campaignStatus.notes}>
            {campaignStatus.notes}
          </span>
        )}
      </div>
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

interface VoterTableProps {
  voters: Voter[];
  isLoading?: boolean;
  sort?: {
    field: SortField;
    direction: SortDirection;
  };
  onSort?: (field: SortField) => void;
  hasFetchedOnce?: boolean;
}

interface SortButtonProps {
  field: SortField;
  label: string;
  currentSort?: {
    field: SortField;
    direction: SortDirection;
  };
  onSort?: (field: SortField) => void;
}

const SortButton = ({ field, label, currentSort, onSort }: SortButtonProps) => {
  const active = currentSort?.field === field;
  const direction = active ? currentSort.direction : null;
  
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={() => onSort?.(field)} 
      className="h-6 px-1 font-semibold text-[10px] justify-between"
    >
      {label}
      {active ? (
        direction === 'asc' ? <ArrowUp className="ml-1 h-3.5 w-3.5" /> : <ArrowDown className="ml-1 h-3.5" />
      ) : (
        <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-50" />
      )}
    </Button>
  );
};

// Helper function to determine styling and text for status badges
const getStatusProps = (status: string | undefined) => {
  if (!status) {
    return {
      className: 'bg-gray-100 text-gray-700 border border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
      text: 'Unknown'
    };
  }

  const statusUpper = status.toUpperCase();
  
  if (statusUpper === 'ACTIVE') {
    return {
      className: 'bg-green-100 text-green-700 border border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700',
      text: 'Active'
    };
  } else if (statusUpper === 'INACTIVE') {
    return {
      className: 'bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-900 dark:text-amber-400 dark:border-amber-700',
      text: 'Inactive'
    };
  } else if (statusUpper.includes('CANCEL')) {
    return {
      className: 'bg-red-100 text-red-700 border border-red-300 dark:bg-red-900 dark:text-red-400 dark:border-red-700',
      text: statusUpper.includes('PENDING') ? 'Pending Cancel' : 'Canceled'
    };
  } else {
    return {
      className: 'bg-gray-100 text-gray-700 border border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
      text: status
    };
  }
};

// Helper to format Full Name
const formatFullName = (voter: Voter) => {
  const middlePart = voter.middleName ? `${voter.middleName.charAt(0)}. ` : ""; // Assuming middle initial if full middle name present
  const nameParts = [voter.firstName, middlePart, voter.lastName].filter(Boolean);
  let fullName = nameParts.join(" ");
  if (voter.nameSuffix) {
    fullName += `, ${voter.nameSuffix}`;
  }
  return fullName;
};

// Helper to format Resident Address
const formatAddress = (address: Voter['address']) => {
    if (!address) return "N/A";
    const addressParts = [
      address.preDirection, // Use preDirection from Voter type
      address.streetName,
      address.postDirection, // Use postDirection from Voter type
    ]
      .filter(Boolean)
      .join(" ");
      // Assuming streetNumber is available and relevant, prepend it
      const streetNumber = address.streetNumber ? `${address.streetNumber} ` : "";
      const fullAddressLine = `${streetNumber}${addressParts}`;
      return address.zipcode ? `${fullAddressLine}, ${address.zipcode}` : fullAddressLine;
};

export function VoterTable({ 
  voters, 
  isLoading = false, 
  sort,
  onSort,
  hasFetchedOnce = false
}: VoterTableProps) {
  // State for the voter quickview
  const [selectedVoter, setSelectedVoter] = useState<string | undefined>(undefined);
  const [isQuickviewOpen, setIsQuickviewOpen] = useState(false);
  const { selectedCampaign } = useCampaignContext();

  // Handle row click to open quickview
  const handleRowClick = (voterId: string) => {
    setSelectedVoter(voterId);
    setIsQuickviewOpen(true);
  };

  // Close quickview
  const handleCloseQuickview = () => {
    setIsQuickviewOpen(false);
  };

  return (
    <div className="w-full h-full relative">
      {hasFetchedOnce && (
        <Table className="relative border-separate border-spacing-0 w-full h-full" style={{ tableLayout: 'fixed' }}>
          <TableHeader className="border-b border-gray-300 dark:border-gray-700">
            <TableRow className="h-7">
              <TableHead 
                style={{ 
                  width: selectedCampaign ? '25%' : '30%', 
                  position: 'sticky', 
                  top: 0, 
                  zIndex: 2 
                }} 
                className="py-1.5 px-3 bg-gray-50 text-gray-600 dark:bg-zinc-800 dark:text-gray-300 font-normal border-b border-gray-300 dark:border-gray-700"
              >
                <SortButton field="name" label="Full Name" currentSort={sort} onSort={onSort} />
              </TableHead>
              <TableHead 
                style={{ 
                  width: selectedCampaign ? '12%' : '15%', 
                  position: 'sticky', 
                  top: 0, 
                  zIndex: 2
                }} 
                className="py-1.5 px-3 bg-gray-50 text-gray-600 dark:bg-zinc-800 dark:text-gray-300 font-normal border-b border-gray-300 dark:border-gray-700"
              >
                <SortButton field="county" label="County" currentSort={sort} onSort={onSort} />
              </TableHead>
              <TableHead 
                style={{ 
                  width: selectedCampaign ? '25%' : '30%', 
                  position: 'sticky', 
                  top: 0, 
                  zIndex: 2
                }} 
                className="py-1.5 px-3 bg-gray-50 text-gray-600 dark:bg-zinc-800 dark:text-gray-300 font-normal text-left border-b border-gray-300 dark:border-gray-700"
              >
                <SortButton field="address" label="Resident Address" currentSort={sort} onSort={onSort} />
              </TableHead>
              <TableHead 
                style={{ 
                  width: selectedCampaign ? '8%' : '10%', 
                  position: 'sticky', 
                  top: 0, 
                  zIndex: 2 
                }} 
                className="py-1.5 px-3 bg-gray-50 text-gray-600 dark:bg-zinc-800 dark:text-gray-300 font-normal border-b border-gray-300 dark:border-gray-700"
              >
                <SortButton field="score" label="Score" currentSort={sort} onSort={onSort} />
              </TableHead>
              {selectedCampaign && (
                <TableHead 
                  style={{ 
                    width: '15%', 
                    position: 'sticky', 
                    top: 0, 
                    zIndex: 2
                  }} 
                  className="py-1.5 px-3 bg-gray-50 text-gray-600 dark:bg-zinc-800 dark:text-gray-300 font-normal border-b border-gray-300 dark:border-gray-700"
                >
                  <div className="flex items-center space-x-1">
                    <span className="text-[10px] font-semibold">Campaign Status</span>
                  </div>
                </TableHead>
              )}
              <TableHead 
                style={{ 
                  width: selectedCampaign ? '15%' : '25%', 
                  position: 'sticky', 
                  top: 0, 
                  zIndex: 2
                }} 
                className="py-1.5 px-3 bg-gray-50 text-gray-600 dark:bg-zinc-800 dark:text-gray-300 font-normal border-b border-gray-300 dark:border-gray-700"
              >
                <SortButton field="status" label="Status" currentSort={sort} onSort={onSort} />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hasFetchedOnce && !isLoading && voters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={selectedCampaign ? 6 : 5} className="text-center py-6 text-muted-foreground">
                  No voters found matching your criteria
                </TableCell>
              </TableRow>
            ) : (
              voters.map((voter, index) => {
                const statusProps = getStatusProps(voter.status);
                return (
                  <TableRow 
                    key={voter.id} 
                    className={cn(
                      "border-b border-gray-200 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800/50 cursor-pointer",
                      index % 2 === 1 ? "bg-gray-50 dark:bg-zinc-900/70" : "bg-white dark:bg-zinc-950"
                    )}
                    onClick={() => handleRowClick(voter.id)}
                  >
                    <TableCell style={{ width: selectedCampaign ? '25%' : '30%' }} className="py-2 px-3 text-xs">{formatFullName(voter)}</TableCell>
                    <TableCell style={{ width: selectedCampaign ? '12%' : '15%' }} className="py-2 px-3 text-xs">{voter.county || "N/A"}</TableCell>
                    <TableCell style={{ width: selectedCampaign ? '25%' : '30%' }} className="py-2 px-3 text-xs">{formatAddress(voter.address)}</TableCell>
                    <TableCell style={{ width: selectedCampaign ? '8%' : '10%' }} className="py-2 px-3 text-xs">
                      <ParticipationScoreWidget score={voter.participationScore} size="small" variant="compact" />
                    </TableCell>
                    {selectedCampaign && (
                      <TableCell style={{ width: '15%' }} className="py-2 px-3 text-xs">
                        <CampaignStatusCell voterId={voter.id} voterIndex={index} />
                      </TableCell>
                    )}
                    <TableCell style={{ width: selectedCampaign ? '15%' : '25%' }} className="py-2 px-3">
                      <span className={cn("inline-flex items-center justify-center text-[10px] font-semibold rounded px-2 py-0.5", statusProps.className)}>
                        {statusProps.text.toUpperCase()}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      )}
      {isLoading && hasFetchedOnce && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/50 z-10">
          <LoaderCircle className="h-12 w-12 animate-spin text-primary/70" />
        </div>
      )}
      {/* Voter Quickview Modal */}
      <VoterQuickview
        isOpen={isQuickviewOpen}
        voterId={selectedVoter}
        onClose={handleCloseQuickview}
      />
    </div>
  );
}

export default VoterTable; 