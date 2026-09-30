import type { Metadata } from 'next';
import Link from 'next/link';

import { PublicNavigation } from '@/components/navigation/PublicNavigation';
import { AccountWorkspaceNav } from '@/features/account/common/AccountWorkspaceNav';
import { ROUTES } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Sở thích du lịch | TripMate',
  description: 'Quản lý tùy chọn sở thích du lịch và danh mục đề xuất TripMate.',
};

export default function AccountPreferencesPage() {
  return (
    <div className="min-h-screen bg-[#F3F6F7] text-[#00152A]" lang="vi">
      <PublicNavigation />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs font-semibold text-[#59616B]">
          <Link href={ROUTES.home} className="hover:text-[#006B5F] hover:underline">
            Trang chủ
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-[#00152A]">Sở thích du lịch</span>
        </nav>

        <AccountWorkspaceNav activeTab="preferences" />

        <section className="rounded-2xl border border-[#D8E1E4] bg-white p-6 shadow-xs sm:p-8">
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E6F4F1] text-[#006B5F]">
              <span className="material-symbols-outlined text-3xl" aria-hidden="true">
                tune
              </span>
            </div>
            <h1 className="mt-4 text-xl font-black text-[#00152A]">Sở thích du lịch (UC-09)</h1>
            <p className="mt-2 max-w-md text-sm text-[#59616B]">
              Tính năng chọn tag sở thích, thể loại du lịch và tùy chỉnh thuật toán đề xuất CSP đang được phát triển theo lộ trình hành trình người dùng.
            </p>
            <div className="mt-6 flex gap-3">
              <Link
                href={ROUTES.account.profile}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              >
                ← Quay lại Hồ sơ cá nhân
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
