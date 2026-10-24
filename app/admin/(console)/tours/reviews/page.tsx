import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { TourReviewQueue } from '@/features/admin/tour-reviews/TourReviewQueue';
import { tourModerationEn } from '@/features/admin/tour-reviews/resources/en';
import { ROUTES } from '@/lib/routes';
import { resolveWebSession } from '@/lib/server/webSession';

export const metadata: Metadata = {
  title: tourModerationEn.metadata.queueTitle,
};

export default async function AdminTourReviewQueuePage() {
  const session = await resolveWebSession();

  if (!session) {
    return redirect(`${ROUTES.signIn}?returnUrl=${encodeURIComponent(ROUTES.admin.tourReviews)}`);
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
