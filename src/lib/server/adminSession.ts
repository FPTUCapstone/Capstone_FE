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

export function clearAdminSession(response: NextResponse): NextResponse {
  response.cookies.set(ADMIN_ACCESS_TOKEN_COOKIE, '', { ...cookieOptions(), maxAge: 0 });
  return response;
}

export function setAdminSession(response: NextResponse, token: string, expiresAt: Date): NextResponse {
  response.cookies.set(ADMIN_ACCESS_TOKEN_COOKIE, token, { ...cookieOptions(), expires: expiresAt });
  return response;
}
