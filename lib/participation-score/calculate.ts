// lib/participation-score/calculate.ts

import { ELECTION_TYPE_OPTIONS } from '../../app/ga/voter/list/constants'; // Adjust path if needed

// --- Simple Invariant Check ---
function invariant(condition: unknown, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message || 'Invariant violation');
  }
}

// --- Types ---

// Define the structure for voting history events based on the JSONB column
export interface HistoryEvent {
  election_date: string; // YYYY-MM-DD
  election_type: string; // e.g., 'GENERAL', 'PRIMARY', 'SPECIAL', 'RUNOFF'
  party: string | null; // e.g., 'DEM', 'REP', 'NP' or null
  ballot_style: string | null;
  absentee: boolean | null;
  provisional: boolean | null;
  supplemental: boolean | null;
}

// Define the input structure for the main calculation function
export interface VoterScoreData {
  status: 'Active' | 'Inactive'; // Expect normalized input
  historyEvents: HistoryEvent[]; // Should be pre-filtered for the last 8 years
}

// --- Configuration ---
// These values should be easily adjustable

// Score Range
const MIN_SCORE = 1.0;
const MAX_SCORE = 10.0;

// Status-based Base Points
const BASE_POINTS_ACTIVE = 2.0; // Minimum score for an active voter with no history
const BASE_POINTS_INACTIVE = 1.0; // Base for inactive voters (final score capped < 5.0)
const MAX_SCORE_INACTIVE = 4.9;

// Recency Step Function (Years Ago -> Points) - Higher points = better
const RECENCY_POINTS: { [yearsAgoMin: number]: number } = {
  0: 4.0, // 0-2 years ago
  3: 2.0, // 3-5 years ago
  6: 1.0, // 6-8 years ago
};
const RECENCY_MAX_YEARS = 8;

// Frequency Scaling (Raw Count -> Points) - Logarithmic
// const FREQUENCY_POINTS_PER_EVENT = 0.5; // Removed linear scaling
const FREQUENCY_LOG_FACTOR = 1.3; // Factor for logarithmic scaling
const MAX_FREQUENCY_POINTS = 4.0; // Max points achievable from frequency alone

// Diversity Multiplier
const DIVERSITY_MULTIPLIER_BONUS = 1.1; // Multiplier applied to Frequency points if non-General vote exists

// Dynamically identify non-general types from constants
// Assumes 'GENERAL' is the main indicator, but includes PRIMARY, SPECIAL, RUNOFF keywords
const GENERAL_KEYWORDS = ['GENERAL'];
const NON_GENERAL_KEYWORDS = ['PRIMARY', 'SPECIAL', 'RUNOFF', 'RECALL']; // Added RECALL based on options
const NON_GENERAL_ELECTION_TYPE_VALUES = ELECTION_TYPE_OPTIONS
  .map(opt => opt.value)
  .filter(value =>
    NON_GENERAL_KEYWORDS.some(keyword => value.includes(keyword)) &&
    !GENERAL_KEYWORDS.some(keyword => value.includes(keyword))
  );
// Example NON_GENERAL_ELECTION_TYPE_VALUES might include: 'SPECIAL ELECTION', 'GENERAL PRIMARY', 'SPECIAL PRIMARY RUNOFF', etc.

// --- Calculation Function ---

/**
 * Calculates the participation score for a single voter.
 * @param voterData - The voter's status and relevant voting history (last 8 years).
 * @returns The calculated participation score (1.0 - 10.0).
 */
export function calculateParticipationScore(voterData: VoterScoreData): number {
  // --- Input Invariants ---
  invariant(voterData, 'voterData is required');
  invariant(typeof voterData.status === 'string' && (voterData.status === 'Active' || voterData.status === 'Inactive'), 'voterData.status must be \'Active\' or \'Inactive\'');
  invariant(Array.isArray(voterData.historyEvents), 'voterData.historyEvents must be an array');

  const { status, historyEvents } = voterData;

  // --- Validate and Pre-process History Events ---
  historyEvents.forEach(event => {
    invariant(event && typeof event.election_date === 'string' && event.election_date.match(/^\d{4}-\d{2}-\d{2}$/), `Invalid date format in history event: ${event?.election_date}`);
    const eventDate = new Date(event.election_date);
    invariant(!isNaN(eventDate.getTime()), `Invalid date value parsed from history event: ${event.election_date}`);
    // Optionally add checks for election_type if needed
  });

  // 1. Determine Base Points from Status
  let basePoints = status === 'Active' ? BASE_POINTS_ACTIVE : BASE_POINTS_INACTIVE;

  // Ensure historyEvents is sorted by date descending for easy recency check
  // Dates are already validated, so sort is safe
  const sortedHistory = [...historyEvents].sort((a, b) =>
    b.election_date.localeCompare(a.election_date)
  );

  // 2. Calculate Recency Points
  let recencyPoints = 0;
  if (sortedHistory.length > 0) {
    const mostRecentDateStr = sortedHistory[0].election_date;
    // Date already validated during pre-processing
    const mostRecentDate = new Date(mostRecentDateStr);
    const yearsAgo = (new Date().getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

    if (yearsAgo <= RECENCY_MAX_YEARS) {
       // Find the correct points bracket
       const applicableBracket = Object.keys(RECENCY_POINTS)
         .map(Number)
         .sort((a, b) => b - a) // Check higher years first
         .find(yearsMin => yearsAgo >= yearsMin);

       if (applicableBracket !== undefined) {
         recencyPoints = RECENCY_POINTS[applicableBracket];
       }
    }
  }

  // 3. Calculate Frequency Points
  const frequencyCount = sortedHistory.length;
  // Apply logarithmic scaling
  let frequencyPoints = 0;
  if (frequencyCount > 0) {
      frequencyPoints = Math.min(
          FREQUENCY_LOG_FACTOR * Math.log(frequencyCount + 1),
          MAX_FREQUENCY_POINTS
      );
  }
  // Note: Math.log is the natural logarithm (ln)

  // 4. Calculate Diversity Multiplier
  let diversityMultiplier = 1.0;
  const hasNonGeneralVote = sortedHistory.some(event =>
    event.election_type && NON_GENERAL_ELECTION_TYPE_VALUES.includes(event.election_type.toUpperCase())
  );
  if (hasNonGeneralVote) {
    diversityMultiplier = DIVERSITY_MULTIPLIER_BONUS;
  }

  // 5. Combine using the formula
  let score = basePoints + recencyPoints + (frequencyPoints * diversityMultiplier);

  // 6. Apply Caps and Clamps
  if (status !== 'Active') {
    score = Math.min(score, MAX_SCORE_INACTIVE);
  }
  score = Math.max(MIN_SCORE, Math.min(score, MAX_SCORE));

  // Round to one decimal place for consistency
  const finalScore = Math.round(score * 10) / 10;

  // --- Output Invariant ---
  invariant(typeof finalScore === 'number' && !isNaN(finalScore), 'Final score must be a number');
  invariant(finalScore >= MIN_SCORE && finalScore <= MAX_SCORE, `Final score (${finalScore}) must be between ${MIN_SCORE} and ${MAX_SCORE}`);

  return finalScore;
}

// --- Averaging Function ---

/**
 * Calculates the average participation score for a list of voters.
 * Individual scores are calculated using calculateParticipationScore unless provided.
 * Returns the average score rounded to one decimal place, or null if the input is empty.
 * @param votersData - Array of voter data objects.
 * @param preCalculatedScores - Optional array of scores. If provided, these are averaged directly.
 */
export function calculateAverageScore(
  votersData: VoterScoreData[] | null,
  preCalculatedScores?: number[]
): number | null {
  let scores: number[] = [];

  if (preCalculatedScores) {
    // Use pre-calculated scores if provided
    scores = preCalculatedScores;
    // Basic validation if using pre-calculated scores
    if (!votersData || votersData.length !== scores.length) {
        console.warn('[Avg] Mismatch between votersData count and preCalculatedScores count. Using preCalculatedScores.');
        // If only scores are provided, proceed, otherwise requires votersData for count check
        if(!votersData && scores.length === 0) return null;
        if(!votersData && scores.length > 0) { /* proceed */ } 
        else if (!votersData) return null; // Need votersData if not just using scores
    }
    if (scores.length === 0) return null; // Handle empty scores array

  } else {
    // Calculate scores if not provided
    if (!votersData || votersData.length === 0) {
      console.log('[Avg] No voters data to average.');
      return null;
    }
    console.log(`[Avg] Calculating average score for ${votersData.length} voters.`);
    scores = votersData.map(voterData => calculateParticipationScore(voterData));
  }

  // Averaging logic remains the same
  const sum = scores.reduce((acc, cur) => acc + cur, 0);
  const average = sum / scores.length;
  const roundedAverage = Math.round(average * 10) / 10;
  console.log(`[Avg] Calculated average score: ${roundedAverage}`);
  return roundedAverage;
} 