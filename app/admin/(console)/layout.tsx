import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { AdminNavigation } from '@/components/navigation/AdminNavigation';
import { ROUTES } from '@/lib/routes';
import { resolveWebSession } from '@/lib/server/webSession';

export default async function AdminConsoleLayout({ children }: Readonly<{ children: ReactNode }>) {
  const session = await resolveWebSession();

  if (!session) {
    return redirect(ROUTES.signIn);
  }

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#191c1e]">
      <AdminNavigation role={session.role} />
      {children}
    </div>
  );
}
