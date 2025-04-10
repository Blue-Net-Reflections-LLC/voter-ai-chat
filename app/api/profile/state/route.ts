import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { updateUserProfile } from '@/lib/db/queries';

console.log('LOADING API ROUTE: /api/profile/state/route.ts'); // <-- Add root log

// Basic validation for state abbreviations (2 uppercase letters)
const isValidStateAbbr = (abbr: string): boolean => {
  return /^[A-Z]{2}$/.test(abbr);
};

export async function PUT(request: Request) {
  console.log('[/api/profile/state] PUT request received'); // Log entry
  
  const session = await auth();
  if (!session?.user?.id) {
    console.error('[/api/profile/state] Unauthorized - No session or user ID');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = session.user.id;
  console.log(`[/api/profile/state] Authenticated user ID: ${userId}`);

  try {
    const { selectedState } = await request.json();
    console.log(`[/api/profile/state] Received state from body: ${selectedState}`);

    if (!selectedState || typeof selectedState !== 'string' || !isValidStateAbbr(selectedState)) {
      console.warn(`[/api/profile/state] Invalid state received: ${selectedState}`);
      return NextResponse.json(
        { error: 'Invalid state abbreviation provided. Must be 2 uppercase letters.' },
        { status: 400 }
      );
    }

    // TODO: Optional - Add check here to ensure the selectedState is one of the *currently supported* states
    // (e.g., fetch supported states list or check against a config)
    // For now, we allow any valid 2-letter code to be saved.

    try {
      console.log(`[/api/profile/state] Attempting to call updateUserProfile for user ${userId} with state ${selectedState}`);
      await updateUserProfile(userId, { selectedState }); 
      console.log(`[/api/profile/state] updateUserProfile call completed successfully for user ${userId}`);
    } catch (dbError) {
        console.error(`[/api/profile/state] Error calling updateUserProfile for user ${userId}:`, dbError);
        // Re-throw to be caught by the outer catch block, which returns 500
        throw dbError;
    }

    return NextResponse.json({ selectedState });
  } catch (error) {
    // Log errors from JSON parsing or the updateUserProfile call
    console.error('[/api/profile/state] Error processing PUT request:', error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to update selected state' },
      { status: 500 }
    );
  }
} 