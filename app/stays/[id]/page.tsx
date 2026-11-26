import { notFound } from 'next/navigation';
import { StayDetail } from '@/features/stays/TravelerStays';
import { positiveId } from '@/features/stays/stayApi';

export default async function StayPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ itineraryId?: string }>;
}) {
  const poiId = positiveId((await params).id);
  if (!poiId) notFound();
  return <StayDetail poiId={poiId} itineraryId={positiveId((await searchParams).itineraryId) ?? undefined} />;
}
