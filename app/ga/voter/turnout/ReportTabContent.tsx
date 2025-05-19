'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-theme-quartz.css'; // Theme
import { ApiReportRow, ApiReportData } from './page';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

interface ReportTabContentProps {
  reportData: ApiReportData | null;
  isLoading: boolean;
  error: string | null;
}

// Helper to format percentages
const formatPercent = (value: number | null | undefined) => {
  if (value === null || typeof value === 'undefined') return 'N/A';
  // Ensure value is treated as a number and is in decimal form (0-1 range)
  const numValue = Number(value);
  return isNaN(numValue) ? 'N/A' : numValue.toLocaleString(undefined, { 
    style: 'percent', 
    minimumFractionDigits: 1, 
    maximumFractionDigits: 1 
  });
};

// Helper to format numbers
const formatNumber = (value: number | null | undefined) => {
  if (value === null || typeof value === 'undefined') return 'N/A';
  const numValue = Number(value);
  return isNaN(numValue) ? 'N/A' : numValue.toLocaleString();
};

// Helper to format currency
const formatCurrency = (value: number | null | undefined) => {
  if (value === null || typeof value === 'undefined') return 'N/A';
  const numValue = Number(value);
  return isNaN(numValue) ? 'N/A' : numValue.toLocaleString('en-US', { 
    style: 'currency', 
    currency: 'USD', 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  });
};


export const ReportTabContent: React.FC<ReportTabContentProps> = ({ reportData, isLoading, error }) => {

  const columnDefs = useMemo<ColDef<ApiReportRow>[]>(() => {
    if (!reportData || reportData.rows.length === 0) {
      // Return a default column def if no data, or AG Grid might complain
      return [{ headerName: 'Status', valueGetter: () => 'No data to display or generate an analysis.' }];
    }

    const firstRow = reportData.rows[0];
    const dynamicColDefs: ColDef<ApiReportRow>[] = [];

    // Base columns
    dynamicColDefs.push(
      { 
        headerName: 'Geo Unit', 
        valueGetter: (params) => params.data?.geoLabel,
        sortable: true, 
        filter: true, 
        flex: 2 
      },
      { 
        headerName: 'Total Registered', 
        valueGetter: (params) => params.data?.totalRegistered,
        sortable: true, 
        filter: 'agNumberColumnFilter', 
        valueFormatter: params => {
          if (params.value === null || params.value === undefined) return 'N/A';
          return formatNumber(params.value);
        }, 
        type: 'numericColumn', 
        flex: 1 
      },
      { 
        headerName: 'Total Voted', 
        valueGetter: (params) => params.data?.totalVoted,
        sortable: true, 
        filter: 'agNumberColumnFilter', 
        valueFormatter: params => {
          if (params.value === null || params.value === undefined) return 'N/A';
          return formatNumber(params.value);
        }, 
        type: 'numericColumn', 
        flex: 1 
      },
      { 
        headerName: 'Overall Turnout', 
        valueGetter: (params) => params.data?.overallTurnoutRate,
        sortable: true, 
        filter: 'agNumberColumnFilter', 
        valueFormatter: params => {
          if (params.value === null || params.value === undefined) return 'N/A';
          return formatPercent(params.value);
        }, 
        type: 'numericColumn', 
        flex: 1 
      }
    );

    // Dynamically add breakdown columns
    if (firstRow.breakdowns) {
      const breakdownKeys = Object.keys(firstRow.breakdowns);
      breakdownKeys.forEach(key => {
        const parts = key.split('_');
        const categoryDisplayParts: string[] = [];
        parts.forEach(part => {
          const [dimension, categoryValue] = part.split(':');
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
                           categoryValue === 'O' ? 'Other' : categoryValue;
          }
          categoryDisplayParts.push(displayValue);
        });
        const headerPrefix = categoryDisplayParts.join(' & ');

        // Use valueGetter instead of field for complex paths with special characters
        dynamicColDefs.push({ 
          headerName: `${headerPrefix} - Reg.`, 
          valueGetter: (params) => {
            // For regular rows, access the nested property
            if (params.data?.breakdowns?.[key]) {
              return params.data.breakdowns[key].registered;
            }
            // For pinned rows, access the flattened property
            return params.data?.[`breakdowns.${key}.registered` as keyof typeof params.data];
          },
          sortable: true, 
          filter: 'agNumberColumnFilter', 
          valueFormatter: params => {
            if (params.value === null || params.value === undefined) return 'N/A';
            return formatNumber(params.value);
          }, 
          type: 'numericColumn', 
          flex: 1 
        });
        
        dynamicColDefs.push({ 
          headerName: `${headerPrefix} - Voted`, 
          valueGetter: (params) => {
            if (params.data?.breakdowns?.[key]) {
              return params.data.breakdowns[key].voted;
            }
            return params.data?.[`breakdowns.${key}.voted` as keyof typeof params.data];
          },
          sortable: true, 
          filter: 'agNumberColumnFilter', 
          valueFormatter: params => {
            if (params.value === null || params.value === undefined) return 'N/A';
            return formatNumber(params.value);
          }, 
          type: 'numericColumn', 
          flex: 1 
        });
        
        dynamicColDefs.push({ 
          headerName: `${headerPrefix} - Turnout`, 
          valueGetter: (params) => {
            if (params.data?.breakdowns?.[key]) {
              return params.data.breakdowns[key].turnout;
            }
            return params.data?.[`breakdowns.${key}.turnout` as keyof typeof params.data];
          },
          sortable: true, 
          filter: 'agNumberColumnFilter', 
          valueFormatter: params => {
            if (params.value === null || params.value === undefined) return 'N/A';
            return formatPercent(params.value);
          }, 
          type: 'numericColumn', 
          flex: 1 
        });
      });
    }

    // Dynamically add census data columns
    if (firstRow.censusData) {
      Object.keys(firstRow.censusData).forEach(censusKey => {
        const header = censusKey.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
        const fieldName = censusKey.toLowerCase();
        
        let colDef: ColDef<ApiReportRow> = {
          headerName: `Census: ${header}`,
          valueGetter: (params) => {
            // For regular rows, access the nested property
            if (params.data?.censusData) {
              return params.data.censusData[censusKey];
            }
            // For pinned rows, access the flattened property
            return params.data?.[`censusData.${censusKey}` as keyof typeof params.data];
          },
          sortable: true,
          filter: 'agNumberColumnFilter',
          type: 'numericColumn',
          flex: 1
        };

        if (fieldName.includes('income') || fieldName.includes('salary')) {
          // For currency values
          colDef.valueFormatter = params => {
            if (params.value === null || params.value === undefined) return 'N/A';
            // Ensure proper currency formatting for numbers that might be strings in the aggregated row
            return formatCurrency(params.value);
          };
        } else if (fieldName.includes('pct') || fieldName.includes('rate') || fieldName.includes('percentage')) {
          // For percentage values
          colDef.valueFormatter = params => {
            if (params.value === null || params.value === undefined) return 'N/A';
            // Ensure proper percentage formatting for decimal values
            return formatPercent(params.value);
          };
        } else if (typeof firstRow.censusData?.[censusKey] === 'number') {
          // For other numeric values
          colDef.valueFormatter = params => {
            if (params.value === null || params.value === undefined) return 'N/A';
            return formatNumber(params.value);
          };
        } else {
          // For string values
          colDef.filter = true;
          colDef.type = undefined;
        }
        dynamicColDefs.push(colDef);
      });
    }
    return dynamicColDefs;
  }, [reportData]);

  const rowData = useMemo(() => {
    return reportData?.rows || [];
  }, [reportData]);

  const pinnedBottomRowData = useMemo(() => {
    if (!reportData || !reportData.aggregations) {
      return [];
    }

    // Log the full aggregations object to inspect the actual keys
    console.log('Aggregations object:', reportData.aggregations);

    const aggregations = reportData.aggregations;
    const totalRow: any = {
      geoLabel: 'Grand Total', // Label for the first column
      totalRegistered: aggregations.grandTotalRegistered ?? null,
      totalVoted: aggregations.grandTotalVoted ?? null,
      overallTurnoutRate: aggregations.averageOverallTurnoutRate ?? null,
    };

    console.log('Base totalRow:', totalRow);

    // Map breakdown aggregations
    if (reportData.rows.length > 0 && reportData.rows[0].breakdowns) {
      const breakdownKeys = Object.keys(reportData.rows[0].breakdowns);
      console.log('Breakdown keys:', breakdownKeys);
      
      breakdownKeys.forEach(key => {
        // The key structure might be different in the aggregations object
        // Log both the key and the potential aggregation keys to check
        console.log(`Processing breakdown key: ${key}`);
        
        // Try different potential key formats
        const potential1 = `${key}_totalRegistered`;
        const potential2 = `${key.replace(':', '_')}_totalRegistered`;
        
        console.log('Potential keys:', {
          potential1,
          potential2,
          valueForPotential1: aggregations[potential1],
          valueForPotential2: aggregations[potential2]
        });
        
        // Use the field names exactly as they would be accessed in the grid
        totalRow[`breakdowns.${key}.registered`] = aggregations[`${key}_totalRegistered`] ?? 
                                                   aggregations[`${key.replace(':', '_')}_totalRegistered`] ?? 
                                                   null;
        
        totalRow[`breakdowns.${key}.voted`] = aggregations[`${key}_totalVoted`] ?? 
                                              aggregations[`${key.replace(':', '_')}_totalVoted`] ?? 
                                              null;
        
        totalRow[`breakdowns.${key}.turnout`] = aggregations[`${key}_averageTurnoutRate`] ?? 
                                               aggregations[`${key.replace(':', '_')}_averageTurnoutRate`] ?? 
                                               null;
      });
      
      console.log('Final totalRow after breakdowns:', totalRow);
    }

    // Map census aggregations
    if (reportData.rows.length > 0 && reportData.rows[0].censusData) {
      Object.keys(reportData.rows[0].censusData).forEach(censusKey => {
        if (censusKey === 'census_tract' || censusKey === 'census_year') {
          totalRow[`censusData.${censusKey}`] = null; // Explicitly null for N/A
        } else {
          // Prioritize grandTotal for counts, then avg, then direct key, then null
          const value = reportData.aggregations?.[`grandTotal_${censusKey}`] ??
                        reportData.aggregations?.[`avg_${censusKey}`] ??
                        reportData.aggregations?.[censusKey] ??
                        null;
          totalRow[`censusData.${censusKey}`] = value;
        }
      });
    }
    
    return [totalRow];
  }, [reportData]);

  // Default ColDef, applies to all columns unless overridden
  const defaultColDef = useMemo<ColDef>(() => {
    return {
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1, // Distribute space equally by default
      minWidth: 100, // Minimum width for columns
    };
  }, []);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading report data...</p>
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

  // Note: AG Grid handles "No data" overlay by default if rowData is empty.
  // We will keep the explicit "No report data to display" for when reportData is null.
  if (!reportData) {
     return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No report data to display. Please generate an analysis.</p>
      </div>
    );
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
        <div>
          <CardTitle>Voter Turnout Report</CardTitle>
          <CardDescription>Detailed breakdown of voter turnout based on your selections.</CardDescription>
        </div>
        <Button variant="outline" size="sm" disabled={isLoading || !reportData || reportData.rows.length === 0}>
          Download Report (CSV/Excel) {/* TODO: Implement AG Grid export */}
        </Button>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        {/* Ensure this div has a defined height for AG Grid. 
            It should get its height from the flex layout defined in page.tsx 
            where the parent of ReportTabContent is set to scroll.
            The ag-theme-quartz class provides styling.
        */}
        <div className="ag-theme-quartz h-full w-full">
          <AgGridReact<ApiReportRow>
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            domLayout='normal'
            pinnedBottomRowData={pinnedBottomRowData}
            suppressAggFuncInHeader={true}
          />
        </div>
      </CardContent>
    </Card>
  );
}; 