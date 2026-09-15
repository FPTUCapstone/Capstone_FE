import type { Metadata } from 'next';

import { PoiDetailPage } from '@/features/public/pois/components/PoiDetailPage';

export const metadata: Metadata = {
  title: 'Chi tiết địa điểm',
  description: 'Thông tin chi tiết điểm tham quan trên TripMate.',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PoiPage({ params }: PageProps) {
  const { id } = await params;
  return <PoiDetailPage id={id} />;
}
