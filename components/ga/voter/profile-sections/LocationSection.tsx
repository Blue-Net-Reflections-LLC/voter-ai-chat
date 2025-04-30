"use client";

import React from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge"; // For status
import { calculateAge } from '@/lib/utils'; // Assuming a utility for age calc

// Helper to format address object as a string
function formatAddress(address: any) {
  if (!address) return 'Not available';
  if (typeof address === 'string') return address;
  if (typeof address === 'object' && address !== null) {
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
  return String(address); // Fallback
}

interface LocationSectionProps {
  locationData: any;
  locationLoading: boolean;
  locationError: string | null;
  otherVotersData: any; // Array of other voters
  otherVotersLoading: boolean;
  otherVotersError: string | null;
}

export function LocationSection({
  locationData,
  locationLoading,
  locationError,
  otherVotersData,
  otherVotersLoading,
  otherVotersError
}: LocationSectionProps) {

  // Debug log
  console.log('LocationSection otherVotersData:', otherVotersData);
  
  // Add debug for location data and coordinates
  console.log('LocationData:', locationData);
  console.log('Map coordinates:', locationData?.coordinates?.longitude, locationData?.coordinates?.latitude);
  
  const mapToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  console.log('Mapbox token available:', !!mapToken);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Location</CardTitle>
        <CardDescription>
          Address, map, household, and redistricting information
        </CardDescription>
      </CardHeader>
      <CardContent>
        {locationLoading ? (
          <div className="space-y-2">
            <Skeleton className="w-full h-5" />
            <Skeleton className="w-4/5 h-5" />
            <div className="aspect-[4/3] w-full max-w-sm mx-auto my-4">
              <Skeleton className="w-full h-full rounded-md" />
            </div>
            <Skeleton className="w-1/2 h-4 mt-4" />
            <Skeleton className="w-full h-5" />
          </div>
        ) : locationError ? (
          <div className="text-red-500">Error loading location: {locationError}</div>
        ) : locationData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Address & Other Voters */}
            <div className="space-y-4">
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">County:</span> {locationData.countyName ? `${locationData.countyName} (${locationData.countyCode})` : locationData.countyCode || 'N/A'}</p>
                <p><span className="font-medium">Residence:</span> {formatAddress(locationData.residenceAddress)}</p>
                <p><span className="font-medium">Mailing:</span> {formatAddress(locationData.mailingAddress) || 'Same as residence'}</p>
                
                {/* Redistricting information */}
                {locationData.redistrictingDates && (
                  <p><span className="font-medium">Last Redistricting:</span> {new Date(locationData.redistrictingDates.last).toLocaleDateString()}</p>
                )}
                
                {/* Check if redistrictingAffected object exists and has any true values */}
                {locationData.redistrictingAffected && 
                  (locationData.redistrictingAffected.congressional || 
                   locationData.redistrictingAffected.senate || 
                   locationData.redistrictingAffected.house) && (
                  <div className="mt-1">
                    <span className="font-medium">Redistricting Affected:</span>
                    <ul className="pl-5 list-disc">
                      {locationData.redistrictingAffected.congressional && <li>Congressional District</li>}
                      {locationData.redistrictingAffected.senate && <li>State Senate District</li>}
                      {locationData.redistrictingAffected.house && <li>State House District</li>}
                    </ul>
                  </div>
                )}
              </div>
              
              {/* Other Voters - Now moved to left column */}
              <div className="mt-4">
                <h4 className="font-medium mb-2 text-sm">Other Voters at Residence</h4>
                {otherVotersLoading ? (
                  <div className="space-y-2">
                     <Skeleton className="w-full h-5" />
                     <Skeleton className="w-4/5 h-5" />
                     <Skeleton className="w-2/3 h-5" />
                  </div>
                ) : otherVotersError ? (
                   <div className="text-red-500 text-xs">Error loading household: {otherVotersError}</div>
                ) : otherVotersData && otherVotersData.length > 0 ? (
                  <ul className="space-y-2">
                    {otherVotersData.map((voter: any) => (
                      <li key={voter.registrationNumber} className="text-xs border-b pb-1 last:border-b-0 last:pb-0">
                        <div className="flex justify-between items-center">
                          <Link href={`/ga/voter/profile/${voter.registrationNumber}`} className="font-medium hover:underline truncate mr-2">
                            {`${voter.firstName || ''} ${voter.middleName || ''} ${voter.lastName || ''} ${voter.suffix || ''}`.replace(/\s+/g, ' ').trim()}
                          </Link>
                          <Badge variant={voter.status?.toUpperCase() === 'ACTIVE' ? 'solid' : 'outline'} className="text-[10px] px-1.5 py-0.5">
                             {voter.status}
                          </Badge>
                        </div>
                        <div className="text-muted-foreground">
                           {voter.gender ? `${voter.gender}, ` : ''} Age: {voter.birthYear ? calculateAge(voter.birthYear) : 'N/A'}
                           <span className="ml-2">Reg: {voter.registrationNumber}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                   <p className="text-xs text-muted-foreground">No other voters found at this residence address.</p>
                )}
              </div>
            </div>

            {/* Right Column: Map (now moved here) */}
            <div className="aspect-[4/3] rounded-md overflow-hidden border">
              {locationData.coordinates && 
               locationData.coordinates.longitude && 
               locationData.coordinates.latitude && 
               mapToken ? (
                <img
                  src={`https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-s+e55e5e(${locationData.coordinates.longitude},${locationData.coordinates.latitude})/${locationData.coordinates.longitude},${locationData.coordinates.latitude},15,0/400x300?access_token=${mapToken}`}
                  alt="Voter location map"
                  className="w-full h-full object-cover"
                  width={400}
                  height={300}
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-sm">
                  Map Unavailable
                  {locationData.coordinates ? 
                    <span className="text-xs block mt-1">
                      {!locationData.coordinates.longitude || !locationData.coordinates.latitude 
                        ? "Missing coordinates" 
                        : "Mapbox token missing"}
                    </span> : null
                  }
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>No location information available</div>
        )}
      </CardContent>
    </Card>
  );
} 