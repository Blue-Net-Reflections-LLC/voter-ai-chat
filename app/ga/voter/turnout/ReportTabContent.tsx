'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
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

// Helper to format currency
const formatCurrency = (value: number | null | undefined) => {
  if (value === null || typeof value === 'undefined') return 'N/A';
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
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
    const aggregations = reportData.aggregations;

    const getCellFormatter = (columnId: string, value: any) => {
      let numericValue = typeof value === 'string' ? parseFloat(value) : value;
      const fieldName = columnId.includes('.') ? columnId.split('.').pop()?.toLowerCase() || '' : columnId.toLowerCase();

      // Exclude specific string fields from any numeric formatting attempts
      if (fieldName === 'distincttractidsingeography' || fieldName === 'censusdatasourcetyear') {
        return String(value);
      }

      if (typeof numericValue !== 'number' || isNaN(numericValue)) {
        return String(value); 
      }
      
      // console.log(`Formatter: colId=${columnId}, field=${fieldName}, val=${numericValue}, originalType=${typeof value}`);

      if (columnId === 'overallTurnoutRate') {
        return formatPercent(numericValue); // Expects 0-1 range
      }
      
      if (columnId.startsWith('censusData.')) {
        if (fieldName.includes('income') || 
            fieldName.includes('salary') || 
            (fieldName.includes('household') && fieldName.includes('income'))) {
          return formatCurrency(numericValue);
        }
        
        // Census percentages are now also 0-1 from backend
        if (fieldName.includes('pct') || 
            fieldName.includes('rate') ||
            fieldName.includes('percentage')) {
          return formatPercent(numericValue); // Expects 0-1 range
        }
      }
      
      return formatNumber(numericValue);
    };

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
        footer: () => "Totals / Averages",
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
        cell: ({ getValue, column }) => getCellFormatter(column.id, getValue<number>()),
        footer: () => aggregations ? formatNumber(aggregations.grandTotalRegistered) : null,
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
        cell: ({ getValue, column }) => getCellFormatter(column.id, getValue<number>()),
        footer: () => aggregations ? formatNumber(aggregations.grandTotalVoted) : null,
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
        cell: ({ getValue, column }) => getCellFormatter(column.id, getValue<number>()),
        footer: () => aggregations ? formatPercent(aggregations.averageOverallTurnoutRate) : null,
      }
    );

    // Breakdown columns (dynamically generated)
    if (firstRow.breakdowns) {
      const breakdownKeys = Object.keys(firstRow.breakdowns);
      if (breakdownKeys.length > 0) {
        // New logic to handle single and Cartesian product keys
        breakdownKeys.forEach(key => {
          // Example key for single: "Race:White"
          // Example key for Cartesian: "AgeRange:18-23_Race:White"
          
          const parts = key.split('_'); // ["AgeRange:18-23", "Race:White"] or ["Race:White"]
          
          const categoryDisplayParts: string[] = [];
          parts.forEach(part => {
            const [dimension, categoryValue] = part.split(':');
            // Use a mapping for more readable category values if necessary, similar to existing displayCategory
            // For now, directly use categoryValue, or enhance this mapping as needed.
            let displayValue = categoryValue;
            if (dimension === 'Race') {
              displayValue = categoryValue === 'WH' ? 'White' : 
                             categoryValue === 'BH' ? 'Black' : 
                             categoryValue === 'AP' ? 'Asian/Pacific' :
                             categoryValue === 'HP' ? 'Hispanic' :
                             categoryValue === 'OT' ? 'Other' :
                             categoryValue === 'U' ? 'Unknown' : categoryValue;
            } else if (dimension === 'Gender') {
              displayValue = categoryValue === 'M' ? 'Male' :
                             categoryValue === 'F' ? 'Female' :
                             categoryValue === 'O' ? 'Other' : categoryValue; // Assuming 'O' for Other if used
            }
            // Add other dimension mappings if needed (e.g., AgeRange is usually fine as is)
            categoryDisplayParts.push(displayValue);
          });
          
          const headerPrefix = categoryDisplayParts.join(' & '); // e.g., "18-23 & White" or "White"

          dynamicColumns.push({
            id: `${key}-registered`,
            header: ({ column }) => (
              <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="p-0 hover:bg-transparent whitespace-nowrap"
              >
                {`${headerPrefix} - Reg.`}
                <span className="ml-2">
                  {column.getIsSorted() === "asc" ? <ArrowUp className="h-4 w-4" /> : 
                  column.getIsSorted() === "desc" ? <ArrowDown className="h-4 w-4" /> : 
                  <ArrowUpDown className="h-4 w-4" />}
                </span>
              </Button>
            ),
            accessorFn: (row) => row.breakdowns[key]?.registered,
            cell: ({ getValue }) => getCellFormatter(`${key}-registered`, getValue<number>()),
            footer: () => aggregations ? formatNumber(aggregations[`${key}_totalRegistered`]) : null,
          });
          
          dynamicColumns.push({
            id: `${key}-voted`,
            header: ({ column }) => (
              <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="p-0 hover:bg-transparent whitespace-nowrap"
              >
                {`${headerPrefix} - Voted`}
                <span className="ml-2">
                  {column.getIsSorted() === "asc" ? <ArrowUp className="h-4 w-4" /> : 
                  column.getIsSorted() === "desc" ? <ArrowDown className="h-4 w-4" /> : 
                  <ArrowUpDown className="h-4 w-4" />}
                </span>
              </Button>
            ),
            accessorFn: (row) => row.breakdowns[key]?.voted,
            cell: ({ getValue }) => getCellFormatter(`${key}-voted`, getValue<number>()),
            footer: () => aggregations ? formatNumber(aggregations[`${key}_totalVoted`]) : null,
          });
          
          dynamicColumns.push({
            id: `${key}-turnout`,
            header: ({ column }) => (
              <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="p-0 hover:bg-transparent whitespace-nowrap"
              >
                {`${headerPrefix} - Turnout`}
                <span className="ml-2">
                  {column.getIsSorted() === "asc" ? <ArrowUp className="h-4 w-4" /> : 
                  column.getIsSorted() === "desc" ? <ArrowDown className="h-4 w-4" /> : 
                  <ArrowUpDown className="h-4 w-4" />}
                </span>
              </Button>
            ),
            accessorFn: (row) => row.breakdowns[key]?.turnout,
            cell: ({ getValue }) => getCellFormatter(`${key}-turnout`, getValue<number>()),
            footer: () => aggregations ? formatPercent(aggregations[`${key}_averageTurnoutRate`]) : null,
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

            const lowerCensusKey = censusKey.toLowerCase();
            const isNonAggregable = lowerCensusKey === 'distincttractidsingeography' || lowerCensusKey === 'censusdatasourcetyear';

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
                    
                    // Use the global formatter instead of duplicating logic
                    return getCellFormatter(`censusData.${censusKey}`, val);
                },
                footer: () => {
                  const lowerCensusKey = censusKey.toLowerCase(); // e.g., "totaleducationpop25plus", "avgmedianhouseholdincome"
                  if (aggregations) {
                      if (lowerCensusKey === 'distincttractidsingeography') return ''; // No footer for this
                      
                      if (lowerCensusKey === 'censusdatasourcetyear') {
                          // Backend currently doesn't provide a specific aggregation for censusDataSourceYear in censusSums.
                          // If it did, e.g. as aggregations[`summary_censusDataSourceYear`], we could display it.
                          // For now, it will be N/A as neither grandTotal_ nor avg_ will typically exist for it.
                          const yearAgg = aggregations[`avg_${censusKey}`] || aggregations[`summary_${censusKey}`]; 
                          return yearAgg ? getCellFormatter(`summary_${censusKey}`, yearAgg) : 'N/A';
                      }

                      let aggValueToFormat: any = 'N/A';
                      let aggKeyForFormatter: string = censusKey; // Original key for context to formatter

                      // Prefer grandTotal for keys that represent totals
                      const hasGrandTotalKey = `grandTotal_${censusKey}`;
                      if ((lowerCensusKey.startsWith('total') || lowerCensusKey.includes('population') || lowerCensusKey.endsWith('plus')) && aggregations[hasGrandTotalKey] !== undefined) {
                          aggValueToFormat = aggregations[hasGrandTotalKey];
                          aggKeyForFormatter = hasGrandTotalKey; 
                      } 
                      // Otherwise, use the avg_ version if it exists
                      else if (aggregations[`avg_${censusKey}`] !== undefined) {
                          aggValueToFormat = aggregations[`avg_${censusKey}`];
                          aggKeyForFormatter = `avg_${censusKey}`;
                      } 
                      // If neither, it remains 'N/A' with original censusKey for formatting context (though unlikely to format well)
                      
                      return getCellFormatter(aggKeyForFormatter, aggValueToFormat);
                  }
                  return null;
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
            <TableFooter>
              {table.getFooterGroups().map(footerGroup => (
                <TableRow key={footerGroup.id}>
                  {footerGroup.headers.map(header => (
                    <TableHead key={header.id} className="whitespace-nowrap font-semibold">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.footer,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableFooter>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}; 