import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

import { upsertUser } from './db/queries';

export const authOptions: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? '',
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ user, profile }) {
      if (!profile?.email) return false;
      if (!user.id) return false;
      
      const nameParts = profile.name?.split(' ') || [];
      const firstName = nameParts[0] || null;
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;

      await upsertUser({
        id: user.id,
        email: profile.email,
        firstName: firstName as string | null,
        lastName: lastName as string | null,
        // image: profile.image ?? null,
        emailVerified: new Date()
      });
      
      return true;
    }
  }
};