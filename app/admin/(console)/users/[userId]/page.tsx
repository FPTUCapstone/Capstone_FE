import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { UserAccountDetailUnavailableView } from '@/features/admin/user-accounts/components/UserAccountDetailUnavailableView';
import { parseUserAccountRouteId } from '@/features/admin/user-accounts/server/userAccountRouteId';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';

interface UserAccountDetailPageProps {
  params: Promise<{ userId: string }>;
}

export const metadata: Metadata = {
  title: 'User Account Details (Backend Integration Pending) | TripMate Administration',
  description: 'View administrative account status and moderation details pending backend integration.',
};

export default async function UserAccountDetailPage({ params }: UserAccountDetailPageProps) {
  let session: ReturnType<typeof verifyAdminSessionFromCookies> = null;
  try {
    session = verifyAdminSessionFromCookies(await cookies());
  } catch {
    session = null;
  }

  if (!session) {
    return redirect('/admin/login?returnUrl=%2Fadmin%2Fusers');
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
