'use client';

import React, { useMemo, useRef, useCallback, useImperativeHandle, forwardRef, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-theme-quartz.css'; // Theme
import { ApiReportRow } from './page';

// Add custom CSS for AG Grid styling
import './ag-grid-custom.css';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Interface for exposed imperative actions
export interface ReportActions {
  exportCsv: () => void;
}

interface ReportTabContentProps {
  rows: ApiReportRow[] | null;
  isLoading: boolean;
  error: string | null;
  isActive?: boolean; // Add prop to detect when tab is active
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

export const ReportTabContent = forwardRef<ReportActions, ReportTabContentProps>(({ rows, isLoading, error, isActive = false }, ref) => {
  const gridRef = useRef<AgGridReact>(null);
  const [gridApi, setGridApi] = useState<any>(null);
  const [rowHeight] = useState(100); // Fixed row height for all rows

  // Function to apply the default sort
  const applyDefaultSort = useCallback((api: any) => {
    if (api) {
      api.applyColumnState({
        state: [
          { colId: 'overallTurnoutRate', sort: 'asc', sortIndex: 0 }
        ],
        defaultState: { sort: null }
      });
    }
  }, []);

  // Handle tab visibility changes - optimize to prevent excessive renders
  useEffect(() => {
    if (isActive && gridApi) {
      // Only resize when tab becomes active
      const resizeGrid = () => {
        // Reset column state
        gridApi.resetColumnState();
        
        // Apply the default sort
        applyDefaultSort(gridApi);

        // Size columns to fit once
        gridApi.sizeColumnsToFit();
      };
      
      // Single timer to prevent multiple operations
      const timerId = setTimeout(resizeGrid, 50);
      return () => clearTimeout(timerId);
    }
  }, [isActive, gridApi, applyDefaultSort]);

  // Calculate aggregations for the report - replacing backend aggregations that were removed
  const reportAggregations = useMemo(() => {
    if (!rows || rows.length === 0) return null;
    
    let grandTotalRegistered = 0;
    let grandTotalVoted = 0;
    
    // Calculate basic aggregations
    rows.forEach(row => {
      grandTotalRegistered += row.totalRegistered;
      grandTotalVoted += row.totalVoted;
    });
    
    const averageOverallTurnoutRate = grandTotalRegistered > 0 ? grandTotalVoted / grandTotalRegistered : 0;
    
    // Calculate breakdown aggregations
    const breakdownSums: Record<string, { totalRegistered: number; totalVoted: number }> = {};
    
    rows.forEach(row => {
      Object.entries(row.breakdowns).forEach(([key, data]) => {
        if (!breakdownSums[key]) {
          breakdownSums[key] = { totalRegistered: 0, totalVoted: 0 };
        }
        breakdownSums[key].totalRegistered += data.registered;
        breakdownSums[key].totalVoted += data.voted;
      });
    });
    
    const breakdownRates: Record<string, number> = {};
    Object.entries(breakdownSums).forEach(([key, data]) => {
      breakdownRates[key] = data.totalRegistered > 0 ? data.totalVoted / data.totalRegistered : 0;
    });
    
    return {
      grandTotalRegistered,
      grandTotalVoted,
      averageOverallTurnoutRate,
      breakdownSums,
      breakdownRates
    };
  }, [rows]);

  const columnDefs = useMemo<ColDef<ApiReportRow>[]>(() => {
    if (!rows || rows.length === 0) {
      // Return a default column def if no data, or AG Grid might complain
      return [{ headerName: 'Status', valueGetter: () => 'No data to display or generate an analysis.' }];
    }

    // Find the first row that has censusData with keys, if any
    const firstRowWithActualCensusData = rows.find(row => row.censusData && Object.keys(row.censusData).length > 0);

    const firstRow = rows[0];
    const dynamicColDefs: ColDef<ApiReportRow>[] = [];

    // Base columns
    dynamicColDefs.push(
      { 
        headerName: 'Geo Unit', 
        field: 'geoLabel', // Use field instead of valueGetter for better performance
        sortable: true, 
        filter: true,
        flex: 2,
        minWidth: 200,
        wrapText: true,
        cellStyle: { 
          'white-space': 'pre-line',
          'line-height': '1.5',
          'padding': '12px 8px'
        },
        cellClass: 'geo-unit-cell'
      },
      { 
        headerName: 'Total Registered', 
        valueGetter: (params) => params.data?.totalRegistered,
        sortable: true, 
        filter: false,
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
        filter: false,
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
        filter: false,
        valueFormatter: params => {
          if (params.value === null || params.value === undefined) return 'N/A';
          return formatPercent(params.value);
        }, 
        type: 'numericColumn', 
        flex: 1,
        colId: 'overallTurnoutRate'
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

        dynamicColDefs.push({ 
          headerName: `${headerPrefix} - Registered`, 
          valueGetter: (params) => {
            if (params.data?.breakdowns?.[key]) {
              return params.data.breakdowns[key].registered;
            }
            return params.data?.[`breakdowns.${key}.registered` as keyof typeof params.data];
          },
          sortable: true, 
          filter: false,
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
          filter: false,
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
          filter: false,
          valueFormatter: params => {
            if (params.value === null || params.value === undefined) return 'N/A';
            return formatPercent(params.value);
          }, 
          type: 'numericColumn', 
          flex: 1 
        });

        // Add census race data columns immediately after race breakdown columns if Race dimension is detected
        if (firstRowWithActualCensusData?.censusData && key.includes('Race:')) {
          const raceCategory = key.split('Race:')[1].split('_')[0]; // Extract race category
          
          // Add corresponding census race population and percentage columns for both total and 18+ population
          if (raceCategory === 'White') {
            if (firstRowWithActualCensusData.censusData.totalCvapWhiteAlone !== undefined) {
              dynamicColDefs.push({
                headerName: `CVAP: White Citizens 18+`,
                valueGetter: (params) => params.data?.censusData?.totalCvapWhiteAlone || (params.data as any)?.['censusData.totalCvapWhiteAlone'],
                sortable: true,
                filter: false,
                valueFormatter: params => params.value === null || params.value === undefined ? 'N/A' : formatNumber(params.value),
                type: 'numericColumn',
                flex: 1
              });
              dynamicColDefs.push({
                headerName: `CVAP: % White Citizens`,
                valueGetter: (params) => params.data?.censusData?.pctCvapWhiteAlone || (params.data as any)?.['censusData.pctCvapWhiteAlone'],
                sortable: true,
                filter: false,
                valueFormatter: params => params.value === null || params.value === undefined ? 'N/A' : formatPercent(params.value),
                type: 'numericColumn',
                flex: 1
              });
            }
          } else if (raceCategory === 'Black') {
            if (firstRowWithActualCensusData.censusData.totalPopBlackAlone !== undefined) {
              dynamicColDefs.push({
                headerName: `Census: Black Population`,
                valueGetter: (params) => params.data?.censusData?.totalPopBlackAlone || (params.data as any)?.['censusData.totalPopBlackAlone'],
                sortable: true,
                filter: false,
                valueFormatter: params => params.value === null || params.value === undefined ? 'N/A' : formatNumber(params.value),
                type: 'numericColumn',
                flex: 1
              });
              dynamicColDefs.push({
                headerName: `Census: % Black`,
                valueGetter: (params) => params.data?.censusData?.pctPopBlackAlone || (params.data as any)?.['censusData.pctPopBlackAlone'],
                sortable: true,
                filter: false,
                valueFormatter: params => params.value === null || params.value === undefined ? 'N/A' : formatPercent(params.value),
                type: 'numericColumn',
                flex: 1
              });
            }
            if (firstRowWithActualCensusData.censusData.totalCvapBlackAlone !== undefined) {
              dynamicColDefs.push({
                headerName: `CVAP: Black Citizens 18+`,
                valueGetter: (params) => params.data?.censusData?.totalCvapBlackAlone || (params.data as any)?.['censusData.totalCvapBlackAlone'],
                sortable: true,
                filter: false,
                valueFormatter: params => params.value === null || params.value === undefined ? 'N/A' : formatNumber(params.value),
                type: 'numericColumn',
                flex: 1
              });
              dynamicColDefs.push({
                headerName: `CVAP: % Black Citizens`,
                valueGetter: (params) => params.data?.censusData?.pctCvapBlackAlone || (params.data as any)?.['censusData.pctCvapBlackAlone'],
                sortable: true,
                filter: false,
                valueFormatter: params => params.value === null || params.value === undefined ? 'N/A' : formatPercent(params.value),
                type: 'numericColumn',
                flex: 1
              });
            }
          } else if (raceCategory === 'Asian') {
            if (firstRowWithActualCensusData.censusData.totalPopAsianAlone !== undefined) {
              dynamicColDefs.push({
                headerName: `Census: Asian Population`,
                valueGetter: (params) => params.data?.censusData?.totalPopAsianAlone || (params.data as any)?.['censusData.totalPopAsianAlone'],
                sortable: true,
                filter: false,
                valueFormatter: params => params.value === null || params.value === undefined ? 'N/A' : formatNumber(params.value),
                type: 'numericColumn',
                flex: 1
              });
              dynamicColDefs.push({
                headerName: `Census: % Asian`,
                valueGetter: (params) => params.data?.censusData?.pctPopAsianAlone || (params.data as any)?.['censusData.pctPopAsianAlone'],
                sortable: true,
                filter: false,
                valueFormatter: params => params.value === null || params.value === undefined ? 'N/A' : formatPercent(params.value),
                type: 'numericColumn',
                flex: 1
              });
            }
            if (firstRowWithActualCensusData.censusData.totalCvapAsianAlone !== undefined) {
              dynamicColDefs.push({
                headerName: `CVAP: Asian Citizens 18+`,
                valueGetter: (params) => params.data?.censusData?.totalCvapAsianAlone || (params.data as any)?.['censusData.totalCvapAsianAlone'],
                sortable: true,
                filter: false,
                valueFormatter: params => params.value === null || params.value === undefined ? 'N/A' : formatNumber(params.value),
                type: 'numericColumn',
                flex: 1
              });
              dynamicColDefs.push({
                headerName: `CVAP: % Asian Citizens`,
                valueGetter: (params) => params.data?.censusData?.pctCvapAsianAlone || (params.data as any)?.['censusData.pctCvapAsianAlone'],
                sortable: true,
                filter: false,
                valueFormatter: params => params.value === null || params.value === undefined ? 'N/A' : formatPercent(params.value),
                type: 'numericColumn',
                flex: 1
              });
            }
          } else if (raceCategory === 'Hispanic' && firstRowWithActualCensusData.censusData.totalCvapHispanicOrLatino !== undefined) {
            dynamicColDefs.push({
              headerName: `CVAP: Hispanic Citizens 18+`,
              valueGetter: (params) => params.data?.censusData?.totalCvapHispanicOrLatino || (params.data as any)?.['censusData.totalCvapHispanicOrLatino'],
              sortable: true,
              filter: false,
              valueFormatter: params => params.value === null || params.value === undefined ? 'N/A' : formatNumber(params.value),
              type: 'numericColumn',
              flex: 1
            });
            dynamicColDefs.push({
              headerName: `CVAP: % Hispanic Citizens`,
              valueGetter: (params) => params.data?.censusData?.pctCvapHispanicOrLatino || (params.data as any)?.['censusData.pctCvapHispanicOrLatino'],
              sortable: true,
              filter: false,
              valueFormatter: params => params.value === null || params.value === undefined ? 'N/A' : formatPercent(params.value),
              type: 'numericColumn',
              flex: 1
            });
          } else if (raceCategory === 'Other') {
            if (firstRowWithActualCensusData.censusData.totalPopOtherRaceAlone !== undefined) {
              dynamicColDefs.push({
                headerName: `Census: Other Race Population`,
                valueGetter: (params) => {
                  // Sum American Indian, Pacific Islander, and Other Race alone categories
                  const americanIndian = params.data?.censusData?.totalPopAmericanIndianAlone || (params.data as any)?.['censusData.totalPopAmericanIndianAlone'] || 0;
                  const pacificIslander = params.data?.censusData?.totalPopPacificIslanderAlone || (params.data as any)?.['censusData.totalPopPacificIslanderAlone'] || 0;
                  const otherRace = params.data?.censusData?.totalPopOtherRaceAlone || (params.data as any)?.['censusData.totalPopOtherRaceAlone'] || 0;
                  const total = americanIndian + pacificIslander + otherRace;
                  return total > 0 ? total : null;
                },
                sortable: true,
                filter: false,
                valueFormatter: params => params.value === null || params.value === undefined ? 'N/A' : formatNumber(params.value),
                type: 'numericColumn',
                flex: 1
              });
              dynamicColDefs.push({
                headerName: `Census: % Other Race`,
                valueGetter: (params) => params.data?.censusData?.pctPopOtherRaceAlone || (params.data as any)?.['censusData.pctPopOtherRaceAlone'],
                sortable: true,
                filter: false,
                valueFormatter: params => params.value === null || params.value === undefined ? 'N/A' : formatPercent(params.value),
                type: 'numericColumn',
                flex: 1
              });
            }
            if (firstRowWithActualCensusData.censusData.totalCvapOtherRacesCombined !== undefined) {
              dynamicColDefs.push({
                headerName: `CVAP: Other Race Citizens 18+`,
                valueGetter: (params) => {
                  // Sum CVAP American Indian, Pacific Islander, Other Race, and Two or More Races
                  const americanIndian = params.data?.censusData?.totalCvapAmericanIndianAlone || (params.data as any)?.['censusData.totalCvapAmericanIndianAlone'] || 0;
                  const pacificIslander = params.data?.censusData?.totalCvapPacificIslanderAlone || (params.data as any)?.['censusData.totalCvapPacificIslanderAlone'] || 0;
                  const otherRace = params.data?.censusData?.totalCvapOtherRaceAlone || (params.data as any)?.['censusData.totalCvapOtherRaceAlone'] || 0;
                  const twoOrMore = params.data?.censusData?.totalCvapTwoOrMoreRaces || (params.data as any)?.['censusData.totalCvapTwoOrMoreRaces'] || 0;
                  const total = americanIndian + pacificIslander + otherRace + twoOrMore;
                  return total > 0 ? total : null;
                },
                sortable: true,
                filter: false,
                valueFormatter: params => params.value === null || params.value === undefined ? 'N/A' : formatNumber(params.value),
                type: 'numericColumn',
                flex: 1
              });
              dynamicColDefs.push({
                headerName: `CVAP: % Other Race Citizens`,
                valueGetter: (params) => params.data?.censusData?.pctCvapOtherRacesCombined || (params.data as any)?.['censusData.pctCvapOtherRacesCombined'],
                sortable: true,
                filter: false,
                valueFormatter: params => params.value === null || params.value === undefined ? 'N/A' : formatPercent(params.value),
                type: 'numericColumn',
                flex: 1
              });
            }
          }
        }
      });
    }

    // Dynamically add other census data columns (excluding the race data we already added)
    if (firstRowWithActualCensusData && firstRowWithActualCensusData.censusData) {
      // Track which race columns we've already added to avoid duplication
      const raceColumnsAdded = new Set<string>();
      if (firstRow.breakdowns) {
        Object.keys(firstRow.breakdowns).forEach(key => {
          if (key.includes('Race:')) {
            const raceCategory = key.split('Race:')[1].split('_')[0];
            if (raceCategory === 'White') {
              raceColumnsAdded.add('totalPopWhiteAlone');
              raceColumnsAdded.add('pctPopWhiteAlone');
            } else if (raceCategory === 'Black') {
              raceColumnsAdded.add('totalPopBlackAlone');
              raceColumnsAdded.add('pctPopBlackAlone');
            } else if (raceCategory === 'Asian') {
              raceColumnsAdded.add('totalPopAsianAlone');
              raceColumnsAdded.add('pctPopAsianAlone');
            } else if (raceCategory === 'Hispanic') {
              raceColumnsAdded.add('totalPopHispanic');
              raceColumnsAdded.add('pctPopHispanic');
            } else if (raceCategory === 'Other') {
              raceColumnsAdded.add('totalPopOtherRaceAlone');
              raceColumnsAdded.add('pctPopOtherRaceAlone');
            }
          }
        });
      }

      Object.keys(firstRowWithActualCensusData.censusData).forEach(censusKey => {
        // Skip race-specific columns if they were already added near race breakdowns
        if (raceColumnsAdded.has(censusKey)) {
          return;
        }

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
          filter: false,
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
        } else if (typeof firstRowWithActualCensusData.censusData?.[censusKey] === 'number') {
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

        // Position total population towards the end by adding it last among numeric columns
        if (censusKey === 'totalPopulation') {
          // We'll add this after all other columns
        } else {
          dynamicColDefs.push(colDef);
        }
      });

      // Add total population columns at the end if they exist
      if (firstRowWithActualCensusData.censusData.totalPopulation !== undefined) {
        dynamicColDefs.push({
          headerName: `Census: Total Population`,
          valueGetter: (params) => {
            if (params.data?.censusData) {
              return params.data.censusData.totalPopulation;
            }
            return (params.data as any)?.['censusData.totalPopulation'];
          },
          sortable: true,
          filter: false,
          valueFormatter: params => {
            if (params.value === null || params.value === undefined) return 'N/A';
            return formatNumber(params.value);
          },
          type: 'numericColumn',
          flex: 1
        });
      }
      
      if (firstRowWithActualCensusData.censusData.totalCvap !== undefined) {
        dynamicColDefs.push({
          headerName: `CVAP: Total Citizens 18+`,
          valueGetter: (params) => {
            if (params.data?.censusData) {
              return params.data.censusData.totalCvap;
            }
            return (params.data as any)?.['censusData.totalCvap'];
          },
          sortable: true,
          filter: false,
          valueFormatter: params => {
            if (params.value === null || params.value === undefined) return 'N/A';
            return formatNumber(params.value);
          },
          type: 'numericColumn',
          flex: 1
        });
      }
    }
    return dynamicColDefs;
  }, [rows]);

  const rowData = useMemo(() => {
    return rows || [];
  }, [rows]);

  const pinnedBottomRowData = useMemo(() => {
    if (!reportAggregations || !rows || rows.length === 0) {
      return [];
    }

    const {
      grandTotalRegistered,
      grandTotalVoted,
      averageOverallTurnoutRate,
      breakdownSums,
      breakdownRates
    } = reportAggregations;

    const totalRow: any = {
      geoLabel: 'Grand Total', // Label for the first column
      totalRegistered: grandTotalRegistered ?? null,
      totalVoted: grandTotalVoted ?? null,
      overallTurnoutRate: averageOverallTurnoutRate ?? null,
    };

    // Populate aggregated breakdown data
    if (breakdownSums) {
      for (const key in breakdownSums) {
        totalRow[`breakdowns.${key}.registered`] = breakdownSums[key].totalRegistered;
        totalRow[`breakdowns.${key}.voted`] = breakdownSums[key].totalVoted;
      }
    }
    if (breakdownRates) {
      for (const key in breakdownRates) {
        totalRow[`breakdowns.${key}.turnout`] = breakdownRates[key];
      }
    }

    // Populate aggregated census data
    const firstRowWithCensusForAgg = rows.find(row => row.censusData && Object.keys(row.censusData).length > 0);
    if (firstRowWithCensusForAgg && firstRowWithCensusForAgg.censusData) {
      const censusKeys = Object.keys(firstRowWithCensusForAgg.censusData);
      censusKeys.forEach(censusKey => {
        if (censusKey === 'distinctTractIdsInGeography' || censusKey === 'censusDataSourceYear' || censusKey === 'decennialDataSourceYear') {
          totalRow[`censusData.${censusKey}`] = null; // Explicitly set to null for non-aggregatable fields
        } else {
          let sum = 0;
          let numericCount = 0;

          for (const row of rows) {
            const rawValue = row.censusData?.[censusKey];
            const parsedValue = parseFloat(String(rawValue)); // Attempt to parse to float

            if (!isNaN(parsedValue)) { // Check if parsing resulted in a valid number
              sum += parsedValue;
              numericCount++;
            }
          }

          if (numericCount > 0) {
            const lowerCensusKey = censusKey.toLowerCase();
            if (lowerCensusKey.includes('pct') || lowerCensusKey.includes('rate') || lowerCensusKey.includes('percentage')) {
              totalRow[`censusData.${censusKey}`] = sum / numericCount; // Average for percentages/rates
            } else {
              totalRow[`censusData.${censusKey}`] = sum; // Sum for other numeric data (population counts, income, etc.)
            }
          } else {
            // No numeric values found for this key across all rows (all were null, undefined, or non-numeric strings).
            totalRow[`censusData.${censusKey}`] = null; // Formatter will show 'N/A'
          }
        }
      });
    }

    return [totalRow];
  }, [reportAggregations, rows]);

  // Default ColDef, applies to all columns unless overridden
  const defaultColDef = useMemo<ColDef>(() => {
    return {
      sortable: true,
      filter: false,
      resizable: true,
      flex: 1, // Distribute space equally by default
      minWidth: 100, // Minimum width for columns
    };
  }, []);

  const handleExportCSV = useCallback(() => {
    if (gridRef.current && gridRef.current.api) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const fileName = `voter_turnout_report_${timestamp}.csv`;
      
      gridRef.current.api.exportDataAsCsv({
        fileName,
        processCellCallback: (params) => {
          if (params.value === null || params.value === undefined) {
            return '';
          }
          const colDef = params.column.getColDef();
          const valueFormatter = colDef.valueFormatter;
          if (valueFormatter && typeof valueFormatter === 'function') {
            const formattedValue = valueFormatter({
              value: params.value,
              data: params.node?.data,
              colDef: params.column.getColDef(),
              column: params.column,
              api: params.api,
              node: params.node ?? null,
              context: params.context
            });
            if (typeof formattedValue === 'string') {
              return formattedValue.replace(/[$,%]/g, '');
            }
            return formattedValue;
          }
          return params.value;
        }
      });
    }
  }, []);

  // Expose the exportCsv action via ref
  useImperativeHandle(ref, () => ({
    exportCsv: handleExportCSV
  }));

  // Store API reference when grid is ready
  const onGridReady = useCallback((params: any) => {
    setGridApi(params.api);
    
    // Apply the default sort when grid is first ready
    applyDefaultSort(params.api);
  }, [applyDefaultSort]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading report data...</div>;
  }

  // If there are no rows and not loading, and no error handled above, show a specific message
  if (!rows && !isLoading && !error) {
    return (
      <Card className="h-full flex flex-col items-center justify-center">
        <CardContent className="text-center">
          <p className="text-lg font-semibold">No Data Available</p>
          <p className="text-muted-foreground">Please make your selections and generate a report.</p>
        </CardContent>
      </Card>
    );
  }
  
  // Ensure rows is not null before proceeding to render the grid
  if (!rows) {
    // This case should ideally be covered by the above, but as a fallback:
    return <div className="flex items-center justify-center h-full">Report data is unavailable.</div>;
  }
  
  return (
    <Card className="h-full flex flex-col shadow-none border-0 p-0 m-0">
      <CardContent className="flex-1 p-0 ag-theme-quartz" style={{ height: '100%', width: '100%' }}>
        <div className="h-full w-full flex flex-col">
          <div className="flex-grow h-full w-full">
            <AgGridReact<ApiReportRow>
              ref={gridRef}
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              domLayout='normal'
              rowHeight={rowHeight}
              pinnedBottomRowData={pinnedBottomRowData}
              suppressAggFuncInHeader={true}
              onGridReady={onGridReady}
              onFirstDataRendered={(params) => {
                // Also do initial sizing after first render
                params.api.sizeColumnsToFit();
              }}
              className=""
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ReportTabContent.displayName = 'ReportTabContent'; 