'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';

import { webRefresh } from '@/lib/authApi';
import { AuthStorage, type WebAuthContext } from './authSession';

export type WebSessionStatus = 'restoring' | 'authenticated' | 'unauthenticated';

// Single-flight for one document: repeated mounts join the in-progress restore
// instead of issuing parallel refresh calls.
let restorePromise: Promise<void> | null = null;
function restoreOnce(): Promise<void> {
  restorePromise ??= webRefresh()
    .then(() => undefined)
    .catch(() => { /* Invalid/revoked/absent cookie: remain genuinely unauthenticated. */ })
    .finally(() => { restorePromise = null; });
  return restorePromise;
}

/**
 * S01 Web session state for role/status-sensitive UI. A missing in-memory
 * context is NOT Guest until the cookie-backed restore has completed, so the
 * status is explicit: restoring | authenticated | unauthenticated.
 */
export function useWebSession(): { status: WebSessionStatus; context: WebAuthContext | null } {
  const context = useSyncExternalStore(
    (onChange) => AuthStorage.subscribe(onChange),
    () => AuthStorage.getContext(),
    () => null,
  );
  // A session already in memory at mount needs no restore. Seeding the settled
  // flag from that lets a later Sign Out settle to unauthenticated instead of
  // waiting forever on a restore that was correctly never started.
  const [restoreSettled, setRestoreSettled] = useState(() => AuthStorage.getContext() !== null);

  useEffect(() => {
    // An existing in-memory context is already authoritative for this tab;
    // only a cold start (post-refresh/reopen/direct URL) needs a restore.
    if (AuthStorage.getContext()) return;
    let active = true;
    void restoreOnce().finally(() => { if (active) setRestoreSettled(true); });
    return () => { active = false; };
  }, []);

  const status: WebSessionStatus = context ? 'authenticated' : restoreSettled ? 'unauthenticated' : 'restoring';
  return useMemo(() => ({ status, context }), [status, context]);
}
