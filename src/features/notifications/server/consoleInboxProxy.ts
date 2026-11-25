import 'server-only';

import { cookies } from 'next/headers';
import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  isSameOriginRequest,
  jsonNoStore,
  verifyAdminSessionFromCookies,
} from '@/lib/server/adminSession';
import { fetchBackend } from '@/lib/server/backend';

export async function proxyConsoleInbox(request: Request, notificationId?: string): Promise<Response> {
  const isMutation = notificationId !== undefined;
  if (isMutation && !isSameOriginRequest(request)) {
    return jsonNoStore({ title: 'Invalid request origin.' }, 403);
  }
  if (isMutation && !/^[1-9]\d{0,18}$/.test(notificationId)) {
    return jsonNoStore({ title: 'Invalid notification ID.' }, 400);
  }

  try {
    const store = await cookies();
    const session = verifyAdminSessionFromCookies(store);
    const token = store.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
    if (!session || !token) return jsonNoStore({ title: 'Sign-in required.' }, 401);
    if (request.headers.get('X-Notification-Session') !== String(session.userId ?? session.issuedAtMs)) {
      return jsonNoStore({ title: 'The console account changed. Reload to continue.' }, 401);
    }
    if (session.mustChangePassword) return jsonNoStore({ title: 'Password change required.' }, 403);

    const incoming = new URL(request.url).searchParams;
    const query = new URLSearchParams();
    for (const key of ['unreadOnly', 'limit', 'beforeId']) {
      const value = incoming.get(key);
      if (value !== null) query.set(key, value);
    }

    const path = isMutation ? `/${notificationId}/read` : `?${query}`;
    const response = await fetchBackend(`/api/v1/notifications${path}`, {
      method: isMutation ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${token}` },
      signal: request.signal,
    });
    if (response.status >= 500) return jsonNoStore({ title: 'Notification service unavailable.' }, 503);
    if (!response.ok) return jsonNoStore({ title: 'Notification request failed.' }, response.status);
    if (response.status === 204) return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
    return new Response(response.body, {
      status: response.status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch {
    return jsonNoStore({ title: 'Notification service unavailable.' }, 503);
  }
}
