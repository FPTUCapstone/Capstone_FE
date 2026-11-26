'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useWebSession } from '@/features/auth/session/useWebSession';
import { ROUTES } from '@/lib/routes';
import { CreateSchedulingRequestForm } from './CreateSchedulingRequestForm';

export function CreateSchedulingRequestPage({ stayPoiId }: { stayPoiId?: number } = {}) {
  const router = useRouter();
  const { status, context } = useWebSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      const returnUrl = stayPoiId ? `${ROUTES.plan}?stayPoiId=${stayPoiId}` : ROUTES.plan;
      router.replace(`${ROUTES.signIn}?returnUrl=${encodeURIComponent(returnUrl)}`);
    } else if (status === 'authenticated' && context?.role === 'TourOperator') {
      router.replace(ROUTES.partner.dashboard);
    } else if (status === 'authenticated' && context?.role === 'Administrator') {
      router.replace(ROUTES.admin.dashboard);
    }
  }, [status, context, router, stayPoiId]);

  if (status === 'restoring') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F5EF]">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-8 w-8 animate-spin rounded-full border-3 border-[#174B4A] border-t-transparent"
            aria-hidden="true"
          />
          <p className="text-xs font-semibold text-[#5B6E69]">Đang tải kế hoạch du lịch…</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !context || context.role !== 'Traveler') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#1C2928]">

      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="mb-3 flex items-center gap-1.5 text-xs font-medium text-[#5B6E69]"
          >
            <Link href={ROUTES.home} className="transition hover:text-[#174B4A]">
              Trang chủ
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-[#1C2928]">Lập lịch trình</span>
          </nav>

          {/* Compact Page Header */}
          <div className="mb-6 text-center sm:text-left">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#1C2928] sm:text-3xl">
              Lên lịch trình chuyến đi của bạn
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-[#5B6E69]">
              Chọn điểm đến, thời gian và phương tiện — TripMate sẽ tự động sắp xếp cung đường hợp lý nhất.
            </p>
          </div>

          {/* Form */}
          <CreateSchedulingRequestForm
            userId={context.userId}
            stayPoiId={stayPoiId}
            onSuccess={(itinerary) => router.push(ROUTES.itinerary(itinerary.itineraryId))}
          />
        </div>
      </main>

      <footer className="mt-16 border-t border-[#DCE2DD] bg-white/80 py-8 text-center text-xs text-[#5B6E69]">
        <div className="mx-auto max-w-7xl px-4">
          <p>© 2026 TripMate AI Travel Planner. Nền tảng du lịch thông minh Việt Nam.</p>
        </div>
      </footer>
    </div>
  );
}
