import { notFound } from 'next/navigation';
import { CanonicalTripReviewPage } from '@/features/reviews/components/CanonicalTripReviewPage';
import type { ReviewableRecordKind } from '@/features/reviews/types/canonicalReview';

interface Props { params: Promise<{ kind: string; id: string }> }
export default async function ReviewPage({ params }: Props) {
  const { kind, id } = await params;
  if ((kind !== 'commerceBooking' && kind !== 'serviceBooking') || !/^[1-9]\d*$/.test(id)) notFound();
  return <CanonicalTripReviewPage reference={{ kind: kind as ReviewableRecordKind, id: Number(id) }} />;
}
