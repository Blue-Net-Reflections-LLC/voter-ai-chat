// --- Participation Score Definitions ---

// Interface for score range definition
export interface ScoreRange {
  min: number;
  max: number;
  label: string;
  className?: string; // Optional specific styling class for the label/badge (used by frontend widget)
}

// Single source of truth for score ranges
export const SCORE_RANGES: ScoreRange[] = [
  { min: 1.0, max: 2.9, label: 'Needs Attention', className: 'bg-red-100 text-red-800 border-red-300' },
  { min: 3.0, max: 4.9, label: 'Needs Review', className: 'bg-orange-100 text-orange-800 border-orange-300' }, 
  { min: 5.0, max: 6.4, label: 'Participates', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' }, 
  { min: 6.5, max: 9.9, label: 'Power Voter', className: 'bg-green-100 text-green-800 border-green-300' }, 
  { min: 10.0, max: 10.0, label: 'Super Power Voter', className: 'bg-blue-100 text-blue-800 border-blue-300' }, 
];

// You could also add helper functions here if they are purely data-driven,
// but getScoreLabel might stay in components if it's tied to display logic. 