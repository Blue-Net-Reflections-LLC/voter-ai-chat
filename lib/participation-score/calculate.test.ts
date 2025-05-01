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
    // Expected: Base(2.0) + Recency(4.0) + Freq(1.3*ln(2)≈0.9)*Div(1.0) = 6.9
    expect(calculateParticipationScore(data)).toBe(6.9);
  });

   it('Inactive voter, 1 recent vote (1 year ago)', () => {
    const data: VoterScoreData = {
      status: 'Inactive',
      historyEvents: [createMockEvent(1, 'GENERAL')]
    };
    // Expected: Base(1.0) + Recency(4.0) + Freq(≈0.9)*Div(1.0) = 5.9 -> Capped 4.9
    expect(calculateParticipationScore(data)).toBe(4.9);
  });

  it('Active voter, 1 mid-recency vote (4 years ago)', () => {
    const data: VoterScoreData = {
      status: 'Active',
      historyEvents: [createMockEvent(4, 'GENERAL')]
    };
     // Expected: Base(2.0) + Recency(2.0) + Freq(≈0.9)*Div(1.0) = 4.9
    expect(calculateParticipationScore(data)).toBe(4.9);
  });

  it('Inactive voter, 1 mid-recency vote (4 years ago)', () => {
    const data: VoterScoreData = {
      status: 'Inactive',
      historyEvents: [createMockEvent(4, 'GENERAL')]
    };
     // Expected: Base(1.0) + Recency(2.0) + Freq(≈0.9)*Div(1.0) = 3.9
    expect(calculateParticipationScore(data)).toBe(3.9);
  });

  it('Active voter, 1 old vote (7 years ago)', () => {
    const data: VoterScoreData = {
      status: 'Active',
      historyEvents: [createMockEvent(7, 'GENERAL')]
    };
    // Expected: Base(2.0) + Recency(1.0) + Freq(≈0.9)*Div(1.0) = 3.9
    expect(calculateParticipationScore(data)).toBe(3.9);
  });

  it('Inactive voter, 1 old vote (7 years ago)', () => {
    const data: VoterScoreData = {
      status: 'Inactive',
      historyEvents: [createMockEvent(7, 'GENERAL')]
    };
    // Expected: Base(1.0) + Recency(1.0) + Freq(≈0.9)*Div(1.0) = 2.9
    expect(calculateParticipationScore(data)).toBe(2.9);
  });

  it('Active voter, 1 very old vote (> 8 years ago)', () => {
    const data: VoterScoreData = {
      status: 'Active',
      historyEvents: [createMockEvent(9, 'GENERAL')]
    };
    // Expected: Base(2.0) + Recency(0.0) + Freq(≈0.9)*Div(1.0) = 2.9
    expect(calculateParticipationScore(data)).toBe(2.9);
  });

   it('Inactive voter, 1 very old vote (> 8 years ago)', () => {
    const data: VoterScoreData = {
      status: 'Inactive',
      historyEvents: [createMockEvent(9, 'GENERAL')]
    };
    // Expected: Base(1.0) + Recency(0.0) + Freq(≈0.9)*Div(1.0) = 1.9
    expect(calculateParticipationScore(data)).toBe(1.9);
  });

   // --- Frequency Tests (Active Voter, Recent Votes) ---

  it('Active voter, multiple recent votes (3 votes, 1 year ago)', () => {
    const data: VoterScoreData = {
      status: 'Active',
      historyEvents: [
        createMockEvent(1, 'GENERAL'),
        createMockEvent(1, 'GENERAL'),
        createMockEvent(1, 'GENERAL')
      ]
    };
    // Expected: Base(2.0) + Recency(4.0) + Freq(1.3*ln(4)≈1.8)*Div(1.0) = 7.8
    expect(calculateParticipationScore(data)).toBe(7.8);
  });

  it('Active voter, enough recent votes to approach frequency cap (10 votes, 1 year ago)', () => {
    const history = Array(10).fill(0).map(() => createMockEvent(1, 'GENERAL'));
    const data: VoterScoreData = {
      status: 'Active',
      historyEvents: history
    };
    // Expected: Base(2.0) + Recency(4.0) + Freq(1.3*ln(11)≈3.12)*Div(1.0) = 9.12 -> 9.1
    expect(calculateParticipationScore(data)).toBe(9.1);
  });

  // --- Diversity Tests (Active Voter, Recent Votes) ---

  it('Active voter, multiple recent votes including diverse type (2 General, 1 Special Election, 1 year ago)', () => {
    const data: VoterScoreData = {
      status: 'Active',
      historyEvents: [
        createMockEvent(1, 'GENERAL'),
        createMockEvent(1, 'SPECIAL ELECTION'),
        createMockEvent(1, 'GENERAL')
      ]
    };
    // Freq points = 1.3*ln(4) ≈ 1.80
    // Expected: Base(2.0) + Recency(4.0) + Freq(1.80)*Div(1.1) = 2.0 + 4.0 + 1.98 = 7.98 -> 8.0
    expect(calculateParticipationScore(data)).toBe(8.0);
  });

   it('Active voter, multiple recent votes approaching frequency cap including diverse type (10 votes, 1 Special Election, 1 year ago)', () => {
    const history = Array(9).fill(0).map(() => createMockEvent(1, 'GENERAL'));
    history.push(createMockEvent(1, 'SPECIAL ELECTION'));
    const data: VoterScoreData = {
      status: 'Active',
      historyEvents: history
    };
    // Freq points = 1.3*ln(11) ≈ 3.12
    // Expected: Base(2.0) + Recency(4.0) + Freq(3.12)*Div(1.1) = 2.0 + 4.0 + 3.43 = 9.43 -> 9.4
    expect(calculateParticipationScore(data)).toBe(9.4);
  });


  // --- Cap Tests ---

  it('Active voter, score clamped at MAX_SCORE (10.0)', () => {
     // Use 20 votes w/ diversity to ensure score > 10 before clamp
     const history = Array(19).fill(0).map(() => createMockEvent(1, 'GENERAL'));
     history.push(createMockEvent(1, 'PRIMARY RUNOFF'));
     const data: VoterScoreData = {
      status: 'Active',
      historyEvents: history
    };
     // Freq points = 1.3*ln(21) ≈ 3.95
     // Expected: Base(2.0) + Recency(4.0) + Freq(3.95)*Div(1.1) = 2.0 + 4.0 + 4.345 = 10.345 -> clamped 10.0
     expect(calculateParticipationScore(data)).toBe(10.0);
  });

  it('Inactive voter, score capped at MAX_SCORE_INACTIVE (4.9) even with high potential score', () => {
    // Use 20 votes w/ diversity
    const history = Array(19).fill(0).map(() => createMockEvent(1, 'GENERAL'));
    history.push(createMockEvent(1, 'SPECIAL ELECTION RUNOFF'));
    const data: VoterScoreData = {
     status: 'Inactive',
     historyEvents: history
   };
    // Freq points = 1.3*ln(21) ≈ 3.95
    // Potential: Base(1.0) + Recency(4.0) + Freq(3.95)*Div(1.1) = 1.0 + 4.0 + 4.345 = 9.345 -> capped 4.9
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

  // --- Specific Logarithmic Frequency Tests (Active, Recent) ---
  // Base = 2.0, Recency = 4.0, Diversity = 1.0 for these

  it('Log Freq: 1 vote', () => {
      const data: VoterScoreData = { status: 'Active', historyEvents: [createMockEvent(1)] };
      // Freq = 1.3*ln(2) ≈ 0.9. Score = 2.0 + 4.0 + 0.9 = 6.9
      expect(calculateParticipationScore(data)).toBe(6.9);
  });

  it('Log Freq: 3 votes', () => {
      const history = Array(3).fill(0).map(() => createMockEvent(1));
      const data: VoterScoreData = { status: 'Active', historyEvents: history };
      // Freq = 1.3*ln(4) ≈ 1.8. Score = 2.0 + 4.0 + 1.8 = 7.8
      expect(calculateParticipationScore(data)).toBe(7.8);
  });

  it('Log Freq: 8 votes', () => {
      const history = Array(8).fill(0).map(() => createMockEvent(1));
      const data: VoterScoreData = { status: 'Active', historyEvents: history };
      // Freq = 1.3*ln(9) ≈ 2.86. Score = 2.0 + 4.0 + 2.86 = 8.86 -> 8.9
      expect(calculateParticipationScore(data)).toBe(8.9);
  });

  it('Log Freq: 15 votes', () => {
      const history = Array(15).fill(0).map(() => createMockEvent(1));
      const data: VoterScoreData = { status: 'Active', historyEvents: history };
      // Freq = 1.3*ln(16) ≈ 3.60. Score = 2.0 + 4.0 + 3.6 = 9.6
      expect(calculateParticipationScore(data)).toBe(9.6);
  });

  it('Log Freq: 20 votes (approaching cap)', () => {
      const history = Array(20).fill(0).map(() => createMockEvent(1));
      const data: VoterScoreData = { status: 'Active', historyEvents: history };
      // Freq = 1.3*ln(21) ≈ 3.95. Score = 2.0 + 4.0 + 3.95 = 9.95 -> 10.0
      expect(calculateParticipationScore(data)).toBe(10.0);
  });

  it('Log Freq: 30 votes (hits cap)', () => {
      const history = Array(30).fill(0).map(() => createMockEvent(1));
      const data: VoterScoreData = { status: 'Active', historyEvents: history };
      // Freq = 1.3*ln(31) ≈ 4.46 -> capped at 4.0. Score = 2.0 + 4.0 + 4.0 = 10.0
      expect(calculateParticipationScore(data)).toBe(10.0);
  });

}); 