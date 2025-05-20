'use client';

import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TurnoutBarChart } from './components/TurnoutBarChart';
import { TurnoutStackedRowChart } from './components/TurnoutStackedRowChart';
import { ChartExporter } from './components/ChartExporter';

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

export const ChartTabContent: React.FC<ChartTabContentProps> = ({ chartData, isLoading, error }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  
  // Diagnostic log
  console.log('[ChartTabContent PROPS]', { chartData, isLoading, error });

  if (isLoading) {
    console.log('[ChartTabContent RENDER]: isLoading');
    return (
      <div className="flex items-center justify-center h-96">
        <p>Loading chart data...</p>
      </div>
    );
  }

  if (error) {
    console.log('[ChartTabContent RENDER]: error', error);
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
    console.log('[ChartTabContent RENDER]: No chart data', chartData);
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">No chart data to display. Please ensure a chart breakdown is selected and data is generated.</p>
      </div>
    );
  }
  
  console.log('[ChartTabContent RENDER]: Rendering chart', chartData);

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
          <CardTitle>Voter Turnout Chart</CardTitle>
          <CardDescription>
            Visual representation of voter turnout ({chartData.type === 'bar' ? 'Overall Turnout' : 'Demographic Breakdown'})
          </CardDescription>
        </div>
        <ChartExporter 
          chartRef={chartContainerRef} 
          chartType={chartData.type} 
          disabled={isLoading || !chartData || chartData.rows.length === 0}
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
}; 