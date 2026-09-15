import { sendEmailVerification, signInWithEmailAndPassword, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { isApiError, webLogin, webVerifyEmail, type WebLoginRequest } from '@/lib/authApi';
import type { WebAuthContext } from '../session/authSession';

const normalize = (email: string) => email.trim().toLowerCase();
function requireMatchingUser(user: User | null | undefined, email: string): asserts user is User {
  if (!user?.email || normalize(user.email) !== normalize(email)) throw { code: 'FIREBASE_SESSION_MISMATCH' };
}

export async function loginWithWebRecovery(input: WebLoginRequest, administrator: boolean): Promise<WebAuthContext> {
  const request = { ...input, email: normalize(input.email) };
  try { return await webLogin(request, administrator); }
  catch (error) {
    if (!isApiError(error) || error.status !== 403 || error.code !== 'MSG_UNVERIFIED') throw error;
  }
  // Firebase is evidence only; backend verification and full Web login retain account authority.
  const { user } = await signInWithEmailAndPassword(auth, request.email, request.password);
  requireMatchingUser(user, request.email);
  await user.reload();
  requireMatchingUser(user, request.email);
  if (!user.emailVerified) throw { code: 'MSG_UNVERIFIED', status: 403 };
  const freshToken = await user.getIdToken(true);
  await webVerifyEmail(freshToken);
  // Deliberately outside the initial catch: second failure cannot recurse or recover again.
  return webLogin(request, administrator);
}

export async function resendWebVerification(email: string, password: string): Promise<void> {
  const normalizedEmail = normalize(email);
  let user = auth.currentUser;
  if (!user?.email || normalize(user.email) !== normalizedEmail) {
    if (!password) throw { code: 'FIREBASE_SESSION_MISMATCH' };
    user = (await signInWithEmailAndPassword(auth, normalizedEmail, password)).user;
  }
  requireMatchingUser(user, normalizedEmail);
  await sendEmailVerification(user, { url: `${window.location.origin}/verify-email`, handleCodeInApp: false });
}
