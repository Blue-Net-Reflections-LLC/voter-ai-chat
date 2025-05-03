'use client';

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

// Custom legend component for better toggle behavior
const CustomLegend = ({ payload, visibleLines, onToggle }: {
  payload?: any[],
  visibleLines: Record<string, boolean>,
  onToggle: (dataKey: string) => void
}) => {
  if (!payload || payload.length === 0) return null;
  
  return (
    <ul className="flex flex-wrap justify-center gap-3 mt-3">
      {payload.map((entry, index) => (
        <li 
          key={`legend-item-${index}`}
          className="flex items-center gap-1 cursor-pointer select-none px-2 py-1 rounded hover:bg-muted transition-colors"
          onClick={() => onToggle(entry.dataKey)}
        >
          <span 
            className="inline-block w-3 h-3 rounded-full" 
            style={{ 
              backgroundColor: entry.color, 
              opacity: visibleLines[entry.dataKey] ? 1 : 0.3 
            }}
          />
          <span style={{ 
            textDecoration: visibleLines[entry.dataKey] ? 'none' : 'line-through',
            opacity: visibleLines[entry.dataKey] ? 1 : 0.6
          }}>
            {entry.value}
          </span>
        </li>
      ))}
    </ul>
  );
};

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

  // Handle legend click to toggle line visibility
  const handleLegendClick = (dataKey: string) => {
    setVisibleLines(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey]
    }));
  };

  // Format data for Recharts
  const formatChartData = () => {
    if (!chartData) return [];
    
    return chartData.years.map((year, index) => {
      const dataPoint: Record<string, any> = { year };
      
      chartData.series.forEach(series => {
        // Only add data for visible lines
        if (visibleLines[series.name]) {
          // Use the percentage format (0-100%) instead of ratio (0-1)
          const value = series.data[index];
          dataPoint[series.name] = value !== null ? (value * 100).toFixed(1) : null;
        }
      });
      
      return dataPoint;
    });
  };

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
  const tooltipFormatter = (value: string) => {
    return `${value}%`;
  };

  // Render lines, including hidden ones with 0 opacity to maintain legend entries
  const renderLines = () => {
    if (!chartData) return null;
    
    return chartData.series.map((series, index) => (
      <Line
        key={series.name}
        type="monotone"
        dataKey={series.name}
        stroke={COLORS[index % COLORS.length]}
        activeDot={{ r: 8 }}
        connectNulls
        strokeOpacity={visibleLines[series.name] ? 1 : 0}
        dot={{ strokeOpacity: visibleLines[series.name] ? 1 : 0, fillOpacity: visibleLines[series.name] ? 1 : 0 }}
      />
    ));
  };

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
          <div className="flex justify-center items-center h-80">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && !isLoading && (
          <div className="mb-4 p-4 border border-red-500 bg-red-50 text-red-800 rounded-md">
            <h4 className="font-medium mb-1">Error</h4>
            <p>{error}</p>
          </div>
        )}

        {chartData && !isLoading && !error && (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={formatChartData()}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="year" 
                  label={{ value: 'Election Year', position: 'insideBottomRight', offset: -10 }} 
                />
                <YAxis 
                  domain={calculateYAxisDomain()} 
                  label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip formatter={tooltipFormatter} />
                <Legend 
                  content={<CustomLegend 
                    visibleLines={visibleLines} 
                    onToggle={handleLegendClick} 
                  />}
                />
                {renderLines()}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 