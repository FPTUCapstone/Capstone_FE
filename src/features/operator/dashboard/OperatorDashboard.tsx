'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { useWebSession } from '@/features/auth/session/useWebSession';
import { PartnerWorkspaceLayout } from '@/features/operator/common/components/PartnerWorkspaceLayout';
import { PageContentContainer } from '@/features/operator/common/components/PageContentContainer';

const actions = [
  { href: '/partner/tours/new', icon: 'add_circle', title: 'Tạo gói tour', description: 'Tạo và gửi một gói tour mới để xét duyệt.', iconTone: 'bg-[#E8F0EA] text-[#103B39]' },
  { href: '/partner/bookings', icon: 'receipt_long', title: 'Quản lý đơn đặt chỗ', description: 'Theo dõi khách hàng và xử lý các yêu cầu đơn.', iconTone: 'bg-[#E8F0EA] text-[#174B4A]' },
  { href: '/partner/revenue', icon: 'monitoring', title: 'Xem doanh thu', description: 'Theo dõi thanh toán thành công, hoàn tiền và commission.', iconTone: 'bg-[#F6EDE8] text-[#995436]' },
];

export function OperatorDashboard() {
  const { context } = useWebSession();
  const name = context?.fullName || 'Đối tác lữ hành';

  return (
    <PartnerWorkspaceLayout activeTab="dashboard" operatorName={name}>
      <PageContentContainer>
        <PageHeader
          eyebrow="TripMate Partner Workspace"
          title={`Chào ${name}`}
          description="Quản lý tour, đơn đặt chỗ và tình hình doanh thu của doanh nghiệp tại một nơi."
          actions={
            <Link
              href="/partner/tours/new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#103B39] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#174B4A]"
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">add</span>
              <span>Tạo gói tour</span>
            </Link>
          }
        />

        <section aria-label="Tác vụ nhanh">
          <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-[#5B6E69]">Tác vụ nhanh</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {actions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group flex flex-col rounded-2xl border border-[#DCE2DD] bg-white p-5 shadow-xs transition hover:-translate-y-0.5 hover:border-[#174B4A]/40 hover:shadow-sm"
              >
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${action.iconTone}`}>
                  <span className="material-symbols-outlined" aria-hidden="true">{action.icon}</span>
                </span>
                <h3 className="mt-3.5 font-bold text-[#1C2928]">{action.title}</h3>
                <p className="mt-1 text-sm leading-5 text-[#5B6E69]">{action.description}</p>
                <span className="mt-auto pt-3.5 inline-flex items-center text-xs font-bold text-[#174B4A]">
                  Mở <span className="material-symbols-outlined ml-1 text-base transition-transform group-hover:translate-x-0.5" aria-hidden="true">arrow_forward</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section aria-label="Tổng quan vận hành">
          <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-[#5B6E69]">Không gian quản lý</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ['Gói tour', 'Quản lý danh sách tour, trạng thái xét duyệt và lịch khởi hành.', '/partner/tours', 'tour'],
              ['Mã giảm giá', 'Tạo và quản lý ưu đãi dành cho khách hàng.', '/partner/coupons', 'confirmation_number'],
              ['Hồ sơ doanh nghiệp', 'Cập nhật thông tin hiển thị của doanh nghiệp.', '/partner/profile', 'domain'],
            ].map(([title, desc, href, icon]) => (
              <Link
                key={href}
                href={href}
                className="flex items-start gap-3.5 rounded-2xl border border-[#DCE2DD] bg-white p-5 text-left shadow-xs transition hover:border-[#174B4A]/40 hover:shadow-sm"
              >
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F7F5EF] text-[#174B4A]">
                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{icon}</span>
                </span>
                <span className="min-w-0">
                  <span className="block font-bold text-[#1C2928]">{title}</span>
                  <span className="mt-1 block text-xs leading-5 text-[#5B6E69]">{desc}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </PageContentContainer>
    </PartnerWorkspaceLayout>
  );
}
