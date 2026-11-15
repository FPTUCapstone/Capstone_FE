import { accountSession, fetchAccounts } from '@/features/admin/user-accounts/server/accounts';
import { parseUserAccountRouteId } from '@/features/admin/user-accounts/server/userAccountRouteId';
import { isSameOriginRequest, jsonNoStore } from '@/lib/server/adminSession';

export async function POST(request: Request, context: { params: Promise<{ userId: string; action: string }> }) {
  if (!isSameOriginRequest(request)) return jsonNoStore({ title: 'Request origin is not allowed.' }, 403);
  const session = await accountSession();
  if (!session) return jsonNoStore({ title: 'Sign-in required.' }, 401);
  const { userId, action } = await context.params;
  const id = parseUserAccountRouteId(userId);
  if (!id || (action !== 'lock' && action !== 'unlock')) return jsonNoStore({ title: 'Account unavailable.' }, 404);
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Object.keys(body).length !== 1
      || !('reason' in body) || typeof body.reason !== 'string' || !body.reason.trim() || body.reason.length > 200) {
    return jsonNoStore({ title: 'Enter a reason of up to 200 characters.' }, 400);
  }
  try {
    const result = await fetchAccounts(session.token, `/${id}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: body.reason.trim() }),
    });
    if (result.ok) return jsonNoStore({ updated: true });
    const titles: Record<number, string> = {
      400: 'Check the supplied reason.', 401: 'Sign in again to continue.', 403: 'Access denied.',
      404: 'Account unavailable.', 409: 'The account cannot be updated in its current state.',
    };
    const title = titles[result.status];
    if (title) return jsonNoStore({ title }, result.status);
  } catch {
    return jsonNoStore({ title: 'Account management is temporarily unavailable.' }, 503);
  }
  return jsonNoStore({ title: 'Account management is temporarily unavailable.' }, 503);
}
