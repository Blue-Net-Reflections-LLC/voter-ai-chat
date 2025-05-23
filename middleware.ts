import NextAuth from 'next-auth';

import { authConfig } from '@/app/(auth)/auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    '/', 
    '/([a-zA-Z]{2})/chat/:path*',
    '/chat/:path*',
    '/login', 
    '/register', 
    '/onboarding', 
    '/chat',
    '/api/profile/:path*',
    '/admin',
    '/admin/:path*',
    '/ga/voter/:path*',
  ],
};
  