import { ROUTES } from '@/lib/routes';

const BASE_URL = 'http://tripmate.local';

// Staff may open only these administration pages; every other /admin/* page is Administrator-only.
const STAFF_ALLOWED_EXACT_ROUTES = new Set<string>([
  ROUTES.admin.staffDashboard,
  ROUTES.admin.accountSecurity,
  ROUTES.admin.payouts,
  ROUTES.admin.createPoi,
]);

/**
 * Role-independent check for a `returnUrl` that points into the administration console.
 * Accepts a same-origin `/admin/*` path (with query and hash) and rejects the login and
 * password-recovery pages, protocol-relative and backslash forms, and anything off-site.
 * Returns the normalized path, or null when the value is not safe to forward.
 */
export function safeAdminReturnPath(value: string | string[] | undefined): string | null {
  if (typeof value !== 'string') return null;
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null;

  try {
    const candidate = new URL(value, BASE_URL);
    if (candidate.origin !== BASE_URL) return null;

    // Trailing slashes are stripped so `/admin/login/` cannot slip past the login exclusion.
    const pathname = candidate.pathname.replace(/\/+$/, '') || '/';
    const isAdministrationPath = pathname === ROUTES.admin.dashboard || pathname.startsWith('/admin/');
    const isExcluded = pathname === ROUTES.admin.login || pathname === ROUTES.admin.forgotPassword;
    if (!isAdministrationPath || isExcluded) return null;

    return `${candidate.pathname}${candidate.search}${candidate.hash}`;
  } catch {
    return null;
  }
}

/**
 * Chooses where a successful sign-in lands. The `returnUrl` is honored only for
 * Administrator and Staff, and only when the role may open that page; every other case
 * uses the role's own destination (`fallback`). Traveler and Tour Operator never receive
 * an administration `returnUrl`.
 */
export function resolveSignInReturnUrl(
  returnUrl: string | string[] | undefined,
  role: string | undefined,
  fallback: string | null,
): string | null {
  if (role !== 'Administrator' && role !== 'Staff') return fallback;

  const path = safeAdminReturnPath(returnUrl);
  if (!path) return fallback;

  const pathname = new URL(path, BASE_URL).pathname.replace(/\/+$/, '') || '/';
  if (role === 'Staff' && !STAFF_ALLOWED_EXACT_ROUTES.has(pathname)) return fallback;
  if (role === 'Administrator' && pathname === ROUTES.admin.createPoi) return fallback;
  return path;
}
