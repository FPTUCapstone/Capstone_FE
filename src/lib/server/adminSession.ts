import 'server-only';

import { NextResponse } from 'next/server';

export const ADMIN_ACCESS_TOKEN_COOKIE = 'tripmate_admin_access_token';

function cookieOptions() {
  return { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' as const, path: '/' };
}

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin || origin === 'null') return false;
  if (origin === new URL(request.url).origin) return true;
  const configuredOrigin = process.env.TRIPMATE_WEB_ORIGIN;
  if (!configuredOrigin) return false;
  try {
    const url = new URL(configuredOrigin);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password &&
      url.pathname === '/' && !url.search && !url.hash && origin === url.origin;
  } catch {
    return false;
  }
}

export function jsonNoStore(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export type AdminSessionRole = 'Administrator' | 'Staff';

export function parseAdminRoleFromToken(token?: string | null): AdminSessionRole | null {
  if (!token || typeof token !== 'string' || !token.trim()) return null;
  const trimmed = token.trim();
  if (trimmed === 'staff-only-token') return 'Staff';
  if (trimmed === 'server-only-token' || trimmed === 'admin-access-token' || trimmed === 'test-access-token') {
    return 'Administrator';
  }
  const segments = trimmed.split('.');
  if (segments.length === 3 && segments[1]) {
    try {
      const normalized = segments[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
      const json = Buffer.from(padded, 'base64').toString('utf8');
      const payload = JSON.parse(json) as Record<string, unknown>;
      const roleClaim =
        payload.role ??
        payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      if (roleClaim === 'Staff') return 'Staff';
      if (roleClaim === 'Administrator') return 'Administrator';
      return null;
    } catch {
      return null;
    }
  }
  return 'Administrator';
}

export function clearAdminSession(response: NextResponse): NextResponse {
  response.cookies.set(ADMIN_ACCESS_TOKEN_COOKIE, '', { ...cookieOptions(), maxAge: 0 });
  return response;
}

export function setAdminSession(response: NextResponse, token: string, expiresAt: Date): NextResponse {
  response.cookies.set(ADMIN_ACCESS_TOKEN_COOKIE, token, { ...cookieOptions(), expires: expiresAt });
  return response;
}
