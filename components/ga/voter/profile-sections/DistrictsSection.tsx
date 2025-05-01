"use client";

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

interface DistrictsSectionProps {
  districtsData: any;
  districtsLoading: boolean;
  districtsError: string | null;
  representativesData?: any;
  representativesLoading?: boolean;
  representativesError?: string | null;
}

// Helper to render a representative
const RepresentativeItem = ({ rep }: { rep: any }) => {
  if (!rep) return null;
  
  return (
    <div className="mb-2">
      <div className="flex items-start">
        {rep.photo_url && (
          <div className="mr-3 flex-shrink-0">
            <img 
              src={rep.photo_url} 
              alt={`Photo of ${rep.name}`} 
              className="w-12 h-12 rounded-full object-cover border border-muted"
              onError={(e) => {
                // If the image fails to load, hide it
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        <div className="flex-1">
          <Link 
            href={rep.sponsor_page_url || "#"} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm font-medium hover:underline flex items-center text-primary"
          >
            {rep.name} {rep.sponsor_page_url !== "#" && <ExternalLink size={14} className="ml-1" />}
          </Link>
          <div className="text-xs text-muted-foreground">
            {rep.party_name && (
              <span className="mr-2">{rep.party_name}</span>
            )}
            {rep.role && (
              <span>{rep.role}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper to format district numbers by removing FIPS code prefix (13)
const formatDistrictNumber = (district: string | number | null): string => {
  if (!district) return 'N/A';
  
  const districtStr = String(district);
  
  // Remove '13' prefix from district numbers if present
  if (districtStr.startsWith('13') && districtStr.length > 2) {
    return districtStr.substring(2);
  }
  
  return districtStr;
};

export function DistrictsSection({
  districtsData,
  districtsLoading,
  districtsError,
  representativesData,
  representativesLoading = false,
  representativesError = null,
}: DistrictsSectionProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Districts & Representatives</CardTitle>
        <CardDescription>
          Electoral districts and elected officials
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm">
        {districtsLoading ? (
          <div className="space-y-2">
            <Skeleton className="w-full h-5" />
            <Skeleton className="w-3/4 h-5" />
            <Skeleton className="w-4/5 h-5" />
          </div>
        ) : districtsError ? (
          <div className="text-red-500">Error loading districts: {districtsError}</div>
        ) : districtsData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Voting Location */}
            <div className="space-y-2">
              <h4 className="font-medium mb-1">Voting Location</h4>
              {districtsData.countyPrecinct ? (
                <p><span className="font-medium">Precinct:</span> {districtsData.countyPrecinctDescription || districtsData.countyPrecinct}</p>
              ) : <p className="text-muted-foreground">Precinct: N/A</p>}
              {districtsData.municipalPrecinct && (
                <p><span className="font-medium">Municipal Precinct:</span> {districtsData.municipalPrecinct}</p>
              )}
            </div>

            {/* Right: Elected Districts */}
            <div className="space-y-2">
              <h4 className="font-medium mb-1">Elected Districts</h4>
              <ul className="space-y-1 list-disc list-inside marker:text-muted-foreground">
                <li><span className="font-medium">Congressional:</span> {formatDistrictNumber(districtsData.congressional)}</li>
                <li><span className="font-medium">State Senate:</span> {formatDistrictNumber(districtsData.stateSenate)}</li>
                <li><span className="font-medium">State House:</span> {formatDistrictNumber(districtsData.stateHouse)}</li>
                {districtsData.judicial ? <li><span className="font-medium">Judicial:</span> {String(districtsData.judicial)}</li> : <li>Judicial: N/A</li>}
                {districtsData.municipality ? <li><span className="font-medium">Municipality:</span> {String(districtsData.municipality)}</li> : <li>Municipality: N/A</li>}
              </ul>
            </div>
          </div>
        ) : (
          <div>No district information available</div>
        )}

        {/* Representatives Section */}
        {representativesLoading ? (
          <div className="mt-6 space-y-2">
            <Skeleton className="w-full h-5" />
            <Skeleton className="w-3/4 h-5" />
            <Skeleton className="w-4/5 h-5" />
          </div>
        ) : representativesError ? (
          <div className="mt-6 text-red-500">Error loading representatives: {representativesError}</div>
        ) : representativesData?.representatives ? (
          <div className="mt-6">
            <h4 className="font-medium mb-3">Representatives</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Congressional Representatives */}
              {representativesData.representatives.congressional?.length > 0 && (
                <div className="bg-muted/30 p-3 rounded-md">
                  <h5 className="text-xs uppercase text-muted-foreground mb-2">CONGRESSIONAL</h5>
                  {representativesData.representatives.congressional.map((rep: any, index: number) => (
                    <RepresentativeItem key={`congressional-${index}`} rep={rep} />
                  ))}
                </div>
              )}
              
              {/* State Representatives (Combined State Senate and State House) */}
              {representativesData.representatives.state?.length > 0 && (
                <div className="bg-muted/30 p-3 rounded-md">
                  <h5 className="text-xs uppercase text-muted-foreground mb-2">STATE</h5>
                  {representativesData.representatives.state.map((rep: any, index: number) => (
                    <RepresentativeItem key={`state-${index}`} rep={rep} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
} 