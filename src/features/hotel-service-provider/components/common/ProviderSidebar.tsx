'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { hotelProviderEn } from '../../resources/en';
import { ROUTES } from '@/lib/routes';

interface ProviderSidebarProps {
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

export function ProviderSidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: ProviderSidebarProps) {
  const pathname = usePathname() || '/provider/bookings';

  const navItems: NavItem[] = [
    {
      href: ROUTES.provider?.bookings || '/provider/bookings',
      label: hotelProviderEn.nav.bookingsTab,
      icon: 'receipt_long',
    },
    {
      href: ROUTES.provider?.statements || '/provider/statements',
      label: hotelProviderEn.nav.statementsTab,
      icon: 'payments',
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#1C2928] text-[#F7F5EF] border-r border-[#103B39]">
      {/* Brand & Workspace Identity */}
      <div className="flex items-center justify-between p-4 border-b border-[#103B39]">
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <BrandLogo context="partner" inverse />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#995436] bg-[#3D271E] px-1.5 py-0.5 rounded border border-[#B96D4C]/40">
                Hotel
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[#8E9E9B] truncate font-medium">
              Hội An Riverside Heritage
            </p>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto">
            <span className="material-symbols-outlined text-[24px] text-[#E8F7F4]">
              hotel
            </span>
          </div>
        )}

        {/* Desktop Collapse Toggle */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden md:flex items-center justify-center p-1.5 rounded-lg text-[#8E9E9B] hover:text-white hover:bg-[#103B39] transition-colors cursor-pointer"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="material-symbols-outlined text-[18px]">
            {collapsed ? 'chevron_right' : 'chevron_left'}
          </span>
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        <div className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8E9E9B] ${collapsed ? 'sr-only' : ''}`}>
          Operations
        </div>
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-[#103B39] text-[#E8F7F4] shadow-xs'
                  : 'text-[#DCE2DD] hover:bg-[#103B39]/60 hover:text-white'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <span
                className={`material-symbols-outlined text-[20px] shrink-0 ${
                  isActive ? 'text-[#B96D4C]' : 'text-[#8E9E9B]'
                }`}
                aria-hidden="true"
              >
                {item.icon}
              </span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </div>

      {/* Property Information Footer */}
      {!collapsed && (
        <div className="p-3 m-2 bg-[#103B39]/60 border border-[#103B39] rounded-lg">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0E9F6E] shrink-0" aria-hidden="true" />
            <span className="text-[11px] font-medium text-[#E8F7F4] truncate">
              POI-DANANG-0042
            </span>
          </div>
          <p className="mt-1 text-[10px] text-[#8E9E9B] truncate">
            188 Cửa Đại, Hội An
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop / Tablet Sidebar */}
      <aside
        className={`hidden md:block shrink-0 transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="sticky top-0 h-screen">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#101E26]/60 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        >
          <div
            className="w-64 h-full bg-[#1C2928]"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
