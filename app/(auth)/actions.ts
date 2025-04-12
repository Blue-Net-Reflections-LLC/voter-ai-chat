'use server';

import { signIn, signOut } from './auth';

export async function googleAuthenticate() {
  await signIn('google', {
    callbackUrl: '/chat-google',
    redirect: true
  });
}

export async function signOutAction() {
  await signOut({
    redirectTo: '/',
    redirect: true
  });
}
