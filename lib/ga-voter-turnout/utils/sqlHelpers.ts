/**
 * SQL utilities for Georgia Voter Turnout Analysis
 */

import { GeographySelection } from '../types';

/**
 * Builds a SQL WHERE clause for filtering voter data based on geography selection
 */
export function buildGeoFilterCondition(
    geography: GeographySelection,
    voterTableAlias: string = 'vrl' 
): string {
    const conditions: string[] = [];
    const { areaType, areaValue, districtType } = geography;

    if (areaValue === "ALL") {
        return "1=1"; // No specific primary geographic filter
    }

    if (areaType === 'County') {
        conditions.push(`UPPER(${voterTableAlias}.county_name) = UPPER('${areaValue}')`);
    } else if (areaType === 'District') {
        if (!districtType || !areaValue) {
            console.error("District type and value are required for District areaType filtering.");
            return "1 = 0";
        }
        let districtColumn = '';
        switch (districtType) {
            case 'Congressional':
                districtColumn = 'congressional_district';
                break;
            case 'StateSenate':
                districtColumn = 'state_senate_district';
                break;
            case 'StateHouse':
                districtColumn = 'state_house_district';
                break;
            default:
                console.error(`Unknown district type: ${districtType}`);
                return "1 = 0";
        }
        conditions.push(`${voterTableAlias}.${districtColumn} = '${areaValue}'`); 
    }

    if (conditions.length === 0) {
        console.error("Could not build specific geography filter for:", geography);
        return "1 = 0";
    }
    return conditions.join(' AND ');
}

/**
 * Determines the appropriate SQL column to use for grouping data in queries
 */
export function getGeoGroupingColumnSQL(
    geography: GeographySelection,
    voterTableAlias: string = 'vrl'
): string {
    const { areaType, areaValue, districtType, subAreaType } = geography;

    // If a secondary breakdown is specified, that takes precedence for grouping.
    if (subAreaType) {
        switch (subAreaType) {
            case 'Precinct':
                return `${voterTableAlias}.county_precinct`; 
            case 'Municipality':
                return `${voterTableAlias}.municipal_precinct`;
            case 'ZipCode':
                return `${voterTableAlias}.residence_zipcode`;
            default:
                console.warn(`Unknown subAreaType for grouping: ${subAreaType}. Defaulting to primary area.`);
                // Fall through to primary area grouping if subAreaType is unknown
        }
    }

    // If no subAreaType or an unknown one, group by the primary selected area.
    if (areaValue === "ALL") {
        // When "ALL" is selected for the primary area (e.g. "All Counties"),
        // and no valid subAreaType is given for breakdown, we group by the primary geo type itself.
        if (areaType === 'County') return `${voterTableAlias}.county_code`;
        if (areaType === 'District') {
            if (!districtType) {
                console.error("District type is required for 'ALL' districts grouping.");
                return "\'unknown_district_group\'"
            }
            switch (districtType) {
                case 'Congressional': return `${voterTableAlias}.congressional_district`;
                case 'StateSenate': return `${voterTableAlias}.state_senate_district`;
                case 'StateHouse': return `${voterTableAlias}.state_house_district`;
                default: 
                    console.error(`Unknown district type for 'ALL' districts grouping: ${districtType}`);
                    return "\'unknown_district_type_group\'";
            }
        }
    }

    // If a specific primary area is selected (not "ALL") and no subAreaType for breakdown.
    if (areaType === 'County') {
        return `${voterTableAlias}.county_code`;
    }
    if (areaType === 'District') {
        if (!districtType) {
            console.error("District type is required for specific district grouping.");
            return "\'unknown_district_group\'"
        }
        switch (districtType) {
            case 'Congressional': return `${voterTableAlias}.congressional_district`;
            case 'StateSenate': return `${voterTableAlias}.state_senate_district`;
            case 'StateHouse': return `${voterTableAlias}.state_house_district`;
            default: 
                console.error(`Unknown district type for specific district grouping: ${districtType}`);
                return "\'unknown_district_type_group\'";
        }
    }
    
    console.error('Could not determine grouping column for geography:', geography);
    return "\'unknown_geo_group\'"; 
}

/**
 * Generates a descriptive label for the geographical unit based on query results
 */
export function getGeoUnitLabel(
    geography: GeographySelection,
    sqlRow: any, // The raw row object from the SQL query
    groupingColumnIdentifier: string // The alias used for the geo grouping column in SQL
): string {
    const { areaType, areaValue, subAreaType } = geography;
    const actualGeoValue = sqlRow[groupingColumnIdentifier];

    if (areaType === 'County') {
        if (subAreaType === 'Precinct') return `Precinct ${actualGeoValue} (County ${areaValue})`;
        if (subAreaType === 'Municipality') return `Municipality ${actualGeoValue} (County ${areaValue})`;
        return `County ${actualGeoValue}`;
    }
    if (areaType === 'District') return `District ${actualGeoValue}`;
    if (areaType === 'ZipCode') return `Zip Code ${actualGeoValue}`;
    
    return String(actualGeoValue || 'N/A');
}

/**
 * Creates a SQL condition for demographic filtering based on dimension, category, and election year
 */
export function getDemographicConditionSQL(
    dimension: string, 
    category: string, 
    electionYearForAgeCalc: number
): string {
    if (dimension === 'Race') {
        const sqlRaceCategory = require('../constants').GA_SQL_RACE_CATEGORIES_MAP[category];
        return sqlRaceCategory ? `UPPER(vrl.race) = '${sqlRaceCategory.replace(/'/g, "''")}'` : '1=0';
    } else if (dimension === 'Gender') {
        return `LOWER(vrl.gender) = LOWER('${category.replace(/'/g, "''")}')`;
    } else if (dimension === 'AgeRange') {
        const ageRangeDef = require('../constants').AGE_RANGE_CATEGORIES_DEF[category];
        if (!ageRangeDef) return '1=0';
        
        if (category === '75+') {
            const effectiveMaxBirthYear = electionYearForAgeCalc - ageRangeDef.min;
            return `vrl.birth_year <= ${effectiveMaxBirthYear}`;
        } else {
            const maxBirthYear = electionYearForAgeCalc - ageRangeDef.min;
            const minBirthYear = electionYearForAgeCalc - ageRangeDef.max;
            return `vrl.birth_year BETWEEN ${minBirthYear} AND ${maxBirthYear}`;
        }
    }
    return '1=1'; 
} 