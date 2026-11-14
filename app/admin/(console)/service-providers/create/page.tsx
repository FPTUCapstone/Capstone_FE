import type { Metadata } from 'next';
import { CreateServiceProviderView } from '@/features/hotel-service-provider/components/w102/CreateServiceProviderView';
import { ToastProvider } from '@/features/hotel-service-provider/components/common/Toast';

export const metadata: Metadata = {
  title: 'Tạo tài khoản đối tác dịch vụ | TripMate Staff',
  description: 'Khởi tạo tài khoản đối tác thương mại và liên kết cơ sở lưu trú vào hệ thống vận hành.',
};

export default function CreateServiceProviderPage() {
  return (
    <ToastProvider>
      <CreateServiceProviderView />
    </ToastProvider>
  );
}
