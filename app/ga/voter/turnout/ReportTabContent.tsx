'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { ApiReportRow, ApiReportData } from './page'; // Import types from page.tsx

// Props interface updated to use specific types
interface ReportTabContentProps {
  reportData: ApiReportData | null;
  isLoading: boolean;
  error: string | null;
  // To determine which census columns to show, we might need selections or check data
  // For now, we'll infer from the first row's censusData keys if present
}

// Helper to format percentages
const formatPercent = (value: number | null | undefined) => {
  if (value === null || typeof value === 'undefined') return 'N/A';
  return value.toLocaleString(undefined, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 });
};

// Helper to format numbers
const formatNumber = (value: number | null | undefined) => {
  if (value === null || typeof value === 'undefined') return 'N/A';
  return value.toLocaleString();
};

export const ReportTabContent: React.FC<ReportTabContentProps> = ({ reportData, isLoading, error }) => {
  // Add sorting state - default to sort by overallTurnoutRate ascending (lowest to highest)
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'overallTurnoutRate', desc: false }
  ]);

  const columns = useMemo<ColumnDef<ApiReportRow>[]>(() => {
    if (!reportData || reportData.rows.length === 0) return [];

    const firstRow = reportData.rows[0];
    const dynamicColumns: ColumnDef<ApiReportRow>[] = [];

    // Base columns with sortable headers
    dynamicColumns.push(
      { 
        accessorKey: 'geoLabel', 
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Geo Unit
            <span className="ml-2">
              {column.getIsSorted() === "asc" ? <ArrowUp className="h-4 w-4" /> : 
               column.getIsSorted() === "desc" ? <ArrowDown className="h-4 w-4" /> : 
               <ArrowUpDown className="h-4 w-4" />}
            </span>
          </Button>
        ),
      },
      { 
        accessorKey: 'totalRegistered', 
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Total Registered
            <span className="ml-2">
              {column.getIsSorted() === "asc" ? <ArrowUp className="h-4 w-4" /> : 
               column.getIsSorted() === "desc" ? <ArrowDown className="h-4 w-4" /> : 
               <ArrowUpDown className="h-4 w-4" />}
            </span>
          </Button>
        ),
        cell: ({ getValue }) => formatNumber(getValue<number>()) 
      },
      { 
        accessorKey: 'totalVoted', 
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Total Voted
            <span className="ml-2">
              {column.getIsSorted() === "asc" ? <ArrowUp className="h-4 w-4" /> : 
               column.getIsSorted() === "desc" ? <ArrowDown className="h-4 w-4" /> : 
               <ArrowUpDown className="h-4 w-4" />}
            </span>
          </Button>
        ),
        cell: ({ getValue }) => formatNumber(getValue<number>()) 
      },
      { 
        accessorKey: 'overallTurnoutRate', 
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Overall Turnout
            <span className="ml-2">
              {column.getIsSorted() === "asc" ? <ArrowUp className="h-4 w-4" /> : 
               column.getIsSorted() === "desc" ? <ArrowDown className="h-4 w-4" /> : 
               <ArrowUpDown className="h-4 w-4" />}
            </span>
          </Button>
        ),
        cell: ({ getValue }) => formatPercent(getValue<number>()) 
      }
    );

    // Breakdown columns (dynamically generated)
    if (firstRow.breakdowns) {
      const breakdownKeys = Object.keys(firstRow.breakdowns);
      if (breakdownKeys.length > 0) {
        // Group breakdown keys by data point type (Race, Gender, AgeRange)
        const groupedBreakdowns: Record<string, string[]> = {};
        
        breakdownKeys.forEach(key => {
          const [dataPoint, category] = key.split(':');
          if (!groupedBreakdowns[dataPoint]) {
            groupedBreakdowns[dataPoint] = [];
          }
          groupedBreakdowns[dataPoint].push(key);
        });
        
        // For each data point type, add the columns for all categories
        Object.entries(groupedBreakdowns).forEach(([dataPoint, keys]) => {
          // Add a header column for this data point group
          dynamicColumns.push({
            id: `header-${dataPoint}`,
            header: () => (
              <div className="font-bold text-center border-b pb-1 mb-1">
                {dataPoint} Breakdown
              </div>
            ),
            cell: () => null
          });
          
          // Add columns for each category in this data point
          keys.forEach(key => {
            const [dataPoint, category] = key.split(':');
            const displayCategory = category === 'WH' ? 'White' : 
                                   category === 'BH' ? 'Black' : 
                                   category === 'AP' ? 'Asian/Pacific' :
                                   category === 'HP' ? 'Hispanic' :
                                   category === 'OT' ? 'Other' :
                                   category === 'U' ? 'Unknown' :
                                   category === 'M' ? 'Male' :
                                   category === 'F' ? 'Female' : category;
            
            dynamicColumns.push({
              id: `${key}-registered`,
              header: ({ column }) => (
                <Button
                  variant="ghost"
                  onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                  className="p-0 hover:bg-transparent whitespace-nowrap"
                >
                  {`${displayCategory} - Reg.`}
                  <span className="ml-2">
                    {column.getIsSorted() === "asc" ? <ArrowUp className="h-4 w-4" /> : 
                    column.getIsSorted() === "desc" ? <ArrowDown className="h-4 w-4" /> : 
                    <ArrowUpDown className="h-4 w-4" />}
                  </span>
                </Button>
              ),
              accessorFn: (row) => row.breakdowns[key]?.registered,
              cell: ({ getValue }) => formatNumber(getValue<number>()),
            });
            
            dynamicColumns.push({
              id: `${key}-voted`,
              header: ({ column }) => (
                <Button
                  variant="ghost"
                  onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                  className="p-0 hover:bg-transparent whitespace-nowrap"
                >
                  {`${displayCategory} - Voted`}
                  <span className="ml-2">
                    {column.getIsSorted() === "asc" ? <ArrowUp className="h-4 w-4" /> : 
                    column.getIsSorted() === "desc" ? <ArrowDown className="h-4 w-4" /> : 
                    <ArrowUpDown className="h-4 w-4" />}
                  </span>
                </Button>
              ),
              accessorFn: (row) => row.breakdowns[key]?.voted,
              cell: ({ getValue }) => formatNumber(getValue<number>()),
            });
            
            dynamicColumns.push({
              id: `${key}-turnout`,
              header: ({ column }) => (
                <Button
                  variant="ghost"
                  onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                  className="p-0 hover:bg-transparent whitespace-nowrap"
                >
                  {`${displayCategory} - Turnout`}
                  <span className="ml-2">
                    {column.getIsSorted() === "asc" ? <ArrowUp className="h-4 w-4" /> : 
                    column.getIsSorted() === "desc" ? <ArrowDown className="h-4 w-4" /> : 
                    <ArrowUpDown className="h-4 w-4" />}
                  </span>
                </Button>
              ),
              accessorFn: (row) => row.breakdowns[key]?.turnout,
              cell: ({ getValue }) => formatPercent(getValue<number>()),
            });
          });
        });
      } else {
        // Legacy handling for old format of breakdowns if needed
        Object.keys(firstRow.breakdowns).forEach(breakdownKey => {
          // Example breakdownKey: "Race:WHITE | Gender:MALE"
          const breakdownHeader = breakdownKey.split('|').map(s => s.trim()).join(' / ');
          dynamicColumns.push({
            id: `breakdown-${breakdownKey}-registered`,
            header: ({ column }) => (
              <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="p-0 hover:bg-transparent whitespace-nowrap"
              >
                {`${breakdownHeader} - Reg.`}
                <span className="ml-2">
                  {column.getIsSorted() === "asc" ? <ArrowUp className="h-4 w-4" /> : 
                  column.getIsSorted() === "desc" ? <ArrowDown className="h-4 w-4" /> : 
                  <ArrowUpDown className="h-4 w-4" />}
                </span>
              </Button>
            ),
            accessorFn: (row) => row.breakdowns[breakdownKey]?.registered,
            cell: ({ getValue }) => formatNumber(getValue<number>()),
          });
          dynamicColumns.push({
            id: `breakdown-${breakdownKey}-voted`,
            header: ({ column }) => (
              <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="p-0 hover:bg-transparent whitespace-nowrap"
              >
                {`${breakdownHeader} - Voted`}
                <span className="ml-2">
                  {column.getIsSorted() === "asc" ? <ArrowUp className="h-4 w-4" /> : 
                  column.getIsSorted() === "desc" ? <ArrowDown className="h-4 w-4" /> : 
                  <ArrowUpDown className="h-4 w-4" />}
                </span>
              </Button>
            ),
            accessorFn: (row) => row.breakdowns[breakdownKey]?.voted,
            cell: ({ getValue }) => formatNumber(getValue<number>()),
          });
          dynamicColumns.push({
            id: `breakdown-${breakdownKey}-turnout`,
            header: ({ column }) => (
              <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="p-0 hover:bg-transparent whitespace-nowrap"
              >
                {`${breakdownHeader} - Turnout`}
                <span className="ml-2">
                  {column.getIsSorted() === "asc" ? <ArrowUp className="h-4 w-4" /> : 
                  column.getIsSorted() === "desc" ? <ArrowDown className="h-4 w-4" /> : 
                  <ArrowUpDown className="h-4 w-4" />}
                </span>
              </Button>
            ),
            accessorFn: (row) => row.breakdowns[breakdownKey]?.turnout,
            cell: ({ getValue }) => formatPercent(getValue<number>()),
          });
        });
      }
    }
    
    // Census data columns (dynamically generated if present)
    if (firstRow.censusData) {
        Object.keys(firstRow.censusData).forEach(censusKey => {
            // Try to make header more readable
            const header = censusKey
                .replace(/_/g, ' ')
                .replace(/([A-Z])/g, ' $1') // Add space before caps for camelCase/PascalCase
                .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
                .trim();

            dynamicColumns.push({
                accessorKey: `censusData.${censusKey}`,
                header: ({ column }) => (
                  <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent whitespace-nowrap"
                  >
                    {`Census: ${header}`}
                    <span className="ml-2">
                      {column.getIsSorted() === "asc" ? <ArrowUp className="h-4 w-4" /> : 
                      column.getIsSorted() === "desc" ? <ArrowDown className="h-4 w-4" /> : 
                      <ArrowUpDown className="h-4 w-4" />}
                    </span>
                  </Button>
                ),
                cell: ({ getValue }) => {
                    const val = getValue<number | string>();
                    if (typeof val === 'number') {
                        // Assuming census percentages are 0-100, not 0-1
                        if (header.toLowerCase().includes('percentage') || header.toLowerCase().includes('rate')) {
                             return (val / 100).toLocaleString(undefined, { style: 'percent', minimumFractionDigits: 1 });
                        }
                        return formatNumber(val);
                    }
                    return String(val);
                }
            });
        });
    }

    return dynamicColumns;
  }, [reportData]);

  const table = useReactTable({
    data: reportData?.rows || [],
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading report data...</p> {/* TODO: Add spinner component - e.g. <Spinner className="h-8 w-8 text-primary" /> */}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Report</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!reportData || reportData.rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No report data to display. Please generate an analysis.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Voter Turnout Report</CardTitle>
          <CardDescription>Detailed breakdown of voter turnout based on your selections.</CardDescription>
        </div>
        <Button variant="outline" size="sm" disabled={isLoading || !reportData || reportData.rows.length === 0}>
          Download Report (CSV/Excel) {/* TODO: Implement download functionality */}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <TableHead key={header.id} className="whitespace-nowrap">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map(row => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id} className="whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {reportData.aggregations && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="text-lg font-semibold mb-3">Report Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Average Overall Turnout Rate:</span>
                <Badge variant="outline">{formatPercent(reportData.aggregations.averageOverallTurnoutRate)}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Grand Total Voted (Participated):</span>
                <Badge variant="outline">{formatNumber(reportData.aggregations.grandTotalVoted)}</Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 