import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { PartnerRouteGuard } from '@/features/operator/access/PartnerRouteGuard';

export const metadata: Metadata = {
  title: 'Cảnh báo an toàn thời tiết | TripMate Partner',
  description: 'Quản lý và xử lý các cảnh báo an toàn thời tiết cho lịch trình tour.',
};

export default function PartnerWeatherSafetyReviewsLayout({ children }: { children: ReactNode }) {
  return <PartnerRouteGuard route="dashboard">{children}</PartnerRouteGuard>;
}
