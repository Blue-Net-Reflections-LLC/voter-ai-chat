import { auth } from '@/app/(auth)/auth'
import { getUserProfile } from '@/lib/db/queries'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    console.log("Profile Check - No user ID in session")
    return NextResponse.json({ hasRole: false })
  }

  const profile = await getUserProfile(session.user.id)
  console.log("Profile Check - User Profile:", profile)
  return NextResponse.json({ 
    hasRole: !!profile?.role 
  })
} 
