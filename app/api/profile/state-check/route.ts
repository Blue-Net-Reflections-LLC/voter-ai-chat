import { auth } from '@/app/(auth)/auth';
import { getUserProfile } from '@/lib/db/queries';
import { NextResponse } from 'next/server';

// This endpoint is solely responsible for returning the selectedState
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ selectedState: null });
    }

    const profile = await getUserProfile(session.user.id);
    
    return NextResponse.json({ 
      selectedState: profile?.selectedState || null 
    });
    
  } catch (error) {
    console.error('[API state-check] Error fetching selected state:', error);
    return NextResponse.json({ selectedState: null }, { status: 500 });
  }
} 