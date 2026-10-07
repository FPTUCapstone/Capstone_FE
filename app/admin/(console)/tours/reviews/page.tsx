import type { Metadata } from 'next';
import { Suspense } from 'react';

import { TourReviewQueue } from '@/features/admin/tour-reviews/TourReviewQueue';
import { tourModerationEn } from '@/features/admin/tour-reviews/resources/en';

export const metadata: Metadata = {
  title: tourModerationEn.metadata.queueTitle,
};

export default function AdminTourReviewQueuePage() {
  return (
    <Suspense fallback={null}>
      <TourReviewQueue />
    </Suspense>
  );
}
