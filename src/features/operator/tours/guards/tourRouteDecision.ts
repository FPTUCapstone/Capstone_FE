import { ROUTES } from '@/lib/routes';
import type { WebAuthContext } from '@/features/auth/session/authSession';

export type TourRouteDecision = { action: 'allow' } | { action: 'redirect'; href: string };

/**
 * Access guard for Tour Operator Tour Lifecycle routes (UC-35, UC-36, UC-37).
 * Follows BR-07: Only active, approved Tour Operators may access tour management.
 */
export function tourRouteDecision(context: WebAuthContext | null): TourRouteDecision {
  if (!context) {
    return { action: 'redirect', href: ROUTES.signIn };
  }
  if (context.role === 'Traveler') {
    return { action: 'redirect', href: ROUTES.home };
  }
  if (context.role === 'Administrator') {
    return { action: 'redirect', href: ROUTES.admin.dashboard };
  }

  const approved = context.applicationStatus === 'Approved';
  return approved ? { action: 'allow' } : { action: 'redirect', href: ROUTES.partner.application };
}
