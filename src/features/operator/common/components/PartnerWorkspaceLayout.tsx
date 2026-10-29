'use client';

import { useState, type ReactNode } from 'react';
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

  return (
    <div className={`min-h-screen bg-[#F4F7FC] text-[#00152A] lg:flex ${className}`}>
      {/* Desktop Fixed Sidebar */}
      <PartnerSidebar
        activeTab={activeTab}
        isDemo={isDemo}
        operatorName={operatorName}
        className="hidden lg:flex lg:sticky lg:top-0 lg:h-screen lg:shrink-0"
      />

      {/* Mobile Slide-Over Drawer */}
      <MobileNavigationDrawer isOpen={mobileOpen} onClose={() => setMobileOpen(false)}>
        <PartnerSidebar
          activeTab={activeTab}
          isDemo={isDemo}
          operatorName={operatorName}
          onCloseMobile={() => setMobileOpen(false)}
          className="h-full"
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

        <main className="flex-1 bg-[#F4F7FC]">
          {children}
        </main>
      </div>
    </div>
  );
}
