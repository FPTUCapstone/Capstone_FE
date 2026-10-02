'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { PublicNavigation } from '@/components/navigation/PublicNavigation';
import { useWebSession } from '@/features/auth/session/useWebSession';
import { getTourDetail, isTourDemoAllowedInCurrentEnv } from '@/features/public/tours/services/tourApi';
import type { TourDetailDto } from '@/features/public/tours/types/tour';
import { ROUTES } from '@/lib/routes';
import { TourBookingView } from './TourBookingView';

interface TourBookingPageProps {
  id: string;
}

export function TourBookingPage({ id }: TourBookingPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, context } = useWebSession();

  const isDemo =
    searchParams.get('demo') === '1' && isTourDemoAllowedInCurrentEnv();
  const scheduleId = searchParams.get('scheduleId') || undefined;

  const [tour, setTour] = useState<TourDetailDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Authentication & Role Redirection
  useEffect(() => {
    if (status === 'restoring') return;

    // Allow unauthenticated preview ONLY when demo mode is active in non-production
    if (status === 'unauthenticated' && !isDemo) {
      const returnUrl = `/tours/${id}/book${
        searchParams.toString() ? `?${searchParams.toString()}` : ''
      }`;
      router.replace(`${ROUTES.signIn}?returnUrl=${encodeURIComponent(returnUrl)}`);
    }
  }, [status, isDemo, id, searchParams, router]);

  // Load Tour details
  useEffect(() => {
    let isMounted = true;

    getTourDetail(id, { allowDemo: isDemo })
      .then((data) => {
        if (!isMounted) return;
        setTour(data);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Không thể tải chi tiết gói tour.';
        setErrorNotice(msg);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id, isDemo]);

  if (status === 'restoring' || loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f8fafc]">
        <PublicNavigation />
        <main className="flex flex-1 items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3">
            <div
              className="h-9 w-9 animate-spin rounded-full border-3 border-[#007d6e] border-t-transparent"
              aria-hidden="true"
            />
            <p className="text-xs font-semibold text-slate-500">
              Đang tải dữ liệu đặt tour…
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Role Access Guard: Tour Operator or Admin
  if (status === 'authenticated' && context && context.role !== 'Traveler') {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <PublicNavigation />
        <main className="mx-auto max-w-xl px-4 py-16 text-center">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 mb-4">
              <span className="material-symbols-outlined text-3xl">block</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              Tài khoản không thuộc phạm vi Đặt tour
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Tính năng Đặt tour và Vé điện tử (UC-27, UC-28, UC-29) chỉ dành riêng cho tài khoản
              Du khách (Traveler). Bạn hiện đang đăng nhập với vai trò{' '}
              <strong className="text-slate-900">{context.role}</strong>.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={
                  context.role === 'TourOperator'
                    ? ROUTES.partner.dashboard
                    : ROUTES.admin.dashboard
                }
                className="rounded-xl bg-[#007d6e] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#006b5f] transition"
              >
                Về Không gian làm việc ({context.role})
              </Link>
              <Link
                href={ROUTES.home}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                Về Trang chủ
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Pending BE or Tour Error
  if (errorNotice || !tour) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <PublicNavigation />
        <main className="mx-auto max-w-2xl px-4 py-16 text-center">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 mb-4">
              <span className="material-symbols-outlined text-3xl">pending_actions</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              Dịch vụ đang chờ hoàn tất kết nối API
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              {errorNotice || 'Gói tour chưa khả dụng hoặc đang cập nhật dữ liệu từ máy chủ.'}
            </p>

            {process.env.NODE_ENV !== 'production' && !isDemo && (
              <div className="mb-6 rounded-2xl bg-teal-50 border border-teal-200 p-4 text-xs text-teal-900 text-left">
                <p className="font-bold mb-1">Kiểm thử giao diện (Demo Preview):</p>
                <p className="text-teal-700 text-[11px] mb-3">
                  Bạn có thể kích hoạt chế độ xem trước dữ liệu mẫu đã được phê duyệt bằng cách nhấn vào nút bên dưới:
                </p>
                <Link
                  href={`/tours/${id}/book?demo=1${scheduleId ? `&scheduleId=${scheduleId}` : ''}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#007d6e] px-4 py-2 text-xs font-bold text-white hover:bg-[#006b5f] transition"
                >
                  <span className="material-symbols-outlined text-sm">science</span>
                  <span>Mở giao diện đặt tour Demo (?demo=1)</span>
                </Link>
              </div>
            )}

            <div className="flex justify-center gap-3">
              <Link
                href={ROUTES.tours}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                Quay lại danh sách tour
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <PublicNavigation />
      <main className="pb-16 pt-4">
        <TourBookingView
          tour={tour}
          initialScheduleId={scheduleId}
          isDemo={isDemo}
          userContext={context}
        />
      </main>
    </div>
  );
}
