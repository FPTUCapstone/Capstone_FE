import fs from 'node:fs';
import path from 'node:path';

import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

import { AdminNavigation } from '@/components/navigation/AdminNavigation';
import { AuthStorage } from '@/features/auth/session/authSession';

import { StatisticalReportsView } from './StatisticalReportsView';
import { statisticalReportsEn } from '../resources/en';

const VIETNAMESE_DIACRITIC_REGEX =
  /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

const RAW_CODE_REGEX = /\b(?:BR-\d+|MSG\d+)\b/;

function collectAllStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(collectAllStrings);
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).flatMap(collectAllStrings);
  }
  return [];
}

describe('Screen #32 StatisticalReportsView (UC-67 Export Statistical Reports)', () => {
  beforeEach(() => {
    AuthStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('1. Fail-Closed Authorization & CR-09 English Resource Architecture', () => {
    it('denies access when actorRole is omitted and no session exists (fail-closed)', () => {
      render(<StatisticalReportsView />);

      expect(
        screen.getByRole('heading', { level: 1, name: statisticalReportsEn.accessDenied.title }),
      ).toBeTruthy();
      expect(screen.getByText(statisticalReportsEn.accessDenied.message)).toBeTruthy();
      expect(
        screen.queryByRole('button', { name: statisticalReportsEn.criteriaForm.generateButton }),
      ).toBeNull();
    });

    it.each(['Traveler', 'TourOperator', 'Staff', 'Unknown', ''])(
      'denies access when actorRole is %s and displays semantic permission denied state',
      (unauthorizedRole) => {
        render(<StatisticalReportsView actorRole={unauthorizedRole} />);

        expect(
          screen.getByRole('heading', { level: 1, name: statisticalReportsEn.accessDenied.title }),
        ).toBeTruthy();
        expect(screen.getByText(statisticalReportsEn.accessDenied.message)).toBeTruthy();
        expect(
          screen.queryByRole('button', { name: statisticalReportsEn.criteriaForm.generateButton }),
        ).toBeNull();
      },
    );

    it('allows Administrator access and renders 100% English copy with zero Vietnamese or raw BR/MSG codes', () => {
      const { container } = render(
        <>
          <AdminNavigation />
          <StatisticalReportsView actorRole="Administrator" />
        </>,
      );

      expect(
        screen.getByRole('heading', { level: 1, name: statisticalReportsEn.header.title }),
      ).toBeTruthy();
      expect(container.textContent ?? '').not.toMatch(VIETNAMESE_DIACRITIC_REGEX);
      expect(container.textContent ?? '').not.toMatch(RAW_CODE_REGEX);
    });

    it('verifies CR-09 resource centralization across resources/en.ts, StatisticalReportsView.tsx, and statisticalReportService.ts', () => {
      const allResourceStrings = collectAllStrings(statisticalReportsEn);
      expect(allResourceStrings.length).toBeGreaterThan(80);
      for (const entry of allResourceStrings) {
        expect(entry).not.toMatch(VIETNAMESE_DIACRITIC_REGEX);
        expect(entry).not.toMatch(RAW_CODE_REGEX);
      }

      const reportsDir = path.resolve(__dirname, '..');
      const viewSource = fs.readFileSync(
        path.join(reportsDir, 'components', 'StatisticalReportsView.tsx'),
        'utf8',
      );
      const serviceSource = fs.readFileSync(
        path.join(reportsDir, 'services', 'statisticalReportService.ts'),
        'utf8',
      );

      expect(viewSource).not.toMatch(VIETNAMESE_DIACRITIC_REGEX);
      expect(serviceSource).not.toMatch(VIETNAMESE_DIACRITIC_REGEX);
      expect(viewSource).not.toMatch(RAW_CODE_REGEX);
      expect(serviceSource).not.toMatch(RAW_CODE_REGEX);

      // Verify previously flagged hardcoded presentation literals are centralized into resources/en.ts
      const forbiddenHardcodedLiterals = [
        'Draft report criteria reset to last applied configuration.',
        'Net Platform Revenue',
        'Confirmed Bookings Gross',
        'Completed Bookings Gross',
        'Recorded Refunds Deducted',
        'Total New Registrations',
        'Direct Web Registrations',
        'Mobile App Registrations',
        'Total Recorded Bookings',
        'Evaluated Tour Operators',
        'Completed Traveler Visits',
        '[DEMO FIXTURE EXPORT — NOT PRODUCTION ACCOUNTING DATA]',
        'September 2026 (01/09/2026',
      ];

      for (const literal of forbiddenHardcodedLiterals) {
        expect(viewSource).not.toContain(literal);
        expect(serviceSource).not.toContain(literal);
      }
    });
  });

  describe('2. Production Truthfulness Default & Environment Lockdown (NO_BACKEND / PENDING_BE_INTEGRATION)', () => {
    it('defaults normal rendering (<StatisticalReportsView actorRole="Administrator" />) to PRODUCTION mode with PENDING_BE_INTEGRATION and no user-facing Demo toggle', () => {
      render(<StatisticalReportsView actorRole="Administrator" />);

      expect(
        screen.getByRole('heading', {
          name: statisticalReportsEn.states.pendingBackendTitle,
        }),
      ).toBeTruthy();

      // Verify no user-facing Production/Demo switcher button exists
      expect(screen.queryByRole('button', { name: /Demo Mode/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /Fixtures/i })).toBeNull();

      // Verify zero fabricated statistics, zero charts, and disabled export
      expect(screen.queryByRole('table')).toBeNull();
      expect(
        screen.queryByRole('img', { name: statisticalReportsEn.results.chartSvgAriaLabel }),
      ).toBeNull();

      const exportButton = screen.getByRole('button', {
        name: statisticalReportsEn.exportPanel.exportButton,
      }) as HTMLButtonElement;
      expect(exportButton.disabled).toBe(true);
      expect(
        screen.getByText(statisticalReportsEn.exportPanel.disabledProductionReason),
      ).toBeTruthy();

      // Change criteria in Production mode and click Generate Report -> preserves criteria in PENDING_BE_INTEGRATION
      fireEvent.change(
        screen.getByLabelText(statisticalReportsEn.criteriaForm.reportTypeSelectLabel),
        {
          target: { value: 'USER_GROWTH' },
        },
      );
      fireEvent.click(
        screen.getByRole('button', { name: statisticalReportsEn.criteriaForm.generateButton }),
      );

      const pendingRegion = screen.getByRole('region', {
        name: statisticalReportsEn.states.pendingBackendTitle,
      });
      expect(within(pendingRegion).getByText(/User Growth/i)).toBeTruthy();
      expect(within(pendingRegion).getByText(/Period: 2026-09/i)).toBeTruthy();
      expect(exportButton.disabled).toBe(true);
      expect(screen.queryByRole('table')).toBeNull();
    });

    it('forces PRODUCTION mode and blocks fixture data when NODE_ENV is production even if initialMode="DEMO" is passed', () => {
      vi.stubEnv('NODE_ENV', 'production');

      render(<StatisticalReportsView actorRole="Administrator" initialMode="DEMO" />);

      expect(
        screen.getByRole('heading', {
          name: statisticalReportsEn.states.pendingBackendTitle,
        }),
      ).toBeTruthy();
      expect(screen.queryByText(statisticalReportsEn.results.demoWatermarkBadge)).toBeNull();
      expect(screen.queryByRole('table')).toBeNull();
      expect(
        (
          screen.getByRole('button', {
            name: statisticalReportsEn.exportPanel.exportButton,
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(true);
    });
  });

  describe('3. Demo Mode — Report Types, Closed Periods, Open Period Rejection & Draft vs Applied', () => {
    it('supports all five report types and renders summary figures, SVG chart, and accessible tabular fallback with zero Vietnamese or raw codes', () => {
      const { container } = render(
        <StatisticalReportsView actorRole="Administrator" initialMode="DEMO" />,
      );

      const reportTypes = [
        { value: 'USER_GROWTH', expectedHeading: 'User Growth' },
        { value: 'BOOKING_VOLUME', expectedHeading: 'Booking Volume' },
        { value: 'PLATFORM_REVENUE', expectedHeading: 'Platform Revenue' },
        { value: 'OPERATOR_PERFORMANCE', expectedHeading: 'Tour Operator Performance' },
        { value: 'DESTINATION_POPULARITY', expectedHeading: 'Destination Popularity' },
      ] as const;

      for (const rt of reportTypes) {
        fireEvent.change(
          screen.getByLabelText(statisticalReportsEn.criteriaForm.reportTypeSelectLabel),
          { target: { value: rt.value } },
        );
        fireEvent.click(
          screen.getByRole('button', { name: statisticalReportsEn.criteriaForm.generateButton }),
        );

        expect(screen.getByRole('heading', { level: 3, name: rt.expectedHeading })).toBeTruthy();
        expect(
          screen.getByRole('img', { name: statisticalReportsEn.results.chartSvgAriaLabel }),
        ).toBeTruthy();
        expect(screen.getByRole('table')).toBeTruthy();
        expect(container.textContent ?? '').not.toMatch(VIETNAMESE_DIACRITIC_REGEX);
        expect(container.textContent ?? '').not.toMatch(RAW_CODE_REGEX);
      }
    });

    it('supports Closed Month, Closed Quarter, and Closed Year and rejects open periods in Demo mode', () => {
      render(<StatisticalReportsView actorRole="Administrator" initialMode="DEMO" />);

      // Switch to Closed Quarter -> generates Q3 2026
      fireEvent.click(
        screen.getByRole('button', { name: statisticalReportsEn.granularities.CLOSED_QUARTER }),
      );
      fireEvent.click(
        screen.getByRole('button', { name: statisticalReportsEn.criteriaForm.generateButton }),
      );
      expect(screen.getByText(/01\/07\/2026 – 30\/09\/2026 \(2026-Q3\)/)).toBeTruthy();

      // Switch to Closed Year -> generates FY 2025
      fireEvent.click(
        screen.getByRole('button', { name: statisticalReportsEn.granularities.CLOSED_YEAR }),
      );
      fireEvent.click(
        screen.getByRole('button', { name: statisticalReportsEn.criteriaForm.generateButton }),
      );
      expect(screen.getByText(/01\/01\/2025 – 31\/12\/2025 \(2025\)/)).toBeTruthy();

      // Select open year (2026-OPEN) -> rejected with semantic closed-period validation message
      fireEvent.change(
        screen.getByLabelText(statisticalReportsEn.criteriaForm.periodSelectLabel),
        { target: { value: '2026-OPEN' } },
      );
      fireEvent.click(
        screen.getByRole('button', { name: statisticalReportsEn.criteriaForm.generateButton }),
      );

      expect(screen.getByRole('alert').textContent).toBe(
        statisticalReportsEn.validation.openPeriodRejected,
      );
      // Previously generated closed-year report (2025) remains intact
      expect(screen.getByText(/01\/01\/2025 – 31\/12\/2025 \(2025\)/)).toBeTruthy();
    });

    it('keeps the previously generated report intact when draft criteria are modified until Generate Report is pressed, and reverts draft on Cancel', () => {
      render(<StatisticalReportsView actorRole="Administrator" initialMode="DEMO" />);

      // Initially displays Platform Revenue for 2026-09 (1,420,000,000 VND)
      expect(screen.getByRole('heading', { level: 3, name: 'Platform Revenue' })).toBeTruthy();
      expect(screen.getAllByText('1,420,000,000 VND').length).toBeGreaterThan(0);

      // Modify draft report type to Destination Popularity without clicking Generate Report
      fireEvent.change(
        screen.getByLabelText(statisticalReportsEn.criteriaForm.reportTypeSelectLabel),
        { target: { value: 'DESTINATION_POPULARITY' } },
      );

      // Notice appears, but displayed report is still Platform Revenue
      expect(screen.getByText(statisticalReportsEn.criteriaForm.draftModifiedNotice)).toBeTruthy();
      expect(screen.getByRole('heading', { level: 3, name: 'Platform Revenue' })).toBeTruthy();

      // Clicking Cancel reverts draft back to Platform Revenue
      fireEvent.click(
        screen.getByRole('button', { name: statisticalReportsEn.criteriaForm.cancelButton }),
      );
      expect(
        screen.queryByText(statisticalReportsEn.criteriaForm.draftModifiedNotice),
      ).toBeNull();
      expect(screen.getByText(statisticalReportsEn.criteriaForm.draftResetAnnouncement)).toBeTruthy();

      // Now change to Destination Popularity and click Generate Report
      fireEvent.change(
        screen.getByLabelText(statisticalReportsEn.criteriaForm.reportTypeSelectLabel),
        { target: { value: 'DESTINATION_POPULARITY' } },
      );
      fireEvent.click(
        screen.getByRole('button', { name: statisticalReportsEn.criteriaForm.generateButton }),
      );
      expect(
        screen.getByRole('heading', { level: 3, name: 'Destination Popularity' }),
      ).toBeTruthy();
    });

    it('renders empty state when no records match, and supports generation & export failure recovery plus Excel/CSV/PDF export', () => {
      render(<StatisticalReportsView actorRole="Administrator" initialMode="DEMO" />);

      // Export Excel, CSV, PDF on valid generated report
      for (const [label, expectedExt] of [
        ['Excel (.xlsx)', '.xlsx'],
        ['CSV (.csv)', '.csv'],
        ['PDF (.pdf)', '.pdf'],
      ] as const) {
        fireEvent.click(screen.getByLabelText(label));
        fireEvent.click(
          screen.getByRole('button', { name: statisticalReportsEn.exportPanel.exportButton }),
        );
        expect(
          screen.getAllByText(
            new RegExp(`DEMO-TripMate-PLATFORM_REVENUE-2026-09\\${expectedExt}`),
          ).length,
        ).toBeGreaterThan(0);
      }

      // Simulate Export Error -> preserves displayed report and allows retry
      fireEvent.click(
        screen.getByLabelText(statisticalReportsEn.criteriaForm.simulateExportErrorLabel),
      );
      fireEvent.click(
        screen.getByRole('button', { name: statisticalReportsEn.exportPanel.exportButton }),
      );
      expect(
        screen.getAllByText(statisticalReportsEn.exportPanel.exportErrorMessage).length,
      ).toBeGreaterThan(0);
      expect(screen.getByRole('heading', { level: 3, name: 'Platform Revenue' })).toBeTruthy();

      // Clear Export Error simulation and retry
      fireEvent.click(
        screen.getByLabelText(statisticalReportsEn.criteriaForm.simulateExportErrorLabel),
      );
      fireEvent.click(
        screen.getByRole('button', { name: statisticalReportsEn.exportPanel.retryExportButton }),
      );
      expect(
        screen.getByText(statisticalReportsEn.exportPanel.exportSuccessTitle),
      ).toBeTruthy();

      // Simulate Generation Error -> renders error state and recovers on Retry
      fireEvent.click(
        screen.getByLabelText(statisticalReportsEn.criteriaForm.simulateGenerationErrorLabel),
      );
      fireEvent.click(
        screen.getByRole('button', { name: statisticalReportsEn.criteriaForm.generateButton }),
      );
      expect(
        screen.getAllByText(statisticalReportsEn.states.generationErrorMessage).length,
      ).toBeGreaterThan(0);

      fireEvent.click(
        screen.getByLabelText(statisticalReportsEn.criteriaForm.simulateGenerationErrorLabel),
      );
      fireEvent.click(
        screen.getByRole('button', { name: statisticalReportsEn.states.retryGenerateButton }),
      );
      expect(screen.getByRole('heading', { level: 3, name: 'Platform Revenue' })).toBeTruthy();

      // Select zero-activity operator filter (OP-104) -> No Data state
      fireEvent.change(
        screen.getByLabelText(statisticalReportsEn.criteriaForm.operatorFilterLabel),
        { target: { value: 'OP-104' } },
      );
      fireEvent.click(
        screen.getByRole('button', { name: statisticalReportsEn.criteriaForm.generateButton }),
      );
      expect(
        screen.getAllByText(statisticalReportsEn.states.noDataMessage).length,
      ).toBeGreaterThan(0);
      expect(
        (
          screen.getByRole('button', {
            name: statisticalReportsEn.exportPanel.exportButton,
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(true);
    });
  });
});
