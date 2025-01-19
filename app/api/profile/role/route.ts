import { auth } from '@/app/(auth)/auth';
import { getUserProfile, updateUserProfile } from '@/lib/db/queries';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ role: null }, { status: 401 });
  }

  const profile = await getUserProfile(session.user.id);
  return NextResponse.json({ role: profile?.role || null });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { role } = await request.json();
    
    if (!role || typeof role !== 'string') {
      return NextResponse.json(
        { error: 'Invalid role provided' },
        { status: 400 }
      );
    }

    await updateUserProfile(session.user.id, { role });
    
    return NextResponse.json({ role });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    );
  }
} 