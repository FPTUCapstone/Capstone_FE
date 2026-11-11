import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PartnerRevenueClient } from '@/features/operator/finance/components/revenue/PartnerRevenueClient';
import { PartnerRouteGuard } from '@/features/operator/access/PartnerRouteGuard';

export const metadata: Metadata = {
  title: 'Doanh thu & Báo cáo | Đối tác | TripMate',
  description:
    'Theo dõi doanh thu, hoa hồng nền tảng, hoàn tiền và thu nhập thực nhận cho các gói tour.',
};

export default function PartnerRevenuePage() {
  return (
    <PartnerRouteGuard route="dashboard">
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#F8FAFC] p-8 text-center text-xs text-slate-500">
            Đang tải dữ liệu doanh thu...
          </div>
        }
      >
        <PartnerRevenueClient />
      </Suspense>
    </PartnerRouteGuard>
  );
}
