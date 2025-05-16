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
import { Label } from "@/components/ui/label";

interface VoterInfoSectionProps {
  data: any;
  loading: boolean;
  error: string | null;
}

// Helper component for individual data points to reduce repetition
const InfoItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="mb-2">
    <Label className="text-xs text-muted-foreground">{label}</Label>
    <p className="text-sm font-medium text-foreground mt-0.5 break-words">{value || "N/A"}</p>
  </div>
);

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
            <Skeleton className="w-full h-5" />
            <Skeleton className="w-3/4 h-5" />
            <Skeleton className="w-1/2 h-5" />
          </div>
        ) : error ? (
          <div className="text-red-500">Error loading voter information: {error}</div>
        ) : data ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
            <InfoItem label="Registration Number" value={data.registrationNumber} />
            <InfoItem label="Status" value={data.status} />
            {data.statusReason && (
              <InfoItem label="Status Reason" value={data.statusReason} />
            )}
            <InfoItem label="Registration Date" value={data.registrationDate ? new Date(data.registrationDate).toLocaleDateString() : 'N/A'} />
            <InfoItem label="Birth Year" value={data.birthYear} />
            <InfoItem label="Age" value={data.age} />
            <InfoItem label="Race" value={data.race} />
            <InfoItem label="Gender" value={data.gender} />
            <InfoItem label="Last Modified" value={data.lastModifiedDate ? new Date(data.lastModifiedDate).toLocaleDateString() : 'N/A'} />
            <InfoItem label="Record Created" value={data.voterCreationDate ? new Date(data.voterCreationDate).toLocaleDateString() : 'N/A'} />
          </div>
        ) : (
          <div>No voter information available</div>
        )}
      </CardContent>
    </Card>
  );
} 