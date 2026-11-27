import { ProviderStays } from '@/features/stays/ProviderStays';
import { positiveId } from '@/features/stays/stayApi';

export default async function ProviderStaysPage({ searchParams }: { searchParams: Promise<{ requestId?: string }> }) {
  return <ProviderStays requestId={positiveId((await searchParams).requestId) ?? undefined} />;
}
