"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, X } from "lucide-react";
import { ParticipationScoreWidget } from "@/components/voter/ParticipationScoreWidget";
import { Label } from "@/components/ui/label";

interface VoterQuickviewProps {
  isOpen: boolean;
  voterId: string | undefined;
  onClose: () => void;
}

// Reusing the same hook from the profile page
function useVoterProfileSection(registrationNumber: string | undefined, section: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch if registrationNumber is valid
    if (!registrationNumber || !/^\d+$/.test(registrationNumber)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setData(null); // Reset data on new fetch

    // Use AbortController for cleanup
    const controller = new AbortController();
    const signal = controller.signal;

    fetch(`/api/ga/voter/profile/${registrationNumber}?section=${section}`, { signal })
      .then(res => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
      })
      .then(json => {
        if (json.errors && json.errors[section]) {
          setError(json.errors[section]);
          setData(null); // Ensure data is null on error
        } else {
          // Handle cases where the section might not be in the response (e.g., partial success)
          setData(json[section] || null);
        }
        setLoading(false);
      })
      .catch(e => {
        if (e.name === 'AbortError') {
          console.log(`Fetch aborted for section: ${section}`);
          return; // Don't update state if fetch was aborted
        }
        console.error(`Error fetching ${section}:`, e);
        setError(e.message || 'An error occurred');
        setData(null); // Ensure data is null on error
        setLoading(false);
      });

    // Cleanup function to abort fetch if component unmounts or deps change
    return () => {
      controller.abort();
    };

  }, [registrationNumber, section]);

  return { data, loading, error };
}

// Helper to format address object as a string
function formatAddress(address: any) {
  if (!address) return 'Not available';
  if (typeof address === 'string') return address;
  if (typeof address === 'object') {
    return [
      address.streetNumber,
      address.preDirection,
      address.streetName,
      address.streetType,
      address.postDirection,
      address.aptUnitNumber ? `Apt ${address.aptUnitNumber}` : null,
      address.city,
      address.zipcode
    ].filter(Boolean).join(' ');
  }
  return String(address);
}

// Calculate age from birth year
function calculateAge(birthYear: number): number {
  const currentYear = new Date().getFullYear();
  return currentYear - birthYear;
}

export function VoterQuickview({ isOpen, voterId, onClose }: VoterQuickviewProps) {
  // Fetch only the necessary sections for the quickview
  const {
    data: infoData,
    loading: infoLoading,
    error: infoError
  } = useVoterProfileSection(voterId, 'info');

  const {
    data: locationData,
    loading: locationLoading,
    error: locationError
  } = useVoterProfileSection(voterId, 'location');
  
  const {
    data: districtsData,
    loading: districtsLoading,
    error: districtsError
  } = useVoterProfileSection(voterId, 'districts');

  const {
    data: participationData,
    loading: participationLoading,
    error: participationError
  } = useVoterProfileSection(voterId, 'participation');

  // Derive voter name for dialog title once info data is loaded
  const voterName = infoData
    ? `${infoData.firstName || ''} ${infoData.middleName ? infoData.middleName + ' ' : ''}${infoData.lastName || ''}`.trim() || 'Voter Profile'
    : 'Voter Profile';

  // Check if we're still loading or have errors
  const isLoading = infoLoading || locationLoading || districtsLoading || participationLoading;
  const hasError = infoError || locationError || districtsError || participationError;

  // Extract history from participationData
  const historyData = participationData?.history;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl p-0 flex flex-col max-h-[90vh]">
        <DialogHeader className="pb-2 pt-4 px-4 border-b">
          <DialogTitle className="pr-8 text-xl">
            {isLoading ? (
              <Skeleton className="h-6 w-3/4" />
            ) : hasError ? (
              "Error Loading Voter"
            ) : (
              voterName
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2 my-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : hasError ? (
          <div className="text-red-500 py-2 px-4">
            {infoError || locationError || districtsError || participationError || "Failed to load voter information"}
          </div>
        ) : (
          <div className="text-sm flex-grow overflow-y-auto px-4 py-3">
            {/* Main two-column layout for content below Participation Score */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              {/* === Column 1: Voter Information === */}
              <div className="space-y-2.5">
                <div>
                  <Label className="text-xs text-muted-foreground">Participation Score</Label>
                  <div className="mt-0.5">
                     <ParticipationScoreWidget score={infoData?.participationScore} size="small" />
                  </div>
                </div>

                {/* Status and Reason Row */}
                <div className={`grid ${infoData?.statusReason ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'} gap-x-3`}>
                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <p className="text-sm font-medium text-foreground mt-0.5">{infoData?.status || "Unknown"}</p>
                  </div>
                  {infoData?.statusReason && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Reason</Label>
                      <p className="text-sm font-medium text-foreground mt-0.5">{infoData.statusReason}</p>
                    </div>
                  )}
                </div>

                {/* Race (own row) */}
                <div>
                  <Label className="text-xs text-muted-foreground">Race</Label>
                  <p className="text-sm font-medium text-foreground mt-0.5">{infoData?.race || "Unknown"}</p>
                </div>

                {/* Age and Gender Row */}
                <div className="grid grid-cols-2 gap-x-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Age</Label>
                    <p className="text-sm font-medium text-foreground mt-0.5">{infoData?.birthYear ? calculateAge(infoData.birthYear) : "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Gender</Label>
                    <p className="text-sm font-medium text-foreground mt-0.5">{infoData?.gender || "Unknown"}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs text-muted-foreground">Residence</Label>
                  <p className="text-sm font-medium text-foreground mt-0.5">{locationData?.residenceAddress ? formatAddress(locationData.residenceAddress) : "Address not available"}</p>
                </div>
                
                <div>
                  <Label className="text-xs text-muted-foreground">County</Label>
                  <p className="text-sm font-medium text-foreground mt-0.5">{locationData?.countyName || "N/A"}</p>
                </div>
                
                <div>
                  <Label className="text-xs text-muted-foreground">Precinct</Label>
                  <div className="text-sm font-medium text-foreground mt-0.5">
                    <div>
                      {districtsData?.countyPrecinctDescription ? (
                        `${districtsData.countyPrecinctDescription} (${districtsData.countyPrecinct})`
                      ) : districtsData?.countyPrecinct || "N/A"}
                    </div>
                    {districtsData?.facility?.facilityName && (
                      <div className="text-xs font-normal text-muted-foreground mt-0.5">
                        {districtsData.facility.facilityName}
                      </div>
                    )}
                    {districtsData?.facility?.facilityAddress && (
                      <div className="text-xs font-normal text-muted-foreground">
                        {districtsData.facility.facilityAddress}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground bg-muted p-1.5 rounded mt-3">
                  Registration No: {voterId}
                </div>
              </div>

              {/* === Column 2: Voting History === */}
              <div className="mt-4 md:mt-0">
                {participationLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-1/3 mb-1" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                    <Skeleton className="h-3 w-full mt-1" />
                    <Skeleton className="h-3 w-4/5" />
                  </div>
                ) : participationError ? (
                  <p className="text-red-500 text-xs">Could not load voting history. <br/> <span className="text-xs text-muted-foreground">({participationError})</span></p>
                ) : historyData && historyData.length > 0 ? (
                  <div>
                    <h4 className="text-sm font-semibold mb-1.5 text-foreground">Recent Voting History</h4>
                    <div className="space-y-1.5 text-xs">
                      {historyData.slice(0, 10).map((event: any, index: number) => (
                        <div key={index} className="grid grid-cols-[auto_1fr] gap-x-2 items-baseline">
                          <span className="text-muted-foreground whitespace-nowrap font-mono">{event.election_date || 'N/A'}:</span>
                          <span className="text-foreground">{event.election_type || 'N/A'} <span className="text-muted-foreground">({event.ballot_style || 'N/A'})</span></span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No recent voting history found.</p>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="sm:justify-between flex-row gap-2 pt-3 pb-3 px-4 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-muted-foreground hover:text-foreground transition-colors"
            onClick={onClose}
          >
            Close
          </Button>
          <Button 
            size="sm" 
            className="gap-1"
            asChild
          >
            {isLoading || hasError || voterId === undefined ? (
              <span className="opacity-50 cursor-not-allowed">
                View Full Profile
                <ExternalLink className="h-4 w-4 ml-1" />
              </span>
            ) : (
              <Link href={`/ga/voter/profile/${voterId}`}>
                View Full Profile
                <ExternalLink className="h-4 w-4 ml-1" />
              </Link>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 