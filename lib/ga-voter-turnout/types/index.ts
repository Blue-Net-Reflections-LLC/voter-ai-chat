/**
 * Type definitions for Georgia Voter Turnout Analysis
 */

export interface GeographySelection {
    areaType: 'County' | 'District' | 'ZipCode';
    areaValue: string;
    districtType?: 'Congressional' | 'StateSenate' | 'StateHouse';
    subAreaType?: 'Precinct' | 'Municipality' | 'ZipCode'; 
    subAreaValue?: string;
}

export interface ValidatedTurnoutAnalysisParams {
    geography: {
        areaType: 'County' | 'District' | 'ZipCode';
        areaValue: string;
        districtType?: 'Congressional' | 'StateSenate' | 'StateHouse';
        subAreaType?: 'Precinct' | 'Municipality' | 'ZipCode';
        subAreaValue?: string;
    };
    electionDate: string; // YYYY-MM-DD
    dataPoints: Array<'Race' | 'Gender' | 'AgeRange'>;
    chartDataPoint?: 'Race' | 'Gender' | 'AgeRange' | null;
    includeCensusData: boolean;
}

export interface ProcessedReportRow {
    geoLabel: string;
    totalRegistered: number;
    totalVoted: number;
    overallTurnoutRate: number;
    breakdowns: Record<string, { registered: number; voted: number; turnout: number }>;
    censusData?: Record<string, any>;
}

export interface ProcessedChartRow {
    geoLabel: string;
    summedDemographicTurnoutRate?: number;
    segments?: Array<{ label: string; turnoutRate: number; color: string }>;
    overallTurnoutRate?: number;
}

export interface ProcessedTurnoutPayload {
    report?: {
        rows: ProcessedReportRow[];
        aggregations: Record<string, any>;
    };
    chart?: {
        type: 'stackedRow' | 'bar';
        rows: ProcessedChartRow[];
        xAxisMax: number;
    };
}

export interface ConsolidatedDbRow {
    query_county_name?: string;
    geo_unit_id: string | number;
    total_registered_overall: number;
    total_voted_overall: number;
    overall_turnout_rate_calculated: number;
} 