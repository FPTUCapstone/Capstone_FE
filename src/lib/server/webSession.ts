import 'server-only';

import { cookies } from 'next/headers';
import { fetchBackend } from '@/lib/server/backend';

export const WEB_REFRESH_COOKIE = 'tripmate_refresh';

export type AdministrationRole = 'Administrator' | 'Staff';

export interface ResolvedAdministrationSession {
  readonly accessToken: string;
  readonly role: AdministrationRole;
}

function isAdministrationRole(value: unknown): value is AdministrationRole {
  return value === 'Administrator' || value === 'Staff';
}

/**
 * Resolves the signed-in administration session for a server-side request.
 *
 * Exchanges the refresh cookie for an access token and returns it only when the account is an
 * active Administrator or Staff. Every other outcome — no cookie, a rejected or expired refresh,
 * an unreachable backend, another role, or a non-active status — returns null and never exposes a
 * token. The access token is held in memory only: this function sets no cookie and writes nothing
 * to the browser.
 */
export async function resolveWebSession(
  signal?: AbortSignal,
): Promise<ResolvedAdministrationSession | null> {
  const refresh = (await cookies()).get(WEB_REFRESH_COOKIE)?.value;
  if (!refresh) return null;

  let response: Response;
  try {
    response = await fetchBackend('/api/v1/auth/web/refresh', {
      method: 'POST',
      headers: { Cookie: `${WEB_REFRESH_COOKIE}=${encodeURIComponent(refresh)}` },
      signal,
    });
  } catch {
    return null;
  }
  if (!response.ok) return null;

  const payload: unknown = await response.json().catch(() => null);
  const data = payload && typeof payload === 'object' && 'data' in payload ? payload.data : null;
  if (!data || typeof data !== 'object') return null;

  const { accessToken, role, status } = data as Record<string, unknown>;
  if (typeof accessToken !== 'string' || accessToken.length === 0) return null;
  if (!isAdministrationRole(role) || status !== 'Active') return null;

  return { accessToken, role };
}
