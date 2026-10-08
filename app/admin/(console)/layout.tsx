import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { AdminNavigation } from '@/components/navigation/AdminNavigation';
import { ROUTES } from '@/lib/routes';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';

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
    <div className="min-h-screen bg-[#f7f9fc] text-[#191c1e]">
      <AdminNavigation role={session.role} />
      {children}
    </div>
  );
}
