"use client";

import React from 'react';
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

interface DistrictsParticipationTabsProps {
  districtsData: any;
  districtsLoading: boolean;
  districtsError: string | null;
  participationData: any;
  participationLoading: boolean;
  participationError: string | null;
  // Add representatives data props later
}

export function DistrictsParticipationTabs({
  districtsData,
  districtsLoading,
  districtsError,
  participationData,
  participationLoading,
  participationError
}: DistrictsParticipationTabsProps) {
  return (
    <div className="mb-6">
      <Tabs defaultValue="districts">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="districts">Districts & Reps</TabsTrigger>
          <TabsTrigger value="participation">Voting History</TabsTrigger>
        </TabsList>

        {/* Districts Tab */}
        <TabsContent value="districts">
          <Card>
            <CardContent className="pt-6 text-sm">
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
        </TabsContent>

        {/* Participation Tab */}
        <TabsContent value="participation">
          <Card>
            <CardContent className="pt-6">
              {participationLoading ? (
                <div className="space-y-2">
                  <Skeleton className="w-full h-5" />
                  <Skeleton className="w-full h-5" />
                  <Skeleton className="w-4/5 h-5" />
                </div>
              ) : participationError ? (
                <div className="text-red-500">Error loading voting history: {participationError}</div>
              ) : participationData && participationData.history && participationData.history.length > 0 ? (
                <div>
                  {/* <h3 className="font-medium mb-2 text-sm">Voting History</h3> */} {/* Title redundant with tab */}
                  <ul className="space-y-3">
                    {participationData.history.map((item: any, index: number) => (
                      <li key={index} className="text-sm border-b pb-2 last:border-b-0 last:pb-0">
                        <p className="font-medium">{item.electionName} - {new Date(item.date).toLocaleDateString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.type} {item.party ? `(${item.party})` : ''} • Method: {item.method}
                          {item.absentee === 'Y' && ' • Absentee'}
                          {item.provisional === 'Y' && ' • Provisional'}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No voting history available for this voter.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 