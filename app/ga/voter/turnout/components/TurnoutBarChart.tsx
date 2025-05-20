'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
  Cell,
  ReferenceLine,
} from 'recharts';
import { ApiChartRow } from '../page';
// import { formatPercent } from '@/lib/utils/formatters'; // Removed faulty import

// Helper to format percentages (consistent with ReportTabContent.tsx)
const formatPercent = (value: number | null | undefined) => {
  if (value === null || typeof value === 'undefined') return 'N/A';
  const numValue = Number(value);
  return isNaN(numValue) ? 'N/A' : numValue.toLocaleString(undefined, { 
    style: 'percent', 
    minimumFractionDigits: 1, 
    maximumFractionDigits: 1 
  });
};

interface TurnoutBarChartProps {
  rows: ApiChartRow[];
  xAxisMax: number;
}

// Custom Legend component for the top of the chart
const CustomLegend = () => {
  return (
    <div className="flex justify-center mb-4 py-2">
      <div className="flex items-center px-3 py-1.5 rounded-md border border-border bg-muted/30">
        <div
          className="w-4 h-4 mr-2 rounded"
          style={{ backgroundColor: "#4BC0C0" }}
        />
        <span className="text-sm font-medium">Overall Turnout Rate</span>
      </div>
    </div>
  );
};

// Custom tooltip component for bar chart - This seems unused now, Recharts Tooltip is used directly
/*
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border p-2 shadow-md rounded-md">
        <p className="font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`tooltip-${index}`} style={{ color: entry.color }}>
            {entry.name}: {(entry.value * 100).toFixed(1)}%
          </p>
        ))}
      </div>
    );
  }
  return null;
};
*/

// Define a custom shape for the Bar to enforce minimum height
const CustomBarShape = (props: any) => {
  const { x, y, width, height, fill } = props;
  const minHeight = 24;
  const displayHeight = Math.max(height, minHeight);
  // Adjust y position so the bar still grows upwards from the baseline
  const displayY = y + height - displayHeight;

  // Don't render if width or height is effectively zero or negative (before minHeight adjustment)
  if (width <= 0 || height < 0) { // height can be 0 for 0% turnout
    return null;
  }

  return <rect x={x} y={displayY} width={width} height={displayHeight} fill={fill} />;
};

export const TurnoutBarChart: React.FC<TurnoutBarChartProps> = ({ rows, xAxisMax }) => {
  if (!rows || rows.length === 0) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">No data for bar chart.</div>;
  }

  // Sort rows by overall turnout rate ascending (lowest first as per requirements)
  const sortedRows = [...rows].sort((a, b) => 
    (a.overallTurnoutRate || 0) - (b.overallTurnoutRate || 0)
  );

  // Format data for the bar chart
  const chartData = sortedRows.map(row => ({
    name: row.geoLabel,
    turnout: row.overallTurnoutRate || 0,
  }));

  return (
    <div className="flex flex-col h-full">
      {/* Add custom legend at the top */}
      <CustomLegend />
      
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical" // Horizontal bars
          margin={{
            top: 5,
            right: 30,
            left: 100, // Increased left margin for longer geoLabels
            bottom: 5,
          }}
        >
          {/* Remove CartesianGrid and replace with explicit ReferenceLines */}
          {/* These reference lines will appear as vertical lines in a vertical layout */}
          <ReferenceLine x={0.25} stroke="hsla(var(--muted-foreground), 0.2)" strokeWidth={1} />
          <ReferenceLine x={0.5} stroke="hsla(var(--muted-foreground), 0.2)" strokeWidth={1} />
          <ReferenceLine x={0.75} stroke="hsla(var(--muted-foreground), 0.2)" strokeWidth={1} />
          
          <XAxis 
            type="number" 
            domain={[0, xAxisMax]} 
            tickFormatter={(tick) => formatPercent(tick)} 
            allowDecimals={false}
            stroke="hsl(var(--muted-foreground))"
            tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
            ticks={[0, 0.25, 0.5, 0.75, 1]} // Keep explicit ticks
          />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={150} // Adjust width based on expected label length
            interval={0} // Show all labels
            stroke="hsl(var(--muted-foreground))"
            tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
            tick={{ fontSize: 10 }}
          />
          <Tooltip 
            formatter={(value: number) => [formatPercent(value), 'Overall Turnout']}
            cursor={{ fill: 'hsla(var(--muted-foreground), 0.1)' }}
            contentStyle={{ 
              background: "hsl(var(--background))", 
              borderColor: "hsl(var(--border))", 
              borderRadius: "0.375rem",
              color: "hsl(var(--foreground))",
              padding: "0.5rem",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)"
            }}
            itemStyle={{
              padding: "0.25rem 0",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
            labelStyle={{
              fontWeight: "500",
              marginBottom: "0.25rem",
              color: "hsl(var(--foreground))"
            }}
          />
          <Bar 
            dataKey="turnout" 
            fill="#4BC0C0" 
            name="Overall Turnout Rate"
            barSize={24}
            shape={<CustomBarShape />}
          >
            <LabelList 
              dataKey="turnout" 
              position="right" 
              formatter={(value: number) => formatPercent(value)}
              style={{ fill: 'hsl(var(--muted-foreground))', fontSize: '12px' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}; 