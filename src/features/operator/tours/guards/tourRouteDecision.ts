import { ROUTES } from '@/lib/routes';
import type { WebAuthContext } from '@/features/auth/session/authSession';

export type TourRouteDecision = { action: 'allow' } | { action: 'redirect'; href: string };

/**
 * Access guard decision for Tour Operator Tour Lifecycle routes (UC-35, UC-36, UC-37).
 * Follows BR-07: Only active, approved Tour Operators may access tour management workspace.
 * All other states fail closed.
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

  // Fails closed if not TourOperator or not Active status
  if (context.role !== 'TourOperator' || context.status !== 'Active') {
    return { action: 'redirect', href: ROUTES.signIn };
  }

  // TourOperator requires approved application status and no unresolved application state
  const isApproved = context.applicationStatus === 'Approved' && !context.applicationUnresolved;
  if (isApproved) {
    return { action: 'allow' };
  }

  // PendingApproval, Rejected, or unresolved application states fail closed to application status screen
  return { action: 'redirect', href: ROUTES.partner.application };
}
