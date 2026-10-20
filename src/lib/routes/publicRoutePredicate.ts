/**
 * Predicate to determine whether the given URL pathname belongs to a public route
 * that should display the persistent shared PublicNavigation header.
 *
 * Excludes:
 * - Admin Console workspace (/admin/*) which renders AdminNavigation
 * - Partner / Tour Operator workspace (/partner/*) which renders PartnerShell
 * - Standalone split-screen authentication routes (/sign-in, /register, etc.)
 * - Standalone payment / checkout handoff flows
 * - Developer sandbox routes (/dev/*)
 */
export function isPublicNavigationRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return true;

  // Normalize path by stripping trailing slash (except root '/')
  const normalized =
    pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

  if (
    normalized === '/admin' ||
    normalized.startsWith('/admin/') ||
    normalized === '/partner' ||
    normalized.startsWith('/partner/') ||
    normalized === '/sign-in' ||
    normalized.startsWith('/sign-in/') ||
    normalized === '/register' ||
    normalized.startsWith('/register/') ||
    normalized === '/forgot-password' ||
    normalized.startsWith('/forgot-password/') ||
    normalized === '/verify-account' ||
    normalized.startsWith('/verify-account/') ||
    normalized === '/verify-email' ||
    normalized.startsWith('/verify-email/') ||
    normalized === '/checkout' ||
    normalized.startsWith('/checkout/') ||
    normalized === '/dev' ||
    normalized.startsWith('/dev/') ||
    normalized.includes('/pay')
  ) {
    return false;
  }

  return true;
}
