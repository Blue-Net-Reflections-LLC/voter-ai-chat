import NextAuth, { DefaultSession } from 'next-auth';
import Google from 'next-auth/providers/google';
import { upsertUser, getUserIdByEmail, createUserProfile, getUserProfile } from '@/lib/db/queries';


// Extend the built-in session type
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
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
        const existingId = await getUserIdByEmail(session.user.email);
        session.user.id = existingId || token.sub!;
      }
      return session;
    }
  }
});
