import NextAuth, { DefaultSession } from 'next-auth';
import Google from 'next-auth/providers/google';
import { upsertUser } from '@/lib/db/queries';

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
      
      const [firstName = null, ...lastNameParts] = (profile.name || '').split(' ');
      const lastName = lastNameParts.join(' ') || null;

      await upsertUser({
        id: user.id,
        email: profile.email,
        firstName,
        lastName,
        image: profile.image ?? null,
        emailVerified: new Date()
      });
      
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    }
  }
});
