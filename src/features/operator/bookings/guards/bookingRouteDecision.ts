import { ROUTES } from '@/lib/routes';
import type { WebAuthContext } from '@/features/auth/session/authSession';

export type BookingRouteDecision = { action: 'allow' } | { action: 'redirect'; href: string };

/**
 * Access guard decision for Tour Operator Customer Booking routes (UC-40, UC-41, UC-42).
 * Follows BR-07: Only active, approved Tour Operators may access the booking management workspace.
 * All other states fail closed. Demo mode MUST NOT bypass this check.
 */
export function bookingRouteDecision(context: WebAuthContext | null): BookingRouteDecision {
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
