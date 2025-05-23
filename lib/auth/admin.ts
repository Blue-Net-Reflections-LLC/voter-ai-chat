import { auth } from '@/app/(auth)/auth';
import { getUserProfile } from '@/lib/db/queries';

/**
 * Check if the current user has admin role
 * @returns Promise<boolean> - true if user is admin, false otherwise
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return false;
    }

    const userProfile = await getUserProfile(session.user.id);
    
    return userProfile?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Middleware function to check admin access
 * Throws an error if user is not admin
 */
export async function requireAdmin(): Promise<void> {
  const isUserAdmin = await isAdmin();
  
  if (!isUserAdmin) {
    throw new Error('Admin access required');
  }
}

/**
 * Get user role from session
 * @returns Promise<string | null> - user role or null if not found
 */
export async function getUserRole(): Promise<string | null> {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return null;
    }

    const userProfile = await getUserProfile(session.user.id);
    
    return userProfile?.role || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

/**
 * Check if user has specific role
 * @param role - Role to check for
 * @returns Promise<boolean> - true if user has the role, false otherwise
 */
export async function hasRole(role: string): Promise<boolean> {
  try {
    const userRole = await getUserRole();
    return userRole === role;
  } catch (error) {
    console.error('Error checking user role:', error);
    return false;
  }
} 