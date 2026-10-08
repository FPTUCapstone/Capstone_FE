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

  describe('1. Trusted Server Authorization & CR-09 English Resource Architecture', () => {
    it('denies access when actorRole is omitted even if client sessionStorage contains an Administrator role (fail-closed server boundary)', () => {
      render(<StatisticalReportsView />);

      expect(
        screen.getByRole('heading', { level: 1, name: statisticalReportsEn.accessDenied.title }),
      ).toBeTruthy();
      expect(screen.getByText(statisticalReportsEn.accessDenied.message)).toBeTruthy();
      expect(
        screen.queryByRole('button', { name: statisticalReportsEn.criteriaForm.generateButton }),
      ).toBeNull();
    });

    it('denies access when actorRole is PENDING_AUTH_SESSION_VERIFICATION (forged or unverified Admin token) and renders verification notice', () => {
      render(<StatisticalReportsView actorRole="PENDING_AUTH_SESSION_VERIFICATION" />);

      expect(
        screen.getByRole('heading', { level: 1, name: statisticalReportsEn.accessDenied.title }),
      ).toBeTruthy();
      expect(
        screen.getByText(statisticalReportsEn.accessDenied.unverifiedSessionNotice),
      ).toBeTruthy();
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

    it('allows verified Administrator access and renders 100% English copy with zero Vietnamese or raw BR/MSG codes', () => {
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

      // Verify presentation literals are centralized into resources/en.ts
      const forbiddenHardcodedLiterals = [
        'Draft report criteria reset to last applied configuration.',
        'Dynamic Tour Operator and Destination filters will become available after Backend reporting integration.',
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
        'Central Heritage Journeys',
        'Danang Coastal Expeditions',
        'Highland Eco Trails',
      ];

      for (const literal of forbiddenHardcodedLiterals) {
        expect(viewSource).not.toContain(literal);
        expect(serviceSource).not.toContain(literal);
      }
    });
  });

  describe('2. Production Truthfulness Default, Filter Truthfulness & Environment Lockdown', () => {
    it('defaults normal rendering (<StatisticalReportsView actorRole="Administrator" />) to PRODUCTION mode with PENDING_BE_INTEGRATION, zero fixture filter options, and zero fabricated report data', () => {
      render(<StatisticalReportsView actorRole="Administrator" />);

      expect(
        screen.getByRole('heading', {
          name: statisticalReportsEn.states.pendingBackendTitle,
        }),
      ).toBeTruthy();

      // Verify no user-facing Production/Demo switcher button exists
      expect(screen.queryByRole('button', { name: /Demo Mode/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /Fixtures/i })).toBeNull();

      // Verify Production filter truthfulness:
      // 1. Tour Operator select contains ONLY "All Tour Operators" and NO fixture operator names
      const operatorSelect = screen.getByLabelText(
        statisticalReportsEn.criteriaForm.operatorFilterLabel,
      ) as HTMLSelectElement;
      const operatorLabels = Array.from(operatorSelect.options).map((o) => o.textContent);
      expect(operatorLabels).toEqual([statisticalReportsEn.filters.allOperatorsLabel]);
      expect(operatorLabels).not.toContain('Central Heritage Journeys');
      expect(operatorLabels).not.toContain('Danang Coastal Expeditions');
      expect(operatorLabels).not.toContain('Highland Eco Trails');
      expect(operatorLabels).not.toContain('Mekong Artisan Tours (Zero Activity Period)');

      // 2. Destination select contains ONLY "All Destinations" and NO fixture destination names
      const destinationSelect = screen.getByLabelText(
        statisticalReportsEn.criteriaForm.destinationFilterLabel,
      ) as HTMLSelectElement;
      const destinationLabels = Array.from(destinationSelect.options).map((o) => o.textContent);
      expect(destinationLabels).toEqual([statisticalReportsEn.filters.allDestinationsLabel]);
      expect(destinationLabels).not.toContain('Da Nang');
      expect(destinationLabels).not.toContain('Hoi An');
      expect(destinationLabels).not.toContain('Hue');
      expect(destinationLabels).not.toContain('Da Lat');
      expect(destinationLabels).not.toContain('Con Dao (No Recorded Activity)');

      // 3. Booking Type select contains the 3 canonical static domain enum options
      const bookingTypeSelect = screen.getByLabelText(
        statisticalReportsEn.criteriaForm.bookingTypeFilterLabel,
      ) as HTMLSelectElement;
      const bookingTypeLabels = Array.from(bookingTypeSelect.options).map((o) => o.textContent);
      expect(bookingTypeLabels).toEqual([
        statisticalReportsEn.filters.bookingTypes.ALL,
        statisticalReportsEn.filters.bookingTypes.TOUR_PACKAGE,
        statisticalReportsEn.filters.bookingTypes.COMMERCIAL_SERVICE,
      ]);

      // 4. Semantic notice explaining dynamic filter availability is shown
      expect(
        screen.getByText(statisticalReportsEn.filters.productionDynamicFiltersNotice),
      ).toBeTruthy();

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

    it('forces PRODUCTION mode and blocks fixture filters and fixture report data when NODE_ENV is production even if initialMode="DEMO" is passed', () => {
      vi.stubEnv('NODE_ENV', 'production');

      render(<StatisticalReportsView actorRole="Administrator" initialMode="DEMO" />);

      expect(
        screen.getByRole('heading', {
          name: statisticalReportsEn.states.pendingBackendTitle,
        }),
      ).toBeTruthy();
      expect(screen.queryByText(statisticalReportsEn.results.demoWatermarkBadge)).toBeNull();
      expect(screen.queryByRole('table')).toBeNull();

      const operatorSelect = screen.getByLabelText(
        statisticalReportsEn.criteriaForm.operatorFilterLabel,
      ) as HTMLSelectElement;
      expect(operatorSelect.options.length).toBe(1);

      const destinationSelect = screen.getByLabelText(
        statisticalReportsEn.criteriaForm.destinationFilterLabel,
      ) as HTMLSelectElement;
      expect(destinationSelect.options.length).toBe(1);

      expect(
        (
          screen.getByRole('button', {
            name: statisticalReportsEn.exportPanel.exportButton,
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(true);
    });
  });

  describe('3. Demo Mode — Fixture Filters, Report Types, Closed Periods, Open Period Rejection & Draft vs Applied', () => {
    it('exposes Demo fixture operator and destination options in Demo mode and supports all five report types with SVG chart and tabular fallback', () => {
      const { container } = render(
        <StatisticalReportsView actorRole="Administrator" initialMode="DEMO" />,
      );

      const operatorSelect = screen.getByLabelText(
        statisticalReportsEn.criteriaForm.operatorFilterLabel,
      ) as HTMLSelectElement;
      expect(operatorSelect.options.length).toBe(5);

      const destinationSelect = screen.getByLabelText(
        statisticalReportsEn.criteriaForm.destinationFilterLabel,
      ) as HTMLSelectElement;
      expect(destinationSelect.options.length).toBe(6);

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

    it('triggers real browser CSV download in Demo mode, keeps Excel/PDF as preview-only without fake download or success banner, and supports failure & empty states', () => {
      const createObjectUrlSpy = vi.fn(() => 'blob:demo-csv-report');
      const revokeObjectUrlSpy = vi.fn();
      vi.stubGlobal('URL', {
        ...URL,
        createObjectURL: createObjectUrlSpy,
        revokeObjectURL: revokeObjectUrlSpy,
      });

      const anchorClickSpy = vi
        .spyOn(HTMLAnchorElement.prototype, 'click')
        .mockImplementation(() => {});

      render(<StatisticalReportsView actorRole="Administrator" initialMode="DEMO" />);

      // 1. CSV (.csv) triggers a real browser download and shows exportSuccessTitle
      fireEvent.click(screen.getByLabelText(statisticalReportsEn.exportPanel.formats.CSV));
      fireEvent.click(
        screen.getByRole('button', { name: statisticalReportsEn.exportPanel.exportButton }),
      );

      expect(createObjectUrlSpy).toHaveBeenCalledTimes(1);
      expect(anchorClickSpy).toHaveBeenCalledTimes(1);
      expect(revokeObjectUrlSpy).toHaveBeenCalledWith('blob:demo-csv-report');
      expect(screen.getByText(statisticalReportsEn.exportPanel.exportSuccessTitle)).toBeTruthy();
      expect(
        screen.getAllByText(/DEMO-TripMate-PLATFORM_REVENUE-2026-09\.csv/).length,
      ).toBeGreaterThan(0);

      // 2. Excel (.xlsx) and PDF (.pdf) do NOT trigger a browser download and do NOT claim file download success
      createObjectUrlSpy.mockClear();
      anchorClickSpy.mockClear();
      revokeObjectUrlSpy.mockClear();

      for (const previewFormatLabel of [
        statisticalReportsEn.exportPanel.formats.EXCEL,
        statisticalReportsEn.exportPanel.formats.PDF,
      ] as const) {
        fireEvent.click(screen.getByLabelText(previewFormatLabel));
        fireEvent.click(
          screen.getByRole('button', { name: statisticalReportsEn.exportPanel.exportButton }),
        );

        expect(createObjectUrlSpy).not.toHaveBeenCalled();
        expect(anchorClickSpy).not.toHaveBeenCalled();
        expect(revokeObjectUrlSpy).not.toHaveBeenCalled();
        expect(
          screen.queryByText(statisticalReportsEn.exportPanel.exportSuccessTitle),
        ).toBeNull();
        expect(screen.getByText(statisticalReportsEn.exportPanel.previewOnlyTitle)).toBeTruthy();
        expect(screen.getByText(statisticalReportsEn.exportPanel.previewOnlyBadge)).toBeTruthy();
      }

      // 3. Simulate Export Error on CSV -> preserves displayed report and allows retry
      fireEvent.click(screen.getByLabelText(statisticalReportsEn.exportPanel.formats.CSV));
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

      // Clear Export Error simulation and retry CSV download
      fireEvent.click(
        screen.getByLabelText(statisticalReportsEn.criteriaForm.simulateExportErrorLabel),
      );
      fireEvent.click(
        screen.getByRole('button', { name: statisticalReportsEn.exportPanel.retryExportButton }),
      );
      expect(
        screen.getByText(statisticalReportsEn.exportPanel.exportSuccessTitle),
      ).toBeTruthy();
      expect(createObjectUrlSpy).toHaveBeenCalledTimes(1);

      // 4. Simulate Generation Error -> renders error state and recovers on Retry
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

      // 5. Select zero-activity operator filter (OP-104) -> No Data state
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

      anchorClickSpy.mockRestore();
      vi.unstubAllGlobals();
    });
  });
});
