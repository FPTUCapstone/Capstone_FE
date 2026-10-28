'use client';

import Link from 'next/link';
import { useWebSession } from '@/features/auth/session/useWebSession';
import { PartnerWorkspaceLayout } from '@/features/operator/common/components/PartnerWorkspaceLayout';
import { PageContentContainer } from '@/features/operator/common/components/PageContentContainer';

const actions = [
  { href: '/partner/tours/new', icon: 'add_circle', title: 'Tạo gói tour', description: 'Tạo và gửi một gói tour mới để xét duyệt.', color: 'bg-emerald-600' },
  { href: '/partner/bookings', icon: 'receipt_long', title: 'Quản lý đơn đặt chỗ', description: 'Theo dõi khách hàng và xử lý các yêu cầu đơn.', color: 'bg-blue-600' },
  { href: '/partner/revenue', icon: 'monitoring', title: 'Xem doanh thu', description: 'Theo dõi thanh toán thành công, hoàn tiền và commission.', color: 'bg-violet-600' },
];

export function OperatorDashboard() {
  const { context } = useWebSession();
  const name = context?.fullName || 'Đối tác lữ hành';

  return (
    <PartnerWorkspaceLayout activeTab="dashboard" operatorName={name}>
      <PageContentContainer>
        <header className="rounded-3xl bg-[#00152A] px-6 py-8 text-white shadow-sm sm:px-8">
          <p className="text-sm font-medium text-emerald-300">TripMate Partner Workspace</p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Chào {name}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            Quản lý tour, đơn đặt chỗ và tình hình doanh thu của doanh nghiệp tại một nơi.
          </p>
        </header>

        <section aria-label="Tác vụ nhanh">
          <h2 className="mb-3 text-base font-bold text-slate-900">Tác vụ nhanh</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {actions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-white ${action.color}`}>
                  <span className="material-symbols-outlined">{action.icon}</span>
                </span>
                <h3 className="mt-4 font-bold text-slate-900">{action.title}</h3>
                <p className="mt-1 text-sm leading-5 text-slate-500">{action.description}</p>
                <span className="mt-4 inline-flex text-sm font-semibold text-[#006B5F]">
                  Mở <span className="material-symbols-outlined ml-1 text-base">arrow_forward</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3" aria-label="Tổng quan vận hành">
          {[
            ['Gói tour', 'Quản lý danh sách tour, trạng thái xét duyệt và lịch khởi hành.', '/partner/tours', 'tour'],
            ['Mã giảm giá', 'Tạo và quản lý ưu đãi dành cho khách hàng.', '/partner/coupons', 'confirmation_number'],
            ['Hồ sơ doanh nghiệp', 'Cập nhật thông tin hiển thị của doanh nghiệp.', '/partner/profile', 'domain'],
          ].map(([title, desc, href, icon]) => (
            <Link
              key={href}
              href={href}
              className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-[#006B5F]/40 shadow-xs"
            >
              <span className="material-symbols-outlined text-[#006B5F]">{icon}</span>
              <span>
                <span className="block font-bold text-slate-900">{title}</span>
                <span className="mt-1 block text-sm leading-5 text-slate-500">{desc}</span>
              </span>
            </Link>
          ))}
        </section>
      </PageContentContainer>
    </PartnerWorkspaceLayout>
  );
}
