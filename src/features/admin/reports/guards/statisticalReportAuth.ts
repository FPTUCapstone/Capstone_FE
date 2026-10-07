import type { StatisticalWorkspaceMode } from '../types/statisticalReports';

export type ResolvedActorRole =
  | 'Administrator'
  | 'Staff'
  | 'Traveler'
  | 'TourOperator'
  | 'Unknown';

export interface ResolveStatisticalWorkspaceModeOptions {
  readonly demoQueryParam?: string | string[] | null;
  readonly nodeEnv?: string;
}

const MS_ROLE_CLAIM_URI = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

/**
 * Fail-closed role parser for UC-67 Export Statistical Reports (Screen #32).
 *
 * Security & Staff Foundation Compatibility Note:
 * - Never treats arbitrary opaque strings or unverified tokens as 'Administrator'.
 * - Only resolves 'Administrator' from a structured 3-segment JWT payload containing an
 *   explicit 'Administrator' role claim (`role` or Microsoft identity role claim URI).
 * - Once PR #55 (`feature/web-staff-foundation`) merges into `develop`, this helper can
 *   delegate directly to the shared server administration session role parser in
 *   `src/lib/server/adminSession.ts` without conflicting token conventions.
 * - Classification Note: Report 3 V2 §3.1.2 lists Screens #37 and #38 without mapping them
 *   to any detailed use case (`SRS_MAPPING_GAP_REPORTING_SCREENS_37_38`); UC-67 is mapped
 *   exclusively to Screen #32 (`Statistical Reports`) for Administrator only.
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
    const roleClaim = record.role ?? record[MS_ROLE_CLAIM_URI];
    if (roleClaim === 'Administrator') return 'Administrator';
    if (roleClaim === 'Staff') return 'Staff';
    if (roleClaim === 'Traveler') return 'Traveler';
    if (roleClaim === 'TourOperator') return 'TourOperator';
    return 'Unknown';
  } catch {
    return 'Unknown';
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
