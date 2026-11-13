import type { Metadata } from 'next';
import { CreateServiceProviderView } from '@/features/hotel-service-provider/components/w102/CreateServiceProviderView';
import { ToastProvider } from '@/features/hotel-service-provider/components/common/Toast';

export const metadata: Metadata = {
  title: 'Create Service Provider Account | TripMate Staff',
  description: 'Provision verified commercial service provider account and link active commercial POIs (UC-77).',
};

export default function CreateServiceProviderPage() {
  return (
    <ToastProvider>
      <CreateServiceProviderView />
    </ToastProvider>
  );
}
