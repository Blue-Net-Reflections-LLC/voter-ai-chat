'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
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

  const columns = useMemo<ColumnDef<ApiReportRow>[]>(() => {
    if (!reportData || reportData.rows.length === 0) return [];

    const firstRow = reportData.rows[0];
    const dynamicColumns: ColumnDef<ApiReportRow>[] = [];

    // Base columns
    dynamicColumns.push(
      { accessorKey: 'geoLabel', header: 'Geo Unit' },
      { accessorKey: 'totalRegistered', header: 'Total Registered', cell: ({ getValue }) => formatNumber(getValue<number>()) },
      { accessorKey: 'totalVoted', header: 'Total Voted', cell: ({ getValue }) => formatNumber(getValue<number>()) },
      { accessorKey: 'overallTurnoutRate', header: 'Overall Turnout', cell: ({ getValue }) => formatPercent(getValue<number>()) }
    );

    // Breakdown columns (dynamically generated)
    if (firstRow.breakdowns) {
      Object.keys(firstRow.breakdowns).forEach(breakdownKey => {
        // Example breakdownKey: "Race:WHITE | Gender:MALE"
        const breakdownHeader = breakdownKey.split('|').map(s => s.trim()).join(' / ');
        dynamicColumns.push({
          id: `breakdown-${breakdownKey}-registered`,
          header: `${breakdownHeader} - Reg.`,
          accessorFn: (row) => row.breakdowns[breakdownKey]?.registered,
          cell: ({ getValue }) => formatNumber(getValue<number>()),
        });
        dynamicColumns.push({
          id: `breakdown-${breakdownKey}-voted`,
          header: `${breakdownHeader} - Voted`,
          accessorFn: (row) => row.breakdowns[breakdownKey]?.voted,
          cell: ({ getValue }) => formatNumber(getValue<number>()),
        });
        dynamicColumns.push({
          id: `breakdown-${breakdownKey}-turnout`,
          header: `${breakdownHeader} - Turnout`,
          accessorFn: (row) => row.breakdowns[breakdownKey]?.turnout,
          cell: ({ getValue }) => formatPercent(getValue<number>()),
        });
      });
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
                header: `Census: ${header}`,
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