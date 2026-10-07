import { describe, expect, it } from 'vitest';

import {
  canAccessStatisticalReports,
  parseAdminTokenRole,
  resolveStatisticalWorkspaceMode,
} from '../guards/statisticalReportAuth';
import {
  DEMO_PERIOD_FIXTURES,
  PRODUCTION_PERIOD_OPTIONS,
  buildDemoExportArtifact,
  findDemoPeriodFixture,
  findProductionPeriodOption,
  formatVietnamDateDdMmYyyy,
  formatVndCurrency,
  generateDemoStatisticalReport,
  getDemoPeriodFixturesByGranularity,
  getProductionPeriodsByGranularity,
} from './statisticalReportService';
import type {
  AppliedStatisticalReportCriteria,
  StatisticalReportType,
} from '../types/statisticalReports';

function createJwt(payload: unknown): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.sig`;
}

function createJwtWithRole(role: string, claimKey = 'role'): string {
  return createJwt({ sub: '1', [claimKey]: role });
}

describe('statisticalReportService & statisticalReportAuth (UC-67)', () => {
  describe('Fail-Closed Authorization (BR-115)', () => {
    it('rejects empty, null, undefined, and whitespace tokens', () => {
      expect(parseAdminTokenRole(null)).toBeNull();
      expect(parseAdminTokenRole(undefined)).toBeNull();
      expect(parseAdminTokenRole('')).toBeNull();
      expect(parseAdminTokenRole('   ')).toBeNull();

      expect(canAccessStatisticalReports(null)).toBe(false);
      expect(canAccessStatisticalReports(undefined)).toBe(false);
      expect(canAccessStatisticalReports('')).toBe(false);
      expect(canAccessStatisticalReports('Unknown')).toBe(false);
    });

    it('rejects random opaque tokens and never falls back to Administrator', () => {
      for (const opaque of [
        'server-only-token',
        'admin-access-token',
        'test-access-token',
        'random-opaque-token-12345',
      ]) {
        const resolved = parseAdminTokenRole(opaque);
        expect(resolved).toBe('Unknown');
        expect(canAccessStatisticalReports(resolved)).toBe(false);
      }
    });

    it('rejects malformed JWTs and JWTs without a valid role claim', () => {
      for (const malformed of [
        'only.two',
        'too.many.segments.here',
        'header.!!!not-base64-json!!!.sig',
        createJwt('not-an-object'),
        createJwt([1, 2, 3]),
        createJwt({ sub: '100' }),
        createJwt({ sub: '100', role: 'SuperUser' }),
      ]) {
        const resolved = parseAdminTokenRole(malformed);
        expect(resolved).toBe('Unknown');
        expect(canAccessStatisticalReports(resolved)).toBe(false);
      }
    });

    it('rejects JWTs with Staff, Traveler, or TourOperator roles and allows only Administrator', () => {
      const msRoleClaim = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

      const staffRole = parseAdminTokenRole(createJwtWithRole('Staff'));
      const staffMsRole = parseAdminTokenRole(createJwtWithRole('Staff', msRoleClaim));
      const travelerRole = parseAdminTokenRole(createJwtWithRole('Traveler'));
      const operatorRole = parseAdminTokenRole(createJwtWithRole('TourOperator'));

      expect(staffRole).toBe('Staff');
      expect(staffMsRole).toBe('Staff');
      expect(travelerRole).toBe('Traveler');
      expect(operatorRole).toBe('TourOperator');

      expect(canAccessStatisticalReports(staffRole)).toBe(false);
      expect(canAccessStatisticalReports(staffMsRole)).toBe(false);
      expect(canAccessStatisticalReports(travelerRole)).toBe(false);
      expect(canAccessStatisticalReports(operatorRole)).toBe(false);

      const adminRole = parseAdminTokenRole(createJwtWithRole('Administrator'));
      const adminMsRole = parseAdminTokenRole(createJwtWithRole('Administrator', msRoleClaim));
      expect(adminRole).toBe('Administrator');
      expect(adminMsRole).toBe('Administrator');
      expect(canAccessStatisticalReports(adminRole)).toBe(true);
      expect(canAccessStatisticalReports(adminMsRole)).toBe(true);
    });
  });

  describe('Workspace Mode Gate (resolveStatisticalWorkspaceMode)', () => {
    it('defaults to PRODUCTION when demoQueryParam is absent or not "true"', () => {
      expect(resolveStatisticalWorkspaceMode()).toBe('PRODUCTION');
      expect(resolveStatisticalWorkspaceMode({ nodeEnv: 'development' })).toBe('PRODUCTION');
      expect(
        resolveStatisticalWorkspaceMode({ nodeEnv: 'development', demoQueryParam: 'false' }),
      ).toBe('PRODUCTION');
      expect(
        resolveStatisticalWorkspaceMode({ nodeEnv: 'development', demoQueryParam: '1' }),
      ).toBe('PRODUCTION');
    });

    it('enables DEMO only when nodeEnv is non-production AND demoQueryParam is "true"', () => {
      expect(
        resolveStatisticalWorkspaceMode({ nodeEnv: 'development', demoQueryParam: 'true' }),
      ).toBe('DEMO');
      expect(
        resolveStatisticalWorkspaceMode({ nodeEnv: 'test', demoQueryParam: ['true'] }),
      ).toBe('DEMO');
    });

    it('locks to PRODUCTION when nodeEnv is "production" even if demoQueryParam is "true"', () => {
      expect(
        resolveStatisticalWorkspaceMode({ nodeEnv: 'production', demoQueryParam: 'true' }),
      ).toBe('PRODUCTION');
      expect(
        resolveStatisticalWorkspaceMode({ nodeEnv: 'production', demoQueryParam: ['true'] }),
      ).toBe('PRODUCTION');
    });
  });

  describe('Formatting & Period Authority Separation', () => {
    it('formats VND currency with thousands separators and no decimals (CR-08 / BR-79) and dates as dd/MM/yyyy in Asia/Ho_Chi_Minh (CR-07)', () => {
      expect(formatVndCurrency(1_420_000_000)).toBe('1,420,000,000 VND');
      expect(formatVndCurrency(130_000_000.4)).toBe('130,000,000 VND');
      expect(formatVndCurrency(-130_000_000)).toBe('-130,000,000 VND');
      expect(formatVietnamDateDdMmYyyy('2026-09-30T10:00:00+07:00')).toBe('30/09/2026');
    });

    it('separates PRODUCTION_PERIOD_OPTIONS (no frontend closure authority claim) from DEMO_PERIOD_FIXTURES (BR-129 fixture simulation)', () => {
      expect(PRODUCTION_PERIOD_OPTIONS.length).toBeGreaterThan(0);
      for (const prodPeriod of PRODUCTION_PERIOD_OPTIONS) {
        expect('isClosed' in prodPeriod).toBe(false);
        expect(prodPeriod.label).not.toContain('Closed');
      }
      expect(getProductionPeriodsByGranularity('CLOSED_MONTH').length).toBe(3);
      expect(getProductionPeriodsByGranularity('CLOSED_QUARTER').length).toBe(2);
      expect(getProductionPeriodsByGranularity('CLOSED_YEAR').length).toBe(2);
      expect(findProductionPeriodOption('2026-09')).toBeDefined();
      expect(findProductionPeriodOption('2026-10-OPEN')).toBeUndefined();

      expect(DEMO_PERIOD_FIXTURES.length).toBeGreaterThan(PRODUCTION_PERIOD_OPTIONS.length);
      expect(getDemoPeriodFixturesByGranularity('CLOSED_MONTH').some((p) => p.isClosed)).toBe(true);
      expect(getDemoPeriodFixturesByGranularity('CLOSED_MONTH').some((p) => !p.isClosed)).toBe(
        true,
      );
      expect(getDemoPeriodFixturesByGranularity('CLOSED_QUARTER').some((p) => p.isClosed)).toBe(
        true,
      );
      expect(getDemoPeriodFixturesByGranularity('CLOSED_YEAR').some((p) => p.isClosed)).toBe(true);

      const openPeriodCriteria: AppliedStatisticalReportCriteria = {
        reportType: 'PLATFORM_REVENUE',
        periodGranularity: 'CLOSED_MONTH',
        periodKey: '2026-10-OPEN',
        operatorId: 'ALL',
        destinationId: 'ALL',
        bookingType: 'ALL',
      };
      expect(findDemoPeriodFixture('2026-10-OPEN')?.isClosed).toBe(false);
      expect(generateDemoStatisticalReport(openPeriodCriteria)).toBeNull();
    });
  });

  describe('Demo Statistical Aggregation & Export', () => {
    it.each<StatisticalReportType>([
      'USER_GROWTH',
      'BOOKING_VOLUME',
      'PLATFORM_REVENUE',
      'OPERATOR_PERFORMANCE',
      'DESTINATION_POPULARITY',
    ])(
      'generates deterministic Demo dataset for report type %s on a closed period',
      (reportType) => {
        const report = generateDemoStatisticalReport({
          reportType,
          periodGranularity: 'CLOSED_MONTH',
          periodKey: '2026-09',
          operatorId: 'ALL',
          destinationId: 'ALL',
          bookingType: 'ALL',
        });

        expect(report).not.toBeNull();
        expect(report?.summaryMetrics.length).toBe(4);
        expect(report?.chartPoints.length).toBeGreaterThan(0);
        expect(report?.breakdownRows.length).toBeGreaterThan(0);
      },
    );

    it('computes Platform Revenue from Confirmed + Completed bookings minus recorded refunds (BR-109)', () => {
      const report = generateDemoStatisticalReport({
        reportType: 'PLATFORM_REVENUE',
        periodGranularity: 'CLOSED_QUARTER',
        periodKey: '2026-Q3',
        operatorId: 'OP-101',
        destinationId: 'DEST-DAD',
        bookingType: 'TOUR_PACKAGE',
      });

      expect(report?.revenueBreakdown).toBeDefined();
      const breakdown = report!.revenueBreakdown!;
      expect(breakdown.netPlatformRevenueVnd).toBe(
        breakdown.confirmedBookingsGrossVnd +
          breakdown.completedBookingsGrossVnd -
          breakdown.recordedRefundsVnd,
      );
    });

    it.each(['EXCEL', 'CSV', 'PDF'] as const)(
      'builds DEMO-watermarked export artifacts in %s format matching applied criteria (BR-110, BR-130)',
      (format) => {
        const report = generateDemoStatisticalReport({
          reportType: 'BOOKING_VOLUME',
          periodGranularity: 'CLOSED_YEAR',
          periodKey: '2025',
          operatorId: 'OP-102',
          destinationId: 'DEST-HOI',
          bookingType: 'TOUR_PACKAGE',
        })!;

        const artifact = buildDemoExportArtifact(report, format);
        expect(artifact.fileName).toMatch(/^DEMO-TripMate-BOOKING_VOLUME-2025\.(xlsx|csv|pdf)$/);
        expect(artifact.contentPreview).toContain(
          '[DEMO FIXTURE EXPORT — NOT PRODUCTION ACCOUNTING DATA]',
        );
        expect(artifact.contentPreview).toContain('Operator=OP-102');
        expect(artifact.contentPreview).toContain('Destination=DEST-HOI');
        expect(artifact.auditEventSummary).toContain('StatisticalReportExported');
      },
    );
  });
});
