import React from 'react';
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
    <div className="text-xs flex flex-nowrap items-center gap-x-5 gap-y-1 py-1 px-2 bg-muted/20 rounded overflow-hidden">
      <div className="flex items-center min-w-0">
        <MapPinIcon className="h-3.5 w-3.5 mr-1.5 text-muted-foreground flex-shrink-0" />
        <span className="text-muted-foreground hidden sm:inline sm:mr-1">Geography:</span>
        <span className="font-medium truncate">{formatGeography()}</span>
      </div>
      
      <div className="flex items-center min-w-0">
        <CalendarIcon className="h-3.5 w-3.5 mr-1.5 text-muted-foreground flex-shrink-0" />
        <span className="text-muted-foreground hidden sm:inline sm:mr-1">Election:</span>
        <span className="font-medium truncate">{appliedSelections.electionDate || 'None'}</span>
      </div>
      
      <div className="flex items-center min-w-0">
        <BarChartIcon className="h-3.5 w-3.5 mr-1.5 text-muted-foreground flex-shrink-0" />
        <span className="text-muted-foreground hidden sm:inline sm:mr-1">Data:</span>
        <span className="font-medium truncate">{formatDataPoints()}</span>
        {appliedSelections.includeCensusData && (
          <span className="ml-1.5 text-xs bg-primary/20 text-primary-foreground px-1 py-0.5 rounded-sm truncate">
            +Census
          </span>
        )}
      </div>
    </div>
  );
}; 