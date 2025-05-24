import NextAuth, { type DefaultSession } from 'next-auth';
import Google from 'next-auth/providers/google';
import { upsertUser, getUserIdByEmail, createUserProfile, getUserProfile } from '@/lib/db/queries';


// Extend the built-in session type
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      selectedState?: string | null;
      role?: string | null;
    } & DefaultSession['user']
  }
}

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? '',
    })
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ user, profile }) {
      if (!profile?.email) return false;
      if (!user.id) return false;
      if (!profile.email) return false;
      
      const nameParts = profile.name?.split(' ') || [];
      const firstName = nameParts[0] || null;
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;

      await upsertUser({
        id: user.id,
        email: profile.email as string,
        firstName,
        lastName,
        image: typeof profile.image === 'string' ? profile.image : null,
        emailVerified: new Date()
      });

      // Get the actual user ID from the database and create profile if needed
      const userId = await getUserIdByEmail(profile.email);
      if (userId) {
        await createUserProfile(userId);
      }
      
      return true;
    },
    async session({ session, token }) {
      if (session.user?.email) {
        const userId = await getUserIdByEmail(session.user.email);
        if (userId) {
          session.user.id = userId;
          // Fetch the user profile to get the selected state
          const profile = await getUserProfile(userId);
          session.user.selectedState = profile?.selectedState || null;
        } else {
          // Fallback or handle case where user ID couldn't be found after sign-in
          session.user.id = token.sub || '';
          session.user.selectedState = null;
        }
      } else {
        // Handle case where session email is missing (should not happen with Google provider)
        session.user.id = token.sub || '';
        session.user.selectedState = null;
      }
      return session;
    }
  }
});
