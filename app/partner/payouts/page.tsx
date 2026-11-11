import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PartnerPayoutClient } from '@/features/operator/finance/components/payouts/PartnerPayoutClient';
import { PartnerRouteGuard } from '@/features/operator/access/PartnerRouteGuard';

export const metadata: Metadata = {
  title: 'Thanh toán & Đối soát | Đối tác | TripMate',
  description:
    'Theo dõi chu kỳ đối soát đã đóng, tài khoản thụ hưởng và lịch sử yêu cầu rút tiền thanh toán.',
};

export default function PartnerPayoutsPage() {
  return (
    <PartnerRouteGuard route="dashboard">
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#F8FAFC] p-8 text-center text-xs text-slate-500">
            Đang tải dữ liệu thanh toán đối soát...
          </div>
        }
      >
        <PartnerPayoutClient />
      </Suspense>
    </PartnerRouteGuard>
  );
}
