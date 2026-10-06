import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { BookingRouteGuard } from '@/features/operator/bookings/guards/BookingRouteGuard';

export const metadata: Metadata = {
  title: 'Quản lý Đơn đặt chỗ | Tour Operator Workspace | TripMate',
  description: 'Quản lý, tra cứu và xử lý đơn đặt chỗ của khách hàng (UC-40, UC-41, UC-42).',
};

export default function PartnerBookingsLayout({ children }: { children: ReactNode }) {
  return <BookingRouteGuard>{children}</BookingRouteGuard>;
}
