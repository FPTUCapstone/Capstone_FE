import { readOutstandingAmountVnd } from '@/features/admin/user-accounts/moderationProblem';
import { adminUserAccountsEn } from '@/features/admin/user-accounts/resources/en';
import { accountSession, fetchAccounts } from '@/features/admin/user-accounts/server/accounts';
import { parseUserAccountRouteId } from '@/features/admin/user-accounts/server/userAccountRouteId';
import { isSameOriginRequest, jsonNoStore } from '@/lib/server/adminSession';

const { MSG126, MSG127, MSG133 } = adminUserAccountsEn.moderation.messages;

const UNAVAILABLE_TITLE = 'Account management is temporarily unavailable.';
const COMMON_TITLES: Record<number, string> = {
  400: 'Check the supplied reason.', 401: 'Sign in again to continue.', 404: 'Account unavailable.',
};
const TITLES_BY_ACTION: Record<'lock' | 'unlock', { titles: Record<number, string>; unavailable: string }> = {
  lock: { titles: { ...COMMON_TITLES, 403: MSG126, 409: MSG133 }, unavailable: MSG127 },
  unlock: {
    titles: { ...COMMON_TITLES, 403: 'Access denied.', 409: 'The account cannot be updated in its current state.' },
    unavailable: UNAVAILABLE_TITLE,
  },
};

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
  const { titles, unavailable } = TITLES_BY_ACTION[action];
  try {
    const result = await fetchAccounts(session.token, `/${id}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: body.reason.trim() }),
    });
    if (result.ok) return jsonNoStore({ updated: true });
    const title = titles[result.status];
    if (result.status === 409 && action === 'unlock') {
      const problem: unknown = await result.json().catch(() => null);
      const outstandingAmountVnd = readOutstandingAmountVnd(problem);
      if (outstandingAmountVnd !== null) {
        return jsonNoStore({ title, messageCode: 'MSG199', outstandingAmountVnd }, 409);
      }
    }
    if (title) return jsonNoStore({ title }, result.status);
  } catch {
    return jsonNoStore({ title: unavailable }, 503);
  }
  return jsonNoStore({ title: unavailable }, 503);
}
