'use client';

import Link from 'next/link';
import * as nextNav from 'next/navigation';
import { BrandLogo } from '@/components/brand/BrandLogo';
import AdminLogoutButton from '@/features/admin/auth/AdminLogoutButton';
import type { AdministrationRole } from '@/features/auth/session/authSession';
import { ROUTES } from '@/lib/routes';

interface AdminSidebarProps {
  role: AdministrationRole;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

function useSafePathname(): string {
  try {
    if (typeof nextNav.usePathname === 'function') {
      return nextNav.usePathname() || '/admin';
    }
  } catch {
    // outside router context or mock
  }
  return '/admin';
}

export function AdminSidebar({
  role,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: AdminSidebarProps) {
  const pathname = useSafePathname();
  const isStaff = role === 'Staff';

  // Navigation schema based on Table 3 and Approved Batch E0 IA
  const staffSections: NavSection[] = [
    {
      title: 'Overview',
      items: [
        { href: ROUTES.admin.staffDashboard, label: 'Staff Operations', icon: 'dashboard' },
      ],
    },
    {
      title: 'Operational Queues',
      items: [
        { href: ROUTES.admin.tourOperatorApplications, label: 'Operator Applications', icon: 'assignment_ind' },
        { href: ROUTES.admin.tourReviews, label: 'Tour Moderation', icon: 'rate_review' },
        { href: ROUTES.admin.createServiceProvider, label: 'Create Service Provider', icon: 'person_add' },
        { href: ROUTES.admin.commissionReconciliation, label: 'Commission Reconciliation', icon: 'account_balance_wallet' },
      ],
    },
    {
      title: 'Catalog & Spatial',
      items: [
        { href: ROUTES.admin.pois, label: 'POI Catalog', icon: 'location_on' },
        { href: ROUTES.admin.createPoi, label: 'Create POI', icon: 'add_location_alt' },
        { href: ROUTES.admin.routesList, label: 'Routes & Network', icon: 'alt_route' },
      ],
    },
    {
      title: 'Live & Content',
      items: [
        { href: ROUTES.admin.activeTrips, label: 'Active Trips', icon: 'commute' },
        { href: ROUTES.admin.users, label: 'User Directory', icon: 'group' },
        { href: ROUTES.admin.landingContent, label: 'Landing Content', icon: 'web' },
      ],
    },
  ];

  const adminSections: NavSection[] = [
    {
      title: 'System Overview',
      items: [
        { href: ROUTES.admin.dashboard, label: 'Control Center', icon: 'admin_panel_settings' },
        { href: ROUTES.admin.staffDashboard, label: 'Staff Workspace', icon: 'dashboard' },
      ],
    },
    {
      title: 'Governance & Finance',
      items: [
        { href: ROUTES.admin.users, label: 'User Governance', icon: 'manage_accounts' },
        { href: ROUTES.admin.reports, label: 'Statistical Reports', icon: 'analytics' },
        { href: ROUTES.admin.commissionReconciliation, label: 'Commission Reconciliation', icon: 'account_balance_wallet' },
      ],
    },
    {
      title: 'Catalog & Moderation',
      items: [
        { href: ROUTES.admin.tourReviews, label: 'Tour Moderation', icon: 'verified' },
        { href: ROUTES.admin.pois, label: 'POI Master Data', icon: 'location_on' },
        { href: ROUTES.admin.activeTrips, label: 'Live Monitoring', icon: 'commute' },
      ],
    },
    {
      title: 'Security & System',
      items: [
        { href: ROUTES.admin.algorithmParameters, label: 'Algorithm Config', icon: 'tune' },
        { href: ROUTES.admin.auditLogs, label: 'Audit Logs', icon: 'history_edu' },
      ],
    },
  ];

  const sections = isStaff ? staffSections : adminSections;
  const allItemHrefs = sections.flatMap((s) => s.items.map((i) => i.href));

  const renderNav = (isMobile = false) => (
    <div className="flex h-full flex-col justify-between overflow-y-auto overflow-x-hidden bg-[#1C2928] text-[#F7F5EF] scrollbar-thin">
      <div>
        {/* Brand Header */}
        <div className={`flex items-center border-b border-[#103B39] p-4 ${collapsed && !isMobile ? 'justify-center' : 'justify-start'}`}>
          <Link
            href={isStaff ? ROUTES.admin.staffDashboard : ROUTES.admin.dashboard}
            className="flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B6E69]"
            aria-label="TripMate Administration Home"
            onClick={isMobile ? onCloseMobile : undefined}
          >
            <BrandLogo context="admin" inverse />
            {(!collapsed || isMobile) && (
              <span className="rounded bg-[#174B4A] px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#E8F0EA] border border-[#5B6E69]/40">
                Admin
              </span>
            )}
          </Link>
        </div>

        {/* Navigation Sections */}
        <nav className="p-3 space-y-6" aria-label={isMobile ? 'Mobile Administration Navigation' : 'Administration Sidebar Navigation'}>
          {sections.map((section) => (
            <div key={section.title} className="space-y-1">
              {(!collapsed || isMobile) && (
                <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#5B6E69]">
                  {section.title}
                </p>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isExact = pathname === item.href;
                  const isDashboard =
                    item.href === ROUTES.admin.dashboard ||
                    item.href === ROUTES.admin.staffDashboard;
                  const isPrefixMatch =
                    !isDashboard && Boolean(pathname?.startsWith(`${item.href}/`));
                  const hasMoreSpecificMatch =
                    isPrefixMatch &&
                    allItemHrefs.some(
                      (otherHref) =>
                        otherHref !== item.href &&
                        (pathname === otherHref || Boolean(pathname?.startsWith(`${otherHref}/`))) &&
                        otherHref.length > item.href.length,
                    );
                  const isActive = isExact || (isPrefixMatch && !hasMoreSpecificMatch);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={isMobile ? onCloseMobile : undefined}
                        title={collapsed && !isMobile ? item.label : undefined}
                        className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-[#174B4A] text-[#FFFFFF] shadow-xs'
                            : 'text-[#5B6E69] hover:bg-[#103B39] hover:text-[#F7F5EF]'
                        } ${collapsed && !isMobile ? 'justify-center' : ''}`}
                      >
                        {isActive && (
                          <span
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-[#5B6E69]"
                            aria-hidden="true"
                          />
                        )}
                        <span
                          className={`material-symbols-outlined text-[18px] transition-colors ${
                            isActive ? 'text-[#F7F5EF]' : 'text-[#5B6E69] group-hover:text-[#F7F5EF]'
                          }`}
                          aria-hidden="true"
                        >
                          {item.icon}
                        </span>
                        {(!collapsed || isMobile) && <span className="truncate">{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer controls: Collapse, Security, Logout */}
      <div className="border-t border-[#103B39] p-3 space-y-2 bg-[#17221D]">
        <Link
          href={ROUTES.admin.accountSecurity}
          onClick={isMobile ? onCloseMobile : undefined}
          title={collapsed && !isMobile ? 'Security & Password' : undefined}
          className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-[#5B6E69] hover:bg-[#103B39] hover:text-[#F7F5EF] transition ${
            collapsed && !isMobile ? 'justify-center' : ''
          }`}
        >
          <span className="material-symbols-outlined text-[18px] text-[#5B6E69]" aria-hidden="true">
            lock_reset
          </span>
          {(!collapsed || isMobile) && <span>Security & Password</span>}
        </Link>

        <div className={`flex items-center gap-2 ${collapsed && !isMobile ? 'justify-center flex-col' : 'justify-between'}`}>
          <div className={collapsed && !isMobile ? 'w-full flex justify-center' : ''}>
            <AdminLogoutButton />
          </div>

          {!isMobile && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg border border-[#103B39] bg-[#103B39] text-[#5B6E69] hover:bg-[#174B4A] hover:text-[#FFFFFF] transition"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                {collapsed ? 'chevron_right' : 'chevron_left'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r border-[#103B39] transition-all duration-300 ease-in-out shrink-0 sticky top-0 h-screen z-30 overflow-x-hidden ${
          collapsed ? 'w-[72px]' : 'w-[260px]'
        }`}
        aria-label="Administration Sidebar"
      >
        {renderNav(false)}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          role="presentation"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-[rgba(28,41,35,0.6)] backdrop-blur-xs md:hidden transition-opacity"
        />
      )}

      {/* Mobile Off-canvas Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-y-0 left-0 z-50 w-[280px] bg-[#1C2928] shadow-2xl transition-transform duration-300 ease-in-out md:hidden translate-x-0"
          aria-label="Mobile Navigation Menu"
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute right-3 top-3 z-10">
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation drawer"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#103B39] text-[#F7F5EF] hover:bg-[#174B4A]"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          {renderNav(true)}
        </div>
      )}
    </>
  );
}
