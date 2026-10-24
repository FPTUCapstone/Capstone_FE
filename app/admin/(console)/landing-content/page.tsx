import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { LandingContentScreen } from '@/features/admin/landing-content/LandingContentScreen';
import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { resolveWebSession } from '@/lib/server/webSession';

export const metadata: Metadata = {
  title: 'Landing Page Content Management | TripMate Administration',
  description: 'Edit, preview and publish the content of the public TripMate landing page.',
};

export default async function LandingContentPage() {
  const session = await resolveWebSession();

  if (!session) {
    return redirect('/sign-in?returnUrl=%2Fadmin%2Flanding-content');
  }

  if (session.role !== 'Administrator' && session.role !== 'Staff') {
    return <AdminAccessDeniedView />;
  }

  return <LandingContentScreen />;
}
