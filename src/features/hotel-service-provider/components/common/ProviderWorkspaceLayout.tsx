'use client';

import React, { useState, type ReactNode } from 'react';
import { ProviderSidebar } from './ProviderSidebar';
import { ProviderTopbar } from './ProviderTopbar';
import { ToastProvider } from './Toast';

interface ProviderWorkspaceLayoutProps {
  children: ReactNode;
}

export function ProviderWorkspaceLayout({ children }: ProviderWorkspaceLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-[#F7F5EF] text-[#1C2928]">
        {/* Service Provider Sidebar */}
        <ProviderSidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((prev) => !prev)}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />

        {/* Main Workspace Column */}
        <div className="flex flex-1 flex-col min-w-0">
          <ProviderTopbar onOpenMobileSidebar={() => setMobileOpen(true)} />

          {/* Full-width Responsive Content Canvas */}
          <main className="flex-1 w-full max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
