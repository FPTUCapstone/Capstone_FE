import 'server-only';

import { cookies } from 'next/headers';

import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  clearAdminSession,
  jsonNoStore,
} from '@/lib/server/adminSession';
import { fetchBackend } from '@/lib/server/backend';
import { isValidPayoutId } from './payoutDetails';

export async function proxyPayoutDetails(id: string): Promise<Response> {
  if (!isValidPayoutId(id)) return jsonNoStore({ title: 'The payout reference is invalid.' }, 400);
  const token = (await cookies()).get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
  if (!token) return jsonNoStore({ title: 'Administrator sign-in required.' }, 401);

  try {
    const upstream = await fetchBackend(`/api/v1/admin/payouts/${id}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      signal: undefined,
    });

    if (upstream.status >= 500) {
      return jsonNoStore({ title: 'The payout service is unavailable.' }, 503);
    }

    if (upstream.status === 401 || upstream.status === 403) {
      return clearAdminSession(jsonNoStore({
        title: upstream.status === 401
          ? 'Administrator sign-in required.'
          : 'Administrator access is not allowed.',
      }, upstream.status));
    }

    const result: unknown = await upstream.json().catch(() => null);
    if (result === null) {
      return jsonNoStore({ title: 'The payout service returned no data.' }, 503);
    }

    return jsonNoStore(result, upstream.status);
  } catch {
    return jsonNoStore({ title: 'The payout service could not be reached.' }, 503);
  }
}
