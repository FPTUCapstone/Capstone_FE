import { ROUTES } from '@/lib/routes';
import type { WebAuthContext } from '../session/authSession';

export const partnerUnresolvedMessage = 'Ch\u01b0a th\u1ec3 x\u00e1c \u0111\u1ecbnh tr\u1ea1ng th\u00e1i h\u1ed3 s\u01a1 Partner. Vui l\u00f2ng th\u1eed l\u1ea1i ho\u1eb7c li\u00ean h\u1ec7 h\u1ed7 tr\u1ee3.';

export function signInDestination(context: WebAuthContext): string | null {
  if (context.status !== 'Active') return null;
  if (context.role === 'Administrator') return ROUTES.admin.dashboard;
  if (context.role === 'Traveler') return ROUTES.home;
  if (context.role !== 'TourOperator' || context.applicationUnresolved) return null;
  if (context.applicationStatus === 'Approved') return ROUTES.partner.dashboard;
  if (context.applicationStatus === 'PendingApproval' || context.applicationStatus === 'Rejected') return ROUTES.partner.application;
  return null;
}
