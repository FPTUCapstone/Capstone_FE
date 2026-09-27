'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import { useWebSession } from '../session/useWebSession';
import { partnerRouteDecision, type PartnerRoute } from './partnerRouteDecision';

/**
 * CR-11 runtime enforcement for a Partner route. It reuses the S01 session
 * state (no second restoration mechanism) and evaluates the authorization
 * matrix only once the session has settled. While restoring it renders a
 * neutral accessible placeholder — never Guest registration, protected Partner
 * content, or a wrong-role message — and issues no redirect. On a redirect
 * decision it replaces the current route (so the unauthorized screen is never
 * committed) and renders nothing. Authorized children render unchanged, so all
 * existing W06 projections are preserved.
 */
export function PartnerRouteGuard({ route, children }: { route: PartnerRoute; children: ReactNode }) {
  const { status, context } = useWebSession();
  const router = useRouter();
  const decision = status === 'restoring' ? null : partnerRouteDecision(route, context);
  // Depend on the stable href string, not the freshly built decision object,
  // so a repeated render cannot re-issue router.replace.
  const redirectHref = decision?.action === 'redirect' ? decision.href : null;

  useEffect(() => {
    if (redirectHref) router.replace(redirectHref);
  }, [redirectHref, router]);

  if (!decision || decision.action === 'redirect') {
    return <div role="status" aria-label="Checking access" className="h-10 w-48 animate-pulse rounded-xl bg-gray-200"><span className="sr-only">Checking access…</span></div>;
  }
  return <>{children}</>;
}
