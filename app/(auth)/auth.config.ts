import type { NextAuthConfig } from 'next-auth';

async function checkUserProfile(origin: string, headers: Headers) {
  const profileRes = await fetch(`${origin}/api/profile/check`, {
    credentials: 'include',
    headers: {
      cookie: headers.get('cookie') || ''
    }
  });
  return profileRes.json();
}

export const authConfig = {
  pages: {
    signIn: '/login',
    newUser: '/chat',
  },
  providers: [],
	debug: true,

  callbacks: {
    async authorized({ auth, request: { nextUrl, headers } }) {
      const isLoggedIn = !!auth?.user;
			const isHomePage = nextUrl.pathname === '/'
				const isOnChat = nextUrl.pathname.startsWith('/chat');
      const isOnRegister = nextUrl.pathname.startsWith('/register');
      const isOnLogin = nextUrl.pathname.startsWith('/login');
      const isOnOnboarding = nextUrl.pathname.startsWith('/onboarding');

      console.log("isLoggedIn", isLoggedIn);
      if (isLoggedIn && isOnOnboarding) {
        const { hasRole } = await checkUserProfile(nextUrl.origin, headers);
        if (hasRole) {
          return Response.redirect(new URL('/chat', nextUrl));
        }
        return true;
      }
      // If on chat, check profile
      if (isOnChat && isLoggedIn) {
        const { hasRole } = await checkUserProfile(nextUrl.origin, headers);
        
        if (!hasRole) {
          return Response.redirect(new URL('/onboarding', nextUrl));
        }
        return true;
      }

      // Protect chat route
      if (isOnChat || isOnOnboarding) {
        return isLoggedIn;
      }

      // Redirect logged-in users from login/register/home
      if (isLoggedIn && (isOnLogin || isOnRegister || isHomePage)) {
        return Response.redirect(new URL('/chat', nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
