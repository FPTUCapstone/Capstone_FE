import type { Metadata } from 'next';

import { MyPostTripComplaintsPage } from '@/features/complaints/submit/components/MyPostTripComplaintsPage';

export const metadata: Metadata = {
  title: 'Khiếu nại của tôi',
  description: 'Theo dõi các khiếu nại sau chuyến đi đã gửi tới TripMate.',
};

export default function AccountComplaintsPage() {
  return <MyPostTripComplaintsPage />;
}
