import type { Metadata } from 'next';

import { FavoritePoisPage } from '@/features/account/favorites/FavoritePoisPage';

export const metadata: Metadata = {
  title: 'Địa điểm yêu thích',
  description: 'Danh sách các địa điểm (POI) bạn đã đánh dấu yêu thích trên TripMate.',
};

export default function AccountFavoritesPage() {
  return <FavoritePoisPage />;
}
