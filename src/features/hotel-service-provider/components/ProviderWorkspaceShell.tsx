'use client';

import Link from 'next/link';
import * as nextNav from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { webLogout } from '@/lib/authApi';
import { AuthStorage } from '@/features/auth/session/authSession';
import { WebSessionNotificationBell } from '@/features/notifications/WorkspaceNotificationBell';
import { ROUTES } from '@/lib/routes';
import { ToastProvider } from './common/Toast';
import { ProviderLocaleProvider, useProviderLocale } from './common/ProviderLocaleContext';

export interface ProviderWorkspaceShellProps {
  children: ReactNode;
  userName?: string;
  userEmail?: string;
}

function useSafePathname(): string {
  try {
    if (typeof nextNav.usePathname === 'function') {
      return nextNav.usePathname() || ROUTES.provider.bookings;
    }
  } catch {
    // Outside Next.js router context (unit tests)
  }
  return ROUTES.provider.bookings;
}

function getInitials(name?: string, email?: string): string {
  const source = (name || email || 'SP').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

function ProviderWorkspaceShellInner({
  children,
  userName,
  userEmail,
}: ProviderWorkspaceShellProps) {
  const router = nextNav.useRouter();
  const pathname = useSafePathname();
  const { locale, setLocale } = useProviderLocale('vi');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isVi = locale === 'vi';

  const copy = isVi
    ? {
        portalName: 'Cổng đối tác dịch vụ',
        providerTag: 'Provider',
        sectionOperations: 'Vận hành dịch vụ',
        bookingsLabel: 'Yêu cầu đặt dịch vụ',
        bookingDetailLabel: 'Chi tiết yêu cầu',
        availabilityLabel: 'Lịch dịch vụ',
        statementsLabel: 'Bảng kê hoa hồng',
        activeStatus: 'Tài khoản đang hoạt động',
        defaultAccountName: 'Đối tác dịch vụ TripMate',
        accountRole: 'Service Provider',
        collapseLabel: 'Thu gọn',
        expandLabel: 'Mở rộng thanh điều hướng',
        openMenuLabel: 'Mở menu điều hướng',
        closeMenuLabel: 'Đóng menu điều hướng',
        signOut: 'Đăng xuất',
        signingOut: 'Đang đăng xuất…',
        signOutError: 'Không thể đăng xuất lúc này. Vui lòng thử lại.',
        navAria: 'Điều hướng cổng đối tác dịch vụ',
        langAria: 'Chuyển đổi ngôn ngữ hiển thị',
      }
    : {
        portalName: 'Service Provider Portal',
        providerTag: 'Provider',
        sectionOperations: 'Service Operations',
        bookingsLabel: 'Booking Requests',
        bookingDetailLabel: 'Request Details',
        availabilityLabel: 'Service Availability',
        statementsLabel: 'Commission Statements',
        activeStatus: 'Account Active',
        defaultAccountName: 'TripMate Service Provider',
        accountRole: 'Service Provider',
        collapseLabel: 'Collapse',
        expandLabel: 'Expand navigation sidebar',
        openMenuLabel: 'Open navigation menu',
        closeMenuLabel: 'Close navigation menu',
        signOut: 'Sign out',
        signingOut: 'Signing out…',
        signOutError: 'Unable to sign out. Please try again.',
        navAria: 'Service Provider workspace',
        langAria: 'Switch display language',
      };

  const navItems = [
    {
      href: '/provider/stays',
      label: locale === 'vi' ? 'Lưu trú' : 'Stays',
      icon: 'hotel',
      isActive: pathname.startsWith('/provider/stays'),
    },
    {
      href: ROUTES.provider.bookings,
      label: copy.bookingsLabel,
      icon: 'inbox',
      isActive:
        pathname === ROUTES.provider.bookings ||
        pathname.startsWith(`${ROUTES.provider.bookings}/`),
    },
    {
      href: ROUTES.provider.availability,
      label: copy.availabilityLabel,
      icon: 'calendar_month',
      isActive:
        pathname === ROUTES.provider.availability ||
        pathname.startsWith(`${ROUTES.provider.availability}/`),
    },
    {
      href: ROUTES.provider.statements,
      label: copy.statementsLabel,
      icon: 'account_balance_wallet',
      isActive:
        pathname === ROUTES.provider.statements ||
        pathname.startsWith(`${ROUTES.provider.statements}/`),
    },
  ];

  // Close mobile drawer on Escape
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  async function logout() {
    setBusy(true);
    setError('');
    try {
      await webLogout();
      AuthStorage.clear();
      router.replace(ROUTES.signIn);
      router.refresh();
    } catch {
      setError(copy.signOutError);
      setBusy(false);
    }
  }

  const displayName = userName || copy.defaultAccountName;
  const initials = getInitials(userName, userEmail);

  const isStays = pathname.startsWith('/provider/stays');
  const isBookingDetail =
    pathname.startsWith(`${ROUTES.provider.bookings}/`) && pathname !== ROUTES.provider.bookings;
  const isAvailability = pathname.startsWith(ROUTES.provider.availability);
  const isStatements = pathname.startsWith(ROUTES.provider.statements);
  const staysLabel = isVi ? 'Lưu trú' : 'Stays';
  const roleBadge = isStays ? 'Hotel Operator' : copy.providerTag;
  const roleSubtitle = isStays ? 'Hotel Operator · ServiceProvider' : copy.accountRole;

  const renderSidebar = (isMobile = false) => {
    const isCollapsedDesktop = collapsed && !isMobile;

    return (
      <div className="flex h-full flex-col overflow-hidden bg-gradient-to-b from-[#172B29] to-[#122422] text-[#F7F5EF]">
        {/* Brand Header */}
        <div
          className={`flex h-16 shrink-0 items-center border-b border-white/10 ${
            isCollapsedDesktop ? 'justify-center px-2' : 'justify-between gap-2 px-4'
          }`}
        >
          <Link
            href={ROUTES.provider.bookings}
            onClick={isMobile ? () => setMobileOpen(false) : undefined}
            className="flex min-w-0 items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8F0EA]"
            aria-label={copy.portalName}
            title={isCollapsedDesktop ? copy.portalName : undefined}
          >
            <BrandLogo
              context="main"
              inverse
              size={isCollapsedDesktop ? 18 : 20}
              variant={isCollapsedDesktop ? 'icon' : 'full'}
              labelClassName="text-[17px] leading-none"
            />
            {!isCollapsedDesktop && (
              <span className="inline-flex shrink-0 items-center rounded-md border border-[#B96D4C]/45 bg-[#B96D4C]/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider leading-none text-[#F4CBB8]">
                {roleBadge}
              </span>
            )}
          </Link>

          {isMobile && (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label={copy.closeMenuLabel}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#F7F5EF] transition hover:bg-white/15 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                close
              </span>
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav
          aria-label={isMobile ? `${copy.navAria} (mobile)` : copy.navAria}
          className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-5 space-y-6"
        >
          <div className="space-y-1.5">
            {!isCollapsedDesktop && (
              <p className="px-3 pb-1 text-[10.5px] font-bold uppercase tracking-wider text-[#7D9992]">
                {copy.sectionOperations}
              </p>
            )}
            <ul className="space-y-1" role="list">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={isMobile ? () => setMobileOpen(false) : undefined}
                    title={isCollapsedDesktop ? item.label : undefined}
                    aria-current={item.isActive ? 'page' : undefined}
                    className={`group relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all ${
                      item.isActive
                        ? 'bg-[#174B4A] text-white shadow-xs'
                        : 'text-[#B9CCC7] hover:bg-white/8 hover:text-white'
                    } ${isCollapsedDesktop ? 'justify-center' : ''}`}
                  >
                    {item.isActive && (
                      <span
                        className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#D98A66]"
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className={`material-symbols-outlined text-[19px] shrink-0 transition-colors ${
                        item.isActive ? 'text-[#F4CBB8]' : 'text-[#8FA9A3] group-hover:text-white'
                      }`}
                      aria-hidden="true"
                    >
                      {item.icon}
                    </span>
                    {!isCollapsedDesktop && <span className="truncate">{item.label}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Sidebar Footer: Authenticated Provider Identity & Collapse Toggle */}
        <div className="shrink-0 border-t border-white/10 p-3 space-y-2.5">
          {!isCollapsedDesktop && (
            <div className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 shrink-0 rounded-full bg-[#10B981] shadow-[0_0_0_3px_rgba(16,185,129,0.22)]"
                  aria-hidden="true"
                />
                <span className="truncate text-xs font-bold text-white" title={displayName}>
                  {displayName}
                </span>
              </div>
              <p
                className="mt-1 truncate text-[11px] text-[#8FA9A3]"
                title={userEmail || copy.activeStatus}
              >
                {userEmail || copy.activeStatus}
              </p>
            </div>
          )}

          {!isMobile && (
            <div className={`flex items-center ${isCollapsedDesktop ? 'justify-center' : 'justify-end'}`}>
              <button
                type="button"
                onClick={() => setCollapsed((prev) => !prev)}
                aria-label={collapsed ? copy.expandLabel : copy.collapseLabel}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.06] px-2.5 text-xs font-semibold text-[#C7D8D4] transition hover:bg-white/12 hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]" aria-hidden="true">
                  {collapsed ? 'chevron_right' : 'chevron_left'}
                </span>
                {!isCollapsedDesktop && <span>{copy.collapseLabel}</span>}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#F7F5EF] text-[#1C2928]">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex shrink-0 flex-col border-r border-[#0E1F1D] transition-all duration-300 ease-in-out sticky top-0 h-screen z-30 ${
          collapsed ? 'w-[72px]' : 'w-[256px]'
        }`}
        aria-label={copy.navAria}
      >
        {renderSidebar(false)}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <>
          <div
            role="presentation"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-[#101E26]/60 backdrop-blur-xs md:hidden"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={copy.navAria}
            className="fixed inset-y-0 left-0 z-50 w-[272px] shadow-2xl md:hidden"
          >
            {renderSidebar(true)}
          </div>
        </>
      )}

      {/* Main Content Column */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Sticky White Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-[#DCE2DD] bg-white/95 px-4 sm:px-6 lg:px-8 backdrop-blur-md">
          {/* Left: Mobile Trigger & Breadcrumb */}
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label={copy.openMenuLabel}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#DCE2DD] bg-[#F7F5EF] text-[#1C2928] transition hover:bg-[#E8F0EA] md:hidden cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                menu
              </span>
            </button>

            <nav aria-label="Breadcrumb" className="min-w-0">
              <ol className="flex items-center gap-1.5 text-xs text-[#5B6E69]">
                <li className="hidden sm:inline truncate">{copy.portalName}</li>
                <li className="hidden sm:inline" aria-hidden="true">
                  <span className="material-symbols-outlined text-[14px] align-middle text-[#8E9E9B]">
                    chevron_right
                  </span>
                </li>
                {isStays ? (
                  <li className="truncate font-bold text-[#1C2928]" aria-current="page">
                    {staysLabel}
                  </li>
                ) : isAvailability ? (
                  <li className="truncate font-bold text-[#1C2928]" aria-current="page">
                    {copy.availabilityLabel}
                  </li>
                ) : isStatements ? (
                  <li className="truncate font-bold text-[#1C2928]" aria-current="page">
                    {copy.statementsLabel}
                  </li>
                ) : isBookingDetail ? (
                  <>
                    <li className="truncate">
                      <Link
                        href={ROUTES.provider.bookings}
                        className="font-medium hover:text-[#174B4A] transition-colors"
                      >
                        {copy.bookingsLabel}
                      </Link>
                    </li>
                    <li aria-hidden="true">
                      <span className="material-symbols-outlined text-[14px] align-middle text-[#8E9E9B]">
                        chevron_right
                      </span>
                    </li>
                    <li className="truncate font-bold text-[#1C2928]" aria-current="page">
                      {copy.bookingDetailLabel}
                    </li>
                  </>
                ) : (
                  <li className="truncate font-bold text-[#1C2928]" aria-current="page">
                    {copy.bookingsLabel}
                  </li>
                )}
              </ol>
            </nav>
          </div>

          {/* Right: Language Toggle, Notification Bell, User Info, Sign Out */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* VI / EN Switcher */}
            <div
              role="group"
              aria-label={copy.langAria}
              className="inline-flex items-center rounded-lg border border-[#DCE2DD] bg-[#F4F5F2] p-0.5 text-[11px] font-bold"
            >
              <button
                type="button"
                onClick={() => setLocale('vi')}
                aria-pressed={locale === 'vi'}
                className={`rounded-md px-2 py-1 transition-colors cursor-pointer ${
                  locale === 'vi'
                    ? 'bg-white text-[#174B4A] shadow-2xs'
                    : 'text-[#5B6E69] hover:text-[#1C2928]'
                }`}
              >
                VI
              </button>
              <button
                type="button"
                onClick={() => setLocale('en')}
                aria-pressed={locale === 'en'}
                className={`rounded-md px-2 py-1 transition-colors cursor-pointer ${
                  locale === 'en'
                    ? 'bg-white text-[#174B4A] shadow-2xs'
                    : 'text-[#5B6E69] hover:text-[#1C2928]'
                }`}
              >
                EN
              </button>
            </div>

            {/* Real Workspace Notification Inbox Bell */}
            {!busy && <WebSessionNotificationBell role="ServiceProvider" />}

            <div className="hidden sm:block h-5 w-px bg-[#DCE2DD]" aria-hidden="true" />

            {/* User Identity */}
            <div className="hidden sm:flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#174B4A] text-xs font-extrabold text-white"
                aria-hidden="true"
              >
                {initials}
              </div>
              <div className="hidden lg:flex flex-col text-left leading-tight">
                <span className="max-w-[160px] truncate text-xs font-bold text-[#1C2928]">
                  {displayName}
                </span>
                <span className="text-[11px] text-[#5B6E69]">{roleSubtitle}</span>
              </div>
            </div>

            {/* Sign Out */}
            <button
              type="button"
              onClick={logout}
              disabled={busy}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#DCE2DD] bg-white px-3 text-xs font-semibold text-[#3D524E] transition hover:border-[#B8C4BE] hover:bg-[#F7F5EF] hover:text-[#1C2928] disabled:opacity-50 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                logout
              </span>
              <span className="hidden sm:inline">
                {busy ? copy.signingOut : copy.signOut}
              </span>
            </button>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="mx-auto mt-4 w-full max-w-[1360px] px-4 sm:px-6 lg:px-8"
          >
            <div className="flex items-center gap-2 rounded-xl border border-[#FECDD3] bg-[#FDECEF] px-4 py-3 text-xs font-semibold text-[#991B1B]">
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                error
              </span>
              <span>{error}</span>
            </div>
          </div>
        )}

        <main className="mx-auto w-full max-w-[1360px] flex-1 px-4 py-6 sm:px-6 lg:px-8 sm:py-7">
          {children}
        </main>
      </div>
    </div>
  );
}

export function ProviderWorkspaceShell(props: ProviderWorkspaceShellProps) {
  return (
    <ProviderLocaleProvider defaultLocale="vi">
      <ToastProvider>
        <ProviderWorkspaceShellInner {...props} />
      </ToastProvider>
    </ProviderLocaleProvider>
  );
}
