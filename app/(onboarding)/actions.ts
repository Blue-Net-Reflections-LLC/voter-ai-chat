'use server'

import { createUserProfile } from '@/lib/db/queries'

export async function createProfile(userId: string, role: string) {
  try {
    return await createUserProfile(userId, role)
  } catch (error) {
    console.error('Failed to create user profile:', error)
    throw new Error('Failed to create user profile')
  }
} 