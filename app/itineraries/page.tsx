import type { Metadata } from 'next';
import { MyItinerariesPage } from '@/features/scheduling/components/MyItinerariesPage';

export const metadata: Metadata = {
  title: 'Lịch trình của tôi',
  description: 'Các lịch trình du lịch bạn đã lập hoặc được chia sẻ trên TripMate.',
};

export default function ItinerariesPage() {
  return <MyItinerariesPage />;
}
