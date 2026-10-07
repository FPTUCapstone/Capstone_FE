import type { StatisticalWorkspaceMode } from '../types/statisticalReports';

export type ResolvedActorRole =
  | 'Administrator'
  | 'Staff'
  | 'Traveler'
  | 'TourOperator'
  | 'PENDING_AUTH_SESSION_VERIFICATION'
  | 'Unknown';

export interface ResolveStatisticalWorkspaceModeOptions {
  readonly demoQueryParam?: string | string[] | null;
  readonly nodeEnv?: string;
}

export type UpstreamAdminSessionVerifier = (bearerToken: string) => Promise<{
  readonly ok: boolean;
  readonly status: number;
}>;

const MS_ROLE_CLAIM_URI = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

/**
 * Untrusted token role-hint inspector for UC-67 Export Statistical Reports (Screen #32).
 *
 * Security & Trusted Session Boundary Note:
 * - Frontend/Node base64 decoding NEVER verifies JWT signature, issuer, audience, or session
 *   authenticity. Therefore this function NEVER returns `'Administrator'`.
 * - A token whose unverified payload claims `'Administrator'` (including a forged token such as
 *   `header.payload.fake-signature`) resolves only to `'PENDING_AUTH_SESSION_VERIFICATION'`,
 *   which is denied by `canAccessStatisticalReports()`.
 * - The `/admin/reports` route fails closed unless a trusted administration session can resolve
 *   the actor as `'Administrator'` through `verifyTrustedAdminStatisticalReportSession()`.
 * - When current environment infrastructure cannot verify token authenticity against the Backend,
 *   the session remains `'PENDING_AUTH_SESSION_VERIFICATION'` and access is denied.
 * - Classification Note: Report 3 V2 §3.1.2 lists Screens #37 (`Platform Revenue Report`) and
 *   #38 (`Export Platform Revenue Report`) without mapping them to any detailed use case
 *   (`SRS_MAPPING_GAP_PLATFORM_REVENUE_SCREENS_37_38`); UC-67 is mapped exclusively to
 *   Screen #32 (`Statistical Reports`) for Administrator only.
 */
export function parseAdminTokenRole(token?: string | null): ResolvedActorRole | null {
  if (!token || typeof token !== 'string' || !token.trim()) return null;
  const trimmed = token.trim();

  const segments = trimmed.split('.');
  if (segments.length !== 3 || !segments[0] || !segments[1] || !segments[2]) {
    return 'Unknown';
  }

  try {
    const normalized = segments[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const json = Buffer.from(padded, 'base64').toString('utf8');
    const payload = JSON.parse(json) as unknown;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return 'Unknown';
    }

    const record = payload as Record<string, unknown>;
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (typeof record.exp === 'number' && record.exp <= nowSeconds) {
      return 'Unknown';
    }
    if (typeof record.nbf === 'number' && record.nbf > nowSeconds) {
      return 'Unknown';
    }

    const roleClaim = record.role ?? record[MS_ROLE_CLAIM_URI];
    if (roleClaim === 'Staff') return 'Staff';
    if (roleClaim === 'Traveler') return 'Traveler';
    if (roleClaim === 'TourOperator') return 'TourOperator';
    if (roleClaim === 'Administrator') {
      return 'PENDING_AUTH_SESSION_VERIFICATION';
    }
    return 'Unknown';
  } catch {
    return 'Unknown';
  }
}

/**
 * Verifies an administration session token over a trusted server-side Backend boundary.
 *
 * - Never trusts a decoded JWT role claim on its own.
 * - Rejects missing, opaque, malformed, expired, and non-Administrator tokens immediately.
 * - Requires an upstream Backend `[Authorize(Roles = "Administrator")]` verification probe
 *   (`verifyUpstream`) to confirm `status === 200` before returning `'Administrator'`.
 * - If upstream rejects the token (`401`/`403`) or verification infrastructure is unavailable,
 *   fails closed (`'Unknown'` or `'PENDING_AUTH_SESSION_VERIFICATION'`).
 */
export async function verifyTrustedAdminStatisticalReportSession(
  token?: string | null,
  verifyUpstream?: UpstreamAdminSessionVerifier,
): Promise<ResolvedActorRole | null> {
  const hint = parseAdminTokenRole(token);
  if (hint === null) return null;
  if (hint !== 'PENDING_AUTH_SESSION_VERIFICATION') {
    return hint;
  }

  if (!verifyUpstream || !token) {
    return 'PENDING_AUTH_SESSION_VERIFICATION';
  }

  try {
    const response = await verifyUpstream(token.trim());
    if (response.ok && response.status === 200) {
      return 'Administrator';
    }
    if (response.status === 401 || response.status === 403) {
      return 'Unknown';
    }
    return 'PENDING_AUTH_SESSION_VERIFICATION';
  } catch {
    return 'PENDING_AUTH_SESSION_VERIFICATION';
  }
}

export function canAccessStatisticalReports(role: string | null | undefined): boolean {
  return role === 'Administrator';
}

export function isStatisticalDemoAllowedInEnv(
  nodeEnv: string | undefined = process.env.NODE_ENV,
): boolean {
  return nodeEnv !== 'production';
}

export function resolveStatisticalWorkspaceMode(
  options?: ResolveStatisticalWorkspaceModeOptions,
): StatisticalWorkspaceMode {
  if (!isStatisticalDemoAllowedInEnv(options?.nodeEnv)) {
    return 'PRODUCTION';
  }

  const rawDemo = Array.isArray(options?.demoQueryParam)
    ? options?.demoQueryParam[0]
    : options?.demoQueryParam;

  return rawDemo === 'true' ? 'DEMO' : 'PRODUCTION';
}
