import { ROUTES } from '@/lib/routes';
import type { WebAuthContext } from '../session/authSession';

export type PartnerRoute = 'register' | 'dashboard' | 'application' | 'resubmit';
export type PartnerRouteDecision = { action: 'allow' } | { action: 'redirect'; href: string };

/**
 * CR-11 direct-route authorization policy for the Partner Web routes, given
 * the authoritative restored Web context. Callers MUST invoke this only after
 * S01 restoration settles (status authenticated/unauthenticated); a null
 * context here means genuinely unauthenticated, never "restoring".
 *
 * Decisions use only the server-provided role / effective status /
 * applicationStatus. Nothing is inferred from email, Firebase, persisted
 * metadata, or the URL. Denied authenticated roles land on their own safe
 * destination (Traveler -> home, Administrator -> admin) rather than a
 * misleading "please sign in" screen; guests use the public sign-in route.
 */
export function partnerRouteDecision(route: PartnerRoute, context: WebAuthContext | null): PartnerRouteDecision {
  if (!context) {
    // Genuinely unauthenticated: only the future UC-02 registration entry is open.
    return route === 'register' ? { action: 'allow' } : { action: 'redirect', href: ROUTES.signIn };
  }
  if (context.role === 'Traveler') return { action: 'redirect', href: ROUTES.home };
  if (context.role === 'Administrator') return { action: 'redirect', href: ROUTES.admin.dashboard };

  // TourOperator (Active is guaranteed by the context validator). Approved is
  // the only state that may enter the workspace; every other application state
  // (PendingApproval/Rejected/unresolved-null) is confined to the application
  // projection, and registration is never offered to an existing operator.
  const approved = context.applicationStatus === 'Approved';
  const rejected = context.applicationStatus === 'Rejected';
  switch (route) {
    case 'dashboard':
      return approved ? { action: 'allow' } : { action: 'redirect', href: ROUTES.partner.application };
    case 'application':
      return approved ? { action: 'redirect', href: ROUTES.partner.dashboard } : { action: 'allow' };
    case 'register':
      return { action: 'redirect', href: approved ? ROUTES.partner.dashboard : ROUTES.partner.application };
    // Resubmission is its own permission, not inherited from the application
    // screen: only a Rejected application may resubmit. PendingApproval is still
    // under review and unresolved stays fail-closed, both back to the
    // application projection; Approved returns to the workspace.
    case 'resubmit':
      if (rejected) return { action: 'allow' };
      return { action: 'redirect', href: approved ? ROUTES.partner.dashboard : ROUTES.partner.application };
  }
}
