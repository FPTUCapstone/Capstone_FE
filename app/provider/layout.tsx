import type { Metadata } from 'next';
import { ProviderWorkspaceLayout } from '@/features/hotel-service-provider/components/common/ProviderWorkspaceLayout';

export const metadata: Metadata = {
  title: 'TripMate Partner — Service Provider Operations',
  description: 'Hospitality and commercial service provider management workspace.',
};

export default function ProviderRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProviderWorkspaceLayout>{children}</ProviderWorkspaceLayout>;
}
