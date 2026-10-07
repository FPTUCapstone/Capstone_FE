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
import { parseAdminRoleFromToken } from '@/lib/server/adminSession';

const VIETNAMESE_DIACRITIC_REGEX =
  /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

function createJwtWithRole(role: string, claimKey = 'role'): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: '15', [claimKey]: role })).toString('base64url');
  return `${header}.${payload}.signature`;
}

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

  it('displays active operational modules with valid workspace links and marks pending modules as unavailable without fabricated counts', () => {
    const { container } = render(<StaffDashboardView />);

    const activeSection = screen.getByRole('region', {
      name: adminStaffEn.staffDashboard.availableSectionTitle,
    });
    expect(within(activeSection).getByRole('link', { name: /Open Review Queue/i }).getAttribute('href')).toBe(
      '/admin/tours/reviews',
    );
    expect(
      within(activeSection).getByRole('link', { name: /Inspect Application Workspace/i }).getAttribute('href'),
    ).toBe('/admin/tour-operator-applications/1');
    expect(within(activeSection).getByRole('link', { name: /Open POI Creator/i }).getAttribute('href')).toBe(
      '/admin/catalogue/points-of-interest/new',
    );

    const pendingSection = screen.getByRole('region', {
      name: adminStaffEn.staffDashboard.pendingSectionTitle,
    });
    const disabledButtons = within(pendingSection).getAllByRole('button', {
      name: adminStaffEn.staffDashboard.unavailableModuleLabel,
    });
    expect(disabledButtons.length).toBe(6);
    for (const button of disabledButtons) {
      expect((button as HTMLButtonElement).disabled).toBe(true);
    }

    expect(screen.getAllByText(adminStaffEn.staffDashboard.statusBadges.pendingBackend).length).toBe(5);
    expect(screen.getAllByText(adminStaffEn.staffDashboard.statusBadges.scheduledBatch).length).toBe(1);
    expect(screen.getByText(adminStaffEn.staffDashboard.analyticsNoticeStatus)).toBeTruthy();

    // Ensure no synthetic numeric counters or fake revenue figures are rendered in text content
    expect(container.textContent ?? '').not.toMatch(/\b\d{1,3}(?:,\d{3})+\b/);
  });

  it('hides Administrator-only navigation items when rendered for a Staff actor and shows them for an Administrator actor', () => {
    const { unmount } = render(<AdminNavigation role="Staff" />);
    const staffNav = screen.getByRole('navigation', { name: adminStaffEn.navigation.navAriaLabel });

    expect(within(staffNav).getByRole('link', { name: adminStaffEn.navigation.staffDashboard })).toBeTruthy();
    expect(within(staffNav).getByRole('link', { name: adminStaffEn.navigation.tourReviews })).toBeTruthy();
    expect(within(staffNav).getByRole('link', { name: adminStaffEn.navigation.createPoi })).toBeTruthy();
    expect(within(staffNav).queryByRole('link', { name: adminStaffEn.navigation.adminDashboard })).toBeNull();
    expect(within(staffNav).queryByRole('link', { name: adminStaffEn.navigation.algorithmSettings })).toBeNull();
    expect(within(staffNav).queryByRole('link', { name: adminStaffEn.navigation.auditLogs })).toBeNull();

    unmount();

    render(<AdminNavigation role="Administrator" />);
    const adminNav = screen.getByRole('navigation', { name: adminStaffEn.navigation.navAriaLabel });
    expect(within(adminNav).getByRole('link', { name: adminStaffEn.navigation.adminDashboard })).toBeTruthy();
    expect(within(adminNav).getByRole('link', { name: adminStaffEn.navigation.staffDashboard })).toBeTruthy();
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

  it('parses Staff and Administrator roles from JWT claims and rejects non-administration JWT roles', () => {
    expect(parseAdminRoleFromToken(createJwtWithRole('Staff'))).toBe('Staff');
    expect(
      parseAdminRoleFromToken(
        createJwtWithRole('Staff', 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'),
      ),
    ).toBe('Staff');
    expect(parseAdminRoleFromToken(createJwtWithRole('Administrator'))).toBe('Administrator');
    expect(parseAdminRoleFromToken(createJwtWithRole('Traveler'))).toBeNull();
    expect(parseAdminRoleFromToken(createJwtWithRole('TourOperator'))).toBeNull();
    expect(parseAdminRoleFromToken('')).toBeNull();
    expect(parseAdminRoleFromToken(null)).toBeNull();
  });
});
