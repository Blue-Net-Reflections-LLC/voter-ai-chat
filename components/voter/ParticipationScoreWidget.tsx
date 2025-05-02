'use client';

import React from 'react';
import { cn } from '@/lib/utils'; // Assuming Shadcn UI utils
import { Loader2, Info } from 'lucide-react'; // Import the icon and Info icon
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // Import Tooltip components

// --- Configuration for Score Ranges and Labels ---
// TODO: Make this externally configurable if needed (e.g., via props or context)
interface ScoreRange {
  min: number;
  max: number;
  label: string;
  className?: string; // Optional specific styling class for the label/badge
}

// Updated ranges based on design/ga/participation-score.md
const SCORE_RANGES: ScoreRange[] = [
  { min: 1.0, max: 2.9, label: 'Needs Attention', className: 'bg-red-100 text-red-800 border-red-300' },
  { min: 3.0, max: 4.9, label: 'Needs Review', className: 'bg-orange-100 text-orange-800 border-orange-300' }, // Using orange for review
  { min: 5.0, max: 6.4, label: 'Participates', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' }, // Using yellow for participates
  { min: 6.5, max: 9.9, label: 'Power Voter', className: 'bg-green-100 text-green-800 border-green-300' }, // Using green for power
  { min: 10.0, max: 10.0, label: 'Super Power Voter', className: 'bg-blue-100 text-blue-800 border-blue-300' }, // Using blue for super power
];

// Find the corresponding label for a given score
const getScoreLabel = (score: number | null): ScoreRange | null => {
  if (score === null || isNaN(score)) {
    return null;
  }
  // Ensure score is within overall bounds for safety
  const clampedScore = Math.max(1.0, Math.min(score, 10.0));
  return SCORE_RANGES.find(range => clampedScore >= range.min && clampedScore <= range.max) || null;
};

// --- Component Props ---
interface ParticipationScoreWidgetProps {
  score: number | null | undefined;
  isLoading?: boolean; // Add isLoading prop
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

// --- Component Implementation ---
export const ParticipationScoreWidget: React.FC<ParticipationScoreWidgetProps> = ({
  score,
  isLoading = false, // Default to false
  size = 'medium',
  className,
}) => {
  const scoreInfo = getScoreLabel(score ?? null);
  const displayScore = score !== null && score !== undefined ? score.toFixed(1) : '--';

  // Define size-based classes
  const scoreSizeClass = size === 'small' ? 'text-lg' : size === 'medium' ? 'text-xl' : 'text-2xl'; // Larger score size
  const labelSizeClass = size === 'small' ? 'text-xs' : size === 'medium' ? 'text-sm' : 'text-base';
  const iconSizeClass = size === 'small' ? 'h-3.5 w-3.5' : size === 'medium' ? 'h-4 w-4' : 'h-5 w-5'; // Size for info icon

  // Loading State
  if (isLoading) {
    const loaderIconSize = size === 'small' ? 'h-4 w-4' : size === 'medium' ? 'h-5 w-5' : 'h-6 w-6';
    return (
      <div className={cn('inline-flex items-center justify-center h-8', className)} style={{ minWidth: '5rem' /* Adjust width as needed */ }}>
        <Loader2 className={cn('animate-spin text-gray-500', loaderIconSize)} />
      </div>
    );
  }

  // Score Display State
  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn('inline-flex items-center gap-2', className)}> {/* Main container */}
        {/* Score Value */}
        <span
          className={cn(
            'tabular-nums tracking-tight font-bold', // Bolder score
            scoreSizeClass,
            !scoreInfo ? 'text-muted-foreground' : 'text-foreground' // Dim if no score/label
          )}
        >
          {displayScore}
        </span>

        {/* Label and Info Tooltip */}
        <div className={cn('flex items-center gap-1', labelSizeClass)}> 
          {scoreInfo && score !== null && score !== undefined && (
            <span
              className={cn(
                scoreInfo.className?.replace(/bg-\S+/, '').replace(/border-\S+/, '').trim(), // Keep text color, remove bg/border
                'font-medium'
              )}
            >
              {scoreInfo.label}
            </span>
          )}
          {/* Fallback label */}
          {score !== null && score !== undefined && !scoreInfo && (
            <span className="font-medium text-muted-foreground">Unknown</span>
          )}
          {/* N/A state - if score is null/undefined, maybe show nothing or a specific N/A text */}
          {(score === null || score === undefined) && (
             <span className="font-medium text-muted-foreground">N/A</span>
          )}

          {/* Info Tooltip Trigger */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button aria-label="Score information">
                 <Info className={cn('text-muted-foreground hover:text-foreground', iconSizeClass)} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs max-w-xs">
                Participation Score (1.0-10.0) based on voting status, recency, frequency, and diversity over the last 8 years.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
};

// Example Usage:
// <ParticipationScoreWidget isLoading={true} />
// <ParticipationScoreWidget score={7.5} />
// <ParticipationScoreWidget score={2.1} size="small" />
// <ParticipationScoreWidget score={null} /> 