'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PanelLeftOpen, PanelRightOpen } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

import { TurnoutControlsSidebar } from './TurnoutControlsSidebar';
import { ReportTabContent } from './ReportTabContent';
import { ChartTabContent } from './ChartTabContent';
import { useLookupData, MultiSelectOption } from '@/app/ga/voter/list/hooks/useLookupData';

// API request body structure (subset of TurnoutSelections)
export interface ApiGeographySelection {
  areaType: 'County' | 'District' | 'ZipCode';
  areaValue: string; // Specific county FIPS, district number, or "ALL"
  districtType?: 'Congressional' | 'StateSenate' | 'StateHouse'; // Only if areaType is 'District'
  // Sub-area type for breaking down the selected County/District
  // The backend will group by these within the primary areaValue
  subAreaType?: 'Precinct' | 'Municipality' | 'ZipCode'; 
  subAreaValue?: string;
}

// API response data types
export interface ApiReportRow {
  geoLabel: string;
  totalRegistered: number;
  totalVoted: number;
  overallTurnoutRate: number;
  breakdowns: Record<string, { registered: number; voted: number; turnout: number }>;
  censusData?: Record<string, any>;
}

export interface ApiReportData {
  rows: ApiReportRow[];
  aggregations: Record<string, any>;
}

export interface ApiChartSegment {
  label: string;
  turnoutRate: number;
  color: string;
}

export interface ApiChartRow {
  geoLabel: string;
  summedDemographicTurnoutRate?: number;
  segments?: ApiChartSegment[];
  overallTurnoutRate?: number;
}

export interface ApiChartData {
  type: 'bar' | 'stackedRow';
  rows: ApiChartRow[];
  xAxisMax: number;
}

export interface TurnoutAnalysisApiResponse {
  report?: ApiReportData;
  chart?: ApiChartData;
  metadata?: any;
}

// Updated TurnoutSelections for the new granular geography controls
export interface TurnoutSelections {
  // New granular geography fields
  primaryGeoType: 'County' | 'District' | null;
  specificCounty: string | null; // County FIPS code or "ALL"
  specificDistrictType: 'Congressional' | 'StateSenate' | 'StateHouse' | null;
  specificDistrictNumber: string | null; // District number or "ALL"
  secondaryBreakdown: 'Precinct' | 'Municipality' | 'ZipCode' | null; // Or "None" represented by null
  
  electionDate: string | null;
  reportDataPoints: string[];
  chartDataPoint: string | null;
  includeCensusData: boolean;
}

const initialSelections: TurnoutSelections = {
  primaryGeoType: 'County',
  specificCounty: 'ALL',
  specificDistrictType: null,
  specificDistrictNumber: null,
  secondaryBreakdown: null,
  electionDate: '2020-11-03',
  reportDataPoints: [],
  chartDataPoint: null,
  includeCensusData: false,
};

const GeorgiaVoterTurnoutPage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selections, setSelections] = useState<TurnoutSelections>(initialSelections);
  
  // Add a ref to track if we already processed URL params
  const initialParamsProcessedRef = useRef(false);

  const [apiData, setApiData] = useState<TurnoutAnalysisApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('report');
  
  // Move the useSearchParams hook here, at component level
  const searchParams = useSearchParams();

  // Integrate useLookupData
  const {
    counties,
    congressionalDistricts,
    stateSenateDistricts,
    stateHouseDistricts,
    isLoading: isLookupLoading,
    error: lookupError,
  } = useLookupData();

  const handleSelectionsChange = useCallback((newSelectionValues: Partial<TurnoutSelections>) => {
    setSelections(prevSelections => ({ ...prevSelections, ...newSelectionValues }));
  }, []);

  const handleGenerateReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    const outputType = activeTab === 'report' ? 'report' : 'chart';
    console.log(`Generating ${outputType} with selections:`, selections);

    // Construct the API geography object based on current selections
    let apiGeography: ApiGeographySelection | null = null;

    if (selections.primaryGeoType === 'County') {
      if (!selections.specificCounty) {
        setError('Please select a specific county or "All Counties".');
        setIsLoading(false);
        return;
      }
      apiGeography = {
        areaType: 'County',
        areaValue: selections.specificCounty,
      };
      if (selections.secondaryBreakdown && selections.specificCounty !== 'ALL') {
        apiGeography.subAreaType = selections.secondaryBreakdown;
        apiGeography.subAreaValue = "ALL";
      }
    } else if (selections.primaryGeoType === 'District') {
      if (!selections.specificDistrictType || !selections.specificDistrictNumber) {
        setError('Please select a district type and a specific district number or "All Districts".');
        setIsLoading(false);
        return;
      }
      apiGeography = {
        areaType: 'District',
        areaValue: selections.specificDistrictNumber,
        districtType: selections.specificDistrictType,
      };
      if (selections.secondaryBreakdown && selections.specificDistrictNumber !== 'ALL') {
        apiGeography.subAreaType = selections.secondaryBreakdown;
        apiGeography.subAreaValue = "ALL";
      }
    }

    if (!apiGeography || !selections.electionDate) {
      setError('Please select Primary Geography, Specific Area, and Election Date.');
      setIsLoading(false);
      return;
    }
    
    // Update URL parameters for bookmarking/sharing (without triggering navigation)
    const urlParams = new URLSearchParams();
    
    // Set basic URL params
    urlParams.set('areaType', apiGeography.areaType);
    urlParams.set('areaValue', apiGeography.areaValue);
    if (apiGeography.districtType) {
      urlParams.set('districtType', apiGeography.districtType);
    }
    if (apiGeography.subAreaType) {
      urlParams.set('subAreaType', apiGeography.subAreaType);
    }
    if (selections.electionDate) {
      urlParams.set('electionDate', selections.electionDate);
    }
    if (selections.reportDataPoints.length > 0) {
      urlParams.set('reportDataPoints', JSON.stringify(selections.reportDataPoints));
    }
    if (selections.chartDataPoint) {
      urlParams.set('chartDataPoint', selections.chartDataPoint);
    }
    urlParams.set('includeCensusData', String(selections.includeCensusData));
    urlParams.set('outputType', outputType);
    
    // Update URL without navigation
    window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`);

    try {
      const requestBody = {
        geography: apiGeography,
        electionDate: selections.electionDate,
        reportDataPoints: selections.reportDataPoints,
        chartDataPoint: selections.chartDataPoint,
        includeCensusData: selections.includeCensusData,
        outputType: outputType,
      };

      const response = await fetch('/api/ga/voter/turnout-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data: TurnoutAnalysisApiResponse = await response.json();
      
      setApiData(prevApiData => ({
        ...prevApiData,
        ...data,
        metadata: data.metadata || prevApiData?.metadata 
      }));

    } catch (err: any) {
      console.error('API call failed:', err);
      setError(err.message || 'Failed to fetch data.');
      setApiData(null); 
    } finally {
      setIsLoading(false);
    }
  }, [selections, activeTab, setIsLoading, setError, setApiData]);
  
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // After the useEffect for window resize, add URL parameter handling
  // This will only generate a report if valid parameters are found in the URL
  useEffect(() => {
    // Only process URL params once to avoid infinite loops
    if (initialParamsProcessedRef.current) return;
    
    // Only try to load from URL params if lookup data is available
    if (!isLookupLoading && !lookupError) {
      // Check if we have geography and election date parameters
      const areaType = searchParams.get('areaType');
      const areaValue = searchParams.get('areaValue');
      const electionDate = searchParams.get('electionDate');
      
      if (areaType && areaValue && electionDate) {
        // We have the minimum parameters to generate a report
        const urlSelections: Partial<TurnoutSelections> = {
          primaryGeoType: (areaType as 'County' | 'District' | null),
          electionDate: electionDate
        };
        
        // Set appropriate additional parameters
        if (areaType === 'County') {
          urlSelections.specificCounty = areaValue;
          
          // Handle sub-area breakdown if present
          const subAreaType = searchParams.get('subAreaType');
          if (subAreaType) {
            urlSelections.secondaryBreakdown = (subAreaType as 'Precinct' | 'Municipality' | 'ZipCode' | null);
          }
        } else if (areaType === 'District') {
          urlSelections.specificDistrictNumber = areaValue;
          const districtType = searchParams.get('districtType');
          if (districtType) {
            urlSelections.specificDistrictType = (districtType as 'Congressional' | 'StateSenate' | 'StateHouse' | null);
          }
        }
        
        // Set report data points if present
        const reportDataPoints = searchParams.get('reportDataPoints');
        if (reportDataPoints) {
          try {
            urlSelections.reportDataPoints = JSON.parse(reportDataPoints);
          } catch (e) {
            console.warn('Invalid reportDataPoints in URL params');
          }
        }
        
        // Set chart data point if present
        const chartDataPoint = searchParams.get('chartDataPoint');
        if (chartDataPoint) {
          urlSelections.chartDataPoint = chartDataPoint;
        }
        
        // Set census data inclusion if present
        const includeCensusData = searchParams.get('includeCensusData');
        if (includeCensusData) {
          urlSelections.includeCensusData = includeCensusData === 'true';
        }
        
        // Update selections
        setSelections(prev => ({ ...prev, ...urlSelections }));
        
        // Mark as processed before triggering the report generation
        initialParamsProcessedRef.current = true;
        
        // Generate the report directly, but after a timeout to ensure state updates
        setTimeout(() => {
          handleGenerateReport();
        }, 0);
      } else {
        // No valid URL params, still mark as processed
        initialParamsProcessedRef.current = true;
      }
    }
  }, [isLookupLoading, lookupError, searchParams]); // Remove handleGenerateReport from deps

  // Display lookup loading/error states if necessary
  if (isLookupLoading) {
    return <div className="flex items-center justify-center h-screen">Loading lookup data...</div>;
  }
  if (lookupError) {
    return <div className="flex items-center justify-center h-screen text-destructive">Error loading lookup data: {lookupError}</div>;
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-background" style={{ height: '100%' }}>
      <Sheet open={isSidebarOpen} onOpenChange={(open) => {
        if (open !== isSidebarOpen) setIsSidebarOpen(open);
      }}>
        <SheetContent side="left" className="w-80 sm:w-96 p-0 flex flex-col border-r">
          <TurnoutControlsSidebar 
            selections={selections}
            onSelectionsChange={handleSelectionsChange}
            onGenerate={handleGenerateReport}
            activeTab={activeTab}
            countyOptions={counties}
            congressionalDistrictOptions={congressionalDistricts}
            stateSenateDistrictOptions={stateSenateDistricts}
            stateHouseDistrictOptions={stateHouseDistricts}
          />
        </SheetContent>
      </Sheet>
      <main className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <header className="p-4 border-b flex items-center justify-between shrink-0 min-h-[69px]">
          <div className="flex items-center">
            <Button variant="outline" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="mr-3">
              {isSidebarOpen ? <PanelLeftOpen className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">Georgia Voter Turnout Analysis</h1>
            </div>
          </div>
        </header>
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden p-4">
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 shrink-0">
              <TabsTrigger value="report">Report</TabsTrigger>
              <TabsTrigger value="chart">Chart</TabsTrigger>
            </TabsList>
            <div className="flex-1 min-h-0 overflow-y-auto mt-4 h-screen" style={{ height: 'calc(100vh - 224px)' }}>
              <TabsContent value="report" className="h-full">
                <div className='h-full'>
                  <ReportTabContent 
                    reportData={apiData?.report || null} 
                    isLoading={isLoading && activeTab === 'report'}
                    error={error}
                  />
                </div>
              </TabsContent>
              <TabsContent value="chart" className="h-full">
                <div className='h-full'>
                  <ChartTabContent 
                    chartData={apiData?.chart || null} 
                    isLoading={isLoading && activeTab === 'chart'} 
                    error={error} 
                  />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
        {isLoading && !isLookupLoading && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <div className="bg-background p-4 rounded-lg shadow-xl">
              <p>Loading analysis data...</p>
            </div>
          </div>
        )}
        {error && !isLoading && (
          <div className="mt-4 p-4 border rounded bg-destructive/10 text-destructive text-center">
            <p>Error: {error}</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default GeorgiaVoterTurnoutPage; 