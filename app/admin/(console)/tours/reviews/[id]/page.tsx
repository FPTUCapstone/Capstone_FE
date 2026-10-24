import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { TourReview } from '@/features/admin/tour-reviews/TourReview';
import { tourModerationEn } from '@/features/admin/tour-reviews/resources/en';
import { ROUTES } from '@/lib/routes';
import { resolveWebSession } from '@/lib/server/webSession';

type TourReviewPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: tourModerationEn.metadata.detailTitle,
};

export default async function AdminTourReviewPage({ params }: TourReviewPageProps) {
  const session = await resolveWebSession();

  if (!session) {
    return redirect(ROUTES.signIn);
  }

  if (session.role === 'Staff') {
    return <AdminAccessDeniedView />;
  }

  const { id } = await params;

  return (
    <Suspense fallback={null}>
      <TourReview id={id} />
    </Suspense>
  );
}
