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

interface DistrictsSectionProps {
  districtsData: any;
  districtsLoading: boolean;
  districtsError: string | null;
  // Add representatives data props later
}

export function DistrictsSection({
  districtsData,
  districtsLoading,
  districtsError,
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
                {districtsData.congressional ? <li><span className="font-medium">Congressional:</span> {String(districtsData.congressional)}</li> : <li>Congressional: N/A</li>}
                {districtsData.stateSenate ? <li><span className="font-medium">State Senate:</span> {String(districtsData.stateSenate)}</li> : <li>State Senate: N/A</li>}
                {districtsData.stateHouse ? <li><span className="font-medium">State House:</span> {String(districtsData.stateHouse)}</li> : <li>State House: N/A</li>}
                {districtsData.judicial ? <li><span className="font-medium">Judicial:</span> {String(districtsData.judicial)}</li> : <li>Judicial: N/A</li>}
                {districtsData.municipality ? <li><span className="font-medium">Municipality:</span> {String(districtsData.municipality)}</li> : <li>Municipality: N/A</li>}
              </ul>
            </div>
          </div>
          // TODO: Add Representatives Section Here
        ) : (
          <div>No district information available</div>
        )}
      </CardContent>
    </Card>
  );
} 