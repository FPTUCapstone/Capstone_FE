import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

let mockPathname = '/admin/tours/reviews';

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

import { AdminBreadcrumbs } from '../AdminBreadcrumbs';
import { AdminConsoleShell } from '../AdminConsoleShell';
import { AdminRoleBadge } from '../AdminRoleBadge';
import { AdminSidebar } from '../AdminSidebar';
import { AdminTopbar } from '../AdminTopbar';

describe('Batch E1 — Administration Shell Components', () => {
  describe('AdminRoleBadge', () => {
    it('renders Staff role badge with Sage styling and STAFF OPERATOR label', () => {
      render(<AdminRoleBadge role="Staff" />);
      const badge = screen.getByTestId('admin-role-badge');
      expect(badge.textContent).toContain('STAFF OPERATOR');
      expect(badge.className).toContain('bg-[#E8EFE9]');
    });

    it('renders Administrator role badge with Copper styling and ADMINISTRATOR label', () => {
      render(<AdminRoleBadge role="Administrator" />);
      const badge = screen.getByTestId('admin-role-badge');
      expect(badge.textContent).toContain('ADMINISTRATOR');
      expect(badge.className).toContain('bg-[#F7EBE5]');
    });
  });

  describe('AdminBreadcrumbs', () => {
    it('renders breadcrumbs trail mapping path segments', () => {
      render(<AdminBreadcrumbs role="Staff" />);
      const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
      expect(nav).toBeTruthy();
      expect(screen.getByText('Tours')).toBeTruthy();
      expect(screen.getByText('Moderation Queue')).toBeTruthy();
    });
  });

  describe('AdminSidebar', () => {
    it('renders role-specific menu items for Staff', () => {
      render(
        <AdminSidebar
          role="Staff"
          collapsed={false}
          onToggleCollapse={vi.fn()}
          mobileOpen={false}
          onCloseMobile={vi.fn()}
        />,
      );

      expect(screen.getByRole('link', { name: /Staff Operations/i })).toBeTruthy();
      expect(screen.getByRole('link', { name: /Operator Applications/i })).toBeTruthy();
      expect(screen.getByRole('link', { name: /Tour Moderation/i })).toBeTruthy();
      expect(screen.getByRole('link', { name: /Payout Review/i })).toBeTruthy();
      expect(screen.getByRole('link', { name: /Create POI/i })).toBeTruthy();
    });

    it('renders governance menu items for Administrator', () => {
      render(
        <AdminSidebar
          role="Administrator"
          collapsed={false}
          onToggleCollapse={vi.fn()}
          mobileOpen={false}
          onCloseMobile={vi.fn()}
        />,
      );

      expect(screen.getByRole('link', { name: /Control Center/i })).toBeTruthy();
      expect(screen.getByRole('link', { name: /User Governance/i })).toBeTruthy();
      expect(screen.getByRole('link', { name: /Payout Settlement/i })).toBeTruthy();
      expect(screen.getByRole('link', { name: /Statistical Reports/i })).toBeTruthy();
      expect(screen.getByRole('link', { name: /Algorithm Config/i })).toBeTruthy();
      expect(screen.getByRole('link', { name: /Audit Logs/i })).toBeTruthy();
    });

    it('triggers toggle collapse callback when toggle button is clicked', () => {
      const toggleMock = vi.fn();
      render(
        <AdminSidebar
          role="Staff"
          collapsed={false}
          onToggleCollapse={toggleMock}
          mobileOpen={false}
          onCloseMobile={vi.fn()}
        />,
      );

      const collapseBtn = screen.getByRole('button', { name: /Collapse sidebar/i });
      fireEvent.click(collapseBtn);
      expect(toggleMock).toHaveBeenCalled();
    });

    it('activates only Create POI when on /admin/catalogue/points-of-interest/new, not POI Catalog', () => {
      mockPathname = '/admin/catalogue/points-of-interest/new';
      render(
        <AdminSidebar
          role="Staff"
          collapsed={false}
          onToggleCollapse={vi.fn()}
          mobileOpen={false}
          onCloseMobile={vi.fn()}
        />,
      );

      const createPoiLink = screen.getByRole('link', { name: /Create POI/i });
      const poiCatalogLink = screen.getByRole('link', { name: /POI Catalog/i });

      expect(createPoiLink.className).toContain('bg-[#245747]');
      expect(poiCatalogLink.className).not.toContain('bg-[#245747]');
      mockPathname = '/admin/tours/reviews';
    });
  });

  describe('AdminTopbar', () => {
    it('renders breadcrumbs, role badge, security link, and hamburger button', () => {
      const openMobileMock = vi.fn();
      render(<AdminTopbar role="Staff" onOpenMobileSidebar={openMobileMock} />);

      expect(screen.getByRole('button', { name: /Open navigation drawer/i })).toBeTruthy();
      expect(screen.getByTestId('admin-role-badge')).toBeTruthy();
      expect(screen.getByTitle('Account Security & Password')).toBeTruthy();

      fireEvent.click(screen.getByRole('button', { name: /Open navigation drawer/i }));
      expect(openMobileMock).toHaveBeenCalled();
    });
  });

  describe('AdminConsoleShell', () => {
    it('renders full shell layout with children in main canvas', () => {
      render(
        <AdminConsoleShell role="Administrator">
          <div data-testid="test-child-content">Workspace Content</div>
        </AdminConsoleShell>,
      );

      expect(screen.getByTestId('test-child-content')).toBeTruthy();
      expect(screen.getByRole('main')).toBeTruthy();
      expect(screen.getByRole('complementary', { name: 'Administration Sidebar' })).toBeTruthy();
    });
  });
});
