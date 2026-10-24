import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { AdminConsoleShell } from '@/features/admin/shared/components/AdminConsoleShell';
import { ROUTES } from '@/lib/routes';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';

import '@/features/admin/shared/styles/admin-theme.css';

export default async function AdminConsoleLayout({ children }: Readonly<{ children: ReactNode }>) {
  let session: ReturnType<typeof verifyAdminSessionFromCookies> = null;
  try {
    const cookieStore = await cookies();
    session = verifyAdminSessionFromCookies(cookieStore);
  } catch {
    session = null;
  }

  if (!session) {
    return redirect(ROUTES.admin.login);
  }

  return (
    <div className="admin-theme min-h-screen bg-[#F7F6F2] text-[#1C2923]">
      <AdminConsoleShell role={session.role}>
        {children}
      </AdminConsoleShell>
    </div>
  );
}
