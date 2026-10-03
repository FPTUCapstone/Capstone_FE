import type { Metadata } from 'next';
import { CreateSchedulingRequestPage } from '@/features/scheduling/components/CreateSchedulingRequestPage';

export const metadata: Metadata = {
  title: 'Lập lịch trình du lịch thông minh | TripMate',
  description:
    'Lập lịch trình tự động tối ưu hóa theo thời gian thực với thuật toán CSP và sở thích cá nhân trên TripMate.',
};

export default function PlanPage() {
  return <CreateSchedulingRequestPage />;
}
