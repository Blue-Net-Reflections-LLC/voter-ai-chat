// components/AggregateFieldDisplay.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';

// Define the structure of the aggregated data items
interface AggregateDataPoint {
    value: string | number; // The specific category value (e.g., 'White', 'Male', 'Active')
    count: number;
    meta?: {
        facility_name?: string;
        facility_address?: string;
        [key: string]: any; // Allow for other metadata properties
    };
}

interface AggregateFieldDisplayProps {
    fieldName: string; // e.g., 'Race', 'Gender'
    data: AggregateDataPoint[];
    totalVoters: number; // Total number of voters for percentage calculation
    onFilterChange: (filterField: string, filterValue: string | number) => void; // Callback to apply filters
    localStorageKey: string; // Add prop for localStorage key
    displayExtraInfo?: (item: any) => React.ReactNode; // Optional prop to display extra information
    variant?: 'default' | 'stacked'; // Add variant prop for different layouts
}

const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d',
    '#FF6666', '#66CCCC', '#CC99FF', '#FFCC66', '#99CC99', '#6699CC',
    '#FF9999', '#99FFCC', '#CCCCFF', '#FFFF99', '#CCFFCC', '#99CCFF',
    '#FFCCCC', '#CCFFFF' // Add more colors if needed
];

// --- Custom Label for Pie Chart --- 
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ 
    cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, percentage
  }: any) => {
  // Increase multiplier slightly more to add padding between line end and text start
  const radiusText = outerRadius * 1.3; // Increased from 1.2
  const xText = cx + radiusText * Math.cos(-midAngle * RADIAN);
  const yText = cy + radiusText * Math.sin(-midAngle * RADIAN);
  
  const textAnchor = xText > cx ? 'start' : 'end';

  return (
    <g>
      <text 
        x={xText} 
        y={yText} 
        fill="#FFFFFF" // Keep white for dark mode
        textAnchor={textAnchor} 
        dominantBaseline="central"
        fontSize={10}
      >
        {`${name} (${percentage}%)`}
      </text>
    </g>
  );
};

// Helper function to get initial state safely (runs only on client)
const getInitialChartType = (key: string): 'bar' | 'pie' => {
  // Check if running in a browser environment
  if (typeof window !== 'undefined' && key) { 
    const savedType = localStorage.getItem(key);
    if (savedType === 'bar' || savedType === 'pie') {
      return savedType;
    }
  }
  return 'bar'; // Default if server-side or no saved value
};

const AggregateFieldDisplay: React.FC<AggregateFieldDisplayProps> = ({
    fieldName,
    data,
    totalVoters,
    onFilterChange,
    localStorageKey,
    displayExtraInfo,
    variant = 'default' // Default to the standard layout
}) => {
    // Initialize state using the helper function - runs once on mount
    const [chartType, setChartType] = useState<'bar' | 'pie'>(() => getInitialChartType(localStorageKey)); 
    const { theme } = useTheme();

    // Effect to SAVE preference to localStorage when chartType changes
    useEffect(() => {
        if (typeof window !== 'undefined' && localStorageKey) {
            try {
                // Add logging to see when saving happens
                console.log(`Saving chartType '${chartType}' for key '${localStorageKey}'`);
                localStorage.setItem(localStorageKey, chartType);
            } catch (error) {
                console.error(`Error saving chart type to localStorage for key "${localStorageKey}":`, error);
            }
        }
        // This effect should run whenever the user changes the chartType via buttons
    }, [chartType, localStorageKey]); 

    const chartData = useMemo(() => {
        return data.map((item, index) => ({
            name: String(item.value), // Recharts expects string names
            count: item.count,
            fill: COLORS[index % COLORS.length],
            percentage: totalVoters > 0 ? ((item.count / totalVoters) * 100).toFixed(2) : '0.00',
        }));
    }, [data, totalVoters]);

    // Only show top 20 items without an "Other" category
    const truncatedChartData = useMemo(() => {
        const sortedData = [...chartData].sort((a, b) => b.count - a.count);
        // Just take the top 20 items without adding an "Other" category
        return sortedData.slice(0, 20);
    }, [chartData]);

    // Note: pieChartData is now the same as truncatedChartData, could potentially remove pieChartData 
    // but keeping separate for clarity for now.
    const pieChartData = truncatedChartData; 

    const handleInteraction = (value: string | number) => {
        onFilterChange(fieldName, value);
    };

     const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const dataPoint = payload[0].payload; // Access the full data point
             const tooltipStyle: React.CSSProperties = {
                backgroundColor: theme === 'dark' ? 'hsl(var(--background))' : 'white', // Adjust background based on theme
                border: `1px solid ${theme === 'dark' ? 'hsl(var(--border))' : '#ccc'}`, // Adjust border based on theme
                padding: '10px',
                color: theme === 'dark' ? 'hsl(var(--foreground))' : 'black', // Adjust text color based on theme
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            };
            return (
                <div style={tooltipStyle}>
                    <p className="font-semibold">{`${dataPoint.name}`}</p>
                    <p>{`Count: ${dataPoint.count}`}</p>
                    <p>{`Percentage: ${dataPoint.percentage}%`}</p>
                </div>
            );
        }
        return null;
    };

    // Handle case where there is no data for this specific field
    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col space-y-2 p-4 border rounded-md bg-card h-[372px]"> {/* Match approx height */} 
                <h3 className="text-lg font-semibold">{fieldName} Distribution</h3>
                <div className="grow flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">No data available for {fieldName}.</p>
                </div>
            </div>
        );
    }

    // If using stacked variant (chart on top, table below)
    if (variant === 'stacked') {
        return (
            <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">{fieldName} Distribution</h3>
                    <div className="space-x-2">
                        <Button
                            variant={chartType === 'bar' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setChartType('bar')}
                        >
                            Bar
                        </Button>
                        <Button
                            variant={chartType === 'pie' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setChartType('pie')}
                        >
                            Pie
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col gap-4 items-start">
                    {/* Chart section first */}
                    <div className="w-full h-[425px]">
                        <ResponsiveContainer>
                            {chartType === 'bar' ? (
                                <BarChart data={truncatedChartData} margin={{ top: 5, right: 5, left: 5, bottom: 20 }}> 
                                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? 'hsl(var(--muted))' : '#e0e0e0'} />
                                    <XAxis 
                                        dataKey="name" 
                                        type="category" 
                                        tick={{ fontSize: 10, fill: theme === 'dark' ? 'hsl(var(--muted-foreground))' : '#666' }} 
                                        interval={0}
                                        angle={-45}
                                        textAnchor="end"
                                    />
                                    <YAxis 
                                        type="number" 
                                        tick={{ fontSize: 10, fill: theme === 'dark' ? 'hsl(var(--muted-foreground))' : '#666' }}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}/>
                                    <Bar dataKey="count" onClick={(data) => handleInteraction(data.name)}>
                                        {truncatedChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            ) : (
                                <PieChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                                    <Pie
                                        data={pieChartData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={true}
                                        label={renderCustomizedLabel}
                                        outerRadius="70%"
                                        innerRadius="0%"
                                        dataKey="count"
                                        nameKey="name"
                                        onClick={(data) => handleInteraction(data.name)}
                                    >
                                        {pieChartData.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={entry.fill} 
                                                onClick={() => handleInteraction(entry.name)} 
                                                style={{ cursor: 'pointer', opacity: 1 }}
                                            />
                                        ))}
                                    </Pie>
                                </PieChart>
                            )}
                        </ResponsiveContainer>
                    </div>

                    {/* Table below with fixed height and scrolling */}
                    <div className="w-full overflow-hidden">
                        <div className="max-h-[425px] overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead colSpan={2} className="pl-8">{fieldName}</TableHead>
                                        <TableHead className="text-right">Count</TableHead>
                                        <TableHead className="text-right">Percentage</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {chartData.map((item, index) => (
                                        <TableRow
                                            key={`${item.name}-${index}`}
                                            onClick={() => handleInteraction(item.name)}
                                            className={`cursor-pointer hover:bg-muted/50 ${
                                                !truncatedChartData.some(chartItem => chartItem.name === item.name)
                                                    ? 'text-muted-foreground text-opacity-80' : ''
                                            }`}
                                        >
                                            <TableCell className="py-1 pl-2 pr-1 w-[24px]">
                                                <div className="size-3 rounded-sm" style={{ backgroundColor: item.fill }}></div>
                                            </TableCell>
                                            <TableCell className="font-medium text-xs py-1 pr-2">
                                                {item.name}
                                                {displayExtraInfo && displayExtraInfo(data[index])}
                                            </TableCell>
                                            <TableCell className="text-right text-xs py-1">{item.count.toLocaleString()}</TableCell>
                                            <TableCell className="text-right text-xs py-1">{item.percentage}%</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Default variant (original layout)
    return (
        <div className="flex flex-col space-y-4 p-4 border rounded-md bg-card">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">{fieldName} Distribution</h3>
                <div className="space-x-2">
                    <Button
                        variant={chartType === 'bar' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setChartType('bar')}
                    >
                        Bar
                    </Button>
                    <Button
                        variant={chartType === 'pie' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setChartType('pie')}
                    >
                        Pie
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
                <div className={`lg:col-span-2 border rounded-md`}>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead colSpan={2} className="pl-8">{fieldName}</TableHead>
                                <TableHead className="text-right">Count</TableHead>
                                <TableHead className="text-right">Percentage</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* Map over the ORIGINAL chartData for the table */}
                            {chartData.map((item, index) => (
                                <TableRow
                                    key={`${item.name}-${index}`}
                                    onClick={() => handleInteraction(item.name)}
                                    className={`cursor-pointer hover:bg-muted/50 ${
                                        !truncatedChartData.some(chartItem => chartItem.name === item.name)
                                            ? 'text-muted-foreground text-opacity-80' : ''
                                    }`}
                                >
                                    <TableCell className="py-1 pl-2 pr-1 w-[24px]">
                                        <div className="size-3 rounded-sm" style={{ backgroundColor: item.fill }}></div>
                                    </TableCell>
                                    <TableCell className="font-medium text-xs py-1 pr-2">
                                        {item.name}
                                        {displayExtraInfo && displayExtraInfo(data[index])}
                                    </TableCell>
                                    <TableCell className="text-right text-xs py-1">{item.count.toLocaleString()}</TableCell>
                                    <TableCell className="text-right text-xs py-1">{item.percentage}%</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="lg:col-span-3 h-full min-h-[320px]">
                    <ResponsiveContainer>
                        {chartType === 'bar' ? (
                            /* Use truncatedChartData for BarChart */
                            <BarChart data={truncatedChartData} margin={{ top: 5, right: 5, left: 5, bottom: 20 }}> 
                                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? 'hsl(var(--muted))' : '#e0e0e0'} />
                                <XAxis 
                                    dataKey="name" 
                                    type="category" 
                                    tick={{ fontSize: 10, fill: theme === 'dark' ? 'hsl(var(--muted-foreground))' : '#666' }} 
                                    interval={0}
                                    angle={-45}
                                    textAnchor="end"
                                />
                                <YAxis 
                                    type="number" 
                                    tick={{ fontSize: 10, fill: theme === 'dark' ? 'hsl(var(--muted-foreground))' : '#666' }}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}/>
                                <Bar dataKey="count" onClick={(data) => handleInteraction(data.name)}>
                                    {/* Map over truncatedChartData for Cells */}
                                    {truncatedChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        ) : (
                            /* Use pieChartData (which is same as truncatedChartData) for PieChart */
                            <PieChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                                <Pie
                                    data={pieChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={true}
                                    label={renderCustomizedLabel}
                                    outerRadius="70%"
                                    innerRadius="0%"
                                    dataKey="count"
                                    nameKey="name"
                                    onClick={(data) => handleInteraction(data.name)}
                                >
                                     {/* Map over pieChartData for Cells */}
                                    {pieChartData.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={entry.fill} 
                                            onClick={() => handleInteraction(entry.name)} 
                                            style={{ 
                                                cursor: 'pointer', 
                                                opacity: 1, 
                                            }}
                                        />
                                    ))}
                                </Pie>
                            </PieChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default AggregateFieldDisplay;