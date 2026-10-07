import type { Metadata } from 'next';
import { Suspense } from 'react';

import { TourReview } from '@/features/admin/tour-reviews/TourReview';
import { tourModerationEn } from '@/features/admin/tour-reviews/resources/en';

type TourReviewPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: tourModerationEn.metadata.detailTitle,
};

export default async function AdminTourReviewPage({ params }: TourReviewPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={null}>
      <TourReview id={id} />
    </Suspense>
  );
}
