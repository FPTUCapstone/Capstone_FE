import 'server-only';

import { fetchBackend } from '@/lib/server/backend';
import { jsonNoStore } from '@/lib/server/jsonNoStore';
import { isSameOriginRequest } from '@/lib/server/sameOrigin';
import { WEB_REFRESH_COOKIE, resolveWebSession } from '@/lib/server/webSession';

const UPSTREAM_PATH = '/api/v1/auth/web/change-password';

/**
 * UC-07 Administrator/Staff change password. Same-origin proxy: the bearer token is resolved
 * server-side from the refresh cookie for this request only and never reaches browser JS.
 *
 * The backend revokes every active refresh token on a password change and returns a replacement
 * `tripmate_refresh` cookie. That replacement is forwarded to the browser; discarding it would
 * sign the administrator out on the next session restore. The replacement access token is not
 * stored: the next request resolves a fresh one from the refresh cookie.
 */
export async function proxyAdminChangePassword(request: Request) {
  if (!isSameOriginRequest(request)) {
    return jsonNoStore({ title: 'Request origin is not allowed.' }, 403);
  }

  const session = await resolveWebSession(request.signal);
  if (!session) {
    return jsonNoStore({ title: 'Administrator sign-in required.' }, 401);
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

  try {
    const upstream = await fetchBackend(UPSTREAM_PATH, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: body.currentPassword, newPassword: body.newPassword }),
      signal: request.signal,
    });

    if (upstream.status >= 500) {
      return jsonNoStore({ title: 'The authentication service is unavailable. The request could not be confirmed.' }, 503);
    }
    if (upstream.status === 401) {
      return jsonNoStore({ title: 'Administrator sign-in required.' }, 401);
    }
    if (!upstream.ok) {
      // 400 (MSG01/MSG05/MSG17) or 403 (local password unavailable): forward the Backend's
      // ProblemDetails/errorCode as-is. No mutation happened, so the session is untouched.
      const problem: unknown = await upstream.json().catch(() => null);
      return jsonNoStore(problem ?? { title: 'The request could not be completed.' }, upstream.status);
    }

    const envelope: unknown = await upstream.json().catch(() => null);
    const succeeded =
      envelope !== null && typeof envelope === 'object' && 'success' in envelope &&
      (envelope as { success?: unknown }).success === true;
    if (!succeeded) {
      return jsonNoStore({ title: 'The authentication service returned no data.' }, 502);
    }

    const response = jsonNoStore({ success: true });
    const replacement = upstream.headers
      .getSetCookie()
      .find((cookie) => cookie.startsWith(`${WEB_REFRESH_COOKIE}=`));
    if (replacement) response.headers.append('Set-Cookie', replacement);
    return response;
  } catch {
    return jsonNoStore({ title: 'The authentication service could not be reached. The request could not be confirmed.' }, 503);
  }
}
