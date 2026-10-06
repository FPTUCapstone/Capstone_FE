import type { Metadata } from 'next';
import { PartnerRouteGuard } from '@/features/auth/routing/PartnerRouteGuard';
import { OperatorProfilePage } from '@/features/operator/profile/components/OperatorProfilePage';

export const metadata: Metadata = {
  title: 'Hồ sơ doanh nghiệp | Tour Operator Workspace | TripMate',
  description: 'Quản lý thông tin hồ sơ doanh nghiệp lữ hành hiển thị công khai trên TripMate.',
};

export default function PartnerProfilePage() {
  return (
    <PartnerRouteGuard route="profile">
      <OperatorProfilePage />
    </PartnerRouteGuard>
  );
}
