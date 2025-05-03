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

    async function fetchChartData() {
      setIsLoading(true);
      setError(null);

      try {
        // Build query params including the chartType
        const params = buildQueryParams(filters, residenceAddressFilters, {
          chartType: 'demographicRatioOverTime'
        });

        const response = await fetch(`/api/ga/voter/chart-data?${params.toString()}`);
        const data = await response.json();

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
        setIsLoading(false);
      }
    }

    fetchChartData();
  }, [filters, residenceAddressFilters, filtersHydrated, toast]);

  // Handle legend click to toggle line visibility
  const handleLegendClick = (entry: { value: string }) => {
    setVisibleLines(prev => ({
      ...prev,
      [entry.value]: !prev[entry.value]
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
    
    const formattedData = formatChartData();
    formattedData.forEach(dataPoint => {
      Object.entries(dataPoint).forEach(([key, value]) => {
        if (key !== 'year' && value !== null) {
          const numValue = parseFloat(value as string);
          if (!isNaN(numValue)) {
            minValue = Math.min(minValue, numValue);
            maxValue = Math.max(maxValue, numValue);
          }
        }
      });
    });
    
    // Add some padding (10% of the range)
    const padding = (maxValue - minValue) * 0.1;
    return [
      Math.max(0, minValue - padding), // Don't go below 0
      Math.min(100, maxValue + padding) // Don't go above 100
    ];
  };

  // Custom tooltip formatter to show percentages
  const tooltipFormatter = (value: string) => {
    return `${value}%`;
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
                <Legend onClick={handleLegendClick} />
                {chartData.series.map((series, index) => (
                  visibleLines[series.name] && (
                    <Line
                      key={series.name}
                      type="monotone"
                      dataKey={series.name}
                      stroke={COLORS[index % COLORS.length]}
                      activeDot={{ r: 8 }}
                      connectNulls
                    />
                  )
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 