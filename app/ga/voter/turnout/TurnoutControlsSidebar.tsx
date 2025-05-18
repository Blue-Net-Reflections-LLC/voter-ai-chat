'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { 
    ELECTION_DATES, 
    REPORT_DATA_POINTS, 
    CHART_DATA_POINTS, 
    PRIMARY_GEO_TYPES,
    DISTRICT_TYPES,
    SECONDARY_BREAKDOWN_TYPES,
    ALL_COUNTIES_OPTION,
    ALL_DISTRICTS_OPTION
} from './constants';
import type { TurnoutSelections } from './page'; // Import updated TurnoutSelections
import type { MultiSelectOption } from '@/app/ga/voter/list/hooks/useLookupData'; // For prop types

interface TurnoutControlsSidebarProps {
  selections: TurnoutSelections;
  onSelectionsChange: (newSelections: Partial<TurnoutSelections>) => void;
  onGenerate: () => void;
  activeTab: string;
  // Lookup data props
  countyOptions: MultiSelectOption[];
  congressionalDistrictOptions: MultiSelectOption[];
  stateSenateDistrictOptions: MultiSelectOption[];
  stateHouseDistrictOptions: MultiSelectOption[];
}

export const TurnoutControlsSidebar: React.FC<TurnoutControlsSidebarProps> = ({ 
  selections, 
  onSelectionsChange, 
  onGenerate, 
  activeTab,
  countyOptions,
  congressionalDistrictOptions,
  stateSenateDistrictOptions,
  stateHouseDistrictOptions,
}) => {

  const handlePrimaryGeoTypeChange = (value: 'County' | 'District' | '' ) => {
    const newPrimaryGeoType = value === '' ? null : value;
    onSelectionsChange({
      primaryGeoType: newPrimaryGeoType,
      specificCounty: null, 
      specificDistrictType: null,
      specificDistrictNumber: null,
      secondaryBreakdown: null, // Reset dependent fields
    });
  };

  const handleSpecificCountyChange = (value: string) => {
    onSelectionsChange({ specificCounty: value === '' ? null : value, secondaryBreakdown: null }); // Reset secondary if county changes
  };

  const handleSpecificDistrictTypeChange = (value: 'Congressional' | 'StateSenate' | 'StateHouse' | '') => {
    const newDistrictType = value === '' ? null : value;
    onSelectionsChange({
      specificDistrictType: newDistrictType,
      specificDistrictNumber: null, // Reset district number
      secondaryBreakdown: null, // Reset secondary
    });
  };

  const handleSpecificDistrictNumberChange = (value: string) => {
    onSelectionsChange({ specificDistrictNumber: value === '' ? null : value, secondaryBreakdown: null }); // Reset secondary
  };
  
  const handleSecondaryBreakdownChange = (value: 'Precinct' | 'Municipality' | 'ZipCode' | 'None' | '') => {
    onSelectionsChange({ secondaryBreakdown: value === '' || value === 'None' ? null : value });
  };

  const handleReportDataPointChange = (pointId: string, checked: boolean) => {
    const currentPoints = selections.reportDataPoints;
    let newPoints = [...currentPoints];
    if (checked) {
      if (!currentPoints.includes(pointId) && currentPoints.length < 3) {
        newPoints.push(pointId);
      }
    } else {
      newPoints = currentPoints.filter(p => p !== pointId);
    }
    if (newPoints.length <=3) {
        onSelectionsChange({ reportDataPoints: newPoints });
    }
  };

  const getDistrictNumberOptions = () => {
    if (!selections.specificDistrictType) return [];
    switch (selections.specificDistrictType) {
      case 'Congressional': return [ALL_DISTRICTS_OPTION, ...congressionalDistrictOptions];
      case 'StateSenate': return [ALL_DISTRICTS_OPTION, ...stateSenateDistrictOptions];
      case 'StateHouse': return [ALL_DISTRICTS_OPTION, ...stateHouseDistrictOptions];
      default: return [];
    }
  };
  
  const isGenerateDisabled = () => {
    if (!selections.electionDate) return true;
    if (selections.primaryGeoType === 'County' && !selections.specificCounty) return true;
    if (selections.primaryGeoType === 'District' && (!selections.specificDistrictType || !selections.specificDistrictNumber)) return true;
    if (!selections.primaryGeoType) return true; // Must select a primary geo type
    return false;
  };

  return (
    <div className="p-0 flex flex-col h-full">
      <SheetHeader className="p-4 border-b">
        <SheetTitle>Analysis Controls</SheetTitle>
      </SheetHeader>
      <ScrollArea className="flex-grow p-4">
        <div className="space-y-6">
          {/* Geography Selection Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Geography</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Control 1: Primary Geo Type */}
              <div className="space-y-1">
                <Label htmlFor="primary-geo-type">Analyze by</Label>
                <Select 
                  value={selections.primaryGeoType || ''}
                  onValueChange={handlePrimaryGeoTypeChange}
                >
                  <SelectTrigger id="primary-geo-type">
                    <SelectValue placeholder="Select primary type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIMARY_GEO_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Control 2a: Specific County */}
              {selections.primaryGeoType === 'County' && (
                <div className="space-y-1">
                  <Label htmlFor="specific-county">Select County</Label>
                  <Select
                    value={selections.specificCounty || ''}
                    onValueChange={handleSpecificCountyChange}
                  >
                    <SelectTrigger id="specific-county">
                      <SelectValue placeholder="Select county..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_COUNTIES_OPTION.value}>{ALL_COUNTIES_OPTION.label}</SelectItem>
                      {countyOptions.map(county => (
                        <SelectItem key={county.value} value={county.value}>{county.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Control 2b: Specific District Type */}
              {selections.primaryGeoType === 'District' && (
                <div className="space-y-1">
                  <Label htmlFor="specific-district-type">Select District Type</Label>
                  <Select
                    value={selections.specificDistrictType || ''}
                    onValueChange={handleSpecificDistrictTypeChange}
                  >
                    <SelectTrigger id="specific-district-type">
                      <SelectValue placeholder="Select district type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {DISTRICT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Control 2c: Specific District Number */}
              {selections.primaryGeoType === 'District' && selections.specificDistrictType && (
                <div className="space-y-1">
                  <Label htmlFor="specific-district-number">Select {selections.specificDistrictType} Number</Label>
                  <Select
                    value={selections.specificDistrictNumber || ''}
                    onValueChange={handleSpecificDistrictNumberChange}
                  >
                    <SelectTrigger id="specific-district-number">
                      <SelectValue placeholder="Select district number..." />
                    </SelectTrigger>
                    <SelectContent>
                      {getDistrictNumberOptions().map(district => (
                        <SelectItem key={district.value} value={district.value}>{district.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Control 3: Secondary Breakdown */}
              {((selections.primaryGeoType === 'County' && selections.specificCounty && selections.specificCounty !== 'ALL') || 
               (selections.primaryGeoType === 'District' && selections.specificDistrictNumber && selections.specificDistrictNumber !== 'ALL')) && (
                <div className="space-y-1">
                  <Label htmlFor="secondary-breakdown">Breakdown By (within selected area)</Label>
                  <Select
                    value={selections.secondaryBreakdown || ''}
                    onValueChange={handleSecondaryBreakdownChange}
                  >
                    <SelectTrigger id="secondary-breakdown">
                      <SelectValue placeholder="Select breakdown..." />
                    </SelectTrigger>
                    <SelectContent>
                      {SECONDARY_BREAKDOWN_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Election Date Selection Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Election</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="election-date">Election Date</Label>
                <Select
                  value={selections.electionDate || ''}
                  onValueChange={(value) => onSelectionsChange({ electionDate: value || null })}
                >
                  <SelectTrigger id="election-date">
                    <SelectValue placeholder="Select date..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ELECTION_DATES.map(date => (
                      <SelectItem key={date} value={date}>{date}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          {/* Report/Chart Specific Controls - Conditional Rendering based on activeTab */}
          {activeTab === 'report' && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Report Breakdowns</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label>Data Points (Max 3)</Label>
                  <div className="space-y-1 pt-1">
                    {REPORT_DATA_POINTS.map(point => (
                      <div key={point.id} className="flex items-center space-x-2">
                        <Switch 
                          id={`report-${point.id.toLowerCase()}`}
                          checked={selections.reportDataPoints.includes(point.id)}
                          onCheckedChange={(checked) => handleReportDataPointChange(point.id, checked)}
                          disabled={!selections.reportDataPoints.includes(point.id) && selections.reportDataPoints.length >= 3}
                        />
                        <Label htmlFor={`report-${point.id.toLowerCase()}`}>{point.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {activeTab === 'chart' && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Chart Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <Label htmlFor="chart-data-point">Data Point</Label>
                  <Select
                    value={selections.chartDataPoint || 'overall'}
                    onValueChange={(value) => onSelectionsChange({ chartDataPoint: value === 'overall' ? null : value })}
                  >
                    <SelectTrigger id="chart-data-point">
                      <SelectValue placeholder="Select data point..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CHART_DATA_POINTS.map(point => (
                         <SelectItem key={point.value} value={point.value}>{point.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Census Data Inclusion Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Additional Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 pt-1">
                <Switch 
                  id="include-census" 
                  checked={selections.includeCensusData}
                  onCheckedChange={(checked) => onSelectionsChange({ includeCensusData: checked })}
                />
                <Label htmlFor="include-census">Include Census Data</Label>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
      
      <div className="p-4 mt-auto border-t">
        <Button 
          onClick={onGenerate} 
          className="w-full"
          disabled={isGenerateDisabled()} // Updated disabled logic
        >
          {activeTab === 'report' ? 'Generate Report' : 'Draw Chart'}
        </Button>
      </div>
    </div>
  );
}; 