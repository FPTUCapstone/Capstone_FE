import type { Metadata } from 'next';
import { ViewSuggestedItineraryPage } from '@/features/scheduling/components/ViewSuggestedItineraryPage';

export const metadata: Metadata = {
  title: 'Kế hoạch lịch trình gợi ý | TripMate',
  description:
    'Xem chi tiết lịch trình du lịch thông minh được tối ưu hóa theo thuật toán CSP trên TripMate.',
};

interface ItineraryPageProps {
  params: Promise<{ id: string }>;
}

export default async function ItineraryDetailPage({ params }: ItineraryPageProps) {
  const { id } = await params;
  return <ViewSuggestedItineraryPage itineraryId={id} />;
}
