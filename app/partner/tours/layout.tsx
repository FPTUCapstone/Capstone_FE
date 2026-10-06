import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { TourRouteGuard } from '@/features/operator/tours/guards/TourRouteGuard';

export const metadata: Metadata = {
  title: 'Quản lý Gói Tour | Tour Operator Workspace | TripMate',
  description: 'Quản lý gói tour, lịch trình và trạng thái xét duyệt cho đối tác lữ hành.',
};

export default function PartnerToursLayout({ children }: { children: ReactNode }) {
  return <TourRouteGuard>{children}</TourRouteGuard>;
}
