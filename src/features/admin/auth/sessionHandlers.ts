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
    const response = await fetchBackend('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: credentials.email.trim(), password: credentials.password }),
    });
    if (response.status === 401) return failure(401, 'Incorrect email or password. Please try again.');
    if (response.status === 403) return failure(403, 'This account cannot access the administration workspace.');
    if (response.status === 400) return failure(400, 'Enter a valid email address and password.');
    if (!response.ok) return failure(503, unavailableMessage);

    const session: unknown = await response.json();
    if (!session || typeof session !== 'object' || !('accessToken' in session) || typeof session.accessToken !== 'string' ||
      !session.accessToken || !('accessTokenExpiresAtUtc' in session) || typeof session.accessTokenExpiresAtUtc !== 'string') {
      return failure(502, unavailableMessage);
    }
    if (!('role' in session) || session.role !== 3 || !('status' in session) || session.status !== 2) {
      return failure(403, 'An active Administrator account is required.');
    }
    const expiresAt = new Date(session.accessTokenExpiresAtUtc);
    if (!Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) return failure(502, unavailableMessage);

    // The BE checks the signed bearer token and current DB role/status before a session is issued.
    const access = await fetchBackend('/api/v1/admin/pois/catalogue', {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    if (access.status === 401 || access.status === 403) return failure(access.status, 'An active Administrator account is required.');
    if (!access.ok) return failure(503, unavailableMessage);

    return setAdminSession(jsonNoStore({ authenticated: true }), session.accessToken, expiresAt);
  } catch {
    return failure(503, unavailableMessage);
  }
}

export async function signOutAdmin(request: Request): Promise<NextResponse> {
  if (!isSameOriginRequest(request)) return jsonNoStore({ message: 'The request origin is not allowed.' }, 403);
  return clearAdminSession(new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } }));
}
