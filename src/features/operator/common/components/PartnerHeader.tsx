'use client';

import Link from 'next/link';
import { BrandLogo } from '@/components/brand/BrandLogo';
import LogoutButton from '@/components/LogoutButton';
import { ROUTES } from '@/lib/routes';
import type { PartnerWorkspaceTabKey } from './PartnerSidebar';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PartnerHeaderProps {
  activeTab: PartnerWorkspaceTabKey;
  mobileOpen?: boolean;
  onToggleMobileMenu?: () => void;
  isDemo?: boolean;
  operatorName?: string;
  breadcrumbs?: BreadcrumbItem[];
}

const TAB_LABELS: Record<PartnerWorkspaceTabKey, string> = {
  dashboard: 'Bảng điều khiển',
  tours: 'Gói tour',
  coupons: 'Mã giảm giá',
  bookings: 'Đơn đặt chỗ',
  revenue: 'Doanh thu',
  payouts: 'Thanh toán & Rút tiền',
  profile: 'Hồ sơ doanh nghiệp',
};

export function PartnerHeader({
  activeTab,
  mobileOpen = false,
  onToggleMobileMenu,
  isDemo = false,
  operatorName,
  breadcrumbs,
}: PartnerHeaderProps) {
  const currentTabLabel = TAB_LABELS[activeTab] || 'Không gian làm việc';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 sm:px-6 py-3.5 backdrop-blur-md shadow-2xs">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-[#006B5F] lg:hidden overflow-hidden"
            aria-label={mobileOpen ? 'Đóng menu quản lý' : 'Mở menu quản lý'}
            aria-expanded={mobileOpen}
          >
            <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
              {mobileOpen ? 'close' : 'menu'}
            </span>
          </button>
        )}

        <div className="flex items-center gap-2 lg:hidden shrink-0">
          <Link href={ROUTES.partner.dashboard} aria-label="TripMate Partner Dashboard">
            <BrandLogo context="partner" size={20} />
          </Link>
        </div>

        {/* Desktop Breadcrumbs */}
        <nav aria-label="Đường dẫn trang" className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500 truncate min-w-0">
          <Link href={ROUTES.partner.dashboard} className="hover:text-slate-900 transition shrink-0">
            Quản lý đối tác
          </Link>
          <span className="text-slate-400 shrink-0">/</span>
          {breadcrumbs && breadcrumbs.length > 0 ? (
            breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              if (isLast || !crumb.href) {
                return (
                  <span key={crumb.label} className="font-bold text-[#00152A] truncate">
                    {crumb.label}
                  </span>
                );
              }
              return (
                <span key={crumb.label} className="flex items-center gap-1.5 shrink-0">
                  <Link href={crumb.href} className="hover:text-slate-900 transition">
                    {crumb.label}
                  </Link>
                  <span className="text-slate-400">/</span>
                </span>
              );
            })
          ) : (
            <span className="font-bold text-[#00152A] truncate">{currentTabLabel}</span>
          )}
        </nav>
      </div>

      {/* Right: Demo Badge, Operator Chip & Logout */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {isDemo && (
          <span className="rounded-full bg-amber-100 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] font-extrabold uppercase text-amber-800 tracking-wider shrink-0">
            <span className="hidden sm:inline">Chế độ thử nghiệm (Demo)</span>
            <span className="sm:hidden">DEMO</span>
          </span>
        )}

        {operatorName && (
          <div className="hidden md:flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs">
            <span className="font-bold text-[#00152A] max-w-[160px] truncate">{operatorName}</span>
            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
              Đã xác minh
            </span>
          </div>
        )}

        <div className="hidden sm:block">
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
