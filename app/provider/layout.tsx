import type { Metadata } from 'next';
import { ProviderWorkspaceLayout } from '@/features/hotel-service-provider/components/common/ProviderWorkspaceLayout';

export const metadata: Metadata = {
  title: 'TripMate Partner — Cổng Quản lý Đối tác',
  description: 'Không gian vận hành và quản lý dành cho đối tác lưu trú và dịch vụ thương mại TripMate.',
};

export default function ProviderRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProviderWorkspaceLayout>{children}</ProviderWorkspaceLayout>;
}
