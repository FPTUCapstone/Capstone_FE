import type { Metadata } from 'next';

import { TravelPreferencesPage } from '@/features/account/preferences/TravelPreferencesPage';

export const metadata: Metadata = {
  title: 'Sở thích du lịch | TripMate',
  description: 'Tùy chỉnh sở thích du lịch, phong cách chuyến đi và ngân sách trên TripMate (UC-09).',
};

export default function AccountPreferencesPage() {
  return <TravelPreferencesPage />;
}
