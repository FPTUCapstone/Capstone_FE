'use client';

import { useEffect, type ReactNode } from 'react';
import { webRefresh } from '@/lib/authApi';
import { AuthStorage } from './authSession';

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
  useEffect(() => {
    let disposed = false;
    let renewing = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const renew = async () => {
      if (disposed || renewing || !AuthStorage.getSessionOwner()) return;
      renewing = true;
      const revision = AuthStorage.getCredentialRevision();
      try { await webRefresh(); }
      catch {
        if (!disposed && AuthStorage.getCredentialRevision() === revision && AuthStorage.getSessionOwner()) {
          clearTimeout(timer); timer = setTimeout(() => { void renew(); }, 5000);
        }
      } finally {
        renewing = false;
        if (!disposed && AuthStorage.getCredentialRevision() !== revision) schedule();
      }
    };
    function schedule() {
      clearTimeout(timer);
      const owner = AuthStorage.getSessionOwner();
      if (!owner || disposed) return;
      const remaining = Date.parse(owner.expiresAtUtc) - Date.now();
      const delay = Math.min(2147483647, Math.max(0, remaining - Math.min(30000, remaining / 2)));
      timer = setTimeout(() => { void renew(); }, delay);
    }
    const resume = () => {
      if (document.visibilityState === 'hidden') return;
      const owner = AuthStorage.getSessionOwner();
      if (owner && Date.parse(owner.expiresAtUtc) - Date.now() <= 30000) { clearTimeout(timer); void renew(); }
      else schedule();
    };
    const unsubscribe = AuthStorage.subscribe(schedule);
    schedule(); window.addEventListener('focus', resume); document.addEventListener('visibilitychange', resume);
    return () => { disposed = true; clearTimeout(timer); unsubscribe(); window.removeEventListener('focus', resume); document.removeEventListener('visibilitychange', resume); };
  }, []);
  return <>{children}</>;
}
