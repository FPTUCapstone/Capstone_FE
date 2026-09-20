import {
  confirmPasswordReset,
  requestPasswordReset,
  webLogin,
  webResendVerification,
  type PasswordResetConfirmInput,
  type PasswordResetMessageDto,
  type WebLoginRequest,
} from '@/lib/authApi';
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
 * UC-06 password reset orchestration — the Backend is the sole password
 * authority, so these functions only normalize the email (like Web sign-in)
 * and forward to the Backend endpoints. No Firebase password action exists on
 * this path. The request response is enumeration-safe; callers must not
 * interpret it as evidence that an account exists.
 */
export async function requestWebPasswordReset(email: string): Promise<PasswordResetMessageDto> {
  return requestPasswordReset(normalize(email));
}

/**
 * Confirm a password reset. The OTP travels as a verbatim string (leading
 * zeros preserved); the FE-only confirmPassword never reaches the Backend
 * because it is not part of the input. Wrong-attempt accounting and OTP
 * validity are Backend-authoritative; the FE keeps no counter.
 */
export async function confirmWebPasswordReset(input: PasswordResetConfirmInput): Promise<PasswordResetMessageDto> {
  return confirmPasswordReset({
    email: normalize(input.email),
    code: input.code,
    newPassword: input.newPassword,
  });
}

export async function resendWebVerification(
  email: string,
  password: string,
): Promise<void> {
  await webResendVerification({ email: normalize(email), password });
}
