import { cookies } from 'next/headers';
import type { ReactNode } from 'react';

import { AdminNavigation } from '@/components/navigation/AdminNavigation';
import { ADMIN_ACCESS_TOKEN_COOKIE, parseAdminRoleFromToken } from '@/lib/server/adminSession';

export default async function AdminConsoleLayout({ children }: Readonly<{ children: ReactNode }>) {
  let role: 'Administrator' | 'Staff' = 'Administrator';
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
    role = parseAdminRoleFromToken(token) ?? 'Administrator';
  } catch {
    role = 'Administrator';
  }

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#191c1e]">
      <AdminNavigation role={role} />
      {children}
    </div>
  );
}
