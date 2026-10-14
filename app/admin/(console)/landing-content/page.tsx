import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { LandingContentScreen } from '@/features/admin/landing-content/LandingContentScreen';
import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';

export const metadata: Metadata = {
  title: 'Landing Page Content Management | TripMate Administration',
  description: 'Edit, preview and publish the content of the public TripMate landing page.',
};

export default async function LandingContentPage() {
  let session: ReturnType<typeof verifyAdminSessionFromCookies> = null;
  try {
    session = verifyAdminSessionFromCookies(await cookies());
  } catch {
    session = null;
  }

  if (!session) {
    return redirect('/admin/login?returnUrl=%2Fadmin%2Flanding-content');
  }

  if (session.role !== 'Administrator' && session.role !== 'Staff') {
    return <AdminAccessDeniedView />;
  }

  return <LandingContentScreen />;
}
