import 'server-only';

import { cookies } from 'next/headers';

import { fetchBackend } from '@/lib/server/backend';
import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  clearAdminSession,
  isSameOriginRequest,
  jsonNoStore,
  setAdminSession,
  verifyAdminSessionFromCookies,
} from '@/lib/server/adminSession';

const UPSTREAM_PATH = '/api/v1/auth/web/change-password';

/**
 * UC-07 Administrator/Staff change password. Same-origin proxy for the
 * signed admin BFF session (sessionHandlers.ts pattern): the bearer token
 * only ever exists in the HttpOnly admin session cookie, never in browser
 * JS. On success, the Backend's replacement access token re-seals this same
 * admin cookie (setAdminSession); the Backend's own `tripmate_refresh`
 * Set-Cookie is discarded — the admin BFF session is the sole source of
 * truth for this workspace and never reads that cookie.
 *
 * This is a deliberate, pre-existing design decision, not an oversight:
 * signInAdmin (sessionHandlers.ts) never read a refresh token either, and
 * the signed internal session is capped at MAX_SESSION_TTL_MS (15 minutes)
 * regardless of any Backend refresh token's actual lifetime. The admin
 * workspace has no refresh-token-backed long session to preserve here. If
 * that changes, this proxy must be revisited to forward/store the refresh
 * cookie through a safe mechanism — see spec §6.
 */
export async function proxyAdminChangePassword(request: Request) {
  if (!isSameOriginRequest(request)) {
    return jsonNoStore({ title: 'Request origin is not allowed.' }, 403);
  }

  const cookieStore = await cookies();
  const session = verifyAdminSessionFromCookies(cookieStore);
  if (!session) {
    return clearAdminSession(jsonNoStore({ title: 'Administrator sign-in required.' }, 401));
  }

  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return jsonNoStore({ title: 'JSON content is required.' }, 415);
  }

  let body: { currentPassword?: unknown; newPassword?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonNoStore({ title: 'Invalid JSON.' }, 400);
  }

  if (typeof body.currentPassword !== 'string' || typeof body.newPassword !== 'string') {
    return jsonNoStore({ title: 'Current and new password are required.', errorCode: 'MSG01' }, 400);
  }

  // The admin session cookie stores the raw bearer token directly (see
  // sessionHandlers.ts); verifyAdminSessionFromCookies only validates the
  // signed seal alongside it.
  const token = cookieStore.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    return clearAdminSession(jsonNoStore({ title: 'Administrator sign-in required.' }, 401));
  }

  try {
    const upstream = await fetchBackend(UPSTREAM_PATH, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: body.currentPassword, newPassword: body.newPassword }),
    });

    if (upstream.status >= 500) {
      return jsonNoStore({ title: 'The authentication service is unavailable. The request could not be confirmed.' }, 503);
    }
    if (upstream.status === 401) {
      return clearAdminSession(jsonNoStore({ title: 'Administrator sign-in required.' }, 401));
    }
    if (!upstream.ok) {
      // 400 (MSG01/MSG05/MSG17) or 403 (local password unavailable): forward
      // the Backend's ProblemDetails/errorCode as-is; the admin session is
      // untouched because no mutation happened.
      const problem: unknown = await upstream.json().catch(() => null);
      return jsonNoStore(problem ?? { title: 'The request could not be completed.' }, upstream.status);
    }

    const envelope: unknown = await upstream.json().catch(() => null);
    const data =
      envelope && typeof envelope === 'object' && 'success' in envelope &&
      (envelope as { success?: unknown }).success === true && 'data' in envelope &&
      typeof (envelope as { data?: unknown }).data === 'object' && envelope.data !== null
        ? (envelope as { data: Record<string, unknown> }).data
        : undefined;

    if (!data || typeof data.accessToken !== 'string' || !data.accessToken ||
      typeof data.accessTokenExpiresAtUtc !== 'string') {
      return jsonNoStore({ title: 'The authentication service returned no data.' }, 502);
    }

    const expiresAt = new Date(data.accessTokenExpiresAtUtc);
    if (!Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
      return jsonNoStore({ title: 'The authentication service returned no data.' }, 502);
    }

    return setAdminSession(
      jsonNoStore({ success: true }),
      data.accessToken,
      expiresAt,
      session.role,
      { userId: session.userId },
    );
  } catch {
    return jsonNoStore({ title: 'The authentication service could not be reached. The request could not be confirmed.' }, 503);
  }
}
