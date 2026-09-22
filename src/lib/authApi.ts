/**
 * Auth API client — FE-UC01 (Register, VerifyEmail, GoogleAuth).
 * Communicates with TripMate backend using Firebase ID tokens.
 */

import { AuthStorage, InvalidAuthContextError, type WebAuthContext } from '@/features/auth/session/authSession';
import { extractFieldErrors } from './authErrorMapper';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

// ─── Request / Response types ────────────────────────────────────────────────

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
  acceptedTerms: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  userId: number;
  email: string;
  fullName: string;
  role: number | string;
  status: number | string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAtUtc: string;
}

export interface RegisterResponse {
  userId: number;
  email: string;
  fullName: string;
  role: string;
  status: string;
  messageCode: string;
}

export interface VerifyEmailResponse {
  userId: number;
  email: string;
  status: string;
  emailVerifiedAt: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAtUtc: string;
}

export interface GoogleAuthResponse {
  userId: number;
  email: string;
  fullName: string;
  role: string;
  status: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAtUtc: string;
  isNewAccount: boolean;
}

// ─── Standardised API error ───────────────────────────────────────────────────

export interface ApiError {
  /** Top-level BE error code, e.g. "MSG03" */
  code?: string;
  /** Human-readable message from BE */
  message?: string;
  /** Field-level validation errors: { fieldName: "MSG01" } */
  errors?: Record<string, string>;
  /** HTTP status code */
  status: number;
}

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as { status?: unknown }).status === 'number'
  );
}

interface RawApiErrorBody {
  code?: string;
  errorCode?: string;
  messageCode?: string;
  message?: string;
  title?: string;
}

interface RawApiEnvelope<T> {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: T;
  errors?: Record<string, string | string[]> | { code?: string };
}

async function handleResponse<T>(res: Response): Promise<T> {
  let body: RawApiEnvelope<T> & RawApiErrorBody = {};
  try {
    body = (await res.json()) as RawApiEnvelope<T> & RawApiErrorBody;
  } catch {
    // non-JSON body
  }

  if (res.ok && body.success === true) {
    return (body.data !== undefined ? body.data : body) as T;
  }

  // Extract error code from envelope (errors.code) or top-level fields
  let errorCode: string | undefined = body?.code ?? body?.errorCode ?? body?.messageCode;
  let fieldErrors: Record<string, string> | undefined;

  if (body?.errors && typeof body.errors === 'object') {
    if ('code' in body.errors && typeof body.errors.code === 'string') {
      errorCode = body.errors.code;
    } else {
      fieldErrors = extractFieldErrors(body.errors as Record<string, string | string[]>);
    }
  }

  const apiError: ApiError = {
    code: errorCode,
    message: body?.message ?? body?.title,
    errors: fieldErrors,
    status: body?.statusCode ?? res.status,
  };
  throw apiError;
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

export async function registerTraveler(data: RegisterRequest, idToken?: string): Promise<RegisterResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  return handleResponse<RegisterResponse>(res);
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse<LoginResponse>(res);
}

export async function verifyEmail(idToken: string): Promise<VerifyEmailResponse> {
  const res = await fetch(`${API_BASE}/auth/verify-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
  });
  return handleResponse<VerifyEmailResponse>(res);
}

export async function googleAuth(idToken: string): Promise<GoogleAuthResponse> {
  // Body-only (UC-04 v2.0 §6.3): the Bearer header is no longer an input channel.
  const res = await fetch(`${API_BASE}/auth/google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ idToken }),
  });
  return handleResponse<GoogleAuthResponse>(res);
}

// ─── Token helpers ────────────────────────────────────────────────────────────

export function saveTokens(accessToken: string, refreshToken: string, user?: { email?: string; fullName?: string; role?: string }): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('tripmate_access_token', accessToken);
  localStorage.setItem('tripmate_refresh_token', refreshToken);
  if (user) {
    localStorage.setItem('tripmate_user', JSON.stringify(user));
  }
}

export interface WebLoginRequest {
  email: string;
  password: string;
  keepMeSignedIn?: boolean;
}

async function webSignIn(path: string, body: object, keepMeSignedIn: boolean, google: boolean): Promise<WebAuthContext & { isNewAccount?: boolean }> {
  const res = await fetch(`${API_BASE}/auth/web/${path}`, {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  // Rejected/network requests preserve the previous memory session and cookie.
  if (!res.ok) return handleResponse<never>(res);
  try {
    const envelope: unknown = await res.json();
    if (!envelope || typeof envelope !== 'object' || !('success' in envelope) || envelope.success !== true || !('data' in envelope)) throw new InvalidAuthContextError();
    const data = envelope.data;
    if (google && (!data || typeof data !== 'object' || !('isNewAccount' in data) || typeof data.isNewAccount !== 'boolean')) throw new InvalidAuthContextError();
    const context = AuthStorage.accept(data, keepMeSignedIn);
    return google ? Object.freeze({ ...context, isNewAccount: (data as { isNewAccount: boolean }).isNewAccount }) : context;
  } catch {
    AuthStorage.clear();
    // Server cookie cleanup belongs to D02; local deletion does not revoke a session.
    throw new InvalidAuthContextError();
  }
}

export function webLogin(data: WebLoginRequest, administrator = false): Promise<WebAuthContext> {
  const keepMeSignedIn = data.keepMeSignedIn ?? false;
  return webSignIn(administrator ? 'admin/login' : 'login', {
    email: data.email.trim().toLowerCase(), password: data.password, keepMeSignedIn,
  }, keepMeSignedIn, false);
}

export async function webGoogleAuth(idToken: string, keepMeSignedIn = false): Promise<WebAuthContext & { isNewAccount: boolean }> {
  return await webSignIn('google', { idToken, keepMeSignedIn }, keepMeSignedIn, true) as WebAuthContext & { isNewAccount: boolean };
}

/**
 * S01 session restoration: redeems the HttpOnly tripmate_refresh cookie for the
 * authoritative current Web auth context. No body, credentials included. A
 * rejected or malformed response leaves the session genuinely unauthenticated;
 * it never authenticates from persisted display metadata.
 */
export async function webRefresh(): Promise<WebAuthContext> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/auth/web/refresh`, { method: 'POST', credentials: 'include' });
  } catch {
    // Network/timeout is recoverable state, not proof of an invalid session:
    // an existing in-memory context must survive; the caller retries later.
    throw { code: 'NETWORK', message: 'Session restore unavailable.', status: 0 } satisfies ApiError;
  }
  if (!res.ok) {
    // Definitive invalid/blocked session (401/403): genuinely unauthenticated.
    AuthStorage.clear();
    return handleResponse<never>(res);
  }
  try {
    const envelope: unknown = await res.json();
    if (!envelope || typeof envelope !== 'object' || !('success' in envelope) || envelope.success !== true || !('data' in envelope)) throw new InvalidAuthContextError();
    return AuthStorage.accept(envelope.data, false);
  } catch {
    AuthStorage.clear();
    throw new InvalidAuthContextError();
  }
}

/** Revokes only the refresh session represented by this browser's HttpOnly cookie. */
export async function webLogout(): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/web/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) return handleResponse<never>(res);

  await handleResponse<boolean>(res);
  AuthStorage.clear();
}

export async function webVerifyEmail(idToken: string): Promise<{ emailVerified: true }> {
  const res = await fetch(`${API_BASE}/auth/web/verify-email`, {
    method: 'POST', credentials: 'omit', headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) return handleResponse<never>(res);
  try {
    const envelope: unknown = await res.json();
    if (envelope && typeof envelope === 'object' && 'success' in envelope && envelope.success === true && 'data' in envelope) {
      const data = envelope.data;
      if (data && typeof data === 'object' && 'emailVerified' in data && data.emailVerified === true && Object.keys(data).length === 1) return { emailVerified: true };
    }
  } catch { /* A malformed verify result never changes the existing auth session. */ }
  throw { code: 'INVALID_VERIFICATION_RESPONSE', status: res.status } satisfies ApiError;
}

// ─── UC-06 password reset ─────────────────────────────────────────────────────

export interface PasswordResetMessageDto {
  message: string;
}

export interface PasswordResetConfirmInput {
  email: string;
  code: string;
  newPassword: string;
}

/**
 * UC-06 reset endpoints answer 2xx with a DIRECT `{ message }` DTO — not the
 * legacy `{ success, data }` envelope — while errors use ProblemDetails /
 * ValidationProblemDetails, which `handleResponse` already normalizes.
 */
async function handleDirectMessageResponse(res: Response): Promise<PasswordResetMessageDto> {
  if (!res.ok) return handleResponse<never>(res);
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = undefined;
  }
  if (
    body &&
    typeof body === 'object' &&
    'message' in body &&
    typeof (body as { message?: unknown }).message === 'string' &&
    Object.keys(body as Record<string, unknown>).length === 1
  ) {
    return body as PasswordResetMessageDto;
  }
  throw { code: 'INVALID_RESET_RESPONSE', status: res.status } satisfies ApiError;
}

async function postJson(path: string, body: unknown): Promise<Response> {
  return fetch(`${API_BASE}/auth${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/**
 * Request a password-reset OTP. The Backend answers enumeration-safely; the
 * FE must never interpret the response as evidence that an account exists.
 * The OTP never appears in this exchange.
 */
export async function requestPasswordReset(email: string): Promise<PasswordResetMessageDto> {
  const res = await postJson('/password-reset/request', { email });
  return handleDirectMessageResponse(res);
}

/**
 * Confirm a password reset. The body is exactly { email, code, newPassword }:
 * the OTP travels as a verbatim string (leading zeros preserved) and the
 * FE-only confirmPassword can never be attached because it is not an input.
 */
export async function confirmPasswordReset(input: PasswordResetConfirmInput): Promise<PasswordResetMessageDto> {
  const res = await postJson('/password-reset/confirm', {
    email: input.email,
    code: input.code,
    newPassword: input.newPassword,
  });
  return handleDirectMessageResponse(res);
}
