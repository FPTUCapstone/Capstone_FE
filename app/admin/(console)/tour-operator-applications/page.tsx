import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { OperatorApplicationQueue } from '@/features/admin/operator-application-queue/OperatorApplicationQueue';
import { operatorApplicationQueueEn } from '@/features/admin/operator-application-queue/resources/en';
import { ROUTES } from '@/lib/routes';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';

export const metadata: Metadata = {
  title: operatorApplicationQueueEn.metadata.title,
};

/**
 * Screen #10. Staff decide on Tour Operator applications (latest team decision); the SRS detailed
 * sections still name Administrator, so both signed roles reach the list. This guard is a UX
 * boundary only: the Backend authorizes the list and the decisions (CR-11).
 */
export default async function PendingOperatorApplicationsPage() {
  let session: ReturnType<typeof verifyAdminSessionFromCookies> = null;
  try {
    session = verifyAdminSessionFromCookies(await cookies());
  } catch {
    session = null;
  }

  if (!session) {
    return redirect(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(ROUTES.admin.operatorApplications)}`);
  }

  return (
    <Suspense fallback={null}>
      <OperatorApplicationQueue />
    </Suspense>
  );
}
