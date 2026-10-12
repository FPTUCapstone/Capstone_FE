import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { UserAccountDetailUnavailableView } from '@/features/admin/user-accounts/components/UserAccountDetailUnavailableView';
import { parseUserAccountRouteId } from '@/features/admin/user-accounts/server/userAccountRouteId';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';

interface UserAccountDetailPageProps {
  params: Promise<{ userId: string }>;
}

export default async function UserAccountDetailPage({ params }: UserAccountDetailPageProps) {
  let session: ReturnType<typeof verifyAdminSessionFromCookies> = null;
  try {
    session = verifyAdminSessionFromCookies(await cookies());
  } catch {
    session = null;
  }

  if (!session) {
    redirect('/admin/login?returnUrl=%2Fadmin%2Fusers');
  }

  const { userId: rawUserId } = await params;
  const userId = parseUserAccountRouteId(rawUserId);
  if (userId === null) {
    notFound();
  }

  return <UserAccountDetailUnavailableView userId={userId} />;
}
