import type { StatisticalWorkspaceMode } from '../types/statisticalReports';

export interface ResolveStatisticalWorkspaceModeOptions {
  readonly demoQueryParam?: string | string[] | null;
  readonly nodeEnv?: string;
}

/**
 * Authorization and workspace mode guards for UC-67 Export Statistical Reports (Screen #32).
 *
 * Canonical Requirements & SRS V2 Alignment:
 * - Specification Section: Report 3 V2 §3.9.11 (Screen #32 Statistical Reports).
 * - Actor: Administrator only. Staff, Traveler, and TourOperator actors are strictly denied.
 * - Business Rules:
 *   - BR-115: Statistical reporting access and filtering criteria.
 *   - BR-129: Report generation and export period boundaries; reports must target closed fiscal periods.
 *   - BR-110: Report generation requirements and validation.
 *   - BR-109: Financial calculations (Gross Revenue, Net Revenue, Commission).
 *   - BR-79: Data export and download format standards (CSV, Excel, PDF).
 *   - BR-130: File delivery and storage guidelines.
 *
 * SRS Discrepancy & Conflict Register:
 * - SRS_MAPPING_GAP_PLATFORM_REVENUE_SCREENS_37_38: Report 3 V2 §3.1.2 lists Screens #37
 *   ("Platform Revenue Report") and #38 ("Export Platform Revenue Report") in the screen table,
 *   but provides no corresponding detailed use case specification. UC-67 is defined at §3.9.11
 *   exclusively targeting Screen #32 ("Statistical Reports").
 * - Application Messages Discrepancies (§3.9.11 vs Appendix §5.3):
 *   - MSG29: In §3.9.11 denotes "Report period must be closed", whereas Appendix §5.3 assigns
 *     MSG29 to POI geographic coordinate validation.
 *   - MSG117: In §3.9.11 denotes "Report generation failed", whereas Appendix §5.3 assigns
 *     MSG117 to algorithm parameter updates.
 *   - MSG149: In §3.9.11 denotes "File delivered successfully", whereas Appendix §5.3 message
 *     catalog terminates at MSG130.
 *
 * BFF Architecture Integration:
 * - Server component `/admin/reports` authenticates via `@/lib/server/adminSession` using signed
 *   HMAC-SHA256 session seals (`TRIPMATE_ADMIN_SESSION_SECRET`).
 * - `canAccessStatisticalReports` acts as a defense-in-depth gate to ensure only verified
 *   `Administrator` sessions can view or operate statistical reporting screens.
 */
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
