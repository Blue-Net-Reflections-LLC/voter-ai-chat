import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { authConfig } from '@/app/(auth)/auth.config';

export default NextAuth(authConfig).auth;

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/register') {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/', '/:id', '/api/:path*', '/login', '/register', '/voter-management'],
};
