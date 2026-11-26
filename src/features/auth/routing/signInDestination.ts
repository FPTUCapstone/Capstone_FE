import { ROUTES } from '@/lib/routes';
import type { WebAuthContext } from '../session/authSession';

export const partnerUnresolvedMessage = 'Ch\u01b0a th\u1ec3 x\u00e1c \u0111\u1ecbnh tr\u1ea1ng th\u00e1i h\u1ed3 s\u01a1 Partner. Vui l\u00f2ng th\u1eed l\u1ea1i ho\u1eb7c li\u00ean h\u1ec7 h\u1ed7 tr\u1ee3.';

const AUTH_LOOP_PATHS = [
  ROUTES.signIn,
  '/admin/sign-in',
  ROUTES.admin.login,
  ROUTES.register,
  ROUTES.partner.register,
  ROUTES.forgotPassword,
  ROUTES.admin.forgotPassword,
  ROUTES.verifyAccount,
  '/verify-email',
  '/first-password',
];

function isPathOrChild(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function resolveSafeReturnPath(
  rawTarget: string | null | undefined,
  context: WebAuthContext,
): string | null {
  if (!rawTarget || typeof rawTarget !== 'string') return null;
  const trimmed = rawTarget.trim();
  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.includes('\\') ||
    /[\u0000-\u001F\u007F]/.test(trimmed)
  ) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed, 'https://tripmate.local');
  } catch {
    return null;
  }

  if (parsed.origin !== 'https://tripmate.local') return null;
  const { pathname } = parsed;

  if (AUTH_LOOP_PATHS.some((path) => isPathOrChild(pathname, path))) {
    return null;
  }

  if (isPathOrChild(pathname, '/admin') && context.role !== 'Administrator' && context.role !== 'Staff') {
    return null;
  }
  if (
    isPathOrChild(pathname, '/partner') &&
    (context.role !== 'TourOperator' || context.applicationStatus !== 'Approved')
  ) {
    return null;
  }
  if (isPathOrChild(pathname, '/provider') && context.role !== 'ServiceProvider') {
    return null;
  }
  if (isPathOrChild(pathname, ROUTES.myItineraries) && context.role !== 'Traveler') {
    return null;
  }

  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

export function signInDestination(context: WebAuthContext): string | null {
  if (context.status !== 'Active') return null;
  if (context.mustChangePassword) return '/first-password';
  if (context.role === 'ServiceProvider') return '/provider/bookings';
  if (context.role === 'Administrator') return ROUTES.admin.dashboard;
  if (context.role === 'Staff') return ROUTES.admin.staffDashboard;
  if (context.role === 'Traveler') return ROUTES.home;
  if (context.role !== 'TourOperator' || context.applicationUnresolved) return null;
  if (context.onboardingState === 'AwaitingSignature') return ROUTES.partner.contract;
  if (context.onboardingState === 'Unresolved') return null;
  if (context.onboardingState === 'AwaitingReview' || context.onboardingState === 'Rejected') return ROUTES.partner.application;
  if (context.applicationStatus === 'Approved') return ROUTES.partner.dashboard;
  if (context.applicationStatus === 'PendingApproval' || context.applicationStatus === 'Rejected') return ROUTES.partner.application;
  return null;
}

export function resolveSignInDestination(
  context: WebAuthContext,
  rawReturnTarget?: string | null,
): string | null {
  const fallback = signInDestination(context);
  if (!fallback) return null;
  if (context.mustChangePassword) return fallback;
  if (context.role === 'TourOperator' && context.applicationStatus !== 'Approved') {
    return fallback;
  }
  return resolveSafeReturnPath(rawReturnTarget, context) ?? fallback;
}
