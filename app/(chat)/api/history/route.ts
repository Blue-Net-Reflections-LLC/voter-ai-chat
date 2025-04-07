import { auth } from '@/app/(auth)/auth';
import { getChatsByUserId } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const state = searchParams.get('state');

  console.log(`[API History] Fetching history for user ${session.user.id} and state: ${state}`);
  
  const chats = await getChatsByUserId({ id: session.user.id });

  return NextResponse.json(chats);
}
