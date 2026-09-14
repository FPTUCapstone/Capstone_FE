/**
 * Error message mapping — single source of truth for FE.
 * Mirrors UC-01-spec.md §5 Message Mapping table.
 */
export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  // Report 3 standard MSGxx codes
  MSG01: 'This field is required.',
  MSG02: 'Invalid email format. Please enter a valid email address (e.g., user@example.com).',
  MSG03: 'An account with this email already exists. Please sign in or use another email.',
  MSG04: 'Invalid phone number. Phone number must be 10 digits starting with 0.',
  MSG_PHONE_DUP: 'This phone number is already registered to another account.',
  MSG05: 'Password must be at least 8 characters, containing uppercase, lowercase, number, and special character.',
  MSG06: 'Passwords do not match. Please re-enter.',
  MSG_TOS: 'You must accept the Terms of Service and Privacy Policy to continue.',
  MSG07: 'Account registered successfully! Please check your email for the verification link.',
  MSG14: 'The verification link is invalid, expired, or has already been used.',
  MSG_COOLDOWN: 'Please wait before requesting another verification email.',
  MSG_UNVERIFIED: 'Please verify your email before signing in.',
  MSG_EMAIL_NOT_VERIFIED: 'Your email address has not been verified yet. Please click the verification link sent to your email.',
  MSG_USER_NOT_FOUND: 'Account not found. Please register first.',
  MSG_EMAIL_SEND_FAILED: 'We could not send the verification email. Please try again.',
  MSG_GOOGLE_TOKEN_INVALID: 'Invalid Google authentication token. Please try again.',
  MSG_RESEND_SUCCESS: 'A fresh verification link has been sent. Please check your email.',
  MSG127: 'Something went wrong. Please try again later.',

  // Backend AUTH_* error codes (ProblemDetails errorCode values)
  AUTH_TOKEN_INVALID: 'Your authentication token is invalid or has expired. Please try again.',
  AUTH_EMAIL_MISMATCH:
    'The email address does not match the account used for registration. Please try again with the same email address.',

  // Semantic Message Codes
  REGISTER_SUCCESS: 'Account registered successfully! Please check your email for the verification link.',
  VERIFICATION_EMAIL_SENT: 'A verification code has been sent to your email.',
  GOOGLE_REGISTER_SUCCESS: 'Registered with Google successfully! Welcome to TripMate.',
  EMAIL_VERIFIED: 'Email verified successfully! Welcome to TripMate.',
  FULL_NAME_REQUIRED: 'Please enter your full name.',
  FULL_NAME_INVALID: 'Full name is invalid.',
  EMAIL_REQUIRED: 'Please enter your email.',
  EMAIL_INVALID: 'Invalid email format. Please enter a valid email address.',
  EMAIL_ALREADY_EXISTS: 'An account with this email already exists. Please sign in or use another email.',
  ACCOUNT_ALREADY_ACTIVE: 'This account is already verified. Please sign in.',
  ACCOUNT_PENDING_VERIFICATION: 'This email is pending verification. Please enter the OTP or resend the verification code.',
  PASSWORD_REQUIRED: 'Please enter your password.',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters.',
  PASSWORD_POLICY_INVALID: 'Password must be at least 8 characters, containing uppercase, lowercase, number, and special character.',
  PASSWORD_CONFIRM_REQUIRED: 'Please confirm your password.',
  PASSWORD_CONFIRM_MISMATCH: 'Passwords do not match. Please re-enter.',
  PHONE_INVALID: 'Invalid phone number. Phone number must be 10 digits starting with 0.',
  PHONE_ALREADY_EXISTS: 'This phone number is already registered to another account.',
  TERMS_REQUIRED: 'You must accept the Terms of Service and Privacy Policy to continue.',
  GOOGLE_LOGIN_CANCELLED: 'Google sign-in was cancelled.',
  GOOGLE_TOKEN_INVALID: 'Invalid Google authentication token.',
  GOOGLE_REGISTER_FAILED: 'Google sign-in failed. Please try again.',
  NETWORK_ERROR: 'No internet connection. Please check your connection and try again.',
  REQUEST_TIMEOUT: 'Request timed out. Please try again.',
  SERVER_ERROR: 'The server encountered an error. Please try again later.',
  SERVICE_UNAVAILABLE: 'TripMate service is temporarily unavailable. Please try again later.',
  UNKNOWN_ERROR: 'An unknown error occurred. Please try again.',
};

/**
 * Map a BE error code and/or server-returned message to a user-facing message.
 *
 * Only known message codes and exact allow-listed user-facing messages are returned.
 * Unknown Backend text is replaced with the generic fallback.
 */
export function mapAuthError(code?: string, serverMessage?: string): string {
  if (code && AUTH_ERROR_MESSAGES[code]) {
    return AUTH_ERROR_MESSAGES[code];
  }
  if (serverMessage && Object.values(AUTH_ERROR_MESSAGES).includes(serverMessage)) {
    return serverMessage;
  }
  return AUTH_ERROR_MESSAGES.MSG127;
}

type ErrorWithCode = {
  code?: unknown;
};

const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': AUTH_ERROR_MESSAGES.EMAIL_ALREADY_EXISTS,
  'auth/expired-action-code': AUTH_ERROR_MESSAGES.MSG14,
  'auth/invalid-action-code': AUTH_ERROR_MESSAGES.MSG14,
  'auth/invalid-email': AUTH_ERROR_MESSAGES.EMAIL_INVALID,
  'auth/network-request-failed': AUTH_ERROR_MESSAGES.NETWORK_ERROR,
  'auth/too-many-requests':
    'Too many attempts. Please wait a few minutes before trying again.',
  'auth/weak-password': AUTH_ERROR_MESSAGES.PASSWORD_POLICY_INVALID,
};

/** Map Firebase errors by their stable code and never expose SDK/internal messages. */
export function mapFirebaseAuthError(error: unknown, fallback = AUTH_ERROR_MESSAGES.MSG127): string {
  if (typeof error === 'object' && error !== null) {
    const code = (error as ErrorWithCode).code;
    if (typeof code === 'string' && FIREBASE_ERROR_MESSAGES[code]) {
      return FIREBASE_ERROR_MESSAGES[code];
    }
  }

  return fallback;
}

/** Map a structured Backend error by code; unknown response text is not user-facing. */
export function getApiErrorMessage(error: unknown, fallback = AUTH_ERROR_MESSAGES.MSG127): string {
  if (typeof error === 'object' && error !== null) {
    const code = (error as ErrorWithCode).code;
    if (typeof code === 'string' && AUTH_ERROR_MESSAGES[code]) {
      return AUTH_ERROR_MESSAGES[code];
    }
  }

  return fallback;
}

/** Extract the first field-level error from a 400 BE errors object. */
export function extractFieldErrors(
  errors: Record<string, string | string[]> | undefined,
): Record<string, string> {
  if (!errors) return {};
  const mapped: Record<string, string> = {};
  for (const [field, raw] of Object.entries(errors)) {
    const val = Array.isArray(raw) ? raw[0] : raw;
    // Map known codes or allow-listed copy; replace unexpected Backend text with a safe fallback.
    mapped[field] = mapAuthError(val, val);
  }
  return mapped;
}

/** Check if an error object/string is a Firebase rate-limit (auth/too-many-requests) error. */
export function isTooManyRequestsError(err: unknown): boolean {
  if (!err) return false;
  if (typeof err === 'string') {
    return err.includes('auth/too-many-requests') || err.includes('too-many-requests');
  }
  if (typeof err === 'object') {
    const e = err as { code?: string; message?: string };
    if (e.code === 'auth/too-many-requests' || e.code === 'too-many-requests') return true;
    if (typeof e.message === 'string' && (e.message.includes('auth/too-many-requests') || e.message.includes('too-many-requests'))) return true;
  }
  return false;
}
