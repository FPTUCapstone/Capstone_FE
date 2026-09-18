import { webLogin, type WebLoginRequest } from '@/lib/authApi';
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

/**
 * TripMate Backend is the sole password authority and UC-06 password recovery
 * is not yet implemented. Resending a verification email requires a live
 * Firebase user session, which Web password sign-in no longer establishes,
 * so this action is intentionally a non-production stub.
 *
 * Production callers must NOT rely on this for password reset, forgot-password,
 * or any other password-authority flow. UC-06 will provide
 *   POST /api/v1/auth/password-reset/request
 *   POST /api/v1/auth/password-reset/confirm
 * until then, the public UI surfaces the unverified-account guidance directly
 * without issuing any Firebase email action.
 */
export async function resendWebVerification(
  email: string,
  password: string,
): Promise<void> {
  void email;
  void password;
  throw { code: 'MSG_VERIFICATION_RESEND_UNAVAILABLE', status: 409 };
}
