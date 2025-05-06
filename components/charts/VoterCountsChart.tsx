'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { useVoterFilterContext } from '@/app/ga/voter/VoterFilterProvider';
import { buildQueryParams } from '@/app/ga/voter/VoterFilterProvider';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// Types (can be shared or redefined if needed)
interface ChartSeries {
  name: string;
  filters: Record<string, string>;
  data: (number | null)[]; // Data is now counts (numbers)
}

interface ChartData {
  years: number[];
  series: ChartSeries[];
}

interface ErrorResponse {
  message: string;
  allowedFilters?: string[];
}

// Consistent colors
const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE',
  '#00C49F', '#FFBB28', '#FF8042', '#a4de6c', '#d0ed57'
];

type ChartViewType = 'line' | 'bar' | 'area';

export function VoterCountsChart() {
  const { filters, residenceAddressFilters, filtersHydrated } = useVoterFilterContext();
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleSeries, setVisibleSeries] = useState<Record<string, boolean>>({});
  const [autoScale, setAutoScale] = useState<boolean>(true);
  const [activeView, setActiveView] = useState<ChartViewType>('line'); // State for Line/Bar/Area
  const { toast } = useToast();

  useEffect(() => {
    if (!filtersHydrated) return;

    const controller = new AbortController();
    const signal = controller.signal;

    async function fetchChartData() {
      setIsLoading(true);
      setError(null);

      try {
        const params = buildQueryParams(filters, residenceAddressFilters, {
          chartType: 'voterCountsOverTime' // Fetch counts data
        });

        const response = await fetch(`/api/ga/voter/chart-data?${params.toString()}`, { signal });
        const data = await response.json();

        if (signal.aborted) return;

        if (!response.ok) {
          const errorMessage = data.message || 'Failed to fetch chart data';
          setError(errorMessage);
          setChartData(null);
          toast({ variant: "destructive", title: "Error loading chart data", description: errorMessage });
          return;
        }

        if (data.message) {
          setError(data.message);
          setChartData(null);
          return;
        }

        setChartData(data);
        
        if (data.series) {
          const initialVisibility: Record<string, boolean> = {};
          data.series.forEach((series: ChartSeries) => {
            initialVisibility[series.name] = true;
          });
          setVisibleSeries(initialVisibility);
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          console.log('Chart data fetch aborted');
          return;
        }
        const errorMessage = 'An error occurred while fetching the chart data.';
        console.error('Error fetching chart data:', err);
        setError(errorMessage);
        setChartData(null);
        toast({ variant: "destructive", title: "Error loading chart data", description: errorMessage });
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    fetchChartData();

    return () => {
      controller.abort();
    };
  }, [filters, residenceAddressFilters, filtersHydrated, toast]);

  const handleTableRowClick = (dataKey: string) => {
    setVisibleSeries(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey]
    }));
  };

  // Format data for Recharts (generic enough for all types)
  const formattedChartData = useMemo(() => {
    if (!chartData) return [];
    
    return chartData.years.map((year, index) => {
      const dataPoint: Record<string, any> = { year };
      chartData.series.forEach(series => {
        // We add data even if hidden, Recharts components handle visibility via props
        dataPoint[series.name] = series.data[index]; 
      });
      return dataPoint;
    });
  }, [chartData]); // Only reformat when chartData changes

  // Calculate Y-axis domain based on counts
  const calculateYAxisDomain = (): [number, number] | [string, string] => {
    if (!autoScale || !chartData || chartData.series.length === 0) return ['auto', 'auto']; // Default Recharts behavior
    
    let minValue = Infinity;
    let maxValue = 0;
    let hasVisibleData = false;
    
    // Determine max value based on view type
    if (activeView === 'area') { // Stacked Area: Max is the sum of visible series for each year
      formattedChartData.forEach(dataPoint => {
        let yearSum = 0;
        chartData.series.forEach(series => {
          if (visibleSeries[series.name] && dataPoint[series.name] !== null) {
            yearSum += dataPoint[series.name];
            hasVisibleData = true;
          }
        });
        maxValue = Math.max(maxValue, yearSum);
      });
      minValue = 0; // Stacked area starts at 0
    } else { // Line or Bar: Max is the highest individual value across visible series
      chartData.series.forEach(series => {
        if (visibleSeries[series.name]) {
          series.data.forEach(value => {
            if (value !== null) {
              maxValue = Math.max(maxValue, value);
              minValue = 0; // Counts usually start at 0
              hasVisibleData = true;
            }
          });
        }
      });
    }
    
    if (!hasVisibleData) return ['auto', 'auto']; // Use ['auto', 'auto'] to match return type
    if (maxValue <= 0) return [0, 10]; // Handle cases where max is 0

    // Add padding (e.g., 10%)
    const padding = maxValue * 0.1;
    const paddedMax = Math.ceil((maxValue + padding) / 10) * 10; // Round up to nearest 10 for cleaner axis
    
    return [0, paddedMax]; // Start Y axis at 0 for counts
  };

  // Custom tooltip formatter for counts (shows integer)
  const tooltipFormatter = (value: any) => {
    if (value === null || value === undefined) return 'N/A';
    // Ensure value is treated as a number before formatting
    const numValue = Number(value);
    return Number.isFinite(numValue) ? numValue.toLocaleString() : 'N/A';
  };
  
  // *** NEW: Format data for the legend table ***
  const tableData = useMemo(() => {
    if (!chartData?.series) return [];
    
    return chartData.series.map((series, index) => {
      // Find the last non-null value for display
      let latestValue: string | number = 'N/A';
      for (let i = series.data.length - 1; i >= 0; i--) {
        if (series.data[i] !== null) {
          latestValue = series.data[i]!.toLocaleString();
          break;
        }
      }
      return {
        name: series.name,
        index: index,
        latestValue: latestValue,
        isVisible: visibleSeries[series.name] ?? true // Default to true if somehow missing
      };
    })
  }, [chartData, visibleSeries]);

  // Render the selected chart content (Line, Bar, Area)
  const renderChartContent = () => {
    if (!chartData || !chartData.series || chartData.series.length === 0) return null;

    switch (activeView) {
      case 'line':
        return chartData.series.map((series, index) => (
          visibleSeries[series.name] && (
            <Line
              key={series.name}
              type="monotone"
              dataKey={series.name}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2}
              dot={false}
              connectNulls={true}
            />
          )
        ));
      case 'bar':
         // Note: BarChart component itself handles layout, this just defines the bars
         return chartData.series.map((series, index) => (
          visibleSeries[series.name] && (
            <Bar key={series.name} dataKey={series.name} fill={COLORS[index % COLORS.length]} />
          )
        ));
      case 'area':
        return chartData.series.map((series, index) => (
          visibleSeries[series.name] && (
            <Area
              key={series.name}
              type="monotone"
              dataKey={series.name}
              stackId="1" 
              stroke={COLORS[index % COLORS.length]}
              fill={COLORS[index % COLORS.length]}
              fillOpacity={0.6}
              strokeWidth={2}
              connectNulls={true}
            />
          )
        ));
      default:
        return null;
    }
  };
  
  // Determine the Recharts container component based on active view
  const ChartComponent = useMemo(() => {
    switch (activeView) {
      case 'bar': return BarChart;
      case 'area': return AreaChart;
      case 'line':
      default: return LineChart;
    }
  }, [activeView]);

  // Render the table view (acting as advanced legend)
  const renderTableView = () => {
      if (!tableData || tableData.length === 0) return null;
      return (
        <div className="mt-4 md:mt-0">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[20px]"></TableHead>
                        <TableHead>Combination</TableHead>
                        <TableHead className="text-right">Latest Count</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                {tableData.map((item) => (
                    <TableRow 
                        key={item.name}
                        onClick={() => handleTableRowClick(item.name)}
                        className={`cursor-pointer ${!item.isVisible ? 'opacity-50' : ''}`}
                        style={{ textDecoration: !item.isVisible ? 'line-through' : 'none' }}
                    >
                        <TableCell className="py-1">
                            <span 
                                className="inline-block w-3 h-3 rounded-full"
                                style={{ backgroundColor: COLORS[item.index % COLORS.length] }}
                            />
                        </TableCell>
                        <TableCell className="font-medium text-xs py-1">{item.name}</TableCell>
                        <TableCell className="text-right text-xs py-1">{item.latestValue}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
        </div>
      );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-center">
            <CardTitle>Voter Counts Over Time</CardTitle>
            <div className="flex items-center space-x-4">
              {/* View Switcher Buttons */}
              <div className="flex justify-center space-x-1 border p-1 rounded-md bg-muted">
                <button 
                  className={`px-3 py-1 rounded text-xs ${activeView === 'line' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
                  onClick={() => setActiveView('line')}
                >Line</button>
                <button 
                  className={`px-3 py-1 rounded text-xs ${activeView === 'bar' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
                  onClick={() => setActiveView('bar')}
                >Bar</button>
                <button 
                  className={`px-3 py-1 rounded text-xs ${activeView === 'area' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
                  onClick={() => setActiveView('area')}
                >Area</button>
              </div>
              {/* Auto-Scale Toggle */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="autoScaleCounts"
                  checked={autoScale}
                  onCheckedChange={setAutoScale}
                />
                <Label htmlFor="autoScaleCounts" className="text-sm whitespace-nowrap">Auto-Scale Y-Axis</Label>
              </div>
            </div>
          </div>
          <CardDescription className="text-sm !-mt-[0px]">
            Absolute number of participating voters based on selected filters.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
           <div className="flex justify-center items-center h-[450px]"> 
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        {!isLoading && error && (
           <div className="flex justify-center items-center h-[450px]">
            <p className="text-center text-red-600">Error: {error}</p>
          </div>
        )}
        {!isLoading && !error && chartData && (
          <div>
            <div className="md:col-span-2">
               <ResponsiveContainer width="100%" height={400}>
                 <ChartComponent 
                    data={formattedChartData} 
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    {...(activeView === 'bar' ? { layout: 'horizontal', barCategoryGap: '10%' } : {})} 
                  >
                   <CartesianGrid strokeDasharray="3 3" />
                   <XAxis dataKey="year" />
                   <YAxis 
                      tickFormatter={tooltipFormatter} 
                      domain={calculateYAxisDomain()} 
                      allowDataOverflow={!autoScale} 
                      width={80} 
                    />
                   <Tooltip 
                     formatter={tooltipFormatter} 
                     contentStyle={{
                       backgroundColor: 'hsl(var(--background))',
                       padding: '5px 10px',
                       border: '1px solid hsl(var(--border))',
                       borderRadius: 'var(--radius)'
                     }}
                     itemStyle={{ color: 'hsl(var(--foreground))' }}
                     cursor={{ fill: 'hsl(var(--muted))', fillOpacity: 0.3 }}
                   />
                   {renderChartContent()}
                 </ChartComponent>
               </ResponsiveContainer>
            </div>
            {renderTableView()}
          </div>
        )}
        {!isLoading && !error && !chartData && (
            <div className="flex justify-center items-center h-[450px]">
             <p className="text-center text-muted-foreground">No count data available for the selected filters.</p>
           </div>
         )}
      </CardContent>
    </Card>
  );
} 