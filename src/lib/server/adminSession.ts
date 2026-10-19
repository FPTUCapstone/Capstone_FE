import 'server-only';

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';

export const ADMIN_ACCESS_TOKEN_COOKIE = 'tripmate_admin_access_token';
export const ADMIN_SESSION_SEAL_COOKIE = 'tripmate_admin_session_seal';
export const ADMIN_SESSION_SECRET_ENV = 'TRIPMATE_ADMIN_SESSION_SECRET';

const ADMIN_SESSION_VERSION = 'v1';
const REQUIRED_SECRET_DECODED_BYTES = 32;
const BASE64URL_UNPADDED_PATTERN = /^[A-Za-z0-9_-]+$/;
const DISALLOWED_PUBLIC_PLACEHOLDER =
  'replace-with-at-least-32-bytes-of-cryptographic-random-secret';
const MAX_SESSION_TTL_MS = 15 * 60 * 1000;
const MAX_ISSUED_AT_FUTURE_SKEW_MS = 60 * 1000;

export type AdminSessionRole = 'Administrator' | 'Staff';

export interface VerifiedAdminSession {
  role: AdminSessionRole;
  userId: number | null;
  issuedAtMs: number;
  expiresAtMs: number;
  tokenFingerprint: string;
}

interface AdminSessionSealPayload {
  v: typeof ADMIN_SESSION_VERSION;
  role: AdminSessionRole;
  uid: number | null;
  th: string;
  iat: number;
  exp: number;
}

export interface CookieStoreReader {
  get(name: string): { value: string } | undefined;
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
  };
}

function getValidatedSessionSecret(secretOverride?: string | null): Buffer | null {
  const raw =
    secretOverride !== undefined ? secretOverride : process.env[ADMIN_SESSION_SECRET_ENV];
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === DISALLOWED_PUBLIC_PLACEHOLDER) {
    return null;
  }
  if (!BASE64URL_UNPADDED_PATTERN.test(trimmed)) {
    return null;
  }
  const decoded = Buffer.from(trimmed, 'base64url');
  if (
    decoded.byteLength !== REQUIRED_SECRET_DECODED_BYTES ||
    decoded.toString('base64url') !== trimmed
  ) {
    return null;
  }
  return decoded;
}

function isValidAdminRole(value: unknown): value is AdminSessionRole {
  return value === 'Administrator' || value === 'Staff';
}

export function computeAdminTokenFingerprint(token: string): string {
  return createHash('sha256').update(token.trim(), 'utf8').digest('base64url');
}

function extractJwtUnverifiedClaims(token: string): {
  expMs: number | null;
  role: string | null;
} {
  const segments = token.trim().split('.');
  if (segments.length !== 3 || !segments[1]) {
    return { expMs: null, role: null };
  }
  try {
    const normalized = segments[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const json = Buffer.from(padded, 'base64').toString('utf8');
    const payload = JSON.parse(json) as Record<string, unknown>;
    const expRaw = payload.exp;
    const expMs =
      typeof expRaw === 'number' && Number.isFinite(expRaw) && expRaw > 0
        ? Math.floor(expRaw * 1000)
        : null;
    const roleRaw =
      payload.role ?? payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    const role = typeof roleRaw === 'string' && roleRaw.trim() ? roleRaw.trim() : null;
    return { expMs, role };
  } catch {
    return { expMs: null, role: null };
  }
}

export function createAdminSessionSeal(params: {
  token: string;
  role: AdminSessionRole;
  userId?: number | null;
  expiresAt: Date;
  nowMs?: number;
  secret?: string | null;
}): { seal: string; expiresAtMs: number } | null {
  const resolvedSecret = getValidatedSessionSecret(params.secret);
  if (!resolvedSecret) return null;

  if (typeof params.token !== 'string' || !params.token.trim()) return null;
  if (!isValidAdminRole(params.role)) return null;
  if (!(params.expiresAt instanceof Date) || !Number.isFinite(params.expiresAt.getTime())) {
    return null;
  }

  const issuedAtMs =
    typeof params.nowMs === 'number' && Number.isFinite(params.nowMs)
      ? Math.floor(params.nowMs)
      : Date.now();
  const backendExpiresAtMs = Math.floor(params.expiresAt.getTime());
  const jwtClaims = extractJwtUnverifiedClaims(params.token);
  const jwtExpiresAtMs = jwtClaims.expMs ?? backendExpiresAtMs;
  const maxAllowedExpiresAtMs = issuedAtMs + MAX_SESSION_TTL_MS;
  const effectiveExpiresAtMs = Math.min(backendExpiresAtMs, jwtExpiresAtMs, maxAllowedExpiresAtMs);

  if (!Number.isFinite(effectiveExpiresAtMs) || effectiveExpiresAtMs <= issuedAtMs) {
    return null;
  }

  const normalizedUserId =
    typeof params.userId === 'number' && Number.isSafeInteger(params.userId) && params.userId > 0
      ? params.userId
      : null;

  const payload: AdminSessionSealPayload = {
    v: ADMIN_SESSION_VERSION,
    role: params.role,
    uid: normalizedUserId,
    th: computeAdminTokenFingerprint(params.token),
    iat: issuedAtMs,
    exp: effectiveExpiresAtMs,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signingInput = `${ADMIN_SESSION_VERSION}.${encodedPayload}`;
  const signature = createHmac('sha256', resolvedSecret)
    .update(signingInput, 'utf8')
    .digest('base64url');

  return {
    seal: `${signingInput}.${signature}`,
    expiresAtMs: effectiveExpiresAtMs,
  };
}

export function verifyAdminSession(params: {
  token?: string | null;
  seal?: string | null;
  nowMs?: number;
  secret?: string | null;
}): VerifiedAdminSession | null {
  const resolvedSecret = getValidatedSessionSecret(params.secret);
  if (!resolvedSecret) return null;

  const rawToken = typeof params.token === 'string' ? params.token.trim() : '';
  const rawSeal = typeof params.seal === 'string' ? params.seal.trim() : '';
  if (!rawToken || !rawSeal) return null;

  const segments = rawSeal.split('.');
  if (segments.length !== 3) return null;
  const [version, encodedPayload, providedSignature] = segments;
  if (version !== ADMIN_SESSION_VERSION || !encodedPayload || !providedSignature) {
    return null;
  }

  const signingInput = `${version}.${encodedPayload}`;
  const expectedSignature = createHmac('sha256', resolvedSecret)
    .update(signingInput, 'utf8')
    .digest('base64url');

  const expectedSigBuffer = Buffer.from(expectedSignature, 'utf8');
  const providedSigBuffer = Buffer.from(providedSignature, 'utf8');
  if (
    expectedSigBuffer.length !== providedSigBuffer.length ||
    !timingSafeEqual(expectedSigBuffer, providedSigBuffer)
  ) {
    return null;
  }

  let parsed: unknown;
  try {
    const json = Buffer.from(encodedPayload, 'base64url').toString('utf8');
    parsed = JSON.parse(json);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== 'object') return null;
  const candidate = parsed as Record<string, unknown>;
  if (candidate.v !== ADMIN_SESSION_VERSION) return null;
  if (!isValidAdminRole(candidate.role)) return null;
  if (typeof candidate.th !== 'string' || !candidate.th) return null;
  if (typeof candidate.iat !== 'number' || !Number.isFinite(candidate.iat)) return null;
  if (typeof candidate.exp !== 'number' || !Number.isFinite(candidate.exp)) return null;
  if (
    candidate.uid !== null &&
    (typeof candidate.uid !== 'number' ||
      !Number.isSafeInteger(candidate.uid) ||
      candidate.uid <= 0)
  ) {
    return null;
  }

  const nowMs =
    typeof params.nowMs === 'number' && Number.isFinite(params.nowMs)
      ? Math.floor(params.nowMs)
      : Date.now();
  if (candidate.exp <= nowMs) return null;
  if (candidate.iat > nowMs + MAX_ISSUED_AT_FUTURE_SKEW_MS) return null;
  if (candidate.exp <= candidate.iat) return null;
  if (candidate.exp - candidate.iat > MAX_SESSION_TTL_MS) return null;

  const expectedTokenHash = computeAdminTokenFingerprint(rawToken);
  const expectedHashBuffer = Buffer.from(expectedTokenHash, 'utf8');
  const sealHashBuffer = Buffer.from(candidate.th, 'utf8');
  if (
    expectedHashBuffer.length !== sealHashBuffer.length ||
    !timingSafeEqual(expectedHashBuffer, sealHashBuffer)
  ) {
    return null;
  }

  const jwtClaims = extractJwtUnverifiedClaims(rawToken);
  if (jwtClaims.expMs !== null && jwtClaims.expMs <= nowMs) {
    return null;
  }
  if (jwtClaims.role !== null && jwtClaims.role !== candidate.role) {
    return null;
  }

  return {
    role: candidate.role,
    userId: candidate.uid ?? null,
    issuedAtMs: candidate.iat,
    expiresAtMs: candidate.exp,
    tokenFingerprint: expectedTokenHash,
  };
}

export function verifyAdminSessionFromCookies(
  cookieStore: CookieStoreReader,
  options?: { nowMs?: number; secret?: string | null },
): VerifiedAdminSession | null {
  const token = cookieStore.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value ?? null;
  const seal = cookieStore.get(ADMIN_SESSION_SEAL_COOKIE)?.value ?? null;
  return verifyAdminSession({
    token,
    seal,
    nowMs: options?.nowMs,
    secret: options?.secret,
  });
}

/**
 * Legacy helper retained only for explicit signature compatibility.
 * Never trusts an unsealed token, hardcoded test token, or unsigned JWT payload.
 */
export function parseAdminRoleFromToken(
  token?: string | null,
  seal?: string | null,
  options?: { nowMs?: number; secret?: string | null },
): AdminSessionRole | null {
  return (
    verifyAdminSession({
      token,
      seal,
      nowMs: options?.nowMs,
      secret: options?.secret,
    })?.role ?? null
  );
}

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin || origin === 'null') return false;
  if (origin === new URL(request.url).origin) return true;
  const configuredOrigin = process.env.TRIPMATE_WEB_ORIGIN;
  if (!configuredOrigin) return false;
  try {
    const url = new URL(configuredOrigin);
    return (
      ['http:', 'https:'].includes(url.protocol) &&
      !url.username &&
      !url.password &&
      url.pathname === '/' &&
      !url.search &&
      !url.hash &&
      origin === url.origin
    );
  } catch {
    return false;
  }
}

export function jsonNoStore(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function clearAdminSession(response: NextResponse): NextResponse {
  response.cookies.set(ADMIN_ACCESS_TOKEN_COOKIE, '', { ...cookieOptions(), maxAge: 0 });
  response.cookies.set(ADMIN_SESSION_SEAL_COOKIE, '', { ...cookieOptions(), maxAge: 0 });
  return response;
}

export function setAdminSession(
  response: NextResponse,
  token: string,
  expiresAt: Date,
  role: AdminSessionRole = 'Administrator',
  options?: { userId?: number | null; nowMs?: number; secret?: string | null },
): NextResponse {
  const sealed = createAdminSessionSeal({
    token,
    role,
    userId: options?.userId ?? null,
    expiresAt,
    nowMs: options?.nowMs,
    secret: options?.secret,
  });

  if (!sealed) {
    throw new Error(
      'Unable to issue BFF-signed administration session: missing or invalid session configuration.',
    );
  }

  const effectiveExpiresAt = new Date(sealed.expiresAtMs);
  response.cookies.set(ADMIN_ACCESS_TOKEN_COOKIE, token, {
    ...cookieOptions(),
    expires: effectiveExpiresAt,
  });
  response.cookies.set(ADMIN_SESSION_SEAL_COOKIE, sealed.seal, {
    ...cookieOptions(),
    expires: effectiveExpiresAt,
  });
  return response;
}
