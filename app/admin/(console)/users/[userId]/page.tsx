import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { UserAccountDetailUnavailableView } from '@/features/admin/user-accounts/components/UserAccountDetailUnavailableView';
import { parseUserAccountRouteId } from '@/features/admin/user-accounts/server/userAccountRouteId';
import { resolveWebSession } from '@/lib/server/webSession';

interface UserAccountDetailPageProps {
  params: Promise<{ userId: string }>;
}

export const metadata: Metadata = {
  title: 'User Account Details (Backend Integration Pending) | TripMate Administration',
  description: 'View administrative account status and moderation details pending backend integration.',
};

export default async function UserAccountDetailPage({ params }: UserAccountDetailPageProps) {
  const session = await resolveWebSession();

  if (!session) {
    return redirect('/sign-in?returnUrl=%2Fadmin%2Fusers');
  }

  if (session.role === 'Staff') {
    return <AdminAccessDeniedView />;
  }

  const { userId: rawUserId } = await params;
  const userId = parseUserAccountRouteId(rawUserId);
  if (userId === null) {
    notFound();
  }

  return <UserAccountDetailUnavailableView userId={userId} />;
}
