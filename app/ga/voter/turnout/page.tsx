'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PanelLeftOpen, PanelRightOpen } from 'lucide-react';

import { TurnoutControlsSidebar } from './TurnoutControlsSidebar';
import { ReportTabContent } from './ReportTabContent';
import { ChartTabContent } from './ChartTabContent';
import { useLookupData, MultiSelectOption } from '@/app/ga/voter/list/hooks/useLookupData';

// API request body structure (subset of TurnoutSelections)
export interface ApiGeographySelection {
  areaType: 'County' | 'District';
  areaValue: string; // Specific county FIPS, district number, or "ALL"
  districtType?: 'Congressional' | 'StateSenate' | 'StateHouse'; // Only if areaType is 'District'
  // Sub-area type for breaking down the selected County/District
  // The backend will group by these within the primary areaValue
  subAreaType?: 'Precinct' | 'Municipality' | 'ZipCode'; 
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
  aggregations: {
    averageOverallTurnoutRate: number;
    grandTotalVoted: number;
  };
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
  primaryGeoType: null,
  specificCounty: null,
  specificDistrictType: null,
  specificDistrictNumber: null,
  secondaryBreakdown: null,
  electionDate: null,
  reportDataPoints: [],
  chartDataPoint: null,
  includeCensusData: false,
};

const GeorgiaVoterTurnoutPage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selections, setSelections] = useState<TurnoutSelections>(initialSelections);

  const [apiData, setApiData] = useState<TurnoutAnalysisApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('report');

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

  const handleGenerateReport = async () => {
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
      }
    }

    if (!apiGeography || !selections.electionDate) {
      setError('Please select Primary Geography, Specific Area, and Election Date.');
      setIsLoading(false);
      return;
    }

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
  };
  
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

  // Display lookup loading/error states if necessary
  if (isLookupLoading) {
    return <div className="flex items-center justify-center h-screen">Loading lookup data...</div>;
  }
  if (lookupError) {
    return <div className="flex items-center justify-center h-screen text-destructive">Error loading lookup data: {lookupError}</div>;
  }

  return (
    <div className={`flex h-screen bg-background`}>
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="w-80 sm:w-96 p-0 flex flex-col border-r">
          <TurnoutControlsSidebar 
            selections={selections}
            onSelectionsChange={handleSelectionsChange}
            onGenerate={handleGenerateReport}
            activeTab={activeTab}
            // Pass lookup data as props
            countyOptions={counties} // from useLookupData, type: MultiSelectOption[]
            congressionalDistrictOptions={congressionalDistricts}
            stateSenateDistrictOptions={stateSenateDistricts}
            stateHouseDistrictOptions={stateHouseDistricts}
          />
        </SheetContent>
      </Sheet>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="p-4 border-b flex items-center justify-between min-h-[69px]">
          <div className="flex items-center">
            <Button variant="outline" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="mr-3">
              {isSidebarOpen ? <PanelLeftOpen className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">Georgia Voter Turnout Analysis</h1>
            </div>
          </div>
        </header>

        <div className="p-4 flex-grow overflow-y-auto">
          <div className="w-full">
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="report">Report</TabsTrigger>
                <TabsTrigger value="chart">Chart</TabsTrigger>
              </TabsList>
              <TabsContent value="report">
                <ReportTabContent 
                  reportData={apiData?.report || null} 
                  isLoading={isLoading && activeTab === 'report'}
                  error={error}
                />
              </TabsContent>
              <TabsContent value="chart">
                <ChartTabContent 
                  chartData={apiData?.chart || null} 
                  isLoading={isLoading && activeTab === 'chart'} 
                  error={error} 
                />
              </TabsContent>
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
        </div>
      </main>
    </div>
  );
};

export default GeorgiaVoterTurnoutPage; 