// --- Census Data Filter Definitions ---

// Income bracket ranges (in USD)
export interface IncomeBracket {
  min: number;
  max: number | null; // null for "no upper limit"
  label: string;
  value: string;
}

export const INCOME_BRACKETS: IncomeBracket[] = [
  { min: 0, max: 25000, label: 'Under $25,000', value: 'under_25k' },
  { min: 25000, max: 50000, label: '$25,000 - $50,000', value: '25k_50k' },
  { min: 50000, max: 75000, label: '$50,000 - $75,000', value: '50k_75k' },
  { min: 75000, max: 100000, label: '$75,000 - $100,000', value: '75k_100k' },
  { min: 100000, max: 150000, label: '$100,000 - $150,000', value: '100k_150k' },
  { min: 150000, max: 200000, label: '$150,000 - $200,000', value: '150k_200k' },
  { min: 200000, max: 300000, label: '$200,000 - $300,000', value: '200k_300k' },
  { min: 300000, max: null, label: 'Over $300,000', value: 'over_300k' },
];

// Education attainment brackets
export interface EducationBracket {
  min: number; // Min percentage with this education level
  max: number; // Max percentage with this education level
  label: string;
  value: string;
}

export const EDUCATION_BRACKETS: EducationBracket[] = [
  { min: 0, max: 20, label: 'Bachelor\'s Degree (0-20% of area)', value: 'very_low_education' },
  { min: 20, max: 35, label: 'Bachelor\'s Degree (20-35% of area)', value: 'low_education' },
  { min: 35, max: 50, label: 'Bachelor\'s Degree (35-50% of area)', value: 'moderate_education' },
  { min: 50, max: 65, label: 'Bachelor\'s Degree (50-65% of area)', value: 'high_education' },
  { min: 65, max: 80, label: 'Bachelor\'s Degree (65-80% of area)', value: 'very_high_education' },
  { min: 80, max: 100, label: 'Bachelor\'s Degree (80%+ of area)', value: 'extremely_high_education' },
];

// Unemployment rate brackets
export interface UnemploymentBracket {
  min: number; // Min percentage unemployed
  max: number; // Max percentage unemployed
  label: string;
  value: string;
}

export const UNEMPLOYMENT_BRACKETS: UnemploymentBracket[] = [
  { min: 0, max: 2, label: 'Very Low (0-2%)', value: 'very_low_unemployment' },
  { min: 2, max: 4, label: 'Low (2-4%)', value: 'low_unemployment' },
  { min: 4, max: 6, label: 'Moderate (4-6%)', value: 'moderate_unemployment' },
  { min: 6, max: 8, label: 'Above Average (6-8%)', value: 'above_avg_unemployment' },
  { min: 8, max: 10, label: 'High (8-10%)', value: 'high_unemployment' },
  { min: 10, max: 15, label: 'Very High (10-15%)', value: 'very_high_unemployment' },
  { min: 15, max: 100, label: 'Extremely High (15%+)', value: 'extremely_high_unemployment' },
]; 