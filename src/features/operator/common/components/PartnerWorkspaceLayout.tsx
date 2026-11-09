'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useWeatherSafetyRealtime } from '@/features/operator/weather-safety/realtime/useWeatherSafetyRealtime';
import { getWeatherSafetyReviewBadgeCount } from '@/features/operator/weather-safety/weatherSafetyApi';
import { PartnerSidebar, type PartnerWorkspaceTabKey } from './PartnerSidebar';
import { PartnerHeader, type BreadcrumbItem } from './PartnerHeader';
import { MobileNavigationDrawer } from './MobileNavigationDrawer';

export interface PartnerWorkspaceLayoutProps {
  activeTab: PartnerWorkspaceTabKey;
  children: ReactNode;
  operatorName?: string;
  isDemo?: boolean;
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
}

export function PartnerWorkspaceLayout({
  activeTab,
  children,
  operatorName,
  isDemo = false,
  breadcrumbs,
  className = '',
}: PartnerWorkspaceLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [weatherAlertBadgeCount, setWeatherAlertBadgeCount] = useState(0);

  useEffect(() => {
    if (isDemo) return;
    let active = true;
    // The badge is only a hint, so a failed read leaves it hidden.
    getWeatherSafetyReviewBadgeCount().then((count) => {
      if (active) setWeatherAlertBadgeCount(count);
    });
    return () => {
      active = false;
    };
  }, [isDemo]);

  useWeatherSafetyRealtime({
    enabled: !isDemo,
    onRefreshHint: () => {
      void getWeatherSafetyReviewBadgeCount().then(setWeatherAlertBadgeCount);
    },
  });

  return (
    <div className={`min-h-screen bg-[#F7F5EF] text-[#1C2928] lg:flex ${className}`}>
      {/* Desktop Fixed Sidebar */}
      <PartnerSidebar
        activeTab={activeTab}
        isDemo={isDemo}
        operatorName={operatorName}
        className="hidden lg:flex lg:sticky lg:top-0 lg:h-screen lg:shrink-0"
        weatherAlertBadgeCount={weatherAlertBadgeCount}
      />

      {/* Mobile Slide-Over Drawer */}
      <MobileNavigationDrawer isOpen={mobileOpen} onClose={() => setMobileOpen(false)}>
        <PartnerSidebar
          activeTab={activeTab}
          isDemo={isDemo}
          operatorName={operatorName}
          onCloseMobile={() => setMobileOpen(false)}
          className="h-full"
          weatherAlertBadgeCount={weatherAlertBadgeCount}
        />
      </MobileNavigationDrawer>

      {/* Main Workspace Column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <PartnerHeader
          activeTab={activeTab}
          mobileOpen={mobileOpen}
          onToggleMobileMenu={() => setMobileOpen(!mobileOpen)}
          isDemo={isDemo}
          operatorName={operatorName}
          breadcrumbs={breadcrumbs}
        />

        <main className="flex-1 bg-[#F7F5EF]">
          {children}
        </main>
      </div>
    </div>
  );
}
