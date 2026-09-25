import { webLogin, webResendVerification, type WebLoginRequest } from '@/lib/authApi';
import type { WebAuthContext } from '../session/authSession';

const normalize = (email: string) => email.trim().toLowerCase();

/**
 * Web password sign-in goes directly to the TripMate Backend. The Backend is
 * the sole password authority; no Firebase password authentication is involved.
 *
 * `webLogin` may respond with `MSG_UNVERIFIED` / `MSG_EMAIL_NOT_VERIFIED` for
 * an account whose email has not yet been verified. The TripMate contract is
 * the authoritative source of that decision — re-asking Firebase to "evidence"
 * it would amount to a second password authority and is intentionally absent.
 */
export async function loginWithWebRecovery(
  input: WebLoginRequest,
  administrator: boolean,
): Promise<WebAuthContext> {
  const request = { ...input, email: normalize(input.email) };
  return webLogin(request, administrator);
}

export async function resendWebVerification(
  email: string,
  password: string,
): Promise<void> {
  await webResendVerification({ email: normalize(email), password });
}
