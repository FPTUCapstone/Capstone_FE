import 'server-only';

import { jsonNoStore } from '@/lib/server/jsonNoStore';
import { isSameOriginRequest } from '@/lib/server/sameOrigin';
import { fetchBackend } from '@/lib/server/backend';
import { resolveWebSession } from '@/lib/server/webSession';
import { parseApplicationId } from '../utils/applicationId';

type ApplicationAction = 'approve' | 'reject';

export async function proxyTourOperatorApplication(
  request: Request,
  userId: string,
  action?: ApplicationAction,
) {
  if (parseApplicationId(userId) === null) {
    return jsonNoStore({ title: 'A valid application ID is required.' }, 400);
  }
  if (request.method !== 'GET' && !isSameOriginRequest(request)) {
    return jsonNoStore({ title: 'Request origin is not allowed.' }, 403);
  }

  const session = await resolveWebSession(request.signal);
  if (!session) return jsonNoStore({ title: 'Administrator sign-in required.' }, 401);
  if (session.role === 'Staff') return jsonNoStore({ title: 'Administrator access is not allowed.' }, 403);

  let body: string | undefined;
  if (action === 'reject') {
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
      return jsonNoStore({ title: 'JSON content is required.' }, 415);
    }
    try {
      body = JSON.stringify(await request.json());
    } catch {
      return jsonNoStore({ title: 'Invalid JSON.' }, 400);
    }
  }

  const suffix = action ? `/${action}` : '';
  try {
    const upstream = await fetchBackend(`/api/v1/admin/tour-operator-applications/${userId}${suffix}`, {
      method: request.method,
      headers: { Authorization: `Bearer ${session.accessToken}`, 'Content-Type': 'application/json' },
      body,
    });
    if (upstream.status >= 500) {
      return jsonNoStore({ title: 'The Tour Operator application service is unavailable.' }, 503);
    }
    if (upstream.status === 401) {
      return jsonNoStore({ title: 'Administrator sign-in required.' }, 401);
    }
    if (upstream.status === 403) {
      return jsonNoStore({ title: 'Administrator access is not allowed.' }, 403);
    }
    if (upstream.status === 204 || upstream.headers.get('content-length') === '0') {
      return new Response(null, { status: upstream.status, headers: { 'Cache-Control': 'no-store' } });
    }
    const result: unknown = await upstream.json().catch(() => null);
    return jsonNoStore(result ?? { title: 'The service returned no data.' }, upstream.status);
  } catch {
    return jsonNoStore({ title: 'The Tour Operator application service could not be reached.' }, 503);
  }
}
