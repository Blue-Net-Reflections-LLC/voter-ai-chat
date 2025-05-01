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

  // Derive voter name for dialog title once info data is loaded
  const voterName = infoData
    ? `${infoData.firstName || ''} ${infoData.middleName ? infoData.middleName + ' ' : ''}${infoData.lastName || ''}`.trim() || 'Voter Profile'
    : 'Voter Profile';

  // Check if we're still loading or have errors
  const isLoading = infoLoading || locationLoading;
  const hasError = infoError || locationError;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-4">
        <DialogHeader className="pb-2">
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
          <div className="text-red-500 py-2">
            {infoError || locationError || "Failed to load voter information"}
          </div>
        ) : (
          <div className="text-sm">
            {/* All fields in horizontal layout with labels on left */}
            <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1">
              <p className="text-muted-foreground text-xs">Status:</p>
              <p className="font-medium">{infoData?.status || "Unknown"}</p>
              
              <p className="text-muted-foreground text-xs">Age:</p>
              <p className="font-medium">{infoData?.birthYear ? calculateAge(infoData.birthYear) : "N/A"}</p>
              
              <p className="text-muted-foreground text-xs">Gender:</p>
              <p className="font-medium">{infoData?.gender || "Unknown"}</p>
              
              <p className="text-muted-foreground text-xs">Race:</p>
              <p className="font-medium">{infoData?.race || "Unknown"}</p>
              
              <p className="text-muted-foreground text-xs">Residence:</p>
              <p className="font-medium">{locationData?.residenceAddress ? formatAddress(locationData.residenceAddress) : "Address not available"}</p>
              
              <p className="text-muted-foreground text-xs">County:</p>
              <p className="font-medium">{locationData?.countyName || "N/A"}</p>
            </div>

            {/* Registration Number */}
            <div className="text-xs text-muted-foreground bg-muted p-1.5 rounded mt-2">
              Registration Number: {voterId}
            </div>
          </div>
        )}

        <DialogFooter className="sm:justify-between flex-row gap-2 pt-3 mt-2 border-t">
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