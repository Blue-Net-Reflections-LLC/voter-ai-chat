'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// TODO: Define props interface accurately based on page.tsx state
interface ApiChartData {
  type: 'bar' | 'stackedRow';
  rows: any[]; // Replace any with specific type for chart rows
  xAxisMax: number;
}

interface ChartTabContentProps {
  chartData: ApiChartData | null;
  isLoading: boolean;
  error: string | null;
}

export const ChartTabContent: React.FC<ChartTabContentProps> = ({ chartData, isLoading, error }) => {

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p>Loading chart data...</p> {/* TODO: Add spinner component */}
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

  if (!chartData || chartData.rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">No chart data to display. Please generate an analysis.</p>
      </div>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Voter Turnout Chart</CardTitle>
          <CardDescription>Visual representation of voter turnout ({chartData.type} chart).</CardDescription>
        </div>
        <div className="space-x-2">
            <Button variant="outline" size="sm" disabled={isLoading || !chartData || chartData.rows.length === 0}>
              Download Chart (SVG)
            </Button>
            <Button variant="outline" size="sm" disabled={isLoading || !chartData || chartData.rows.length === 0}>
              Download Chart (PNG)
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* TODO: Implement chart component (e.g., using Recharts, Nivo, Chart.js) */}
        <div className="h-[500px] border rounded flex items-center justify-center bg-muted/20 p-4">
          <p className="text-muted-foreground text-center">
            Chart implementation pending.
            <br />
            Chart Type: {chartData.type}
            <br />
            Data Rows: {chartData.rows.length}
            <br />
            X-Axis Max: {chartData.xAxisMax}
          </p>
          {/* <pre className="text-xs overflow-auto max-h-64">{JSON.stringify(chartData.rows.slice(0,2), null, 2)}</pre> */}
        </div>
      </CardContent>
    </Card>
  );
}; 