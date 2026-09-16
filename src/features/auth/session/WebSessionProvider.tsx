'use client';

import type { ReactNode } from 'react';

import { useWebSession } from './useWebSession';

/**
 * Shared Web session bootstrap. Mounted once in the root layout so a hard
 * refresh, browser reopen, or direct URL navigation redeems the HttpOnly
 * refresh cookie and repopulates AuthStorage with the authoritative Web
 * context before any role/status-sensitive UI decides Guest vs authenticated.
 *
 * It intentionally does not gate or redirect (that is CR-11): its only job is
 * to run the single-flight restore so every consumer — the navbar now, and the
 * Partner route guards later — observes the same restored context. The restore
 * itself lives in useWebSession and is shared via a module-level single-flight,
 * so mounting this alongside a consumer's own useWebSession never doubles the
 * network call.
 */
export function WebSessionProvider({ children }: { children: ReactNode }) {
  useWebSession();
  return <>{children}</>;
}
