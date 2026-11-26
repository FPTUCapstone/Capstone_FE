import { StayCatalog } from '@/features/stays/TravelerStays';
import { positiveId } from '@/features/stays/stayApi';

export default async function StaysPage({ searchParams }: { searchParams: Promise<{ itineraryId?: string }> }) {
  const { itineraryId } = await searchParams;
  return <StayCatalog itineraryId={positiveId(itineraryId) ?? undefined} />;
}
