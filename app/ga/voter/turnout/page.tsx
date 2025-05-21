'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PanelLeftOpen, PanelRightOpen, List, BarChart2, FileDown, ImageDown } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

import { TurnoutControlsSidebar } from './TurnoutControlsSidebar';
import { ReportTabContent, type ReportActions } from './ReportTabContent';
import { ChartTabContent, type ChartTabActions } from './ChartTabContent';
import { useLookupData, MultiSelectOption } from '@/app/ga/voter/list/hooks/useLookupData';
import { SelectionsHeader } from './components/SelectionsHeader';

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

// Updated API response structure: flat array of rows at top level
export interface TurnoutAnalysisApiResponse {
  rows: ApiReportRow[];
  metadata?: any;
}

// Constants for chart data transformation
const RACE_CHART_CATEGORIES = ['White', 'Black', 'Hispanic', 'Asian', 'Other'];
const GENDER_CHART_CATEGORIES = ['M', 'F', 'O']; // Assuming 'O' is 'Other' from backend if present
const AGE_RANGE_CHART_CATEGORIES = ['18-23', '25-44', '45-64', '65-74', '75+'];

const DEMOGRAPHIC_COLORS: Record<string, string[]> = {
  Race: ['#8884d8', '#FF9F40', '#FFCE56', '#4BC0C0', '#9966FF'],  // Purple for White, Orange for Black
  Gender: ['#8884d8', '#FF9F40', '#FFCE56'],  // Changed to match new color scheme
  AgeRange: ['#8884d8', '#FF9F40', '#FFCE56', '#4BC0C0', '#9966FF', '#C9CBCF'],
};

const getCategoryDisplayName = (dimension: 'Race' | 'Gender' | 'AgeRange' | string, categoryValue: string): string => {
  if (dimension === 'Race') {
    return categoryValue; // Category value from RACE_CHART_CATEGORIES is now the display name
  } else if (dimension === 'Gender') {
    return categoryValue === 'M' ? 'Male' :
           categoryValue === 'F' ? 'Female' :
           categoryValue === 'O' ? 'Other' : categoryValue;
  }
  return categoryValue; // For AgeRange, the categoryValue itself is the display name
};

// Updated TurnoutSelections for the new granular geography controls
export interface TurnoutSelections {
  // New granular geography fields
  primaryGeoType: 'County' | 'District' | null;
  specificCounty: string | null; // County FIPS code or "ALL"
  specificDistrictType: 'Congressional' | 'StateSenate' | 'StateHouse' | null;
  specificDistrictNumber: string | null; // District number or "ALL"
  secondaryBreakdown: 'Precinct' | 'Municipality' | 'ZipCode' | null; // Or "None" represented by null
  
  electionDate: string | null;
  dataPoints: string[]; // Data points for both report and chart visualizations
  includeCensusData: boolean;
}

const initialSelections: TurnoutSelections = {
  primaryGeoType: 'County',
  specificCounty: 'ALL',
  specificDistrictType: null,
  specificDistrictNumber: null,
  secondaryBreakdown: null,
  electionDate: '2024-11-05',
  dataPoints: [], // Data points for both report and chart visualizations
  includeCensusData: false,
};

type ComponentPropsWithClassName<T extends React.ElementType> = React.ComponentProps<T> & { className?: string };

const TypedTabs = Tabs as React.FC<ComponentPropsWithClassName<typeof Tabs>>;
const TypedTabsList = TabsList as React.FC<ComponentPropsWithClassName<typeof TabsList>>;
const TypedTabsTrigger = TabsTrigger as React.FC<ComponentPropsWithClassName<typeof TabsTrigger>>;
const TypedTabsContent = TabsContent as React.FC<ComponentPropsWithClassName<typeof TabsContent>>;

const GeorgiaVoterTurnoutPage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selections, setSelections] = useState<TurnoutSelections>(initialSelections);
  const [appliedSelections, setAppliedSelections] = useState<TurnoutSelections>(initialSelections);
  const initialParamsProcessedRef = useRef(false);
  const [rawReportData, setRawReportData] = useState<ApiReportRow[] | null>(null);
  const [rawChartData, setRawChartData] = useState<ApiReportRow[] | null>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('report');
  const [processedChartData, setProcessedChartData] = useState<ApiChartData | null>(null);
  const searchParams = useSearchParams();
  const reportTabRef = useRef<ReportActions>(null);
  const chartTabRef = useRef<ChartTabActions>(null);

  const headerDataPoints = activeTab === 'chart'
    ? (appliedSelections.dataPoints.length > 0 ? [appliedSelections.dataPoints[0]] : [])
    : appliedSelections.dataPoints;

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
    setAppliedSelections(selections);
    
    if (activeTab === 'report') {
      setIsReportLoading(true);
    } else if (activeTab === 'chart') {
      setIsChartLoading(true);
    }
    setError(null);
    
    console.log(`Generating report with selections:`, selections);

    let apiGeography: ApiGeographySelection | null = null;

    if (selections.primaryGeoType === 'County') {
      if (!selections.specificCounty) {
        setError('Please select a specific county or "All Counties".');
        if (activeTab === 'report') {
          setIsReportLoading(false);
        } else if (activeTab === 'chart') {
          setIsChartLoading(false);
        }
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
        if (activeTab === 'report') {
          setIsReportLoading(false);
        } else if (activeTab === 'chart') {
          setIsChartLoading(false);
        }
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
      if (activeTab === 'report') {
        setIsReportLoading(false);
      } else if (activeTab === 'chart') {
        setIsChartLoading(false);
      }
      return;
    }
    
    const urlParams = new URLSearchParams();
    
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
    if (selections.dataPoints.length > 0) {
      urlParams.set('dataPoints', JSON.stringify(selections.dataPoints));
    }
    urlParams.set('includeCensusData', String(selections.includeCensusData));
    
    window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`);

    try {
      let apiDataPoints: string[];
      let apiIncludeCensusData: boolean;

      if (activeTab === 'chart') {
        apiDataPoints = selections.dataPoints.length > 0 ? [selections.dataPoints[0]] : [];
        apiIncludeCensusData = false;
      } else {
        apiDataPoints = selections.dataPoints;
        apiIncludeCensusData = selections.includeCensusData;
      }

      const requestBody = {
        geography: apiGeography,
        electionDate: selections.electionDate,
        dataPoints: apiDataPoints,
        includeCensusData: apiIncludeCensusData,
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

      const responseData: TurnoutAnalysisApiResponse = await response.json();
      
      if (activeTab === 'report') {
        setRawReportData(responseData.rows);
      } else if (activeTab === 'chart') {
        setRawChartData(responseData.rows);
      }

    } catch (err: any) {
      console.error('API call failed:', err);
      setError(err.message || 'Failed to fetch data.');
      setRawReportData(null);
      setRawChartData(null);
      setProcessedChartData(null);
    } finally {
      if (activeTab === 'report') {
        setIsReportLoading(false);
      } else if (activeTab === 'chart') {
        setIsChartLoading(false);
      }
    }
  }, [selections, activeTab, setError, setRawReportData, setRawChartData, setIsReportLoading, setIsChartLoading]);
  
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

  useEffect(() => {
    if (initialParamsProcessedRef.current) return;
    
    if (!isLookupLoading && !lookupError) {
      const areaType = searchParams.get('areaType');
      const areaValue = searchParams.get('areaValue');
      const electionDate = searchParams.get('electionDate');
      
      if (areaType && areaValue && electionDate) {
        const urlSelections: Partial<TurnoutSelections> = {
          primaryGeoType: (areaType as 'County' | 'District' | null),
          electionDate: electionDate
        };
        
        if (areaType === 'County') {
          urlSelections.specificCounty = areaValue;
          
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
        
        const dataPointsParam = searchParams.get('dataPoints');
        if (dataPointsParam) {
          try {
            urlSelections.dataPoints = JSON.parse(dataPointsParam);
          } catch (e) {
            console.warn('Invalid dataPoints in URL params');
          }
        }
        
        const includeCensusData = searchParams.get('includeCensusData');
        if (includeCensusData) {
          urlSelections.includeCensusData = includeCensusData === 'true';
        }
        
        const newSelections = { ...initialSelections, ...urlSelections };
        setSelections(newSelections);
        setAppliedSelections(newSelections);
        
        initialParamsProcessedRef.current = true;
        
        setTimeout(() => {
          handleGenerateReport();
        }, 0);
      } else {
        initialParamsProcessedRef.current = true;
      }
    }
  }, [isLookupLoading, lookupError, searchParams]);

  useEffect(() => {
    if (activeTab === 'chart') {
      setSelections(prevSelections => {
        if (prevSelections.dataPoints.length > 1) {
          return { ...prevSelections, dataPoints: [prevSelections.dataPoints[0]] };
        }
        return prevSelections;
      });
    }
  }, [activeTab]);

  useEffect(() => {
    if (!rawChartData || !rawChartData.length) {
      setProcessedChartData(null);
      return;
    }

    const chartPoint = appliedSelections.dataPoints.length > 0 ? appliedSelections.dataPoints[0] : null;
    let newChartData: ApiChartData | null = null;

    if (chartPoint && (chartPoint === 'Race' || chartPoint === 'Gender' || chartPoint === 'AgeRange')) {
      console.log(`[ChartData] Processing ${chartPoint} data point`);
      const categories = chartPoint === 'Race' ? RACE_CHART_CATEGORIES :
                        chartPoint === 'Gender' ? GENDER_CHART_CATEGORIES : AGE_RANGE_CHART_CATEGORIES;
      const colors = DEMOGRAPHIC_COLORS[chartPoint] || [];

      const availableBreakdownKeys = new Set<string>();
      rawChartData.forEach(reportRow => {
        if (reportRow.breakdowns) {
          Object.keys(reportRow.breakdowns).forEach(key => {
            if (key.startsWith(`${chartPoint}:`)) {
              availableBreakdownKeys.add(key.split(':')[1]);
            }
          });
        }
      });
      
      console.log(`[ChartData] Available ${chartPoint} categories:`, [...availableBreakdownKeys]);
      console.log(`[ChartData] Configured ${chartPoint} categories:`, categories);
      
      newChartData = {
        type: 'stackedRow',
        rows: rawChartData.map(reportRow => {
          const segments: ApiChartSegment[] = [];
          categories.forEach((catKey, index) => {
            const breakdownKey = `${chartPoint}:${catKey}`;
            const breakdownData = reportRow.breakdowns?.[breakdownKey];
            if (breakdownData) {
              segments.push({
                label: getCategoryDisplayName(chartPoint, catKey),
                turnoutRate: breakdownData.turnout,
                color: colors[index % colors.length],
              });
            } else {
              console.log(`[ChartData] Missing data for ${breakdownKey} in ${reportRow.geoLabel}`);
            }
          });
          return {
            geoLabel: reportRow.geoLabel,
            segments,
            overallTurnoutRate: reportRow.overallTurnoutRate,
          };
        }),
        xAxisMax: 1,
      };
    } else {
      newChartData = {
        type: 'bar',
        rows: rawChartData.map(row => ({
          geoLabel: row.geoLabel,
          overallTurnoutRate: row.overallTurnoutRate,
        })),
        xAxisMax: 1,
      };
    }
    setProcessedChartData(newChartData);
  }, [rawChartData, appliedSelections.dataPoints]);

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
      <TypedTabs defaultValue={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <header className="flex items-center h-12 px-2 py-1 border-b bg-background z-10 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="p-1 h-8 w-8"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <PanelLeftOpen className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
          </Button>

          {/* Vertical separator after sidebar toggle button */}
          <div className="w-px h-6 bg-border mx-2 hidden sm:block"></div>

          {/* SelectionsHeader Wrapper - Hidden on mobile */}
          <div className="mr-2 hidden sm:flex"> 
            <SelectionsHeader 
              appliedSelections={{ ...appliedSelections, dataPoints: headerDataPoints }}
              countyOptions={counties}
              districtOptions={
                appliedSelections.specificDistrictType === 'Congressional' ? congressionalDistricts :
                appliedSelections.specificDistrictType === 'StateSenate' ? stateSenateDistricts :
                appliedSelections.specificDistrictType === 'StateHouse' ? stateHouseDistricts : 
                []
              }
            />
          </div>
          {/* Vertical separator after SelectionsHeader - Hidden on mobile */}
          <div className="w-px h-6 bg-border mx-2 hidden sm:block"></div>

          {/* Spacer is now before Download Buttons */}
          <div className="flex-1 mx-2"></div> 

          {/* Context-aware Download Buttons - Hidden on mobile */}
          {activeTab === 'report' && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 hidden sm:inline-flex" // Added hidden sm:inline-flex
              onClick={() => reportTabRef.current?.exportCsv()}
              disabled={isReportLoading || !rawReportData || rawReportData.length === 0}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Download CSV
            </Button>
          )}
          {activeTab === 'chart' && (
            <div className="flex items-center gap-2 hidden sm:flex"> {/* Added hidden sm:flex */}
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3"
                onClick={() => chartTabRef.current?.exportChartSVG()}
                disabled={isChartLoading || !processedChartData || processedChartData.rows.length === 0}
              >
                <ImageDown className="h-4 w-4 mr-2" />
                Save SVG
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3"
                onClick={() => chartTabRef.current?.exportChartPNG()}
                disabled={isChartLoading || !processedChartData || processedChartData.rows.length === 0}
              >
                <ImageDown className="h-4 w-4 mr-2" />
                Save PNG
              </Button>
            </div>
          )}

          {/* Vertical separator after Download Buttons - Hidden on mobile */}
          <div className="w-px h-6 bg-border mx-2 hidden sm:block"></div>

          <div className="flex items-center gap-1"> {/* Tabs Wrapper */}
            <TypedTabsList className="h-9">
              <TypedTabsTrigger value="report" className="px-3 py-1.5 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <div className="inline-flex items-center gap-2">
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">Report</span>
                </div>
              </TypedTabsTrigger>
              <TypedTabsTrigger value="chart" className="px-3 py-1.5 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <div className="inline-flex items-center gap-2">
                  <BarChart2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Chart</span>
                </div>
              </TypedTabsTrigger>
            </TypedTabsList>
          </div>
        </header>
        <main className="flex flex-col flex-1 min-h-0">
          <div className="flex flex-col flex-1 min-h-0 p-4 overflow-y-auto">
            <div className="flex-1 h-full">
              <TypedTabsContent value="report" className="h-full">
                <div className='h-full'>
                  <ReportTabContent 
                    ref={reportTabRef}
                    rows={rawReportData || null} 
                    isLoading={isReportLoading}
                    error={error}
                  />
                </div>
              </TypedTabsContent>
              <TypedTabsContent value="chart" className="h-full">
                <div className='h-full'>
                  <ChartTabContent
                    ref={chartTabRef}
                    chartData={processedChartData}
                    isLoading={isChartLoading}
                    error={error}
                  />
                </div>
              </TypedTabsContent>
            </div>
            
            {error && !isReportLoading && !isChartLoading && (
              <div className="mt-4 p-4 border rounded bg-destructive/10 text-destructive text-center shrink-0">
                <p>Error: {error}</p>
              </div>
            )}
          </div>
        </main>
      </TypedTabs>
    </div>
  );
};

export default GeorgiaVoterTurnoutPage; 