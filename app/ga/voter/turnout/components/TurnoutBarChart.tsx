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

interface TurnoutBarChartProps {
  rows: ApiChartRow[];
  xAxisMax: number;
}

// Custom tooltip component for bar chart
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

export const TurnoutBarChart: React.FC<TurnoutBarChartProps> = ({ rows, xAxisMax }) => {
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
        <Bar 
          dataKey="turnout" 
          fill="#1e88e5" 
          name="Overall Turnout Rate"
        >
          <LabelList 
            dataKey="turnout" 
            position="right" 
            formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}; 