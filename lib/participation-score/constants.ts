export interface ScoreRange {
  key: string;
  label: string;
  min: number;
  max: number;
}

export const SCORE_RANGES: ScoreRange[] = [
  { key: 'attention', label: 'Needs Attention', min: 1.0, max: 2.9 },
  { key: 'review',    label: 'Needs Review',    min: 3.0, max: 4.9 },
  { key: 'participates', label: 'Participates',    min: 5.0, max: 6.4 },
  { key: 'power',     label: 'Power Voter',     min: 6.5, max: 9.9 },
  { key: 'super',     label: 'Elite Voter',       min: 10.0, max: 10.0 }, // Special case for exact match
]; 