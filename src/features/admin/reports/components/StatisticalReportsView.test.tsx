import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

import { AdminNavigation } from '@/components/navigation/AdminNavigation';
import { AuthStorage } from '@/features/auth/session/authSession';

import { StatisticalReportsView } from './StatisticalReportsView';
import { statisticalReportsEn } from '../resources/en';

const VIETNAMESE_DIACRITIC_REGEX =
  /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

describe('Screen #32 StatisticalReportsView (UC-67 Export Statistical Reports)', () => {
  beforeEach(() => {
    AuthStorage.clear();
  });

  describe('1. Authorization & CR-09 English Resource Compliance', () => {
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
      expect(container.textContent ?? '').not.toMatch(/\b(?:BR-\d+|MSG\d+)\b/);
    });

    it.each(['Traveler', 'TourOperator', 'Staff'])(
      'denies access when actorRole is %s and displays semantic permission denied state',
      (unauthorizedRole) => {
        render(<StatisticalReportsView actorRole={unauthorizedRole} />);

        expect(
          screen.getByRole('heading', { level: 1, name: statisticalReportsEn.accessDenied.title }),
        ).toBeTruthy();
        expect(screen.getByText(statisticalReportsEn.accessDenied.message)).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Generate Report' })).toBeNull();
      },
    );
  });

  describe('2. Production Truthfulness (NO_BACKEND / PENDING_BE_INTEGRATION)', () => {
    it('does not fabricate statistics or enable Export in Production mode and preserves selected criteria on Generate Report', () => {
      render(<StatisticalReportsView actorRole="Administrator" initialMode="PRODUCTION" />);

      expect(
        screen.getByRole('heading', {
          name: statisticalReportsEn.states.pendingBackendTitle,
        }),
      ).toBeTruthy();

      const exportButton = screen.getByRole('button', {
        name: statisticalReportsEn.exportPanel.exportButton,
      }) as HTMLButtonElement;
      expect(exportButton.disabled).toBe(true);
      expect(
        screen.getByText(statisticalReportsEn.exportPanel.disabledProductionReason),
      ).toBeTruthy();

      // Change criteria in Production mode and click Generate Report
      fireEvent.change(screen.getByLabelText(statisticalReportsEn.criteriaForm.reportTypeSelectLabel), {
        target: { value: 'USER_GROWTH' },
      });
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
  });

  describe('3. Demo Mode — Report Types, Closed Periods, Open Period Rejection & Draft vs Applied', () => {
    it('supports all five report types and renders summary figures, SVG chart, and accessible tabular fallback', () => {
      render(<StatisticalReportsView actorRole="Administrator" initialMode="DEMO" />);

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
      }
    });

    it('supports Closed Month, Closed Quarter, and Closed Year and rejects open periods', () => {
      render(<StatisticalReportsView actorRole="Administrator" initialMode="DEMO" />);

      // Switch to Closed Quarter -> generates Q3 2026
      fireEvent.click(screen.getByRole('button', { name: 'Closed Quarter' }));
      fireEvent.click(
        screen.getByRole('button', { name: statisticalReportsEn.criteriaForm.generateButton }),
      );
      expect(screen.getByText(/01\/07\/2026 – 30\/09\/2026 \(2026-Q3\)/)).toBeTruthy();

      // Switch to Closed Year -> generates FY 2025
      fireEvent.click(screen.getByRole('button', { name: 'Closed Year' }));
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
