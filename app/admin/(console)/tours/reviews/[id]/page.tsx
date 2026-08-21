import type { Metadata } from 'next';

import { TourReview } from '@/features/admin/tour-reviews/TourReview';

type TourReviewPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: 'Tour Review',
};

export default async function AdminTourReviewPage({ params }: TourReviewPageProps) {
  const { id } = await params;

  return <TourReview reviewId={id} />;
}
