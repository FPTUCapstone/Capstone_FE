'use client';

import Link from 'next/link';
import { PublicNavigation } from '@/components/navigation/PublicNavigation';
import { useWebSession } from '@/features/auth/session/useWebSession';
import { ROUTES } from '@/lib/routes';
import { CreateSchedulingRequestForm } from './CreateSchedulingRequestForm';

export function CreateSchedulingRequestPage() {
  const { status, context } = useWebSession();

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <PublicNavigation />

      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex items-center gap-2 text-xs text-slate-500"
          >
            <Link href={ROUTES.home} className="hover:text-[#007d6e] transition">
              Trang chủ
            </Link>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="font-semibold text-slate-800">Lập lịch trình thông minh</span>
          </nav>

          {/* Page Header */}
          <div className="mb-8 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold text-[#007d6e] shadow-2xs">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              Thuật toán CSP & Tối ưu hóa thời gian thực
            </div>
            <h1 className="mt-2.5 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
              Lập Lịch Trình Du Lịch Tối Ưu
            </h1>
            <p className="mt-2 max-w-2xl text-xs text-slate-600 sm:text-sm">
              Nhập điểm xuất phát, thời gian dự kiến và sở thích của bạn. Thuật toán CSP của TripMate
              sẽ tự động tính toán cung đường ngắn nhất, thời gian di chuyển và giờ mở cửa để tạo nên
              chuyến đi hoàn hảo.
            </p>
          </div>

          {/* Guest Sign-in Tip Banner if unauthenticated */}
          {status === 'unauthenticated' && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-200 bg-sky-50/70 p-4 text-xs text-sky-900 shadow-xs sm:text-sm">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-lg text-sky-600">
                  info
                </span>
                <span>
                  Bạn đang sử dụng chế độ Khách. Đăng nhập để tự động áp dụng <strong>Sở thích du lịch</strong> và lưu lịch trình vào tài khoản!
                </span>
              </div>
              <Link
                href={`${ROUTES.signIn}?returnUrl=${encodeURIComponent(ROUTES.plan)}`}
                className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-3 py-1.5 font-bold text-white transition hover:bg-sky-700"
              >
                Đăng nhập ngay
              </Link>
            </div>
          )}

          {/* Form */}
          <CreateSchedulingRequestForm userId={context?.userId} />
        </div>
      </main>

      <footer className="mt-16 border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4">
          <p>© 2026 TripMate AI Travel Planner. Nền tảng du lịch thông minh Việt Nam.</p>
        </div>
      </footer>
    </div>
  );
}
