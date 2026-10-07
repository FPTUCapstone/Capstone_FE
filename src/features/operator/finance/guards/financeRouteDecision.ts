import { ROUTES } from '@/lib/routes';
import type { WebAuthContext } from '@/features/auth/session/authSession';

export type FinanceRouteDecision =
  | { action: 'allow' }
  | { action: 'redirect'; href: string };

/**
 * Access decision for Tour Operator Finance routes (UC-44, UC-45, UC-46).
 * Enforces BR-07: Only active, approved Tour Operators may access finance workspaces.
 * All unauthorized states fail closed.
 */
export function financeRouteDecision(
  context: WebAuthContext | null
): FinanceRouteDecision {
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
  const isApproved =
    context.applicationStatus === 'Approved' && !context.applicationUnresolved;
  if (isApproved) {
    return { action: 'allow' };
  }

  // PendingApproval, Rejected, or unresolved application states fail closed
  return { action: 'redirect', href: ROUTES.partner.application };
}
