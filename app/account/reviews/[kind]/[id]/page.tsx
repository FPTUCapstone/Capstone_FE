import { notFound } from 'next/navigation';
import { CanonicalTripReviewPage } from '@/features/reviews/components/CanonicalTripReviewPage';
import type { ReviewableRecordKind } from '@/features/reviews/types/canonicalReview';
import { isPositiveInt64 } from '@/features/reviews/types/reviewableRecordId';

interface Props { params: Promise<{ kind: string; id: string }> }
export default async function ReviewPage({ params }: Props) {
  const { kind, id } = await params;
  if ((kind !== 'commerceBooking' && kind !== 'serviceBooking') || !isPositiveInt64(id)) notFound();
  return <CanonicalTripReviewPage reference={{ kind: kind as ReviewableRecordKind, id }} />;
}
