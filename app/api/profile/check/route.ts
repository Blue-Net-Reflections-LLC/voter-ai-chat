import { auth } from '@/app/(auth)/auth'
import { getUserProfile } from '@/lib/db/queries'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ hasRole: false })
  }

  const profile = await getUserProfile(session.user.id)
      return NextResponse.json({ 
    hasRole: !!profile?.role 
  })
} 
