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

interface CensusSectionProps {
  data: any;
  loading: boolean;
  error: string | null;
}

// Helper function to format demographics key
function formatDemographicKey(key: string): string {
  // Add spaces before capital letters (except the first character)
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
}

export function CensusSection({ data, loading, error }: CensusSectionProps) {
  const censusData = data?.census; // Access the nested census object
  const available = censusData?.available;
  const message = censusData?.message;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Census Data</CardTitle>
        <CardDescription>
          Demographic information for this voter's Census tract
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="w-full h-5" />
            <Skeleton className="w-3/4 h-5" />
            <Skeleton className="w-1/2 h-5" />
          </div>
        ) : error ? (
          <div className="text-red-500">Error loading census data: {error}</div>
        ) : available === false ? (
          // Handle case where API explicitly says data is unavailable
          <div className="text-sm text-muted-foreground">{message || "Census data not available for this voter."}</div>
        ) : censusData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-medium mb-2">Census Tract: {censusData.tract || 'N/A'}</h3>
              <p className="text-xs mb-2 text-muted-foreground">Based on the 2020 Census (placeholder)</p>

              <h4 className="font-medium mt-3 mb-1">Household (Placeholder)</h4>
              <ul className="space-y-1 text-xs">
                <li><span className="font-medium">Median Household Income:</span> {
                  typeof censusData.medianHouseholdIncome === 'number'
                    ? `$${censusData.medianHouseholdIncome.toLocaleString()}`
                    : censusData.medianHouseholdIncome || 'N/A' // Show placeholder string or N/A
                }</li>
                <li><span className="font-medium">Average Household Size:</span> {
                  typeof censusData.averageHouseholdSize === 'number'
                    ? censusData.averageHouseholdSize.toFixed(1)
                    : censusData.averageHouseholdSize || 'N/A' // Show placeholder string or N/A
                }</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-1">Demographics (Placeholder)</h4>
              <ul className="space-y-1 text-xs">
                {censusData.demographics && typeof censusData.demographics === 'object'
                  ? Object.entries(censusData.demographics).map(([key, value]) => (
                      <li key={key} className="truncate"><span className="font-medium">{formatDemographicKey(key)}:</span> {
                        // Handle nested objects like education/employment
                        typeof value === 'object' && value !== null
                          ? Object.entries(value).map(([subKey, subValue]) => (
                              <span key={subKey} className="block ml-4"><span className="font-medium">{formatDemographicKey(subKey)}:</span> {String(subValue)}</span>
                            ))
                          : typeof value === 'number' ? `${value.toFixed(1)}%` : String(value)
                      }</li>
                    ))
                  : <li>No demographic data available</li>}
              </ul>
            </div>
          </div>
        ) : (
          <div>No census data available</div>
        )}
      </CardContent>
    </Card>
  );
} 