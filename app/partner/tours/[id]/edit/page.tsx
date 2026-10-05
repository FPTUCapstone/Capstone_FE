'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { OperatorTourNav } from '@/features/operator/tours/components/OperatorTourNav';
import { UpdateTourPackageView } from '@/features/operator/tours/components/UpdateTourPackageView';
import { isTourDemoAllowedInCurrentEnv } from '@/features/operator/tours/data/operatorTourDemoFixtures';
import { OPERATOR_TOUR_ROUTES } from '@/features/operator/tours/routes';
import { getOperatorTourById } from '@/features/operator/tours/services/operatorTourService';
import {
  OPERATOR_TOUR_MESSAGES,
  type TourPackageDto,
} from '@/features/operator/tours/types/tourLifecycle';

function EditTourContent() {
  const params = useParams<{ id: string }>();
  const id = params?.id || '';
  const searchParams = useSearchParams();
  const isDemoParam = searchParams.get('demo') === '1';
  const isDemo = isDemoParam && isTourDemoAllowedInCurrentEnv();

  const [tour, setTour] = useState<TourPackageDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      setErrorMessage(null);
      try {
        const res = await getOperatorTourById(id, { allowDemo: isDemo });
        if (isMounted) {
          if (res.status === 'SUCCESS' && res.data) {
            setTour(res.data);
          } else if (res.status === 'PENDING_BE_INTEGRATION') {
            setTour(null);
          } else {
            setErrorMessage(res.message || 'Không tìm thấy gói tour.');
          }
        }
      } catch (err) {
        if (isMounted) {
          setErrorMessage(
            err instanceof Error ? err.message : OPERATOR_TOUR_MESSAGES.SYSTEM_FAILURE
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [id, isDemo]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-8 lg:flex-row">
          <OperatorTourNav activeTab="tours" isDemo={isDemo} />
          <main className="flex-1 min-w-0">
            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
                <span className="material-symbols-outlined animate-spin text-[32px] text-[#006B5F]">
                  progress_activity
                </span>
                <p className="mt-2 text-xs font-bold">Đang tải thông tin gói tour...</p>
              </div>
            ) : tour ? (
              <UpdateTourPackageView initialTour={tour} isDemo={isDemo} />
            ) : !isDemo ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-amber-900">
                <div className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-[32px] text-amber-600">
                    engineering
                  </span>
                  <div>
                    <h2 className="text-lg font-bold">
                      Chức năng chỉnh sửa gói tour (UC-36) đang chờ tích hợp Backend
                    </h2>
                    <p className="mt-2 text-sm text-amber-800">
                      {OPERATOR_TOUR_MESSAGES.PENDING_BE_INTEGRATION}
                    </p>
                    <p className="mt-1 text-xs text-amber-700">
                      Mã gói tour yêu cầu: <span className="font-mono font-bold">{id}</span>
                    </p>
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <Link
                        href={OPERATOR_TOUR_ROUTES.list}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800"
                      >
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        Quay lại danh sách tour
                      </Link>
                      {isTourDemoAllowedInCurrentEnv() && (
                        <Link
                          href={`/partner/tours/${id}/edit?demo=1`}
                          className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-xs font-bold text-amber-900 transition hover:bg-amber-100"
                        >
                          <span className="material-symbols-outlined text-sm">science</span>
                          Xem giao diện mẫu (Demo Mode)
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-red-900">
                <h2 className="text-lg font-bold">Không tìm thấy gói tour</h2>
                <p className="mt-2 text-sm text-red-800">
                  {errorMessage || 'Gói tour với mã trên không tồn tại trong bộ dữ liệu.'}
                </p>
                <div className="mt-6">
                  <Link
                    href={`${OPERATOR_TOUR_ROUTES.list}?demo=1`}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-800 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-red-700"
                  >
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    Quay lại danh sách tour
                  </Link>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function EditTourPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] p-8 text-center text-xs text-slate-500">
          Đang tải...
        </div>
      }
    >
      <EditTourContent />
    </Suspense>
  );
}
