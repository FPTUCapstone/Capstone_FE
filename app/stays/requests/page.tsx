import { StayRequestList } from '@/features/stays/TravelerStays';
import { positiveId } from '@/features/stays/stayApi';

export default async function StayRequestsPage({ searchParams }: { searchParams: Promise<{ requestId?: string }> }) {
  return <StayRequestList requestId={positiveId((await searchParams).requestId) ?? undefined} />;
}
