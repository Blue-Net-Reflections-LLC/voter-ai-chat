'use client';

import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface CVAPData {
  label: string;
  count: number;
  race_category: string;
  data_type: 'cvap' | 'registered';
  registration_rate: number;
}

interface CVAPRegistrationComparisonChartProps {
  data: CVAPData[];
  loading?: boolean;
}

interface ProcessedRaceData {
  race: string;
  cvapCount: number;
  registeredCount: number;
  registrationRate: number;
  cvapPercentage: number;
  registeredPercentage: number;
}

// Race-specific colors for consistent visualization
const RACE_COLORS: Record<string, { cvap: string; registered: string }> = {
  'White': { cvap: '#0088FE', registered: '#66B2FF' },
  'Black': { cvap: '#00C49F', registered: '#66D9C4' },
  'Asian/Pacific Islander': { cvap: '#FFBB28', registered: '#FFD666' },
  'Hispanic/Latino': { cvap: '#FF8042', registered: '#FFB380' },
  'American Indian/Alaska Native': { cvap: '#8884D8', registered: '#B8B8E8' }
};

export default function CVAPRegistrationComparisonChart({ 
  data, 
  loading = false 
}: CVAPRegistrationComparisonChartProps) {
  const [viewMode, setViewMode] = useState<'Bar' | 'Pie'>('Bar');

  // Process the data to group by race
  const processedData: ProcessedRaceData[] = React.useMemo(() => {
    if (!data || data.length === 0) return [];

    // Group data by race
    const raceGroups: Record<string, { cvap: number; registered: number; rate: number }> = {};
    
    data.forEach(item => {
      const race = item.race_category;
      if (!raceGroups[race]) {
        raceGroups[race] = { cvap: 0, registered: 0, rate: 0 };
      }
      
      if (item.data_type === 'cvap') {
        raceGroups[race].cvap = item.count;
        raceGroups[race].rate = item.registration_rate;
      } else if (item.data_type === 'registered') {
        raceGroups[race].registered = item.count;
      }
    });

    // Calculate totals for percentage calculations
    const totalCvap = Object.values(raceGroups).reduce((sum, group) => sum + group.cvap, 0);
    const totalRegistered = Object.values(raceGroups).reduce((sum, group) => sum + group.registered, 0);

    // Convert to array format
    return Object.entries(raceGroups)
      .filter(([_, group]) => group.cvap > 0 || group.registered > 0)
      .map(([race, group]) => ({
        race,
        cvapCount: group.cvap,
        registeredCount: group.registered,
        registrationRate: group.rate,
        cvapPercentage: totalCvap > 0 ? (group.cvap / totalCvap) * 100 : 0,
        registeredPercentage: totalRegistered > 0 ? (group.registered / totalRegistered) * 100 : 0
      }))
      .sort((a, b) => b.cvapCount - a.cvapCount); // Sort by CVAP count descending
  }, [data]);

  // Prepare chart data for side-by-side bars
  const chartData = React.useMemo(() => {
    return processedData.map(item => ({
      race: item.race,
      'CVAP Eligible': item.cvapCount,
      'Registered': item.registeredCount,
      registrationRate: item.registrationRate
    }));
  }, [processedData]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>CVAP vs Registered Voters by Race Comparison Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>CVAP vs Registered Voters by Race Comparison Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-center py-8">
            No CVAP registration data available for the selected filters.
          </div>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-blue-600">
            CVAP Eligible: {payload[0].value?.toLocaleString()}
          </p>
          <p className="text-green-600">
            Registered: {payload[1]?.value?.toLocaleString()}
          </p>
          <p className="text-muted-foreground">
            Registration Rate: {data.registrationRate}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>CVAP vs Registered Voters by Race Comparison Distribution</CardTitle>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'Bar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('Bar')}
          >
            Bar
          </Button>
          <Button
            variant={viewMode === 'Pie' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('Pie')}
          >
            Pie
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Table View */}
          <div>
            <h4 className="font-medium mb-3">CVAP vs Registered Voters by Race Comparison</h4>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Race</TableHead>
                    <TableHead className="text-right">CVAP Eligible</TableHead>
                    <TableHead className="text-right">Registered</TableHead>
                    <TableHead className="text-right">Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedData.map((item) => {
                    const registrationPercentage = item.cvapCount > 0 
                      ? ((item.registeredCount / item.cvapCount) * 100).toFixed(1)
                      : '0.0';
                    
                    return (
                      <TableRow key={item.race}>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: RACE_COLORS[item.race]?.cvap || '#0088FE' }}
                            />
                            <span className="font-medium">{item.race}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-3 font-medium">
                          {item.cvapCount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right py-3 font-medium">
                          {item.registeredCount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right py-3 font-bold">
                          {registrationPercentage}%
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Chart View */}
          <div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="race" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis 
                    tickFormatter={(value) => value.toLocaleString()}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  
                  <Bar dataKey="CVAP Eligible" name="CVAP Eligible">
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cvap-${index}`} 
                        fill={RACE_COLORS[entry.race]?.cvap || '#0088FE'} 
                      />
                    ))}
                  </Bar>
                  
                  <Bar dataKey="Registered" name="Registered">
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`registered-${index}`} 
                        fill={RACE_COLORS[entry.race]?.registered || '#66B2FF'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 