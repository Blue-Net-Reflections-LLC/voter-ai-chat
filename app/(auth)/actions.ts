'use server';

import { signIn, signOut } from './auth';

export async function googleAuthenticate({ prompt = false, callbackUrl = '/login' }: { prompt?: boolean; callbackUrl?: string }) {
  const promptObject = prompt ? { prompt: "login" } : undefined;
  await signIn('google', {
    callbackUrl: callbackUrl,
    redirect: true,
    redirectTo: callbackUrl
  }, promptObject);
}

export async function signOutAction() {
  await signOut({
    redirectTo: '/',
    redirect: true
  });
}
