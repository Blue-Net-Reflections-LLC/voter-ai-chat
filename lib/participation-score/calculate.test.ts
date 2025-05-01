// lib/participation-score/calculate.test.ts

import { describe, it, expect } from 'vitest';
import { calculateParticipationScore, VoterScoreData, HistoryEvent } from './calculate';

// Helper function to generate a date string YYYY-MM-DD for X years ago
function getDateYearsAgo(years: number): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  // Handle potential day overflow (e.g., Feb 29) by setting day to 1
  date.setDate(1);
  return date.toISOString().split('T')[0];
}

// Mock History Event Generator
function createMockEvent(yearsAgo: number, type: string = 'GENERAL'): HistoryEvent {
  return {
    election_date: getDateYearsAgo(yearsAgo),
    election_type: type.toUpperCase(),
    party: 'NP', // Default, can be overridden if needed
    ballot_style: 'REGULAR',
    absentee: false,
    provisional: false,
    supplemental: false,
  };
}


describe('calculateParticipationScore', () => {

  // --- Basic Status Tests ---

  it('should return base score for Active voter with no history', () => {
    const data: VoterScoreData = { status: 'Active', historyEvents: [] };
    // Expect BASE_POINTS_ACTIVE = 2.0
    expect(calculateParticipationScore(data)).toBe(2.0);
  });

  it('should return base score for Inactive voter with no history', () => {
    const data: VoterScoreData = { status: 'Inactive', historyEvents: [] };
    // Expect BASE_POINTS_INACTIVE = 1.0
    expect(calculateParticipationScore(data)).toBe(1.0);
  });

  // --- Recency Tests (Single General Election Vote) ---

  it('Active voter, 1 recent vote (1 year ago)', () => {
    const data: VoterScoreData = {
      status: 'Active',
      historyEvents: [createMockEvent(1, 'GENERAL')]
    };
    // Expected: Base(2.0) + Recency(4.0) + Freq(1*0.5)*Diversity(1.0) = 2.0 + 4.0 + 0.5 = 6.5
    expect(calculateParticipationScore(data)).toBe(6.5);
  });

   it('Inactive voter, 1 recent vote (1 year ago)', () => {
    const data: VoterScoreData = {
      status: 'Inactive',
      historyEvents: [createMockEvent(1, 'GENERAL')]
    };
    // Expected: Base(1.0) + Recency(4.0) + Freq(1*0.5)*Diversity(1.0) = 1.0 + 4.0 + 0.5 = 5.5
    // Capped for Inactive at 4.9
    expect(calculateParticipationScore(data)).toBe(4.9);
  });

  it('Active voter, 1 mid-recency vote (4 years ago)', () => {
    const data: VoterScoreData = {
      status: 'Active',
      historyEvents: [createMockEvent(4, 'GENERAL')]
    };
     // Expected: Base(2.0) + Recency(2.0) + Freq(1*0.5)*Diversity(1.0) = 2.0 + 2.0 + 0.5 = 4.5
    expect(calculateParticipationScore(data)).toBe(4.5);
  });

  it('Inactive voter, 1 mid-recency vote (4 years ago)', () => {
    const data: VoterScoreData = {
      status: 'Inactive',
      historyEvents: [createMockEvent(4, 'GENERAL')]
    };
     // Expected: Base(1.0) + Recency(2.0) + Freq(1*0.5)*Diversity(1.0) = 1.0 + 2.0 + 0.5 = 3.5
    expect(calculateParticipationScore(data)).toBe(3.5);
  });

  it('Active voter, 1 old vote (7 years ago)', () => {
    const data: VoterScoreData = {
      status: 'Active',
      historyEvents: [createMockEvent(7, 'GENERAL')]
    };
    // Expected: Base(2.0) + Recency(1.0) + Freq(1*0.5)*Diversity(1.0) = 2.0 + 1.0 + 0.5 = 3.5
    expect(calculateParticipationScore(data)).toBe(3.5);
  });

  it('Inactive voter, 1 old vote (7 years ago)', () => {
    const data: VoterScoreData = {
      status: 'Inactive',
      historyEvents: [createMockEvent(7, 'GENERAL')]
    };
    // Expected: Base(1.0) + Recency(1.0) + Freq(1*0.5)*Diversity(1.0) = 1.0 + 1.0 + 0.5 = 2.5
    expect(calculateParticipationScore(data)).toBe(2.5);
  });

  it('Active voter, 1 very old vote (> 8 years ago)', () => {
    const data: VoterScoreData = {
      status: 'Active',
      historyEvents: [createMockEvent(9, 'GENERAL')]
    };
    // Expected: Base(2.0) + Recency(0.0) + Freq(1*0.5)*Diversity(1.0) = 2.0 + 0.0 + 0.5 = 2.5
    // Note: The history event is passed, but recency points should be 0
    expect(calculateParticipationScore(data)).toBe(2.5);
  });

   it('Inactive voter, 1 very old vote (> 8 years ago)', () => {
    const data: VoterScoreData = {
      status: 'Inactive',
      historyEvents: [createMockEvent(9, 'GENERAL')]
    };
    // Expected: Base(1.0) + Recency(0.0) + Freq(1*0.5)*Diversity(1.0) = 1.0 + 0.0 + 0.5 = 1.5
    expect(calculateParticipationScore(data)).toBe(1.5);
  });

   // --- Frequency Tests (Active Voter, Recent Votes) ---

  it('Active voter, multiple recent votes (3 votes, 1 year ago)', () => {
    const data: VoterScoreData = {
      status: 'Active',
      historyEvents: [
        createMockEvent(1, 'GENERAL'),
        createMockEvent(1, 'GENERAL'), // Date doesn't have to be exact same day, just same recency bracket
        createMockEvent(1, 'GENERAL')
      ]
    };
    // Expected: Base(2.0) + Recency(4.0) + Freq(3*0.5 = 1.5)*Diversity(1.0) = 2.0 + 4.0 + 1.5 = 7.5
    expect(calculateParticipationScore(data)).toBe(7.5);
  });

  it('Active voter, enough recent votes to hit frequency cap (10 votes, 1 year ago)', () => {
    const history = Array(10).fill(0).map(() => createMockEvent(1, 'GENERAL'));
    const data: VoterScoreData = {
      status: 'Active',
      historyEvents: history
    };
    // Expected: Base(2.0) + Recency(4.0) + Freq(capped at 4.0)*Diversity(1.0) = 2.0 + 4.0 + 4.0 = 10.0
    expect(calculateParticipationScore(data)).toBe(10.0);
  });

  // --- Diversity Tests (Active Voter, Recent Votes) ---

  it('Active voter, multiple recent votes including diverse type (2 General, 1 Special Election, 1 year ago)', () => {
    const data: VoterScoreData = {
      status: 'Active',
      historyEvents: [
        createMockEvent(1, 'GENERAL'),
        createMockEvent(1, 'SPECIAL ELECTION'), // Use a valid non-general type from options
        createMockEvent(1, 'GENERAL')
      ]
    };
    const freqPoints = 3 * 0.5; // = 1.5
    const diversityMultiplier = 1.1;
    // Expected: Base(2.0) + Recency(4.0) + Freq(1.5)*Diversity(1.1) = 2.0 + 4.0 + 1.65 = 7.65 -> rounded 7.7
    expect(calculateParticipationScore(data)).toBe(7.7);
  });

   it('Active voter, multiple recent votes hitting frequency cap including diverse type (10 votes, 1 Primary, 1 year ago)', () => {
    const history = Array(9).fill(0).map(() => createMockEvent(1, 'GENERAL'));
    history.push(createMockEvent(1, 'SPECIAL ELECTION')); // Add diverse type
    const data: VoterScoreData = {
      status: 'Active',
      historyEvents: history
    };
    const freqPoints = 4.0; // Capped
    const diversityMultiplier = 1.1;
     // Expected: Base(2.0) + Recency(4.0) + Freq(4.0)*Diversity(1.1) = 2.0 + 4.0 + 4.4 = 10.4 -> clamped 10.0
    expect(calculateParticipationScore(data)).toBe(10.0);
  });


  // --- Cap Tests ---

  it('Active voter, score clamped at MAX_SCORE (10.0)', () => {
     // Simulate conditions that would exceed 10 before clamp (e.g., high freq + diversity)
     const history = Array(10).fill(0).map(() => createMockEvent(1, 'GENERAL'));
     history.push(createMockEvent(1, 'PRIMARY RUNOFF')); // Add diverse type
     const data: VoterScoreData = {
      status: 'Active',
      historyEvents: history
    };
     // Base(2.0) + Recency(4.0) + Freq(capped 4.0)*Diversity(1.1) = 2.0 + 4.0 + 4.4 = 10.4
     // Should be clamped to 10.0
     expect(calculateParticipationScore(data)).toBe(10.0);
  });

  it('Inactive voter, score capped at MAX_SCORE_INACTIVE (4.9) even with high potential score', () => {
    // Same high-scoring history as above, but inactive status
    const history = Array(10).fill(0).map(() => createMockEvent(1, 'GENERAL'));
    history.push(createMockEvent(1, 'SPECIAL ELECTION RUNOFF')); // Add diverse type
    const data: VoterScoreData = {
     status: 'Inactive',
     historyEvents: history
   };
    // Base(1.0) + Recency(4.0) + Freq(capped 4.0)*Diversity(1.1) = 1.0 + 4.0 + 4.4 = 9.4
    // Should be capped for Inactive at 4.9
    expect(calculateParticipationScore(data)).toBe(4.9);
 });

   // --- Input Validation Tests ---

  it('should throw invariant error for missing voterData', () => {
    // @ts-expect-error - Testing invalid input (null)
    expect(() => calculateParticipationScore(null)).toThrow('voterData is required');
    // @ts-expect-error - Testing invalid input (undefined)
    expect(() => calculateParticipationScore(undefined)).toThrow('voterData is required');
  });

  it('should throw invariant error for invalid status', () => {
    // Use 'as any' to bypass TypeScript type check for the test
    const data = { status: 'Pending', historyEvents: [] } as any;
    expect(() => calculateParticipationScore(data)).toThrow('voterData.status must be \'Active\' or \'Inactive\'');
  });

  it('should throw invariant error for missing historyEvents', () => {
     // Use 'as any' to bypass TypeScript type check for the test
    const data = { status: 'Active' } as any;
    expect(() => calculateParticipationScore(data)).toThrow('voterData.historyEvents must be an array');
  });

   it('should throw invariant error for non-array historyEvents', () => {
     // Use 'as any' to bypass TypeScript type check for the test
    const data = { status: 'Active', historyEvents: 'not-an-array' } as any;
    expect(() => calculateParticipationScore(data)).toThrow('voterData.historyEvents must be an array');
  });

   it('should throw invariant error for invalid date format in historyEvents', () => {
    const data: VoterScoreData = {
      status: 'Active',
      historyEvents: [{ ...createMockEvent(1), election_date: '2023/01/01' }]
    };
    // Expect the updated invariant message
    expect(() => calculateParticipationScore(data)).toThrow('Invalid date format in history event: 2023/01/01');
  });

   it('should throw invariant error for invalid date value in historyEvents', () => {
    const data: VoterScoreData = {
      status: 'Active',
      historyEvents: [{ ...createMockEvent(1), election_date: '2023-13-01' }] // Invalid month
    };
    // Expect the updated invariant message
    expect(() => calculateParticipationScore(data)).toThrow('Invalid date value parsed from history event: 2023-13-01');
  });

}); 