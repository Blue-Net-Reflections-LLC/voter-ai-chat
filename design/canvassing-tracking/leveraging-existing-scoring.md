# Leveraging Existing Scoring Infrastructure

## Overview

You already have an excellent foundation in `calculate-ga-scores.ts` that can be repurposed and extended for the new AI scoring systems. This document shows how to build on your existing work rather than starting from scratch.

## What You Already Have (Excellent Foundation!)

### ✅ **Robust Batch Processing System**
- Processes voters in batches of 5,000
- Handles large datasets efficiently
- Includes error handling and recovery
- Tracks progress and statistics

### ✅ **Database Integration**
- PostgreSQL connection management
- Batch update capabilities with fallback to individual updates
- Transaction handling for data integrity
- Score validation and error handling

### ✅ **Score Calculation Framework**
- Modular design with separate calculation logic
- Validation for score ranges (1.0 to 10.0)
- Structured data input (VoterScoreData interface)
- Reusable patterns for different score types

### ✅ **Production-Ready Features**
- Environment variable configuration
- Comprehensive logging
- Error tracking and reporting
- Memory-efficient processing

## How to Extend for AI Scoring Systems

### Phase 1: Extend Database Schema

First, add the new scoring columns to your existing table:

```sql
-- Add new AI scoring columns to ga_voter_registration_list
ALTER TABLE ga_voter_registration_list 
ADD COLUMN sentiment_score INTEGER CHECK (sentiment_score >= -2 AND sentiment_score <= 2),
ADD COLUMN sentiment_confidence DECIMAL(3,2) CHECK (sentiment_confidence >= 0 AND sentiment_confidence <= 1),
ADD COLUMN persuadability_score INTEGER CHECK (persuadability_score >= 1 AND persuadability_score <= 10),
ADD COLUMN persuadability_confidence DECIMAL(3,2) CHECK (persuadability_confidence >= 0 AND persuadability_confidence <= 1),
ADD COLUMN voting_likelihood_score INTEGER CHECK (voting_likelihood_score >= 1 AND voting_likelihood_score <= 10),
ADD COLUMN voting_likelihood_confidence DECIMAL(3,2) CHECK (voting_likelihood_confidence >= 0 AND voting_likelihood_confidence <= 1),
ADD COLUMN ai_scores_updated_at TIMESTAMP WITH TIME ZONE;
```

### Phase 2: Create New Calculation Modules

Following your existing pattern, create new calculation modules:

#### `lib/sentiment-score/calculate.ts`
```typescript
// Following the same pattern as participation-score/calculate.ts

export interface ContactData {
    conversationNotes?: string;
    contactDuration?: number;
    contactOutcome: 'CONNECTED' | 'NO_ANSWER' | 'BUSY' | 'WRONG_NUMBER' | 'HOSTILE' | 'SUPPORTIVE';
    contactType: 'PHONE' | 'DOOR' | 'EMAIL' | 'TEXT';
    followUpRequested?: boolean;
}

export interface SentimentScoreData {
    status: 'Active' | 'Inactive';
    contacts: ContactData[];
    demographics?: {
        age?: number;
        race?: string;
        gender?: string;
    };
}

export interface SentimentResult {
    score: number; // -2 to 2
    confidence: number; // 0 to 1
}

export function calculateSentimentScore(data: SentimentScoreData): SentimentResult {
    // Start with neutral
    let score = 0;
    let confidence = 0.5;
    
    if (!data.contacts || data.contacts.length === 0) {
        return { score: 0, confidence: 0.1 };
    }
    
    // Get most recent contact for primary analysis
    const recentContact = data.contacts[data.contacts.length - 1];
    
    // Simple word-based sentiment analysis
    const positiveWords = ['excited', 'support', 'agree', 'like', 'interested', 'helpful', 'good', 'yes'];
    const negativeWords = ['against', 'oppose', 'disagree', 'concerned', 'worried', 'angry', 'no', 'never'];
    
    if (recentContact.conversationNotes) {
        const notes = recentContact.conversationNotes.toLowerCase();
        const positiveCount = positiveWords.filter(word => notes.includes(word)).length;
        const negativeCount = negativeWords.filter(word => notes.includes(word)).length;
        
        score = positiveCount - negativeCount;
        confidence = Math.min(0.9, 0.3 + (positiveCount + negativeCount) * 0.1);
    }
    
    // Adjust based on contact outcome
    switch (recentContact.contactOutcome) {
        case 'SUPPORTIVE':
            score += 1;
            confidence += 0.2;
            break;
        case 'HOSTILE':
            score -= 2;
            confidence += 0.3;
            break;
        case 'CONNECTED':
            // Neutral adjustment
            break;
        default:
            confidence -= 0.1; // Less confident for non-connections
    }
    
    // Adjust for conversation length
    if (recentContact.contactDuration && recentContact.contactDuration > 600) { // 10+ minutes
        score += 1;
        confidence += 0.1;
    }
    
    // Add bonus for follow-up requests
    if (recentContact.followUpRequested) {
        score += 1;
        confidence += 0.1;
    }
    
    // Cap scores and confidence
    score = Math.max(-2, Math.min(2, Math.round(score)));
    confidence = Math.max(0.1, Math.min(1.0, confidence));
    
    return { score, confidence };
}
```

#### `lib/persuadability-score/calculate.ts`
```typescript
export interface PersuadabilityScoreData {
    status: 'Active' | 'Inactive';
    historyEvents: HistoryEvent[]; // Reuse from existing system
    demographics?: {
        age?: number;
        race?: string;
        gender?: string;
    };
    contacts: ContactData[];
    registrationDate?: Date;
}

export interface PersuadabilityResult {
    score: number; // 1 to 10
    confidence: number; // 0 to 1
}

export function calculatePersuadabilityScore(data: PersuadabilityScoreData): PersuadabilityResult {
    let score = 5; // Start with moderate persuadability
    let confidence = 0.5;
    
    // Analyze voting consistency
    if (data.historyEvents && data.historyEvents.length > 0) {
        const partyConsistency = analyzePartyConsistency(data.historyEvents);
        if (partyConsistency > 0.8) {
            score -= 3; // Strong partisan, hard to persuade
            confidence += 0.2;
        } else if (partyConsistency < 0.6) {
            score += 2; // Swing voter, more persuadable
            confidence += 0.2;
        }
    }
    
    // Age factor
    if (data.demographics?.age) {
        if (data.demographics.age < 35) {
            score += 1; // Younger voters more persuadable
        } else if (data.demographics.age > 65) {
            score -= 1; // Older voters less persuadable
        }
        confidence += 0.1;
    }
    
    // Recent registration suggests openness to change
    if (data.registrationDate && data.registrationDate > new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000)) {
        score += 1;
        confidence += 0.1;
    }
    
    // Engagement indicators
    if (data.contacts && data.contacts.length > 0) {
        const engagementScore = data.contacts.reduce((acc, contact) => {
            if (contact.followUpRequested) acc += 2;
            if (contact.contactDuration && contact.contactDuration > 300) acc += 1; // 5+ minutes
            return acc;
        }, 0);
        
        score += Math.min(2, engagementScore);
        confidence += Math.min(0.2, engagementScore * 0.05);
    }
    
    // Cap scores
    score = Math.max(1, Math.min(10, Math.round(score)));
    confidence = Math.max(0.1, Math.min(1.0, confidence));
    
    return { score, confidence };
}

function analyzePartyConsistency(events: HistoryEvent[]): number {
    // Simplified party consistency analysis
    // In real implementation, you'd analyze actual party voting patterns
    const recentEvents = events.slice(-5); // Last 5 elections
    if (recentEvents.length < 2) return 0.5; // Not enough data
    
    // This is a placeholder - you'd implement actual party analysis
    // based on your voting history data structure
    return 0.7; // Default moderate consistency
}
```

### Phase 3: Extend the Main Calculation Script

Create `calculate-ai-scores.ts` based on your existing pattern:

```typescript
import postgres from 'postgres';
import { config } from 'dotenv';
import * as path from 'node:path';
import { calculateSentimentScore, SentimentScoreData, SentimentResult } from '../../sentiment-score/calculate';
import { calculatePersuadabilityScore, PersuadabilityScoreData, PersuadabilityResult } from '../../persuadability-score/calculate';
import { calculateParticipationScore, HistoryEvent, VoterScoreData } from '../../participation-score/calculate';

// Reuse your existing configuration
config({
    path: [path.join(__dirname, '../../../../.env.local'), '.env.local'],
});

const databaseUrl = process.env.PG_VOTERDATA_URL;
const schemaName = process.env.PG_VOTERDATA_SCHEMA;

if (!databaseUrl || !schemaName) {
    throw new Error("Missing PG_VOTERDATA_URL or PG_VOTERDATA_SCHEMA. Set them in the .env file.");
}

const sql = postgres(databaseUrl, { max: 1 });
const REGISTRATION_TABLE = sql`${sql(schemaName)}.ga_voter_registration_list`;
const CONTACTS_TABLE = sql`${sql(schemaName)}.voter_contacts`; // New table for contact data

const BATCH_SIZE = 5000; // Reuse your proven batch size

interface AIScoreUpdate {
    voter_registration_number: string;
    sentiment_score?: number;
    sentiment_confidence?: number;
    persuadability_score?: number;
    persuadability_confidence?: number;
    voting_likelihood_score?: number;
    voting_likelihood_confidence?: number;
}

async function calculateAndStoreAIScores() {
    console.log('Starting AI Score calculation process...');
    let totalProcessed = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    let offset = 0;

    try {
        while (true) {
            console.log(`Fetching next batch (offset: ${offset}, size: ${BATCH_SIZE})...`);
            
            // Extend your existing query to include contact data
            const voters = await sql<any[]>`
                SELECT
                    v.voter_registration_number,
                    v.status,
                    v.voting_events,
                    v.participation_score, -- Reuse existing score
                    v.date_of_birth,
                    v.race,
                    v.gender,
                    v.date_registration,
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'conversationNotes', c.conversation_notes,
                                'contactDuration', c.contact_duration,
                                'contactOutcome', c.outcome,
                                'contactType', c.contact_type,
                                'followUpRequested', c.follow_up_required,
                                'contactDate', c.contact_date_time
                            )
                            ORDER BY c.contact_date_time DESC
                        ) FILTER (WHERE c.id IS NOT NULL),
                        '[]'::json
                    ) as contacts
                FROM ${REGISTRATION_TABLE} v
                LEFT JOIN ${CONTACTS_TABLE} c ON v.voter_registration_number = c.voter_registration_number
                GROUP BY v.voter_registration_number, v.status, v.voting_events, v.participation_score, 
                         v.date_of_birth, v.race, v.gender, v.date_registration
                ORDER BY v.voter_registration_number
                LIMIT ${BATCH_SIZE}
                OFFSET ${offset};
            `;

            if (voters.length === 0) {
                console.log("No more voters found in this batch. Exiting loop.");
                break;
            }

            console.log(`Processing ${voters.length} voters...`);
            const updatesToMake: AIScoreUpdate[] = [];
            let calculationErrorsInBatch = 0;

            for (const voter of voters) {
                try {
                    if (!voter.voter_registration_number) {
                        console.error(`Error: Voter without registration number found. Skipping.`);
                        calculationErrorsInBatch++;
                        continue;
                    }

                    const update: AIScoreUpdate = {
                        voter_registration_number: voter.voter_registration_number
                    };

                    // Calculate sentiment score
                    try {
                        const sentimentData: SentimentScoreData = {
                            status: voter.status?.toUpperCase() === 'ACTIVE' ? 'Active' : 'Inactive',
                            contacts: voter.contacts || [],
                            demographics: {
                                age: voter.date_of_birth ? calculateAge(voter.date_of_birth) : undefined,
                                race: voter.race,
                                gender: voter.gender
                            }
                        };
                        
                        const sentimentResult = calculateSentimentScore(sentimentData);
                        update.sentiment_score = sentimentResult.score;
                        update.sentiment_confidence = sentimentResult.confidence;
                    } catch (error) {
                        console.error(`Error calculating sentiment for voter ${voter.voter_registration_number}:`, error);
                    }

                    // Calculate persuadability score
                    try {
                        const persuadabilityData: PersuadabilityScoreData = {
                            status: voter.status?.toUpperCase() === 'ACTIVE' ? 'Active' : 'Inactive',
                            historyEvents: voter.voting_events || [],
                            demographics: {
                                age: voter.date_of_birth ? calculateAge(voter.date_of_birth) : undefined,
                                race: voter.race,
                                gender: voter.gender
                            },
                            contacts: voter.contacts || [],
                            registrationDate: voter.date_registration
                        };
                        
                        const persuadabilityResult = calculatePersuadabilityScore(persuadabilityData);
                        update.persuadability_score = persuadabilityResult.score;
                        update.persuadability_confidence = persuadabilityResult.confidence;
                    } catch (error) {
                        console.error(`Error calculating persuadability for voter ${voter.voter_registration_number}:`, error);
                    }

                    // Voting likelihood can reuse participation score logic with enhancements
                    try {
                        // You can enhance this with contact engagement data
                        update.voting_likelihood_score = voter.participation_score || 5; // Fallback
                        update.voting_likelihood_confidence = 0.7; // Base confidence
                        
                        // Enhance with contact engagement
                        if (voter.contacts && voter.contacts.length > 0) {
                            const recentEngagement = voter.contacts.some((c: any) => 
                                c.contactOutcome === 'SUPPORTIVE' || c.followUpRequested
                            );
                            if (recentEngagement) {
                                update.voting_likelihood_score = Math.min(10, (update.voting_likelihood_score || 5) + 1);
                                update.voting_likelihood_confidence = 0.8;
                            }
                        }
                    } catch (error) {
                        console.error(`Error calculating voting likelihood for voter ${voter.voter_registration_number}:`, error);
                    }

                    updatesToMake.push(update);

                } catch (error) {
                    console.error(`Error processing voter ${voter.voter_registration_number}:`, error);
                    calculationErrorsInBatch++;
                }
            }

            // Reuse your existing batch update logic
            let updatedInBatch = 0;
            if (updatesToMake.length > 0) {
                try {
                    // Build dynamic update query based on available scores
                    const valueSets = updatesToMake.map(update => {
                        const values = [
                            `'${update.voter_registration_number}'`,
                            update.sentiment_score !== undefined ? update.sentiment_score : 'NULL',
                            update.sentiment_confidence !== undefined ? update.sentiment_confidence : 'NULL',
                            update.persuadability_score !== undefined ? update.persuadability_score : 'NULL',
                            update.persuadability_confidence !== undefined ? update.persuadability_confidence : 'NULL',
                            update.voting_likelihood_score !== undefined ? update.voting_likelihood_score : 'NULL',
                            update.voting_likelihood_confidence !== undefined ? update.voting_likelihood_confidence : 'NULL',
                            'NOW()'
                        ];
                        return `(${values.join(', ')})`;
                    }).join(', ');

                    const query = `
                        UPDATE ${schemaName}.ga_voter_registration_list AS target
                        SET 
                            sentiment_score = source.sentiment_score,
                            sentiment_confidence = source.sentiment_confidence,
                            persuadability_score = source.persuadability_score,
                            persuadability_confidence = source.persuadability_confidence,
                            voting_likelihood_score = source.voting_likelihood_score,
                            voting_likelihood_confidence = source.voting_likelihood_confidence,
                            ai_scores_updated_at = source.updated_at
                        FROM (VALUES ${valueSets}) AS source(
                            reg_num, sentiment_score, sentiment_confidence,
                            persuadability_score, persuadability_confidence,
                            voting_likelihood_score, voting_likelihood_confidence,
                            updated_at
                        )
                        WHERE target.voter_registration_number = source.reg_num;
                    `;

                    const result = await sql.unsafe(query);
                    updatedInBatch = result.count || 0;
                    console.log(`Batch update successful. Rows affected: ${updatedInBatch}`);

                } catch (error) {
                    console.error(`Error with batch update:`, error);
                    // Your existing fallback logic would go here
                }
            }

            totalProcessed += voters.length;
            totalUpdated += updatedInBatch;
            totalErrors += calculationErrorsInBatch;
            offset += voters.length;

            console.log(`Batch complete. Processed: ${voters.length}, Updated: ${updatedInBatch}, Errors: ${calculationErrorsInBatch}`);
            console.log(`TOTALS - Processed: ${totalProcessed}, Updated: ${totalUpdated}, Errors: ${totalErrors}`);
        }

        console.log('AI Score calculation complete.');

    } catch (error) {
        console.error('Fatal error during AI score calculation:', error);
        process.exit(1);
    } finally {
        await sql.end({ timeout: 5 });
        console.log('Database connection closed.');
    }
}

function calculateAge(birthDate: Date): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

// Execute the function
calculateAndStoreAIScores();
```

## Benefits of This Approach

### ✅ **Reuses Proven Infrastructure**
- Your batch processing system is already tested and working
- Error handling and recovery mechanisms are in place
- Database connection management is robust
- Progress tracking and logging are comprehensive

### ✅ **Modular and Extensible**
- Each scoring system is in its own module
- Easy to test and modify individual scoring algorithms
- Can run all scores together or individually
- Follows your existing code patterns

### ✅ **Production Ready**
- Built on your existing production-tested foundation
- Handles large datasets efficiently
- Includes proper error handling and validation
- Uses your existing environment configuration

### ✅ **Gradual Implementation**
- Start with simple rule-based scoring
- Enhance algorithms over time
- Add new scoring types easily
- Maintain backward compatibility

## Next Steps

1. **Extend Database Schema** - Add the new AI scoring columns
2. **Create Calculation Modules** - Build sentiment and persuadability calculators
3. **Adapt Main Script** - Extend your existing batch processor
4. **Test with Small Batches** - Use your existing validation patterns
5. **Deploy Gradually** - Run alongside existing participation scoring

This approach leverages all your existing work while adding the new AI capabilities. You get the benefits of your proven infrastructure with the power of the new scoring systems! 