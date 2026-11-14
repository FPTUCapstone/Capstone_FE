import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { CommissionStatementsView } from '@/features/hotel-service-provider/components/w105/CommissionStatementsView';

export const metadata: Metadata = {
  title: 'Bảng kê hoa hồng | TripMate Partner',
  description: 'Theo dõi quyết toán hoa hồng hàng tháng, kiểm tra doanh thu lưu trú hoàn thành và thông báo mã giao dịch chuyển khoản.',
};

export default function ProviderStatementsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-[#5B6E69]">
          <span className="material-symbols-outlined text-[28px] animate-spin text-[#174B4A] mb-2 block mx-auto">
            progress_activity
          </span>
          Đang tải bảng kê hoa hồng...
        </div>
      }
    >
      <CommissionStatementsView />
    </Suspense>
  );
}
