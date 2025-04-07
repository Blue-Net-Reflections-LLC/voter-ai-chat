import type { NextAuthConfig } from 'next-auth';

// Add minimal constants needed for state routing
const SUPPORTED_STATES = new Set(['GA']); 
const stateChatRouteRegex = /^\/([a-zA-Z]{2})\/chat(?:\/([0-9a-fA-F-]+))?$/;

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

      // Check for state routes (new addition)
      const stateRouteMatch = nextUrl.pathname.match(stateChatRouteRegex);
      const isStateChatRoute = !!stateRouteMatch;
      const urlState = isStateChatRoute ? stateRouteMatch[1].toUpperCase() : null;

      if (isLoggedIn && isOnOnboarding) {
        const { hasRole } = await checkUserProfile(nextUrl.origin, headers);
        if (hasRole) {
          return Response.redirect(new URL('/chat', nextUrl));
        }
        return true;
      }

      // If on chat, check profile
      if (isOnChat && isLoggedIn) {
        const userProfile = await checkUserProfile(nextUrl.origin, headers);
        console.log('userProfile', userProfile);
        const { hasRole, selectedState } = userProfile;
        
        if (!hasRole) {
          return Response.redirect(new URL('/onboarding', nextUrl));
        }

        // New addition: Basic state redirection if ON /chat
        // If user has a role AND selectedState, redirect to state-specific path
        if (nextUrl.pathname === '/chat' && selectedState) {
          console.log(`[AUTH] User has state ${selectedState}, redirecting from /chat`);
          return Response.redirect(new URL(`/${selectedState.toLowerCase()}/chat`, nextUrl));
        }
        
        return true;
      }

      // New addition: Handle state-specific routes
      if (isStateChatRoute && isLoggedIn) {
        // For state routes, check if state is supported
        if (!urlState || !SUPPORTED_STATES.has(urlState)) {
          console.log(`[AUTH] Unsupported state ${urlState} in URL`);
          return Response.redirect(new URL('/unsupported-state', nextUrl));
        }
        
        // Check if user's selectedState matches URL state
        const userProfile = await checkUserProfile(nextUrl.origin, headers);
        if (!userProfile.hasRole) {
          return Response.redirect(new URL('/onboarding', nextUrl));
        }
        
        if (userProfile.selectedState && 
            userProfile.selectedState.toUpperCase() !== urlState) {
          console.log(`[AUTH] State mismatch: URL=${urlState}, Profile=${userProfile.selectedState}`);
          return Response.redirect(
            new URL(`/${userProfile.selectedState.toLowerCase()}/chat`, nextUrl)
          );
        }
        
        // Allow access if state is valid
        return true;
      }

      // Protect chat route
      if (isOnChat || isOnOnboarding) {
        return isLoggedIn;
      }

      // Redirect logged-in users from login/register/home
      if (isLoggedIn && (isOnLogin || isOnRegister || isHomePage)) {
        const userProfile = await checkUserProfile(nextUrl.origin, headers);
        
        // New addition: If user has both role and state, redirect to state-specific chat
        if (userProfile.hasRole && userProfile.selectedState) {
          return Response.redirect(
            new URL(`/${userProfile.selectedState.toLowerCase()}/chat`, nextUrl)
          );
        }
        
        // Otherwise, follow existing logic
        return Response.redirect(new URL('/chat', nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
