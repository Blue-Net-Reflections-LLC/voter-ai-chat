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
import { SCORE_RANGES, ScoreRange } from '@/lib/participation-score/constants';

// --- Configuration for Score Ranges and Labels ---
// TODO: Make this externally configurable if needed (e.g., via props or context)

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
  variant?: 'default' | 'compact'; // Add variant prop
  className?: string;
}

// --- Component Implementation ---
export const ParticipationScoreWidget: React.FC<ParticipationScoreWidgetProps> = ({
  score,
  isLoading = false, // Default to false
  size = 'medium',
  variant = 'default', // Default variant
  className,
}) => {
  const scoreInfo = getScoreLabel(score ?? null);
  const displayScore = score !== null && score !== undefined ? score.toFixed(1) : '--';

  // Define size-based classes
  const scoreSizeClass = size === 'small' ? 'text-sm' : size === 'medium' ? 'text-xl' : 'text-2xl';
  const labelSizeClass = size === 'small' ? 'text-xs' : size === 'medium' ? 'text-sm' : 'text-base';
  const iconSizeClass = size === 'small' ? 'h-3.5 w-3.5' : size === 'medium' ? 'h-4 w-4' : 'h-5 w-5'; // Size for info icon

  // Loading State
  if (isLoading) {
    const loaderIconSize = size === 'small' ? 'h-4 w-4' : size === 'medium' ? 'h-5 w-5' : 'h-6 w-6';
    return (
      <div className={cn('inline-flex items-center justify-center', className)} style={{ minWidth: '5rem' /* Adjust width as needed */ }}>
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
            'tabular-nums tracking-tight font-semibold', // Slightly less bold
            scoreSizeClass,
            // Apply text color based on score range even in compact mode, default to foreground
            scoreInfo ? scoreInfo.className?.match(/text-[^-]+-\d+/)?.[0] : 'text-foreground'
          )}
        >
          {displayScore}
        </span>

        {/* Label and Info Tooltip - Conditionally render based on variant */}
        {variant === 'default' && (
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
            <div className="hidden sm:block">
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
        )}
      </div>
    </TooltipProvider>
  );
};

// Example Usage:
// <ParticipationScoreWidget isLoading={true} />
// <ParticipationScoreWidget score={7.5} />
// <ParticipationScoreWidget score={2.1} size="small" />
// <ParticipationScoreWidget score={null} /> 