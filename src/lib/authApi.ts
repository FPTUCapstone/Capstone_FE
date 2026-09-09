/**
 * Auth API client — FE-UC01 (Register, VerifyEmail, GoogleAuth).
 * Communicates with TripMate backend using Firebase ID tokens.
 */

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
  status: string;
  accessToken: string;
  refreshToken: string;
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
    errors: fieldErrors ?? (body?.errors as Record<string, string>),
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
  const res = await fetch(`${API_BASE}/auth/google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ idToken }),
  });
  return handleResponse<GoogleAuthResponse>(res);
}

// ─── Token helpers ────────────────────────────────────────────────────────────

export function saveTokens(accessToken: string, refreshToken: string, user?: { email?: string; fullName?: string }): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('tripmate_access_token', accessToken);
  localStorage.setItem('tripmate_refresh_token', refreshToken);
  if (user) {
    localStorage.setItem('tripmate_user', JSON.stringify(user));
  }
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('tripmate_access_token');
  localStorage.removeItem('tripmate_refresh_token');
  localStorage.removeItem('tripmate_user');
}
