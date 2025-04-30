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

interface VoterInfoSectionProps {
  data: any;
  loading: boolean;
  error: string | null;
}

export function VoterInfoSection({ data, loading, error }: VoterInfoSectionProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Voter Information</CardTitle>
        <CardDescription>
          Personal and registration details
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="w-full h-5" />
            <Skeleton className="w-2/3 h-5" />
            <Skeleton className="w-3/4 h-5" />
          </div>
        ) : error ? (
          <div className="text-red-500">Error loading voter information: {error}</div>
        ) : data ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p><span className="font-medium">Registration Number:</span> {data.registrationNumber}</p>
              <p><span className="font-medium">Status:</span> {data.status}</p>
              <p><span className="font-medium">Registration Date:</span> {data.registrationDate ? new Date(data.registrationDate).toLocaleDateString() : 'N/A'}</p>
              <p><span className="font-medium">Last Modified:</span> {data.lastModifiedDate ? new Date(data.lastModifiedDate).toLocaleDateString() : 'N/A'}</p>
              <p><span className="font-medium">Created:</span> {data.voterCreationDate ? new Date(data.voterCreationDate).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p><span className="font-medium">Birth Year:</span> {data.birthYear || 'N/A'}</p>
              <p><span className="font-medium">Age:</span> {data.age || 'N/A'}</p>
              <p><span className="font-medium">Race:</span> {data.race}</p>
              <p><span className="font-medium">Gender:</span> {data.gender}</p>
            </div>
          </div>
        ) : (
          <div>No voter information available</div>
        )}
      </CardContent>
    </Card>
  );
} 