'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
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

// Types to match the API response
interface ChartSeries {
  name: string;
  filters: Record<string, string>;
  data: (number | null)[];
}

interface ChartData {
  years: number[];
  series: ChartSeries[];
}

interface ErrorResponse {
  message: string;
  allowedFilters?: string[];
}

const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', 
  '#00C49F', '#FFBB28', '#FF8042', '#a4de6c', '#d0ed57'
];

export function DemographicRatioChart() {
  const { filters, residenceAddressFilters, filtersHydrated } = useVoterFilterContext();
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleLines, setVisibleLines] = useState<Record<string, boolean>>({});
  const [autoScale, setAutoScale] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    // Don't fetch until filters are hydrated from URL
    if (!filtersHydrated) return;

    // Create abort controller for cancelling fetch when filters change
    const controller = new AbortController();
    const signal = controller.signal;

    async function fetchChartData() {
      setIsLoading(true);
      setError(null);

      try {
        // Build query params including the chartType
        const params = buildQueryParams(filters, residenceAddressFilters, {
          chartType: 'demographicRatioOverTime'
        });

        const response = await fetch(`/api/ga/voter/chart-data?${params.toString()}`, { signal });
        const data = await response.json();

        // Check if the request was aborted before processing response
        if (signal.aborted) return;

        if (!response.ok) {
          const errorMessage = data.message || 'Failed to fetch chart data';
          setError(errorMessage);
          setChartData(null);
          
          // Show toast notification for error
          toast({
            variant: "destructive",
            title: "Error loading chart data",
            description: errorMessage,
          });
          
          return;
        }

        if (data.message) {
          // This is for cases where there's no error but a message (e.g., "Please select filters")
          setError(data.message);
          setChartData(null);
          return;
        }

        setChartData(data);
        
        // Initialize visibility state for all series (set all to visible)
        if (data.series) {
          const initialVisibility: Record<string, boolean> = {};
          data.series.forEach((series: ChartSeries) => {
            initialVisibility[series.name] = true;
          });
          setVisibleLines(initialVisibility);
        }
      } catch (err) {
        // Ignore AbortError which happens when we cancel the request
        if (err instanceof Error && err.name === 'AbortError') {
          console.log('Chart data fetch aborted due to filter change');
          return;
        }
        
        const errorMessage = 'An error occurred while fetching the chart data.';
        console.error('Error fetching chart data:', err);
        setError(errorMessage);
        setChartData(null);
        
        // Show toast notification for error
        toast({
          variant: "destructive",
          title: "Error loading chart data",
          description: errorMessage,
        });
      } finally {
        // Only update loading state if the request wasn't aborted
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    fetchChartData();

    // Cleanup: abort any in-flight requests when filters change or component unmounts
    return () => {
      controller.abort();
    };
  }, [filters, residenceAddressFilters, filtersHydrated, toast]);

  // Renamed handleLegendClick to handleTableRowClick for clarity
  const handleTableRowClick = (dataKey: string) => {
    setVisibleLines(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey]
    }));
  };

  // Format data for Recharts
  const formattedChartData = useMemo(() => {
    if (!chartData) return [];
    
    return chartData.years.map((year, index) => {
      const dataPoint: Record<string, any> = { year };
      
      chartData.series.forEach(series => {
        // Keep data point even if line is hidden, Recharts handles visibility
          const value = series.data[index];
        dataPoint[series.name] = value !== null ? (value * 100) : null;
      });
      
      return dataPoint;
    });
  }, [chartData]);

  // Calculate Y-axis domain based on data when auto-scaling is enabled
  const calculateYAxisDomain = () => {
    if (!autoScale || !chartData) return [0, 100];
    
    // Find min and max values across all visible series
    let minValue = 100;
    let maxValue = 0;
    let hasVisibleData = false;
    
    // Get actual values from chart data, not the formatted data
    chartData.series.forEach(series => {
      if (visibleLines[series.name]) {
        series.data.forEach(value => {
          if (value !== null) {
            const percentage = value * 100;
            minValue = Math.min(minValue, percentage);
            maxValue = Math.max(maxValue, percentage);
            hasVisibleData = true;
          }
        });
      }
    });
    
    // If no visible data or min/max are the same, use default range
    if (!hasVisibleData || minValue === maxValue) {
      return [0, 100];
    }
    
    // Add padding (15% of the range)
    const range = maxValue - minValue;
    const padding = range * 0.15;
    
    // Calculate rounded min/max for cleaner axis values
    const paddedMin = Math.max(0, minValue - padding);
    const paddedMax = Math.min(100, maxValue + padding);
    
    // Round to 1 decimal place for cleaner axis
    const roundedMin = Math.floor(paddedMin * 10) / 10;
    const roundedMax = Math.ceil(paddedMax * 10) / 10;
    
    return [roundedMin, roundedMax];
  };

  // Custom tooltip formatter to show percentages
  const tooltipFormatter = (value: number | string, name: string) => {
    if (value === null || value === undefined) return 'N/A';
    const numValue = Number(value);
    return Number.isFinite(numValue) ? `${numValue.toFixed(1)}%` : 'N/A';
  };

  // *** NEW: Format data for the legend table ***
  const tableData = useMemo(() => {
    if (!chartData?.series) return [];
    
    return chartData.series.map((series, index) => {
      // Find the last non-null value for display
      let latestValue: string | number = 'N/A';
      for (let i = series.data.length - 1; i >= 0; i--) {
        if (series.data[i] !== null) {
          latestValue = (series.data[i]! * 100).toFixed(1) + '%';
          break;
        }
      }
      return {
        name: series.name,
        index: index,
        latestValue: latestValue,
        isVisible: visibleLines[series.name] ?? true // Default to true if somehow missing
      };
    })
    // Optional: Sort by visibility or name if desired
    // .sort((a, b) => a.name.localeCompare(b.name)); 
  }, [chartData, visibleLines]);

  // Render the Line Chart view
  const renderChartView = () => {
    if (!chartData) return null;
    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart 
          data={formattedChartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis 
            domain={calculateYAxisDomain()}
            tickFormatter={(value) => `${value}%`}
            allowDataOverflow={!autoScale}
          />
          {/* Apply consistent theme styling to the tooltip */}
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
          {/* Legend Removed */} 
          {chartData.series.map((series, index) => (
            visibleLines[series.name] && (
      <Line
        key={series.name}
        type="monotone"
        dataKey={series.name}
        stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={false}
                connectNulls={true} // Connect points across null values
              />
            )
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // Render the table view (acting as advanced legend)
  const renderTableView = () => {
    if (!tableData || tableData.length === 0) return null;
    return (
      <div className="mt-4 md:mt-0"> {/* Adjusted margin */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[20px]"></TableHead> {/* Color swatch */}
              <TableHead>Combination</TableHead>
              <TableHead className="text-right">Latest Ratio</TableHead> {/* Value column */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((item) => (
              <TableRow 
                key={item.name}
                onClick={() => handleTableRowClick(item.name)} // Toggle on row click
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
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Demographic Ratio Over Time</CardTitle>
          <CardDescription>
            Shows demographic proportions of participating voters by election year
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="auto-scale" className="text-sm text-muted-foreground">Auto-scale</Label>
          <Switch 
            id="auto-scale" 
            checked={autoScale} 
            onCheckedChange={setAutoScale} 
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex justify-center items-center h-[450px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && !isLoading && (
          <div className="flex justify-center items-center h-[450px]">
            <p className="text-center text-red-600">Error: {error}</p>
          </div>
        )}

        {!isLoading && !error && chartData && (
          // Reverted Layout: Chart above Table
          <div>
            {renderChartView()}
            {renderTableView()}
          </div>
        )}

        {!isLoading && !error && !chartData && (
          <div className="flex justify-center items-center h-[450px]">
            <p className="text-center text-muted-foreground">No ratio data available for the selected filters.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 