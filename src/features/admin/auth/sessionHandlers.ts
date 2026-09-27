import 'server-only';

import { NextResponse } from 'next/server';

import { clearAdminSession, isSameOriginRequest, jsonNoStore, setAdminSession } from '@/lib/server/adminSession';
import { fetchBackend } from '@/lib/server/backend';

const unavailableMessage = 'Sign in is temporarily unavailable. Please try again.';

function failure(status: number, message: string) {
  return clearAdminSession(jsonNoStore({ message }, status));
}

export async function signInAdmin(request: Request): Promise<NextResponse> {
  if (!isSameOriginRequest(request)) return jsonNoStore({ message: 'The request origin is not allowed.' }, 403);
  let credentials: unknown;
  try {
    credentials = await request.json();
  } catch {
    return jsonNoStore({ message: 'Enter a valid email address and password.' }, 400);
  }
  if (!credentials || typeof credentials !== 'object' || !('email' in credentials) || !('password' in credentials) ||
    typeof credentials.email !== 'string' || typeof credentials.password !== 'string' ||
    !/^\S+@\S+\.\S+$/.test(credentials.email.trim()) || !credentials.password.trim()) {
    return jsonNoStore({ message: 'Enter a valid email address and password.' }, 400);
  }

  try {
    const response = await fetchBackend('/api/v1/auth/web/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: credentials.email.trim(), password: credentials.password, keepMeSignedIn: false }),
    });
    if (response.status === 401) return failure(401, 'Incorrect email or password. Please try again.');
    if (response.status === 403) return failure(403, 'This account cannot access the administration workspace.');
    if (response.status === 400) return failure(400, 'Enter a valid email address and password.');
    if (!response.ok) return failure(503, unavailableMessage);

    const envelope: unknown = await response.json();
    const data = envelope && typeof envelope === 'object' && 'success' in envelope &&
      (envelope as { success?: unknown }).success === true && 'data' in envelope &&
      typeof (envelope as { data?: unknown }).data === 'object' && envelope.data !== null
      ? (envelope as { data: Record<string, unknown> }).data
      : undefined;
    if (!data || typeof data.accessToken !== 'string' || !data.accessToken ||
      typeof data.accessTokenExpiresAtUtc !== 'string') {
      return failure(502, unavailableMessage);
    }
    if (data.role !== 'Administrator' || data.status !== 'Active') {
      return failure(403, 'An active Administrator account is required.');
    }
    const expiresAt = new Date(data.accessTokenExpiresAtUtc);
    if (!Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) return failure(502, unavailableMessage);

    // /api/v1/auth/web/admin/login is Administrator-specific: the Backend has
    // already authenticated the credentials and authorized the role/status
    // before issuing this session, so no secondary authorization probe is
    // needed (and /api/v1/admin/pois/catalogue no longer exists upstream).
    return setAdminSession(jsonNoStore({ authenticated: true }), data.accessToken, expiresAt);
  } catch {
    return failure(503, unavailableMessage);
  }
}

export async function signOutAdmin(request: Request): Promise<NextResponse> {
  if (!isSameOriginRequest(request)) return jsonNoStore({ message: 'The request origin is not allowed.' }, 403);
  return clearAdminSession(new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } }));
}
