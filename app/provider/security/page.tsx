import type { Metadata } from 'next';
import { ProviderSecurityPage } from '@/features/hotel-service-provider/components/ProviderSecurityPage';

export const metadata: Metadata = { title: 'Account security | TripMate Service Provider' };

export default function SecurityPage() {
  return <ProviderSecurityPage />;
}
