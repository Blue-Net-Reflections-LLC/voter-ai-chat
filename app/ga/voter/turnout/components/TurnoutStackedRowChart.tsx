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

export const TurnoutStackedRowChart: React.FC<TurnoutStackedRowChartProps> = ({ rows, xAxisMax }) => {
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

  return (
    <ResponsiveContainer width="100%" height={chartData.length > 10 ? 800 : 500}>
      <BarChart
        data={chartData}
        layout="vertical" // This creates horizontal bars (counterintuitive but correct)
        margin={{ top: 20, right: 50, left: 100, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          type="number" 
          domain={[0, xAxisMax]} 
          tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
        />
        <YAxis 
          dataKey="name" 
          type="category" 
          width={90}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        
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
  );
}; 