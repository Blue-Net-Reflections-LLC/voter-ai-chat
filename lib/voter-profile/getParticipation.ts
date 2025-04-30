import { sql } from '@/lib/voter/db';

export async function getParticipation(registration_number: string) {
  const result = await sql`
    SELECT voting_events
    FROM ga_voter_registration_list
    WHERE voter_registration_number = ${registration_number}
    LIMIT 1;
  `;

  if (result.length === 0) {
    throw new Error('Voter not found');
  }

  const events = result[0].voting_events || [];
  return { history: events };
} 