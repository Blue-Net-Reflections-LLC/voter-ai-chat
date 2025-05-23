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
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface CensusSectionProps {
  data: any;
  loading: boolean;
  error: string | null;
}

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
};

// Helper function to format percentage
const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export function CensusSection({ data, loading, error }: CensusSectionProps) {
  const censusData = data?.census; // Access the nested census object
  const available = censusData?.available;
  const message = censusData?.message;
  const hasError = censusData?.error;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Census Data</CardTitle>
        <CardDescription>
          Population, citizenship, and demographic information for this voter&apos;s Census tract
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
        ) : hasError ? (
          // Handle API error
          <div className="text-sm text-red-500">{message || "Error retrieving census data."}</div>
        ) : censusData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {/* Left column - Education & Population */}
            <div>
              <h3 className="font-medium mb-2">Census Tract: {censusData.tract || 'N/A'}</h3>
              <p className="text-xs mb-3 text-muted-foreground">
                Based on {censusData.source || 'Census Data'} ({censusData.year || 'Current'})
              </p>

              {/* Population Data Section */}
              {censusData.population && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Total Population</h4>
                  <div className="bg-primary/10 p-3 rounded-md mb-2">
                    <p className="font-bold text-lg">
                      {censusData.population.total.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total residents ({censusData.population.source})
                    </p>
                  </div>
                  
                  {/* Population by Race */}
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>White alone</span>
                      <span>{censusData.population.byRace.white.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Black alone</span>
                      <span>{censusData.population.byRace.black.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Asian alone</span>
                      <span>{censusData.population.byRace.asian.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Other races</span>
                      <span>{(censusData.population.byRace.americanIndian + censusData.population.byRace.pacificIslander + censusData.population.byRace.other).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* CVAP Data Section */}
              {censusData.cvap && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2 flex items-center">
                    Citizen Voting Age Population (CVAP)
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="ml-1 cursor-help">
                            <HelpCircle size={14} className="text-muted-foreground" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>U.S. citizens age 18 and over who are eligible to vote. This is the official Census Bureau data used for voting rights analysis.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </h4>
                  <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md mb-2">
                    <p className="font-bold text-lg text-blue-900 dark:text-blue-100">
                      {censusData.cvap.total.toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Eligible voters ({censusData.cvap.year})
                    </p>
                  </div>
                  
                  {/* CVAP by Race */}
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>White alone</span>
                      <span>{censusData.cvap.byRace.white.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Black alone</span>
                      <span>{censusData.cvap.byRace.black.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Asian alone</span>
                      <span>{censusData.cvap.byRace.asian.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hispanic/Latino</span>
                      <span>{censusData.cvap.byRace.hispanic.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Other races</span>
                      <span>{(censusData.cvap.byRace.americanIndian + censusData.cvap.byRace.pacificIslander + censusData.cvap.byRace.other + censusData.cvap.byRace.twoOrMore).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              <h4 className="font-medium mt-3 mb-2">Education Attainment</h4>
              <p className="text-xs text-muted-foreground mb-2">Population 25 years and over: {
                censusData.education?.totalPopulation?.toLocaleString() || 'N/A'
              }</p>
              
              <div className="space-y-2">
                {censusData.education?.higherEducation && (
                  <div className="bg-primary/10 p-3 rounded-md">
                    <p className="font-bold">
                      {formatPercentage(censusData.education.higherEducation.percentage)}
                    </p>
                    <p className="text-xs">
                      Bachelor&#39;s degree or higher
                    </p>
                  </div>
                )}
                
                <ul className="space-y-1">
                  {censusData.education?.highSchoolGraduate && (
                    <li className="flex justify-between">
                      <span>High School Graduate</span>
                      <span className="font-medium">{formatPercentage(censusData.education.highSchoolGraduate.percentage)}</span>
                    </li>
                  )}
                  
                  {censusData.education?.someCollege && (
                    <li className="flex justify-between">
                      <span>Some College</span>
                      <span className="font-medium">{formatPercentage(censusData.education.someCollege.percentage)}</span>
                    </li>
                  )}
                  
                  {censusData.education?.associatesDegree && (
                    <li className="flex justify-between">
                      <span>Associate&#39;s Degree</span>
                      <span className="font-medium">{formatPercentage(censusData.education.associatesDegree.percentage)}</span>
                    </li>
                  )}
                  
                  {censusData.education?.bachelorsDegree && (
                    <li className="flex justify-between">
                      <span>Bachelor&#39;s Degree</span>
                      <span className="font-medium">{formatPercentage(censusData.education.bachelorsDegree.percentage)}</span>
                    </li>
                  )}
                  
                  {censusData.education?.graduateDegrees && (
                    <li className="flex justify-between">
                      <span>Graduate or Professional Degree</span>
                      <span className="font-medium">{formatPercentage(censusData.education.graduateDegrees.percentage)}</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Right column - Income & Employment */}
            <div>
              {/* Income Section */}
              <h4 className="font-medium mb-2">Economic Indicators</h4>
              {censusData.income?.medianHouseholdIncome ? (
                <div className="bg-primary/10 p-3 rounded-md mb-4">
                  <p className="text-xs text-muted-foreground">Median Household Income</p>
                  <p className="font-bold text-lg">
                    {formatCurrency(censusData.income.medianHouseholdIncome)}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">Income data not available</p>
              )}
              
              {/* Employment Section */}
              {censusData.employment && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2 flex items-center">
                    Employment Status
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="ml-1 cursor-help">
                            <HelpCircle size={14} className="text-muted-foreground" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>These metrics are for all residents age 16 and over in this census tract.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </h4>
                  <div className="flex flex-col space-y-3">
                    {/* Labor Force Participation Rate */}
                    {typeof censusData.employment.laborForceParticipationRate === 'number' && (
                      <div className="flex justify-between items-center p-2 bg-primary/5 rounded">
                        <div className="flex items-center">
                          <span>Labor Force Participation</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="ml-1 cursor-help">
                                  <HelpCircle size={14} className="text-muted-foreground" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>Percentage of population age 16+ who are either working or actively looking for work</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <span className="font-medium">{formatPercentage(censusData.employment.laborForceParticipationRate)}</span>
                      </div>
                    )}
                    
                    {/* Employment rate */}
                    {typeof censusData.employment.employmentRate === 'number' && (
                      <div className="flex justify-between items-center p-2">
                        <div className="flex items-center">
                          <span>Employment Rate</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="ml-1 cursor-help">
                                  <HelpCircle size={14} className="text-muted-foreground" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>Percentage of labor force participants who are employed</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <span className="font-medium">{formatPercentage(censusData.employment.employmentRate)}</span>
                      </div>
                    )}
                    
                    {/* Unemployment rate */}
                    {typeof censusData.employment.unemploymentRate === 'number' && (
                      <div className="flex justify-between items-center p-2">
                        <div className="flex items-center">
                          <span>Unemployment Rate</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="ml-1 cursor-help">
                                  <HelpCircle size={14} className="text-muted-foreground" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>Percentage of labor force participants who are unemployed but looking for work</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <span className="font-medium">{formatPercentage(censusData.employment.unemploymentRate)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="mt-4 text-xs text-muted-foreground">
                <p>
                  Census data represents the characteristics of all residents in the 
                  census tract, not just registered voters.
                </p>
                <p className="mt-2">
                  Sources: U.S. Census Bureau - American Community Survey (ACS), 
                  2020 Decennial Census, and Citizen Voting Age Population (CVAP) Special Tabulations
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No census data available</div>
        )}
      </CardContent>
    </Card>
  );
} 