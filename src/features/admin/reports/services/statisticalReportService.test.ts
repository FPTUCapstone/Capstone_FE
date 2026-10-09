import { describe, expect, it } from 'vitest';

import {
  canAccessStatisticalReports,
  isStatisticalDemoAllowedInEnv,
  resolveStatisticalWorkspaceMode,
} from '../guards/statisticalReportAuth';
import {
  DEMO_FILTER_FIXTURES,
  DEMO_PERIOD_FIXTURES,
  PRODUCTION_FILTER_OPTIONS,
  PRODUCTION_PERIOD_OPTIONS,
  buildDemoExportArtifact,
  findDemoPeriodFixture,
  findProductionPeriodOption,
  formatVietnamDateDdMmYyyy,
  formatVndCurrency,
  generateDemoStatisticalReport,
  getDemoPeriodFixturesByGranularity,
  getFilterOptionsByMode,
  getProductionPeriodsByGranularity,
  triggerBrowserCsvDownload,
} from './statisticalReportService';
import type {
  AppliedStatisticalReportCriteria,
  StatisticalReportType,
} from '../types/statisticalReports';

describe('statisticalReportService & statisticalReportAuth (UC-67)', () => {
  describe('Defense-in-Depth Role Authorization Boundary (BR-115)', () => {
    it('authorizes only Administrator and rejects all other roles and falsy values', () => {
      expect(canAccessStatisticalReports('Administrator')).toBe(true);

      expect(canAccessStatisticalReports('Staff')).toBe(false);
      expect(canAccessStatisticalReports('Traveler')).toBe(false);
      expect(canAccessStatisticalReports('TourOperator')).toBe(false);
      expect(canAccessStatisticalReports('Unknown')).toBe(false);
      expect(canAccessStatisticalReports('PENDING_AUTH_SESSION_VERIFICATION')).toBe(false);
      expect(canAccessStatisticalReports('')).toBe(false);
      expect(canAccessStatisticalReports(null)).toBe(false);
      expect(canAccessStatisticalReports(undefined)).toBe(false);
    });

    it('enforces Demo environment lockdown (isStatisticalDemoAllowedInEnv)', () => {
      expect(isStatisticalDemoAllowedInEnv('development')).toBe(true);
      expect(isStatisticalDemoAllowedInEnv('test')).toBe(true);
      expect(isStatisticalDemoAllowedInEnv('production')).toBe(false);
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

  describe('Production Filter Truthfulness & Period Authority Separation', () => {
    it('separates PRODUCTION_FILTER_OPTIONS (zero fixture operators/destinations) from DEMO_FILTER_FIXTURES', () => {
      expect(PRODUCTION_FILTER_OPTIONS.operators).toEqual([
        { id: 'ALL', label: 'All Tour Operators' },
      ]);
      expect(PRODUCTION_FILTER_OPTIONS.destinations).toEqual([
        { id: 'ALL', label: 'All Destinations' },
      ]);
      expect(PRODUCTION_FILTER_OPTIONS.bookingTypes.map((b) => b.id)).toEqual([
        'ALL',
        'TOUR_PACKAGE',
        'COMMERCIAL_SERVICE',
      ]);

      expect(DEMO_FILTER_FIXTURES.operators.length).toBe(5);
      expect(DEMO_FILTER_FIXTURES.destinations.length).toBe(6);
      expect(getFilterOptionsByMode('PRODUCTION')).toBe(PRODUCTION_FILTER_OPTIONS);
      expect(getFilterOptionsByMode('DEMO')).toBe(DEMO_FILTER_FIXTURES);
    });

    it('formats VND currency with thousands separators and no decimals (CR-08 / BR-79) and dates as dd/MM/yyyy in Asia/Ho_Chi_Minh (CR-07)', () => {
      expect(formatVndCurrency(1_420_000_000)).toBe('1,420,000,000 VND');
      expect(formatVndCurrency(130_000_000.4)).toBe('130,000,000 VND');
      expect(formatVndCurrency(-130_000_000)).toBe('-130,000,000 VND');
      expect(formatVietnamDateDdMmYyyy('2026-09-30T10:00:00+07:00')).toBe('30/09/2026');
      expect(formatVietnamDateDdMmYyyy('invalid-date')).toBe('--/--/----');
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

    it('builds downloadable RFC 4180 CSV export artifacts and marks EXCEL/PDF as preview-only without fake binary content (BR-110, BR-130)', () => {
      const report = generateDemoStatisticalReport({
        reportType: 'BOOKING_VOLUME',
        periodGranularity: 'CLOSED_YEAR',
        periodKey: '2025',
        operatorId: 'OP-102',
        destinationId: 'DEST-HOI',
        bookingType: 'TOUR_PACKAGE',
      })!;

      const csvArtifact = buildDemoExportArtifact(report, 'CSV');
      expect(csvArtifact.isDownloadable).toBe(true);
      expect(csvArtifact.fileName).toBe('DEMO-TripMate-BOOKING_VOLUME-2025.csv');
      expect(csvArtifact.mimeType).toBe('text/csv;charset=utf-8');
      expect(csvArtifact.csvContent).toContain(
        '[DEMO FIXTURE EXPORT — NOT PRODUCTION ACCOUNTING DATA]',
      );
      expect(csvArtifact.csvContent).toContain(
        'Booking Status Category,Booking Count,Associated Value (VND),Settlement State',
      );
      expect(csvArtifact.csvContent).toContain('"880,588,800 VND"');
      expect(csvArtifact.contentPreview).toContain('Operator=OP-102');
      expect(csvArtifact.contentPreview).toContain('Destination=DEST-HOI');
      expect(csvArtifact.auditEventSummary).toContain('StatisticalReportExported');

      for (const binaryFormat of ['EXCEL', 'PDF'] as const) {
        const previewArtifact = buildDemoExportArtifact(report, binaryFormat);
        expect(previewArtifact.isDownloadable).toBe(false);
        expect(previewArtifact.csvContent).toBeUndefined();
        expect(previewArtifact.auditEventSummary).toContain('StatisticalReportPreviewed');
        expect(triggerBrowserCsvDownload(previewArtifact)).toBe(false);
      }
    });

    it('triggers a real browser CSV file download using Blob, URL.createObjectURL, anchor click, and URL.revokeObjectURL cleanup', () => {
      const report = generateDemoStatisticalReport({
        reportType: 'PLATFORM_REVENUE',
        periodGranularity: 'CLOSED_MONTH',
        periodKey: '2026-09',
        operatorId: 'ALL',
        destinationId: 'ALL',
        bookingType: 'ALL',
      })!;

      const csvArtifact = buildDemoExportArtifact(report, 'CSV');
      const originalCreateObjectURL = URL.createObjectURL;
      const originalRevokeObjectURL = URL.revokeObjectURL;

      let capturedBlob: Blob | null = null;
      let revokedUrl: string | null = null;
      let clickedDownloadName: string | null = null;
      let clickedHref: string | null = null;

      URL.createObjectURL = (obj: Blob | MediaSource) => {
        capturedBlob = obj as Blob;
        return 'blob:tripmate-demo-statistical-csv';
      };
      URL.revokeObjectURL = (url: string) => {
        revokedUrl = url;
      };

      const originalCreateElement = document.createElement.bind(document);
      const createElementSpy = (tagName: string) => {
        const el = originalCreateElement(tagName);
        if (tagName.toLowerCase() === 'a') {
          const anchor = el as HTMLAnchorElement;
          anchor.click = () => {
            clickedDownloadName = anchor.download;
            clickedHref = anchor.href;
          };
        }
        return el;
      };
      const originalDocCreateElement = document.createElement;
      document.createElement = createElementSpy as typeof document.createElement;

      try {
        const result = triggerBrowserCsvDownload(csvArtifact);
        expect(result).toBe(true);
        expect(capturedBlob).toBeInstanceOf(Blob);
        expect(capturedBlob!.type).toBe('text/csv;charset=utf-8');
        expect(clickedDownloadName).toBe('DEMO-TripMate-PLATFORM_REVENUE-2026-09.csv');
        expect(clickedHref).toContain('blob:tripmate-demo-statistical-csv');
        expect(revokedUrl).toBe('blob:tripmate-demo-statistical-csv');
      } finally {
        URL.createObjectURL = originalCreateObjectURL;
        URL.revokeObjectURL = originalRevokeObjectURL;
        document.createElement = originalDocCreateElement;
      }
    });
  });
});
