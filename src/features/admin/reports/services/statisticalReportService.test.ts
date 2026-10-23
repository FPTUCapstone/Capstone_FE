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
  escapeCsvCell,
  findDemoPeriodFixture,
  findProductionPeriodOption,
  formatVietnamDateDdMmYyyy,
  formatVndCurrency,
  generateDemoStatisticalReport,
  getDemoPeriodFixturesByGranularity,
  getFilterOptionsByMode,
  getProductionPeriodsByGranularity,
  isLegitimateNumericMetric,
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
      expect(isStatisticalDemoAllowedInEnv('development', 'true')).toBe(true);
      expect(isStatisticalDemoAllowedInEnv('test', 'true')).toBe(true);
      expect(isStatisticalDemoAllowedInEnv('production', 'true')).toBe(false);
      expect(isStatisticalDemoAllowedInEnv('development', 'false')).toBe(false);
      expect(isStatisticalDemoAllowedInEnv('development', undefined)).toBe(false);
      expect(isStatisticalDemoAllowedInEnv('development', '')).toBe(false);
    });
  });

  describe('Workspace Mode Gate (resolveStatisticalWorkspaceMode / L2)', () => {
    it('defaults to PRODUCTION when demoQueryParam is absent or malformed', () => {
      expect(resolveStatisticalWorkspaceMode()).toBe('PRODUCTION');
      expect(
        resolveStatisticalWorkspaceMode({
          nodeEnv: 'development',
          enableDemoFixtures: 'true',
        }),
      ).toBe('PRODUCTION');
      expect(
        resolveStatisticalWorkspaceMode({
          nodeEnv: 'development',
          enableDemoFixtures: 'true',
          demoQueryParam: 'false',
        }),
      ).toBe('PRODUCTION');
      expect(
        resolveStatisticalWorkspaceMode({
          nodeEnv: 'development',
          enableDemoFixtures: 'true',
          demoQueryParam: '0',
        }),
      ).toBe('PRODUCTION');
      expect(
        resolveStatisticalWorkspaceMode({
          nodeEnv: 'development',
          enableDemoFixtures: 'true',
          demoQueryParam: 'malformed',
        }),
      ).toBe('PRODUCTION');
    });

    it('enables DEMO when nodeEnv is non-production, enableDemoFixtures is "true", and demoQueryParam is canonical "1" or "true"', () => {
      // Canonical "?demo=1" format
      expect(
        resolveStatisticalWorkspaceMode({
          nodeEnv: 'development',
          enableDemoFixtures: 'true',
          demoQueryParam: '1',
        }),
      ).toBe('DEMO');
      expect(
        resolveStatisticalWorkspaceMode({
          nodeEnv: 'test',
          enableDemoFixtures: 'true',
          demoQueryParam: ['1'],
        }),
      ).toBe('DEMO');

      // Backward-compatible "?demo=true" format
      expect(
        resolveStatisticalWorkspaceMode({
          nodeEnv: 'development',
          enableDemoFixtures: 'true',
          demoQueryParam: 'true',
        }),
      ).toBe('DEMO');
      expect(
        resolveStatisticalWorkspaceMode({
          nodeEnv: 'test',
          enableDemoFixtures: 'true',
          demoQueryParam: ['true'],
        }),
      ).toBe('DEMO');
    });

    it('locks to PRODUCTION when NEXT_PUBLIC_ENABLE_DEMO_FIXTURES is missing or false, even with ?demo=1 or ?demo=true', () => {
      expect(
        resolveStatisticalWorkspaceMode({
          nodeEnv: 'development',
          enableDemoFixtures: 'false',
          demoQueryParam: '1',
        }),
      ).toBe('PRODUCTION');
      expect(
        resolveStatisticalWorkspaceMode({
          nodeEnv: 'development',
          enableDemoFixtures: undefined,
          demoQueryParam: '1',
        }),
      ).toBe('PRODUCTION');
      expect(
        resolveStatisticalWorkspaceMode({
          nodeEnv: 'development',
          enableDemoFixtures: 'false',
          demoQueryParam: 'true',
        }),
      ).toBe('PRODUCTION');
    });

    it('locks to PRODUCTION when nodeEnv is "production" regardless of enableDemoFixtures and query params', () => {
      expect(
        resolveStatisticalWorkspaceMode({
          nodeEnv: 'production',
          enableDemoFixtures: 'true',
          demoQueryParam: '1',
        }),
      ).toBe('PRODUCTION');
      expect(
        resolveStatisticalWorkspaceMode({
          nodeEnv: 'production',
          enableDemoFixtures: 'true',
          demoQueryParam: 'true',
        }),
      ).toBe('PRODUCTION');
      expect(
        resolveStatisticalWorkspaceMode({
          nodeEnv: 'production',
          enableDemoFixtures: 'true',
          demoQueryParam: ['1'],
        }),
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
        'Booking Status Category,Booking Count,Associated Value (VND)',
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

  describe('CSV Formula Injection Defense & Secure Cell Escaping (CWE-1236 / L1)', () => {
    describe('escapeCsvCell individual cell neutralization', () => {
      it('neutralizes cells starting with formula trigger characters (=, +, -, @) by prepending a single quote', () => {
        expect(escapeCsvCell('=HYPERLINK("http://evil.com","Click")')).toBe(
          `"'=HYPERLINK(""http://evil.com"",""Click"")"`,
        );
        expect(escapeCsvCell('=1+1')).toBe(`'=1+1`);
        expect(escapeCsvCell(`=cmd|' /C calc'!A0`)).toBe(`'=cmd|' /C calc'!A0`);
        expect(escapeCsvCell(`+cmd|' /C calc'!A0`)).toBe(`'+cmd|' /C calc'!A0`);
        expect(escapeCsvCell('@SUM(A1:A10)')).toBe(`'@SUM(A1:A10)`);
        expect(escapeCsvCell('-@SUM(1,2)')).toBe(`"'-@SUM(1,2)"`);
      });

      it('prevents leading whitespace and control character bypasses', () => {
        expect(escapeCsvCell('   =HYPERLINK("http://evil.com")')).toBe(
          `"'   =HYPERLINK(""http://evil.com"")"`,
        );
        expect(escapeCsvCell('\t=1+1')).toBe(`'\t=1+1`);
        expect(escapeCsvCell('\r=calc')).toBe(`"'\r=calc"`);
        expect(escapeCsvCell('   @SUM(1)')).toBe(`'   @SUM(1)`);
        expect(escapeCsvCell('\t@evil')).toBe(`'\t@evil`);
      });

      it('preserves legitimate numeric metrics without prepending an apostrophe', () => {
        expect(escapeCsvCell('-100')).toBe('-100');
        expect(escapeCsvCell('+50')).toBe('+50');
        expect(escapeCsvCell('123.45')).toBe('123.45');
        expect(escapeCsvCell('-123.45')).toBe('-123.45');
        expect(escapeCsvCell('-17,640,000 VND')).toBe(`"-17,640,000 VND"`);
        expect(escapeCsvCell('-17.640.000 ₫')).toBe('-17.640.000 ₫');
        expect(escapeCsvCell('+5%')).toBe('+5%');
        expect(escapeCsvCell('-10%')).toBe('-10%');
        expect(escapeCsvCell('95%')).toBe('95%');
        expect(escapeCsvCell('4.8 / 5.0')).toBe('4.8 / 5.0');
      });

      it('correctly classifies legitimate numeric metrics via isLegitimateNumericMetric', () => {
        expect(isLegitimateNumericMetric('-100')).toBe(true);
        expect(isLegitimateNumericMetric('+50')).toBe(true);
        expect(isLegitimateNumericMetric('1,420,000,000 VND')).toBe(true);
        expect(isLegitimateNumericMetric('-17.640.000 ₫')).toBe(true);
        expect(isLegitimateNumericMetric('+5%')).toBe(true);
        expect(isLegitimateNumericMetric('4.8 / 5.0')).toBe(true);

        expect(isLegitimateNumericMetric('=1+1')).toBe(false);
        expect(isLegitimateNumericMetric(`+cmd|calc`)).toBe(false);
        expect(isLegitimateNumericMetric(`-@SUM(1)`)).toBe(false);
        expect(isLegitimateNumericMetric(`@SUM(A1)`)).toBe(false);
        expect(isLegitimateNumericMetric('Tour Operator')).toBe(false);
        expect(isLegitimateNumericMetric('-')).toBe(false);
      });

      it('preserves Unicode and Vietnamese text correctly', () => {
        expect(escapeCsvCell('Đà Nẵng & Hội An')).toBe('Đà Nẵng & Hội An');
        expect(escapeCsvCell('Tổng doanh thu thuần')).toBe('Tổng doanh thu thuần');
        expect(escapeCsvCell('Văn hoá & Di sản')).toBe('Văn hoá & Di sản');
      });

      it('correctly quotes commas, double quotes, and multiline text with RFC 4180 standard escaping', () => {
        expect(escapeCsvCell('Central, Vietnam')).toBe('"Central, Vietnam"');
        expect(escapeCsvCell('Operator "Saigontourist"')).toBe('"Operator ""Saigontourist"""');
        expect(escapeCsvCell('Line 1\r\nLine 2')).toBe('"Line 1\r\nLine 2"');
        expect(escapeCsvCell('Line 1\nLine 2')).toBe('"Line 1\nLine 2"');
      });

      it('avoids double-escaping values that already have a leading single quote', () => {
        expect(escapeCsvCell(`'=ALREADY_NEUTRALIZED`)).toBe(`'=ALREADY_NEUTRALIZED`);
        expect(escapeCsvCell(`'   =ALREADY_NEUTRALIZED`)).toBe(`'   =ALREADY_NEUTRALIZED`);
      });

      it('does not prepend unnecessary apostrophes to safe table headings and prefixes', () => {
        expect(escapeCsvCell('Period')).toBe('Period');
        expect(escapeCsvCell('Gross Revenue (VND)')).toBe('Gross Revenue (VND)');
        expect(escapeCsvCell('Net Revenue (VND)')).toBe('Net Revenue (VND)');
        expect(escapeCsvCell('Commission Rate (%)')).toBe('Commission Rate (%)');
        expect(escapeCsvCell('Booking Status Category')).toBe('Booking Status Category');
      });
    });

    describe('Full CSV artifact generation with untrusted / malicious data', () => {
      it('neutralizes malicious operator and segment values in generated CSV content', () => {
        const baseReport = generateDemoStatisticalReport({
          reportType: 'PLATFORM_REVENUE',
          periodGranularity: 'CLOSED_MONTH',
          periodKey: '2026-09',
          operatorId: 'ALL',
          destinationId: 'ALL',
          bookingType: 'ALL',
        })!;

        // Inject malicious segments into breakdown rows
        const maliciousReport = {
          ...baseReport,
          breakdownRows: [
            {
              id: 'malicious-1',
              segmentLabel: '=cmd|"/C calc"!A0',
              primaryMetricLabel: '100,000,000 VND',
              secondaryMetricLabel: '10,000,000 VND',
              tertiaryMetricLabel: '90,000,000 VND',
            },
            {
              id: 'malicious-2',
              segmentLabel: '+HYPERLINK("http://evil.com","Phishing")',
              primaryMetricLabel: '-50,000,000 VND',
              secondaryMetricLabel: '0 VND',
              tertiaryMetricLabel: '-50,000,000 VND',
            },
            {
              id: 'malicious-3',
              segmentLabel: '   @SUM(1+1)*cmd',
              primaryMetricLabel: '10,000 VND',
              secondaryMetricLabel: '1,000 VND',
              tertiaryMetricLabel: '9,000 VND',
            },
            {
              id: 'safe-row',
              segmentLabel: 'Đà Nẵng Discovery',
              primaryMetricLabel: '500,000,000 VND',
              secondaryMetricLabel: '50,000,000 VND',
              tertiaryMetricLabel: '450,000,000 VND',
            },
          ],
        };

        const artifact = buildDemoExportArtifact(maliciousReport, 'CSV');
        expect(artifact.isDownloadable).toBe(true);
        const csv = artifact.csvContent!;

        // Must neutralize formula triggers with apostrophe
        expect(csv).toContain(`"'=cmd|""/C calc""!A0"`);
        expect(csv).toContain(`"'+HYPERLINK(""http://evil.com"",""Phishing"")"`);
        expect(csv).toContain(`'   @SUM(1+1)*cmd`);

        // Legitimate negative currency metric preserved without leading apostrophe
        expect(csv).toContain(`"-50,000,000 VND"`);
        expect(csv).not.toContain(`"'-50,000,000 VND"`);

        // Safe Vietnamese label preserved
        expect(csv).toContain('Đà Nẵng Discovery');
      });
    });
  });
});
