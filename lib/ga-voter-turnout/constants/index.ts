/**
 * Constants for Georgia Voter Turnout Analysis
 */

import { RACE_OPTIONS, GENDER_OPTIONS, AGE_RANGE_OPTIONS } from '@/app/ga/voter/list/constants';

// Demographics categories
export const RACE_CATEGORIES = RACE_OPTIONS.map(option => option.value);
export const GENDER_CATEGORIES = GENDER_OPTIONS.map(option => option.value);
export const AGE_RANGE_KEYS = AGE_RANGE_OPTIONS.map(option => option.value);

// Age range definitions
export const AGE_RANGE_CATEGORIES_DEF = {
    '18-23': { min: 18, max: 23 },
    '25-44': { min: 25, max: 44 },
    '45-64': { min: 45, max: 64 },
    '65-74': { min: 65, max: 74 },
    '75+': { min: 75, max: Infinity },
};

// Color palettes for chart segments
export const RACE_COLORS = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'];
export const GENDER_COLORS = ['#17becf', '#bcbd22', '#e377c2'];
export const AGE_RANGE_COLORS = ['#7f7f7f', '#c7c7c7', '#f7b6d2', '#dbdb8d', '#9edae5', '#aec7e8'];

// County code mappings
export const COUNTY_CODE_MAP: Record<string, string> = {
    'Cobb': '067',
    'Fulton': '121',
    'DeKalb': '089',
    'Gwinnett': '135',
    'Clayton': '063',
};

// Race category mappings for SQL
export const GA_SQL_RACE_CATEGORIES_MAP: Record<string, string> = {
  'White': 'WHITE',
  'Black': 'BLACK',
  'Hispanic': 'HISPANIC/LATINO',
  'Asian': 'ASIAN/PACIFIC ISLANDER',
  'Other': 'OTHER',
}; 