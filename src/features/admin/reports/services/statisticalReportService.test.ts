import { describe, expect, it } from 'vitest';

import {
   canAccessStatisticalReports,
  parseAdminTokenRole,
} from '../guards/statisticalReportAuth';
import {
  buildDemoExportArtifact,
  findPeriodOption,
  formatVietnamDateDdMmYyyy,
  formatVndCurrency,
  generateDemoStatisticalReport,
  getPeriodsByGranularity,
} from './statisticalReportService';
import type {
  AppliedStatisticalReportCriteria,
  StatisticalReportType,
} from '../types/statisticalReports';

function createJwtWithRole(role: string, claimKey = 'role'): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: '1', [claimKey]: role })).toString('base64url');
  return `${header}.${payload}.sig`;
}

describe('statisticalReportService & statisticalReportAuth (UC-67)', () => {
  it('enforces Administrator-only access (BR-115) and rejects Traveler, TourOperator, and Staff', () => {
    expect(canAccessStatisticalReports('Administrator')).toBe(true);
    expect(canAccessStatisticalReports('Staff')).toBe(false);
    expect(canAccessStatisticalReports('Traveler')).toBe(false);
    expect(canAccessStatisticalReports('TourOperator')).toBe(false);
    expect(canAccessStatisticalReports(null)).toBe(false);
    expect(canAccessStatisticalReports(undefined)).toBe(false);

    expect(parseAdminTokenRole(createJwtWithRole('Administrator'))).toBe('Administrator');
    expect(
      parseAdminTokenRole(
        createJwtWithRole(
          'Staff',
          'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
        ),
      ),
    ).toBe('Staff');
    expect(parseAdminTokenRole(createJwtWithRole('Traveler'))).toBe('Traveler');
    expect(parseAdminTokenRole(createJwtWithRole('TourOperator'))).toBe('TourOperator');
  });

  it('formats VND currency with thousands separators and no decimals (CR-08 / BR-79) and dates as dd/MM/yyyy in Asia/Ho_Chi_Minh (CR-07)', () => {
    expect(formatVndCurrency(1_420_000_000)).toBe('1,420,000,000 VND');
    expect(formatVndCurrency(130_000_000.4)).toBe('130,000,000 VND');
    expect(formatVndCurrency(-130_000_000)).toBe('-130,000,000 VND');
    expect(formatVietnamDateDdMmYyyy('2026-09-30T10:00:00+07:00')).toBe('30/09/2026');
  });

  it('provides closed and open periods across Closed Month, Closed Quarter, and Closed Year and rejects open periods (BR-129)', () => {
    expect(getPeriodsByGranularity('CLOSED_MONTH').some((p) => p.isClosed)).toBe(true);
    expect(getPeriodsByGranularity('CLOSED_MONTH').some((p) => !p.isClosed)).toBe(true);
    expect(getPeriodsByGranularity('CLOSED_QUARTER').some((p) => p.isClosed)).toBe(true);
    expect(getPeriodsByGranularity('CLOSED_YEAR').some((p) => p.isClosed)).toBe(true);

    const openPeriodCriteria: AppliedStatisticalReportCriteria = {
      reportType: 'PLATFORM_REVENUE',
      periodGranularity: 'CLOSED_MONTH',
      periodKey: '2026-10-OPEN',
      operatorId: 'ALL',
      destinationId: 'ALL',
      bookingType: 'ALL',
    };
    expect(findPeriodOption('2026-10-OPEN')?.isClosed).toBe(false);
    expect(generateDemoStatisticalReport(openPeriodCriteria)).toBeNull();
  });

  it.each<StatisticalReportType>([
    'USER_GROWTH',
    'BOOKING_VOLUME',
    'PLATFORM_REVENUE',
    'OPERATOR_PERFORMANCE',
    'DESTINATION_POPULARITY',
  ])('generates deterministic Demo dataset for report type %s on a closed period', (reportType) => {
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
  });

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
