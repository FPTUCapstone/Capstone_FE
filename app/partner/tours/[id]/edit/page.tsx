'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { PartnerWorkspaceLayout } from '@/features/operator/common/components/PartnerWorkspaceLayout';
import { PageContentContainer } from '@/features/operator/common/components/PageContentContainer';
import { UpdateTourPackageView } from '@/features/operator/tours/components/UpdateTourPackageView';
import { isTourDemoAllowedInCurrentEnv } from '@/features/operator/tours/data/operatorTourDemoFixtures';
import { OPERATOR_TOUR_ROUTES, withTourDemoMode } from '@/features/operator/tours/routes';
import {
  getOperatorTourById,
  OperatorTourApiError,
} from '@/features/operator/tours/services/operatorTourService';
import {
  OPERATOR_TOUR_MESSAGES,
  type TourPackageDto,
} from '@/features/operator/tours/types/tourLifecycle';

function EditTourContent() {
  const params = useParams<{ id: string }>();
  const id = params?.id || '';
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemoParam = searchParams.get('demo') === '1';
  const isDemo = isDemoParam && isTourDemoAllowedInCurrentEnv();

  const [tour, setTour] = useState<TourPackageDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  const reload = useCallback(() => {
    setReloadNonce((n) => n + 1);
  }, []);

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
          } else {
            setTour(null);
            setErrorMessage(res.message || 'Không tìm thấy gói tour.');
          }
        }
      } catch (err) {
        if (isMounted) {
          if (err instanceof OperatorTourApiError && err.status === 401 && !isDemo) {
            router.replace(`/sign-in?returnUrl=${encodeURIComponent(OPERATOR_TOUR_ROUTES.edit(id))}`);
            return;
          }
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
  }, [id, isDemo, reloadNonce, router]);

  return (
    <PartnerWorkspaceLayout activeTab="tours" isDemo={isDemo}>
      <PageContentContainer>
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-xs">
            <span className="material-symbols-outlined animate-spin text-[32px] text-[#174B4A]">
              progress_activity
            </span>
            <p className="mt-2 text-xs font-bold">Đang tải thông tin gói tour...</p>
          </div>
        ) : tour ? (
          <UpdateTourPackageView
            initialTour={tour}
            isDemo={isDemo}
            initialOpenAddDeparture={searchParams.get('action') === 'add-departure'}
          />
        ) : !isDemo ? (
          <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-rose-900">
            <div className="flex items-start gap-4">
              <span className="material-symbols-outlined text-[32px] text-rose-600" aria-hidden="true">
                error
              </span>
              <div>
                <h2 className="text-lg font-bold">
                  Không thể tải thông tin gói tour
                </h2>
                <p className="mt-2 text-sm text-rose-800">
                  {errorMessage || 'Không tìm thấy gói tour hoặc bạn không có quyền truy cập gói tour này.'}
                </p>
                <p className="mt-1 text-xs text-rose-700">
                  Mã gói tour: <span className="font-mono font-bold">{id}</span>
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={reload}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#174B4A] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#103B39]"
                  >
                    <span className="material-symbols-outlined text-sm" aria-hidden="true">refresh</span>
                    Thử lại
                  </button>
                  <Link
                    href={OPERATOR_TOUR_ROUTES.list}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 transition hover:bg-slate-50"
                  >
                    <span className="material-symbols-outlined text-sm" aria-hidden="true">arrow_back</span>
                    Quay lại danh sách tour
                  </Link>
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
                href={withTourDemoMode(OPERATOR_TOUR_ROUTES.list, isDemo)}
                className="inline-flex items-center gap-2 rounded-xl bg-red-800 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-red-700"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Quay lại danh sách tour
              </Link>
            </div>
          </div>
        )}
      </PageContentContainer>
    </PartnerWorkspaceLayout>
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
