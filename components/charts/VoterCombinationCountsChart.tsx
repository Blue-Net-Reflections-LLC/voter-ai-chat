'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // For table view
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useVoterFilterContext } from '@/app/ga/voter/VoterFilterProvider';
import { buildQueryParams } from '@/app/ga/voter/VoterFilterProvider';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Types to match the API response
interface CombinationResult {
  name: string;
  filters: Record<string, string>;
  count: number;
}

interface ChartData {
  results: CombinationResult[];
  totalCombinedCount?: number; // Optional total count
}

interface ErrorResponse {
  message: string;
  allowedFilters?: string[];
}

// Consistent colors
const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE',
  '#00C49F', '#FFBB28', '#FF8042', '#a4de6c', '#d0ed57'
];

// --- Custom Label for Pie Chart --- 
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ 
    cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, 
  }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5; // Label position inside slice (initial)
  // Calculate position slightly outside the slice for the connecting line start
  const radiusLineStart = outerRadius * 1.1;
  const xLineStart = cx + radiusLineStart * Math.cos(-midAngle * RADIAN);
  const yLineStart = cy + radiusLineStart * Math.sin(-midAngle * RADIAN);

  // Calculate end position for the line and text
  const radiusText = outerRadius * 1.3; // Adjust this multiplier for distance
  const xText = cx + radiusText * Math.cos(-midAngle * RADIAN);
  const yText = cy + radiusText * Math.sin(-midAngle * RADIAN);
  
  // Determine text anchor based on position relative to center
  const textAnchor = xText > cx ? 'start' : 'end';

  return (
    <g>
        {/* Connecting Line - Disabled for now as labelLine prop handles it */}
        {/* 
        <line 
            x1={xLineStart} 
            y1={yLineStart} 
            x2={xText} 
            y2={yText} 
            stroke="hsl(var(--muted-foreground))" // Use muted text color for line
            strokeWidth={1} 
        /> 
        */}
      <text 
        x={xText} 
        y={yText} 
        fill="hsl(var(--foreground))" // Use theme text color
        textAnchor={textAnchor} 
        dominantBaseline="central"
        fontSize="0.75rem" // text-xs
      >
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    </g>
  );
};

// Changed: Only Bar and Pie are selectable chart views now
type ChartViewType = 'bar' | 'pie';

export function VoterCombinationCountsChart() {
  const { filters, residenceAddressFilters, filtersHydrated } = useVoterFilterContext();
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ChartViewType>('bar'); // Default to bar
  const { toast } = useToast();

  useEffect(() => {
    if (!filtersHydrated) return;

    const controller = new AbortController();
    const signal = controller.signal;

    async function fetchChartData() {
      setIsLoading(true);
      setError(null);

      try {
        const params = buildQueryParams(filters, residenceAddressFilters, {
          chartType: 'voterCombinationCounts' // Fetch combination counts data
        });

        const response = await fetch(`/api/ga/voter/chart-data?${params.toString()}`, { signal });
        const data = await response.json();

        if (signal.aborted) return;

        if (!response.ok) {
          const errorMessage = data.message || 'Failed to fetch chart data';
          setError(errorMessage);
          setChartData(null);
          toast({ variant: "destructive", title: "Error loading chart data", description: errorMessage });
          return;
        }

        if (data.message) { // Handle API messages like "Please select filters..."
          setError(data.message);
          setChartData(null);
          return;
        }

        setChartData(data);
        
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          console.log('Chart data fetch aborted');
          return;
        }
        const errorMessage = 'An error occurred while fetching the chart data.';
        console.error('Error fetching chart data:', err);
        setError(errorMessage);
        setChartData(null);
        toast({ variant: "destructive", title: "Error loading chart data", description: errorMessage });
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    fetchChartData();

    return () => {
      controller.abort();
    };
  }, [filters, residenceAddressFilters, filtersHydrated, toast]);

  // Custom tooltip formatter for counts
  const tooltipFormatter = (value: any) => {
    if (value === null || value === undefined) return 'N/A';
    const numValue = Number(value);
    return Number.isFinite(numValue) ? numValue.toLocaleString() : 'N/A';
  };
  
  // Data formatting specifically for Pie chart
  const pieData = useMemo(() => {
      if (!chartData?.results) return [];
      return chartData.results.map(item => ({ name: item.name, value: item.count }));
  }, [chartData]);

  // Data formatting specifically for Bar chart (uses results directly but needs name/count keys)
   const barData = useMemo(() => {
       if (!chartData?.results) return [];
       // Recharts BarChart typically expects a dataKey for the value axis
       // Here, we use the combination name for the category axis and 'count' for the value
       return chartData.results.map(item => ({ name: item.name, count: item.count }));
   }, [chartData]);

  // Data formatting and sorting for Table view
  const tableData = useMemo(() => {
    if (!chartData?.results || !chartData?.totalCombinedCount) return [];
    const total = chartData.totalCombinedCount || 1; // Avoid division by zero
    return chartData.results
        .map((item, index) => ({ 
            ...item, 
            index, // Store index for color mapping
            percentage: total > 0 ? ((item.count / total) * 100).toFixed(1) + '%' : '0.0%'
        }))
        .sort((a, b) => b.count - a.count); // Sort descending by count
  }, [chartData]);


  const renderChartView = () => {
    if (!chartData || !chartData.results || chartData.results.length === 0) return null;

    switch (activeView) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={tooltipFormatter} />
              <YAxis type="category" dataKey="name" width={100} interval={0} fontSize={10} />
              <Tooltip 
                formatter={tooltipFormatter} 
                contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', // Use theme background
                    padding: '5px 10px', 
                    border: '1px solid hsl(var(--border))', 
                    borderRadius: 'var(--radius)' 
                }}
                itemStyle={{ color: 'hsl(var(--foreground))' /* Use theme foreground */ }}
                cursor={{ fill: 'hsl(var(--muted))' /* Use theme muted for hover */, fillOpacity: 0.3 }}
               />
              <Bar dataKey="count" fill="#8884d8">
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            {/* Increased margin to give labels space */}
            <PieChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                // Enable default label line rendering
                labelLine={true} 
                // Use the custom label rendering function
                label={renderCustomizedLabel} 
                outerRadius={120} // Adjust radius to make space for labels
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number, name: string) => [`${tooltipFormatter(value)} voters`, name]}/>
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  // Render the table view
  const renderTableView = () => {
      if (!tableData || tableData.length === 0) return null;
      return (
        <div className="mt-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[20px]"></TableHead>
                        <TableHead>Combination</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                        <TableHead className="text-right">Percentage</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                {tableData.map((item) => (
                    <TableRow key={item.name}>
                        <TableCell className="py-1">
                            <span 
                                className="inline-block w-3 h-3 rounded-full"
                                style={{ backgroundColor: COLORS[item.index % COLORS.length] }}
                            />
                        </TableCell>
                        <TableCell className="font-medium text-xs py-1">{item.name}</TableCell>
                        <TableCell className="text-right text-xs py-1">{item.count.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-xs py-1">{item.percentage}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
        </div>
      );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>Voter Combination Counts</CardTitle>
                <CardDescription>Total voters matching selected filter combinations.</CardDescription>
            </div>
             {/* Updated View Switcher Buttons (Bar/Pie only) */}
             <div className="flex justify-center space-x-1 border p-1 rounded-md bg-muted">
                <button 
                    className={`px-3 py-1 rounded text-xs ${activeView === 'bar' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
                    onClick={() => setActiveView('bar')}
                >
                    Bar
                </button>
                <button 
                    className={`px-3 py-1 rounded text-xs ${activeView === 'pie' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
                    onClick={() => setActiveView('pie')}
                >
                    Pie
                </button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex justify-center items-center h-60">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        {!isLoading && error && (
          <div className="flex justify-center items-center h-60">
            <p className="text-center text-red-600">Error: {error}</p>
          </div>
        )}
        {!isLoading && !error && chartData && (
          <div>
            {renderChartView()} 
            {renderTableView()}
          </div>
        )}
        {!isLoading && !error && !chartData && (
           <div className="flex justify-center items-center h-60">
             <p className="text-center text-muted-foreground">No combination data available for the selected filters.</p>
           </div>
         )}
      </CardContent>
    </Card>
  );
} 