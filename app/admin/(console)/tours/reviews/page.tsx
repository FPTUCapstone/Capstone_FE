import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { TourReviewQueue } from '@/features/admin/tour-reviews/TourReviewQueue';
import { tourModerationEn } from '@/features/admin/tour-reviews/resources/en';
import { ROUTES } from '@/lib/routes';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';

export const metadata: Metadata = {
  title: tourModerationEn.metadata.queueTitle,
};

export default async function AdminTourReviewQueuePage() {
  let session: ReturnType<typeof verifyAdminSessionFromCookies> = null;
  try {
    session = verifyAdminSessionFromCookies(await cookies());
  } catch {
    session = null;
  }

  if (!session) {
    return redirect(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(ROUTES.admin.tourReviews)}`);
  }

  if (session.role === 'Staff') {
    return <AdminAccessDeniedView />;
  }

  return (
    <Suspense fallback={null}>
      <TourReviewQueue />
    </Suspense>
  );
}
