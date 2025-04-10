import { auth } from '@/app/(auth)/auth'
import { getUserProfile } from '@/lib/db/queries'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    // Return both fields even if not logged in, with default values
    return NextResponse.json({ hasRole: false, selectedState: null })
  }

  const profile = await getUserProfile(session.user.id)
  
  // Return both hasRole and selectedState from the fetched profile
  return NextResponse.json({ 
    ...profile,
    hasRole: !!profile?.role, 
    selectedState: profile?.selectedState || null // Add selectedState
  })
} 
