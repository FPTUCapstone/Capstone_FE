import type { Metadata } from 'next';

import { TourReviewQueue } from '@/features/admin/tour-reviews/TourReviewQueue';

export const metadata: Metadata = {
  title: 'Tour Review Queue',
};

export default function AdminTourReviewQueuePage() {
  return <TourReviewQueue />;
}
