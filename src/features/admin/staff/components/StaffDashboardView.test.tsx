import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

import { AdminNavigation } from '@/components/navigation/AdminNavigation';
import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { StaffDashboardView } from '@/features/admin/staff/components/StaffDashboardView';
import { adminStaffEn } from '@/features/admin/staff/resources/en';

const VIETNAMESE_DIACRITIC_REGEX =
  /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

describe('Screen #35 StaffDashboardView and Administration Role Foundation', () => {
  it('renders Screen #35 Staff Operations Dashboard with 100% English resource-backed copy and no Vietnamese characters', () => {
    const { container } = render(
      <>
        <AdminNavigation role="Staff" />
        <StaffDashboardView />
      </>,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: adminStaffEn.staffDashboard.title }),
    ).toBeTruthy();
    expect(screen.getByText(adminStaffEn.staffDashboard.eyebrow)).toBeTruthy();
    expect(screen.getByText(adminStaffEn.staffDashboard.readinessBannerTitle)).toBeTruthy();
    expect(container.textContent ?? '').not.toMatch(VIETNAMESE_DIACRITIC_REGEX);
    expect(container.textContent ?? '').not.toMatch(/\b(?:BR-\d+|MSG\d+|StaffOrAdministrator|AdministratorOnly)\b/);
  });

  it('displays only genuinely Staff-accessible modules as active, removes hardcoded application ID links, and marks pending modules as unavailable without fabricated counts', () => {
    const { container } = render(<StaffDashboardView />);

    const activeSection = screen.getByRole('region', {
      name: adminStaffEn.staffDashboard.availableSectionTitle,
    });
    expect(
      within(activeSection).getByRole('link', { name: /Open Security Settings/i }).getAttribute('href'),
    ).toBe('/admin/account/security');
    expect(within(activeSection).queryByRole('link', { name: /Inspect Application Workspace/i })).toBeNull();
    expect(within(activeSection).queryByRole('link', { name: /Open Review Queue/i })).toBeNull();
    expect(
      within(activeSection).getByRole('link', { name: /Open POI Creator/i }).getAttribute('href'),
    ).toBe('/admin/catalogue/points-of-interest/new');
    expect(container.innerHTML).not.toContain('/admin/tour-operator-applications/1');

    const pendingSection = screen.getByRole('region', {
      name: adminStaffEn.staffDashboard.pendingSectionTitle,
    });
    const disabledButtons = within(pendingSection).getAllByRole('button', {
      name: adminStaffEn.staffDashboard.unavailableModuleLabel,
    });
    expect(disabledButtons.length).toBe(8);
    for (const button of disabledButtons) {
      expect((button as HTMLButtonElement).disabled).toBe(true);
    }

    expect(screen.getAllByText(adminStaffEn.staffDashboard.statusBadges.pendingBackend).length).toBe(7);
    expect(screen.getAllByText(adminStaffEn.staffDashboard.statusBadges.scheduledBatch).length).toBe(1);
    expect(screen.getByText(adminStaffEn.staffDashboard.analyticsNoticeStatus)).toBeTruthy();

    // Ensure no synthetic numeric counters or fake revenue figures are rendered in text content
    expect(container.textContent ?? '').not.toMatch(/\b\d{1,3}(?:,\d{3})+\b/);
  });

  it('maps pending Staff operational modules to their canonical Report 3 V2 Use Case identifiers and documents the UC-50/51 actor conflict while keeping them non-actionable', () => {
    render(<StaffDashboardView />);

    const pendingSection = screen.getByRole('region', {
      name: adminStaffEn.staffDashboard.pendingSectionTitle,
    });

    const findModuleCard = (headingText: string) => {
      const heading = within(pendingSection).getByRole('heading', { level: 3, name: headingText });
      const card = heading.closest('article');
      expect(card).not.toBeNull();
      return card as HTMLElement;
    };

    const tourModerationCard = findModuleCard('Tour Package Moderation');
    expect(tourModerationCard.textContent ?? '').toContain('UC-60 / UC-61');
    expect(tourModerationCard.textContent ?? '').not.toContain('UC-50 / UC-51');
    expect(tourModerationCard.textContent ?? '').toContain(
      'SRS_INTERNAL_CONFLICT_TOUR_MODERATION_ACTOR',
    );
    expect(within(tourModerationCard).queryByRole('link')).toBeNull();
    expect(
      (
        within(tourModerationCard).getByRole('button', {
          name: adminStaffEn.staffDashboard.unavailableModuleLabel,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);

    const operatorReviewCard = findModuleCard('Operator Application Review');
    expect(operatorReviewCard.textContent ?? '').toContain('UC-50 / UC-51');
    expect(operatorReviewCard.textContent ?? '').not.toContain('UC-48 / UC-49');
    expect(operatorReviewCard.textContent ?? '').toContain(
      'SRS_INTERNAL_CONFLICT_OPERATOR_REVIEW_ACTOR',
    );
    expect(within(operatorReviewCard).queryByRole('link')).toBeNull();
    expect(
      (
        within(operatorReviewCard).getByRole('button', {
          name: adminStaffEn.staffDashboard.unavailableModuleLabel,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);

    const userAccountsCard = findModuleCard('User Account Management');
    expect(userAccountsCard.textContent ?? '').toContain('UC-47 / UC-48 / UC-49');
    expect(within(userAccountsCard).queryByRole('link')).toBeNull();
    expect(
      (
        within(userAccountsCard).getByRole('button', {
          name: adminStaffEn.staffDashboard.unavailableModuleLabel,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  it('hides Administrator-only and non-Staff-ready navigation items when rendered for a Staff actor and shows them for an Administrator actor', () => {
    const { unmount } = render(<AdminNavigation role="Staff" />);
    const staffNav = screen.getByRole('navigation', { name: adminStaffEn.navigation.navAriaLabel });

    expect(within(staffNav).getByRole('link', { name: adminStaffEn.navigation.staffDashboard })).toBeTruthy();
    expect(within(staffNav).queryByRole('link', { name: adminStaffEn.navigation.adminDashboard })).toBeNull();
    expect(within(staffNav).getByRole('link', { name: adminStaffEn.navigation.createPoi })).toBeTruthy();
    expect(within(staffNav).queryByRole('link', { name: adminStaffEn.navigation.statisticalReports })).toBeNull();
    expect(within(staffNav).queryByRole('link', { name: adminStaffEn.navigation.algorithmSettings })).toBeNull();
    expect(within(staffNav).queryByRole('link', { name: adminStaffEn.navigation.auditLogs })).toBeNull();

    unmount();

    render(<AdminNavigation role="Administrator" />);
    const adminNav = screen.getByRole('navigation', { name: adminStaffEn.navigation.navAriaLabel });
    expect(within(adminNav).getByRole('link', { name: adminStaffEn.navigation.adminDashboard })).toBeTruthy();
    expect(within(adminNav).getByRole('link', { name: adminStaffEn.navigation.staffDashboard })).toBeTruthy();
    expect(within(adminNav).getByRole('link', { name: adminStaffEn.navigation.tourReviews })).toBeTruthy();
    expect(within(adminNav).queryByRole('link', { name: adminStaffEn.navigation.createPoi })).toBeNull();
    expect(within(adminNav).getByRole('link', { name: adminStaffEn.navigation.statisticalReports })).toBeTruthy();
    expect(
      within(adminNav).getByRole('link', { name: adminStaffEn.navigation.statisticalReports }).getAttribute('href'),
    ).toBe('/admin/reports');
    expect(within(adminNav).getByRole('link', { name: adminStaffEn.navigation.algorithmSettings })).toBeTruthy();
    expect(within(adminNav).getByRole('link', { name: adminStaffEn.navigation.auditLogs })).toBeTruthy();
  });

  it('renders semantic English AdminAccessDeniedView with a link back to /admin/staff', () => {
    const { container } = render(<AdminAccessDeniedView />);

    expect(
      screen.getByRole('heading', { level: 1, name: adminStaffEn.accessDenied.title }),
    ).toBeTruthy();
    const staffLink = screen.getByRole('link', {
      name: adminStaffEn.accessDenied.returnToStaffButton,
    });
    expect(staffLink.getAttribute('href')).toBe('/admin/staff');
    expect(container.textContent ?? '').not.toMatch(VIETNAMESE_DIACRITIC_REGEX);
  });
});
