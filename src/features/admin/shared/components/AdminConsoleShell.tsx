'use client';

import { useState, type ReactNode } from 'react';
import type { AdministrationRole } from '@/features/auth/session/authSession';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';

interface AdminConsoleShellProps {
  role: AdministrationRole;
  children: ReactNode;
}

export function AdminConsoleShell({ role, children }: AdminConsoleShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F7F6F2] text-[#1C2923]">
      {/* Role-Aware Collapsible Sidebar */}
      <AdminSidebar
        role={role}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Workspace Column */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Dynamic Contextual Topbar */}
        <AdminTopbar
          role={role}
          onOpenMobileSidebar={() => setMobileOpen(true)}
        />

        {/* Content Canvas */}
        <main
          id="admin-main-canvas"
          className="flex-1 w-full max-w-[1440px] mx-auto p-4 sm:p-6 md:p-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
