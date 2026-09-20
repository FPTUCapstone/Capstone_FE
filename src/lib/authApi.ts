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

/**
 * D02 Web sign-out: POSTs the cookie-only logout contract. Success is the HTTP
 * status alone — the backend answers a direct DTO ({"message": ...}) instead of
 * the ApiResponse envelope, and an idempotent 200 (missing cookie) is still
 * success. Non-2xx reuses the shared ProblemDetails ApiError mapping; a network
 * throw keeps the session recoverable, exactly like webRefresh.
 */
async function webSignOut(path: 'logout' | 'logout-all'): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/auth/web/${path}`, { method: 'POST', credentials: 'include' });
  } catch {
    throw { code: 'NETWORK', message: 'Sign out unavailable.', status: 0 } satisfies ApiError;
  }
  if (!res.ok) return handleResponse<never>(res);
}

export function webLogout(): Promise<void> {
  return webSignOut('logout');
}

/** Revokes every active refresh session belonging to the cookie's user. */
export function webLogoutAll(): Promise<void> {
  return webSignOut('logout-all');
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
