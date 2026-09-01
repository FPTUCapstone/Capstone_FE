import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { findAdminTourReview } from '@/data/adminTourQueue';
import { TourReview } from '@/features/admin/tour-reviews/TourReview';

type TourReviewPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: 'Tour Review',
};

export default async function AdminTourReviewPage({ params }: TourReviewPageProps) {
  const { id } = await params;
  const review = findAdminTourReview(id);

  if (!review) {
    notFound();
  }

  return <TourReview review={review} />;
}
