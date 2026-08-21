import type { ReactNode } from 'react';

import { AdminNavigation } from '@/components/navigation/AdminNavigation';

export default function AdminConsoleLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#191c1e]">
      <AdminNavigation />
      {children}
    </div>
  );
}
