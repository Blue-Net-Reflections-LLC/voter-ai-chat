import React, { useEffect } from 'react';
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
} from 'recharts';
import { ApiChartRow } from '../page';

interface TurnoutStackedRowChartProps {
  rows: ApiChartRow[];
  xAxisMax: number;
}

// Custom tooltip component for stacked chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border p-2 shadow-md rounded-md">
        <p className="font-medium text-foreground">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`tooltip-${index}`} className="flex items-center gap-2">
            <span className="w-3 h-3 inline-block rounded-sm" style={{ backgroundColor: entry.color }}></span>
            <span style={{ color: entry.color }}>
              {entry.name}: {(entry.value * 100).toFixed(1)}%
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Custom Legend component for the top of the chart
const CustomLegend = ({ segmentLabels, segmentColors }: { segmentLabels: string[], segmentColors: string[] }) => {
  return (
    <div className="flex justify-center mb-4 py-2 flex-wrap gap-2">
      {segmentLabels.map((label, index) => (
        <div key={`legend-${index}`} className="flex items-center px-3 py-1.5 rounded-md border border-border bg-muted/30">
          <div
            className="w-4 h-4 mr-2 rounded"
            style={{ backgroundColor: segmentColors[index] }}
          />
          <span className="text-sm font-medium">{label}</span>
        </div>
      ))}
    </div>
  );
};

export const TurnoutStackedRowChart: React.FC<TurnoutStackedRowChartProps> = ({ rows, xAxisMax }) => {
  // Log to show we're using the colors from the segments
  useEffect(() => {
    if (rows?.[0]?.segments) {
      console.log('Stacked chart using colors:', rows[0].segments.map(s => `${s.label}: ${s.color}`));
    }
  }, [rows]);

  // Sort rows by summed demographic turnout rate ascending (lowest first as per requirements)
  // Use summedDemographicTurnoutRate if available, otherwise calculate from segments
  const sortedRows = [...rows].sort((a, b) => {
    const sumA = a.summedDemographicTurnoutRate || 
      (a.segments?.reduce((sum, seg) => sum + seg.turnoutRate, 0) || 0);
    
    const sumB = b.summedDemographicTurnoutRate || 
      (b.segments?.reduce((sum, seg) => sum + seg.turnoutRate, 0) || 0);
    
    return sumA - sumB;
  });

  // Process data for the stacked bar chart
  const chartData = sortedRows.map(row => {
    const dataPoint: any = {
      name: row.geoLabel,
      overallTurnout: row.overallTurnoutRate || 0,
    };

    // Add segments as separate datapoints
    if (row.segments) {
      row.segments.forEach(segment => {
        dataPoint[segment.label] = segment.turnoutRate;
      });
    }

    return dataPoint;
  });

  // Extract segment labels to create bars for each demographic
  const segmentLabels = sortedRows[0]?.segments?.map(segment => segment.label) || [];
  const segmentColors = sortedRows[0]?.segments?.map(segment => segment.color) || [];

  // If no segments in the first row, check other rows to find segments
  let foundSegments = segmentLabels.length > 0;
  if (!foundSegments) {
    // Look through all rows to find one with segments
    for (let i = 1; i < sortedRows.length; i++) {
      // Fix typescript errors by adding proper null checks
      const currentRow = sortedRows[i];
      if (currentRow && currentRow.segments && currentRow.segments.length > 0) {
        // Now that we've confirmed segments exists and isn't empty, it's safe to use
        const rowSegments = currentRow.segments;
        if (rowSegments) {
          const rowSegmentLabels = rowSegments.map(segment => segment.label);
          const rowSegmentColors = rowSegments.map(segment => segment.color);
          
          if (rowSegmentLabels.length > 0) {
            // We found a row with segments, use these instead
            segmentLabels.push(...rowSegmentLabels);
            segmentColors.push(...rowSegmentColors);
            foundSegments = true;
            break;
          }
        }
      }
    }
  }

  // Still no segments found, show error message or fallback
  if (!foundSegments || segmentLabels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <p className="text-muted-foreground mb-2">No demographic breakdown data available for the selected options.</p>
        <p className="text-xs font-medium text-blue-600">Try selecting a different breakdown or click &quot;Draw Chart&quot; after making changes.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Add custom legend at the top */}
      <CustomLegend segmentLabels={segmentLabels} segmentColors={segmentColors} />
      
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical" // This creates horizontal bars (counterintuitive but correct)
          margin={{ top: 20, right: 50, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsla(var(--muted-foreground), 0.2)" />
          <XAxis 
            type="number" 
            domain={[0, xAxisMax]} 
            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
            stroke="hsl(var(--muted-foreground))"
            tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
          />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={150}
            stroke="hsl(var(--muted-foreground))"
            tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
            tick={{ fontSize: 10 }}
          />
          <Tooltip 
            content={<CustomTooltip />}
            cursor={{ fill: 'hsla(var(--muted-foreground), 0.1)' }}
          />
          {/* Keep the original legend but hide it if needed */}
          <Legend layout="horizontal" verticalAlign="bottom" wrapperStyle={{ display: 'none' }} />
          
          {/* Create a bar for each demographic segment */}
          {segmentLabels.map((label, index) => (
            <Bar 
              key={`segment-${index}`}
              dataKey={label}
              stackId="turnout"
              fill={segmentColors[index] || `#${Math.floor(Math.random()*16777215).toString(16)}`}
              name={label}
            >
              <LabelList 
                dataKey={label} 
                position="inside" 
                formatter={(value: number) => value > 0.05 ? `${(value * 100).toFixed(0)}%` : ''}
                fill="#ffffff"
              />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}; 