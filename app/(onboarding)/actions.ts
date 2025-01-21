'use server'

import { updateUserProfile } from '@/lib/db/queries'

export async function createProfile(userId: string, role: string) {
  try {
    await updateUserProfile(userId, { role })
    return true
  } catch (error) {
    console.error('Failed to create user profile:', error)
    throw new Error('Failed to create user profile')
  }
} 