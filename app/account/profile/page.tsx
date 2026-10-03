import type { Metadata } from 'next';

import { TravelerProfilePage } from '@/features/account/profile/TravelerProfilePage';

export const metadata: Metadata = {
  title: 'Hồ sơ cá nhân | TripMate',
  description: 'Cập nhật thông tin hồ sơ du khách cá nhân trên TripMate.',
};

export default function AccountProfilePage() {
  return <TravelerProfilePage />;
}
