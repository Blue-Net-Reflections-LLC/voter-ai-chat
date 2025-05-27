# AI Scoring Systems - How They Work (Non-Technical Guide)

## Overview

This document explains **what** our AI scoring systems do and **how** they work in plain language, plus provides practical implementation guidance that doesn't require deep machine learning expertise.

Think of these AI systems as **smart calculators** that look at lots of information about a voter and give you useful scores to help make campaign decisions.

## The Three Scoring Systems Explained

### 1. Sentiment Scoring: "How does this voter feel about us?"

**What it does:**
- Reads conversation notes from phone calls, door knocks, etc.
- Gives a score from -2 to +2 showing how the voter feels
- -2 = Very Negative (angry, hostile)
- 0 = Neutral (undecided)
- +2 = Very Positive (enthusiastic supporter)

**How it works:**
1. **Reads the conversation notes** - Looks for positive words ("excited", "support") and negative words ("concerned", "against")
2. **Considers the context** - A 30-minute conversation is more meaningful than a 2-minute one
3. **Looks at voter history** - If they were positive before and negative now, that's significant
4. **Gives a final score** - Combines all factors into one simple number

**Real Example:**
- Conversation: "I'm really excited about the healthcare plan, but I'm worried about the cost"
- Duration: 15 minutes (good engagement)
- Previous sentiment: Neutral (0)
- **Result: +1 (Positive)** - Excitement outweighs concern, good engagement time

### 2. Persuadability Scoring: "Can we change this voter's mind?"

**What it does:**
- Predicts how likely a voter is to change their position
- Gives a score from 1 to 10
- 1-2 = Very Hard to Persuade (strong partisan)
- 5-6 = Moderate (genuinely undecided)
- 9-10 = Very Persuadable (actively looking for information)

**How it works:**
1. **Looks at voting history** - Do they always vote for the same party, or do they switch?
2. **Considers demographics** - Younger voters and recent movers are often more persuadable
3. **Analyzes engagement** - Do they ask questions? Request information?
4. **Tracks sentiment changes** - If their feelings change over time, they're more persuadable

**Real Example:**
- Voter: 35-year-old who moved recently, voted for different parties in past elections
- Behavior: Asks lots of questions, requests candidate information
- Sentiment: Has changed from neutral to slightly positive over 3 contacts
- **Result: 8 (High Persuadability)** - Good target for campaign resources

### 3. Voting Likelihood: "Will this voter actually show up to vote?"

**What it does:**
- Predicts probability that voter will turn out on election day
- Gives a score from 1 to 10
- 1-2 = Very Unlikely (rarely votes)
- 5-6 = Moderate (sometimes votes)
- 9-10 = Very Likely (always votes)

**How it works:**
1. **Checks voting history** - Have they voted in past elections? Which types?
2. **Considers life factors** - Age, education, homeownership (older, educated homeowners vote more)
3. **Measures current engagement** - Are they asking about voting procedures? Attending events?
4. **Factors in election context** - Competitive races drive higher turnout

**Real Example:**
- Voter: 45-year-old homeowner, college educated
- History: Voted in 8 of last 10 elections, including local elections
- Current: Asking about polling locations, early voting
- **Result: 9 (Very Likely)** - Reliable voter, definitely worth contacting

## How to Implement This (Practical Steps)

### Phase 1: Start Simple (No Machine Learning Required)

**Step 1: Rule-Based Sentiment Scoring**
Instead of complex AI, start with simple rules:

```
Sentiment Calculation:
1. Count positive words in conversation notes (+1 each)
2. Count negative words in conversation notes (-1 each)
3. Add bonus for long conversations (+1 if >10 minutes)
4. Add bonus for follow-up requests (+1)
5. Subtract for hostile outcomes (-2)
6. Final score = total, capped between -2 and +2
```

**Positive Words List:** excited, support, agree, like, interested, helpful, good, yes
**Negative Words List:** against, oppose, disagree, concerned, worried, angry, no, never

**Step 2: Simple Persuadability Scoring**
Use voter data you already have:

```
Persuadability Calculation:
Start with base score of 5
- If always votes same party: -3
- If votes different parties sometimes: +2
- If age 18-35: +1
- If age 65+: -1
- If moved in last 2 years: +1
- If asks questions during contact: +2
- If requests information: +1
- Final score = total, capped between 1 and 10
```

**Step 3: Basic Voting Likelihood**
Use historical voting patterns:

```
Voting Likelihood Calculation:
Base score = (Number of elections voted in / Number of elections eligible) * 10
Adjustments:
- If voted in last election: +1
- If voted in primaries: +1
- If age 65+: +1
- If college educated: +1
- If homeowner: +1
- If responded positively to contact: +1
- Final score = total, capped between 1 and 10
```

### Phase 2: Add Smart Features (Still No ML Required)

**Improve Sentiment with Context:**
- Weight recent contacts more heavily
- Consider contact type (door knocks = more reliable than texts)
- Track sentiment trends over time
- Adjust for demographic patterns you observe

**Enhance Persuadability:**
- Track how sentiment changes after contacts
- Note which messages resonate with which demographics
- Identify voters who ask follow-up questions
- Flag voters who engage with multiple contact types

**Refine Voting Likelihood:**
- Add points for voters who ask about voting procedures
- Consider local election competitiveness
- Factor in early voting requests
- Track engagement with campaign events

### Phase 3: When You're Ready for Real AI

**Option 1: Use Existing AI Services**
- **OpenAI API** for sentiment analysis of conversation notes
- **Google Cloud Natural Language** for emotion detection
- **AWS Comprehend** for text analysis
- These services do the "machine learning" for you - you just send text and get scores back

**Option 2: Partner with Data Scientists**
- Hire a consultant to build custom models using your data
- They handle the complex math, you handle the business logic
- Focus on model accuracy and bias prevention
- Ensure you understand how to maintain and update the models

**Option 3: Gradual Learning Approach**
- Start with simple rules (Phase 1)
- Collect data on what works and what doesn't
- Use that data to improve your rules
- Eventually, patterns in your data will suggest where AI could help most

## Implementation Strategy

### Week 1-2: Database Setup
```sql
-- Add simple scoring columns to your existing voter_contacts table
ALTER TABLE voter_contacts ADD COLUMN sentiment_score INTEGER;
ALTER TABLE voter_contacts ADD COLUMN persuadability_score INTEGER;
ALTER TABLE voter_contacts ADD COLUMN voting_likelihood_score INTEGER;
ALTER TABLE voter_contacts ADD COLUMN scoring_notes TEXT;
```

### Week 3-4: Build Simple Calculators
Create basic functions that:
1. Take conversation notes and voter data as input
2. Apply the simple rules above
3. Return scores and store them in database
4. Show scores on voter profile pages

### Week 5-8: Test and Refine
- Use the system with real campaign data
- Track which scores seem accurate vs. inaccurate
- Adjust the rules based on what you learn
- Get feedback from campaign staff using the system

### Week 9-12: Add Intelligence
- Implement word counting for sentiment
- Add demographic adjustments
- Create trend tracking over time
- Build simple reporting dashboards

## What You Need to Get Started

### Technical Requirements
- Ability to modify your existing database
- Basic programming skills to implement scoring functions
- Access to voter conversation notes and contact outcomes

### Data Requirements
- Voter registration data (you have this)
- Voting history (you have this)
- Contact logs with conversation notes
- Contact outcomes (successful, hostile, no answer, etc.)

### No Machine Learning Expertise Required
- Start with simple rule-based scoring
- Use existing AI services for text analysis when ready
- Focus on collecting good data and understanding patterns
- Let the complexity grow gradually as you learn

## Success Metrics (How to Know It's Working)

### Short-term (Weeks 1-4)
- Scores are being calculated and stored
- Campaign staff can see scores on voter profiles
- Scores seem reasonable (positive voters get positive scores, etc.)

### Medium-term (Weeks 5-12)
- Scores help prioritize which voters to contact
- High persuadability voters show more sentiment change
- High likelihood voters actually turn out to vote
- Campaign efficiency improves (fewer wasted contacts)

### Long-term (After election)
- Compare predicted vs. actual voting behavior
- Measure campaign resource optimization
- Track sentiment prediction accuracy
- Use results to improve scoring for next campaign

## Common Pitfalls to Avoid

1. **Don't start too complex** - Simple rules work better than broken AI
2. **Don't ignore bias** - Make sure scores are fair across demographic groups
3. **Don't trust scores blindly** - Use them as guidance, not absolute truth
4. **Don't forget privacy** - Protect voter data and follow election laws
5. **Don't skip testing** - Validate scores against real outcomes

## Getting Help

### When to Hire Experts
- If you want custom machine learning models
- If you need bias testing and fairness validation
- If you're processing millions of voter records
- If accuracy requirements are very high

### What You Can Do Yourself
- Implement rule-based scoring systems
- Use existing AI APIs for text analysis
- Build reporting and visualization tools
- Collect and organize training data for future AI

### Learning Resources
- **Sentiment Analysis**: Start with word lists and simple counting
- **Voter Behavior**: Study existing political science research
- **Data Analysis**: Learn basic statistics and pattern recognition
- **AI Services**: Explore OpenAI, Google Cloud, or AWS documentation

## Next Steps

1. **Start with Phase 1** - Implement simple rule-based scoring
2. **Collect data** - Track conversation notes and outcomes systematically
3. **Measure results** - See which scores correlate with actual voter behavior
4. **Iterate and improve** - Refine rules based on what you learn
5. **Consider AI services** - When ready, explore existing AI tools
6. **Plan for growth** - Design system to handle more sophisticated scoring later

Remember: The goal is not to build the most sophisticated AI system, but to build something that actually helps your campaign make better decisions. Start simple, learn from real data, and improve gradually. 