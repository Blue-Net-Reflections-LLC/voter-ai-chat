'use client';

import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TurnoutBarChart } from './components/TurnoutBarChart';
import { TurnoutStackedRowChart } from './components/TurnoutStackedRowChart';
import { ChartExporter, type ChartExporterActions } from './components/ChartExporter';
import { Loader2 } from 'lucide-react';

// Define props interface accurately based on page.tsx state
interface ApiChartData {
  type: 'bar' | 'stackedRow';
  rows: Array<{
    geoLabel: string;
    summedDemographicTurnoutRate?: number;
    segments?: Array<{
      label: string;
      turnoutRate: number;
      color: string;
    }>;
    overallTurnoutRate?: number;
  }>;
  xAxisMax: number;
}

interface ChartTabContentProps {
  chartData: ApiChartData | null;
  isLoading: boolean;
  error: string | null;
}

// Actions exposed by ChartTabContent
export interface ChartTabActions {
  exportChartSVG: () => void;
  exportChartPNG: () => Promise<void>;
}

export const ChartTabContent = forwardRef<ChartTabActions, ChartTabContentProps>(({ chartData, isLoading, error }, ref) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartExporterRef = useRef<ChartExporterActions>(null); // Ref for ChartExporter
  
  // Expose chart export functions
  useImperativeHandle(ref, () => ({
    exportChartSVG: () => chartExporterRef.current?.exportToSVG(),
    exportChartPNG: async () => chartExporterRef.current?.exportToPNG(),
  }));

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium">Processing chart data...</p>
        <p className="text-xs text-muted-foreground mt-2">
          This may take a moment for larger datasets.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!chartData || !chartData.rows || chartData.rows.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground mb-2">No chart data available.</p>
        <p className="text-xs font-medium text-blue-600">
          Please select options in the sidebar and click &quot;Draw Chart&quot; to generate a visualization.
        </p>
      </div>
    );
  }

  // Calculate dynamic chart height
  const MINIMUM_CHART_HEIGHT = 400; // Minimum height in pixels
  const PIXELS_PER_BAR = 40; // Updated: 24px bar + 16px spacing
  let chartHeight = MINIMUM_CHART_HEIGHT;
  if (chartData && chartData.rows && chartData.rows.length > 0) {
    chartHeight = Math.max(MINIMUM_CHART_HEIGHT, chartData.rows.length * PIXELS_PER_BAR);
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
        <div>
          {/* Static text removed as per user request */}
        </div>
        {/* ChartExporter is now invisible but its functions are exposed via ref */}
        <ChartExporter 
          ref={chartExporterRef} // Pass the ref
          chartRef={chartContainerRef} 
          chartType={chartData?.type || 'chart'} // Provide a fallback for chartType
        />
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto">
        {/* The direct child div of CardContent will handle scrolling if needed */}
        <div ref={chartContainerRef} style={{ height: `${chartHeight}px`, minHeight: `${MINIMUM_CHART_HEIGHT}px` }}>
          {chartData.type === 'bar' ? (
            <TurnoutBarChart rows={chartData.rows} xAxisMax={chartData.xAxisMax} />
          ) : (
            <TurnoutStackedRowChart rows={chartData.rows} xAxisMax={chartData.xAxisMax} />
          )}
        </div>
      </CardContent>
    </Card>
  );
});

ChartTabContent.displayName = 'ChartTabContent'; 