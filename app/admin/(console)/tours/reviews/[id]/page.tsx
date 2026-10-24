import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { TourReview } from '@/features/admin/tour-reviews/TourReview';
import { tourModerationEn } from '@/features/admin/tour-reviews/resources/en';
import { ROUTES } from '@/lib/routes';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';

type TourReviewPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: tourModerationEn.metadata.detailTitle,
};

export default async function AdminTourReviewPage({ params }: TourReviewPageProps) {
  let session: ReturnType<typeof verifyAdminSessionFromCookies> = null;
  try {
    session = verifyAdminSessionFromCookies(await cookies());
  } catch {
    session = null;
  }

  if (!session) {
    return redirect(ROUTES.admin.login);
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
