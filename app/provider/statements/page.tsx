import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { CommissionStatementsView } from '@/features/hotel-service-provider/components/w105/CommissionStatementsView';

export const metadata: Metadata = {
  title: 'Bảng kê hoa hồng | TripMate Partner',
  description: 'Theo dõi quyết toán hoa hồng hàng tháng, kiểm tra doanh thu lưu trú hoàn thành và thông báo mã giao dịch chuyển khoản.',
};

export default function ProviderStatementsPage() {
  return (
    <div className="space-y-5">
      <div
        role="status"
        className="flex items-start gap-2.5 rounded-xl border border-[#F2D4BE] bg-[#FFF8F2] px-4 py-3 text-xs text-[#854629]"
      >
        <span className="material-symbols-outlined mt-0.5 shrink-0 text-[18px] text-[#B96D4C]" aria-hidden="true">
          info
        </span>
        <p className="leading-relaxed">
          Bảng kê hoa hồng đang chờ tích hợp Backend đầy đủ. Khi máy chủ chưa phản hồi dữ liệu thực, màn hình hiển thị dữ liệu mô phỏng để đối chiếu giao diện.
        </p>
      </div>
      <Suspense
        fallback={
          <div className="rounded-2xl border border-[#DCE2DD] bg-white p-12 text-center text-xs text-[#5B6E69] shadow-xs">
            <span className="material-symbols-outlined mx-auto mb-2 block animate-spin text-[28px] text-[#174B4A]">
              progress_activity
            </span>
            Đang tải bảng kê hoa hồng...
          </div>
        }
      >
        <CommissionStatementsView />
      </Suspense>
    </div>
  );
}
