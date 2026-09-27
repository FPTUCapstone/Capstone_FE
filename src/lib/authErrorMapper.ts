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
  'auth.admin_google_sign_in_disabled':
    'Administrator accounts must sign in with email and password.',
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

/** Password/Web-only copy; never matches raw server or Firebase messages. */
export function mapPasswordSignInError(error: unknown): string {
  const value = error && typeof error === 'object' ? error as { code?: string; status?: number } : {};
  const messages: Record<string, string> = {
    'auth.invalid_credentials': 'Invalid email or password. Please try again.',
    MSG_UNVERIFIED: 'Please verify your email before signing in.',
    'auth.account_locked': 'Your account is locked. Please contact support.',
    'auth.account_inactive': 'Your account is inactive. Please contact support.',
    'auth.admin_access_required': 'T\u00e0i kho\u1ea3n n\u00e0y kh\u00f4ng c\u00f3 quy\u1ec1n truy c\u1eadp khu v\u1ef1c qu\u1ea3n tr\u1ecb. Vui l\u00f2ng \u0111\u0103ng nh\u1eadp t\u1ea1i trang d\u00e0nh cho ng\u01b0\u1eddi d\u00f9ng.',
    'auth.account_state_unresolved': 'Ch\u01b0a th\u1ec3 x\u00e1c \u0111\u1ecbnh tr\u1ea1ng th\u00e1i t\u00e0i kho\u1ea3n. Vui l\u00f2ng li\u00ean h\u1ec7 h\u1ed7 tr\u1ee3.',
    'auth.request_invalid': 'Unable to submit sign-in. Please check your details and try again.',
    INVALID_AUTH_CONTEXT: 'Ch\u01b0a th\u1ec3 ho\u00e0n t\u1ea5t \u0111\u0103ng nh\u1eadp. Vui l\u00f2ng th\u1eed l\u1ea1i.',
  };
  if (error instanceof Error && error.message === 'INVALID_AUTH_CONTEXT') return messages.INVALID_AUTH_CONTEXT;
  if (value.code && messages[value.code]) return messages[value.code];
  if (value.status === 429) return 'Too many attempts. Please wait before trying again.';
  if (value.status === 415) return 'Unable to submit sign-in. Please try again.';
  if (value.status === 500) return 'Something went wrong. Please try again later.';
  if (value.status && [502, 503, 504].includes(value.status)) return 'TripMate service is temporarily unavailable. Please try again later.';
  if (error instanceof TypeError) return 'Unable to connect to TripMate. Please check your connection and try again.';
  return 'Unable to complete sign-in. Please try again later.';
}

/** Web Google error copy is scoped separately from password/link verification. */
export function mapGoogleSignInError(error: unknown): string {
  const value = error && typeof error === 'object' ? error as { code?: string; status?: number } : {};
  const messages: Record<string, string> = {
    AUTH_TOKEN_MISSING: 'Unable to complete Google sign-in. Please try again.',
    AUTH_TOKEN_INVALID: 'Your Google authentication could not be verified. Please try again.',
    MSG_UNVERIFIED: 'Please verify your TripMate email before signing in.',
    MSG_EMAIL_NOT_VERIFIED: 'Your Google account email could not be confirmed as verified. Please verify it with Google and try again.',
    'auth.admin_google_sign_in_disabled': 'Administrator accounts must sign in with email and password.',
    'auth.firebase_unavailable': 'Google authentication service is temporarily unavailable. Please try again later.',
    'auth/popup-blocked': 'Please allow popups for TripMate and try again.',
    'auth/network-request-failed': 'Unable to connect to TripMate. Please check your connection and try again.',
    'auth/too-many-requests': 'Too many attempts. Please wait a few minutes before trying again.',
  };
  if (value.code && messages[value.code]) return messages[value.code];
  return mapPasswordSignInError(error);
}

/** Recovery token errors refer to Firebase ID-token evidence, not email-action links. */
export function mapWebRecoveryError(error: unknown): string {
  const value = error && typeof error === 'object' ? error as { code?: string; status?: number } : {};
  const messages: Record<string, string> = {
    MSG14: 'Your verification session is invalid or has expired. Please sign in and try again.',
    MSG_EMAIL_NOT_VERIFIED: 'Please verify your email before signing in.',
    AUTH_HEADER_MISSING: 'Unable to confirm email verification. Please sign in and try again.',
    'auth.verification_email_missing': 'Unable to identify the email being verified. Please sign in and try again.',
    MSG_USER_NOT_FOUND: 'Account not found. Please register first.',
    'auth.verification_unavailable': 'Email verification is temporarily unavailable. Please try again later.',
    MSG_EMAIL_SEND_FAILED: 'We could not send the verification email. Please try again.',
    MSG_COOLDOWN: 'Please wait before requesting another verification email.',
    'auth.verification_resend_not_allowed': 'This account no longer needs email verification.',
    'auth.invalid_credentials': 'Invalid email or password. Please try again.',
    FIREBASE_SESSION_MISMATCH: 'Please sign in with the email you want to verify before requesting a new link.',
    'auth/invalid-credential': 'Invalid email or password. Please try again.',
    'auth/wrong-password': 'Invalid email or password. Please try again.',
    'auth/user-not-found': 'Invalid email or password. Please try again.',
    'auth/invalid-email': 'Invalid email format. Please enter a valid email address.',
    'auth/network-request-failed': 'Unable to connect to TripMate. Please check your connection and try again.',
    'auth/too-many-requests': 'Too many attempts. Please wait a few minutes before trying again.',
  };
  if (value.code && messages[value.code]) return messages[value.code];
  return mapPasswordSignInError(error);
}

/**
 * UC-06 password reset errors. MSG14 gets reset-specific copy here instead of
 * rewording the shared entry, which email-verification flows still rely on.
 * The mapping is stateless: the Backend owns wrong-attempt counting and OTP
 * validity, so repeated MSG14 responses map identically and no remaining-
 * attempt count is ever produced.
 */
export function mapPasswordResetError(error: unknown): string {
  const value = error && typeof error === 'object' ? error as { code?: string; status?: number } : {};
  if (value.code === 'MSG14') {
    return 'The verification code is invalid or has expired. Please try again or request a new code.';
  }
  if (value.status === 429) {
    return 'Too many attempts. Please wait before trying again.';
  }
  if (error instanceof TypeError) {
    return 'Unable to connect to TripMate. Please check your connection and try again.';
  }
  if (value.code && AUTH_ERROR_MESSAGES[value.code]) {
    return AUTH_ERROR_MESSAGES[value.code];
  }
  return AUTH_ERROR_MESSAGES.MSG127;
}
