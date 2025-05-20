import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { TurnoutSelections } from '../page';
import { CalendarIcon, MapPinIcon, BarChartIcon } from 'lucide-react';

// Maps for displaying friendly names
const DISTRICT_TYPE_DISPLAY = {
  'Congressional': 'Congressional District',
  'StateSenate': 'State Senate District',
  'StateHouse': 'State House District'
};

const BREAKDOWN_TYPE_DISPLAY = {
  'Precinct': 'Precincts',
  'Municipality': 'Municipalities',
  'ZipCode': 'Zip Codes'
};

interface SelectionsHeaderProps {
  appliedSelections: TurnoutSelections;
  countyOptions?: Array<{ value: string; label: string }>;
  districtOptions?: Array<{ value: string; label: string }>;
}

export const SelectionsHeader: React.FC<SelectionsHeaderProps> = ({ 
  appliedSelections,
  countyOptions = [],
  districtOptions = []
}) => {
  if (!appliedSelections) return null;

  // Helper function to find county name by value
  const getCountyName = (value: string) => {
    if (value === 'ALL') return 'All Counties';
    const county = countyOptions.find(c => c.value === value);
    return county ? county.label : value;
  };

  // Helper function to find district name by value
  const getDistrictName = (value: string, type: string | null) => {
    if (value === 'ALL') return 'All Districts';
    const district = districtOptions.find(d => d.value === value);
    return district ? district.label : `${type} ${value}`;
  };

  // Format geography selection
  const formatGeography = () => {
    if (appliedSelections.primaryGeoType === 'County') {
      const countyName = getCountyName(appliedSelections.specificCounty || '');
      
      if (appliedSelections.secondaryBreakdown) {
        return `${countyName} by ${BREAKDOWN_TYPE_DISPLAY[appliedSelections.secondaryBreakdown] || appliedSelections.secondaryBreakdown}`;
      }
      return countyName;
    } 
    else if (appliedSelections.primaryGeoType === 'District') {
      const districtType = appliedSelections.specificDistrictType;
      const districtName = getDistrictName(
        appliedSelections.specificDistrictNumber || '', 
        districtType || ''
      );
      
      if (appliedSelections.secondaryBreakdown) {
        return `${DISTRICT_TYPE_DISPLAY[districtType as keyof typeof DISTRICT_TYPE_DISPLAY] || districtType} ${districtName} by ${BREAKDOWN_TYPE_DISPLAY[appliedSelections.secondaryBreakdown] || appliedSelections.secondaryBreakdown}`;
      }
      return `${DISTRICT_TYPE_DISPLAY[districtType as keyof typeof DISTRICT_TYPE_DISPLAY] || districtType} ${districtName}`;
    }
    
    return 'No geography selected';
  };

  // Format data points
  const formatDataPoints = () => {
    if (!appliedSelections.dataPoints || appliedSelections.dataPoints.length === 0) {
      return 'Overall Turnout';
    }
    
    return appliedSelections.dataPoints.join(', ');
  };

  return (
    <Card className="mb-4 bg-muted/30">
      <CardContent className="py-3 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="flex items-center">
            <MapPinIcon className="h-4 w-4 mr-2" />
            <div>
              <span className="text-xs text-muted-foreground mr-1">Geography:</span>
              <span className="font-medium text-sm">{formatGeography()}</span>
            </div>
          </div>
          
          <div className="flex items-center">
            <CalendarIcon className="h-4 w-4 mr-2" />
            <div>
              <span className="text-xs text-muted-foreground mr-1">Election:</span>
              <span className="font-medium text-sm">{appliedSelections.electionDate || 'None'}</span>
            </div>
          </div>
          
          <div className="flex items-center">
            <BarChartIcon className="h-4 w-4 mr-2" />
            <div>
              <span className="text-xs text-muted-foreground mr-1">Data:</span>
              <span className="font-medium text-sm">{formatDataPoints()}</span>
              {appliedSelections.includeCensusData && (
                <span className="ml-1 text-xs bg-primary/20 text-primary px-1 py-0.5 rounded">+Census</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 