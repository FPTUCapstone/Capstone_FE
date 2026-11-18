'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { OperatorTourApiError } from '@/features/operator/tours/services/operatorTourApi';
import { PartnerWorkspaceLayout } from '@/features/operator/common/components/PartnerWorkspaceLayout';
import { PageContentContainer } from '@/features/operator/common/components/PageContentContainer';
import { SubmitTourApprovalView } from '@/features/operator/tours/components/SubmitTourApprovalView';
import { isTourDemoAllowedInCurrentEnv } from '@/features/operator/tours/data/operatorTourDemoFixtures';
import { OPERATOR_TOUR_ROUTES, withTourDemoMode } from '@/features/operator/tours/routes';
import { getOperatorTourById } from '@/features/operator/tours/services/operatorTourService';
import {
  OPERATOR_TOUR_MESSAGES,
  type TourPackageDto,
} from '@/features/operator/tours/types/tourLifecycle';

function SubmitTourContent() {
  const params = useParams<{ id: string }>();
  const id = params?.id || '';
  const { replace } = useRouter();
  const searchParams = useSearchParams();
  const isDemoParam = searchParams.get('demo') === '1';
  const isDemo = isDemoParam && isTourDemoAllowedInCurrentEnv();

  const [tour, setTour] = useState<TourPackageDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      setErrorMessage(null);
      setTour(null);
      try {
        const res = await getOperatorTourById(id, { allowDemo: isDemo });
        if (isMounted) {
          if (res.status === 'SUCCESS' && res.data) {
            setTour(res.data);
          } else if (res.status === 'PENDING_BE_INTEGRATION') {
            setErrorMessage(OPERATOR_TOUR_MESSAGES.PENDING_BE_INTEGRATION);
          } else {
            setErrorMessage(res.message || 'Không tìm thấy gói tour.');
          }
        }
      } catch (err) {
        if (isMounted) {
          const status = err instanceof OperatorTourApiError ? err.status : 0;
          setErrorMessage(status === 401 ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
            : status === 403 ? 'Bạn không có quyền xem hoặc gửi duyệt gói tour này.'
            : status === 404 ? 'Không tìm thấy gói tour hoặc tour không còn khả dụng.'
            : status === 0 ? 'Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử tải lại.'
            : OPERATOR_TOUR_MESSAGES.SYSTEM_FAILURE);
          if (status === 401) replace(`/sign-in?returnUrl=${encodeURIComponent(OPERATOR_TOUR_ROUTES.submit(id))}`);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [id, isDemo, reloadVersion, replace]);

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
          <SubmitTourApprovalView key={`${id}:${isDemo}:${reloadVersion}`} tour={tour} isDemo={isDemo} onReload={() => setReloadVersion((value) => value + 1)} />
        ) : (
          <div role="alert" className="min-w-0 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900 [overflow-wrap:anywhere] sm:p-8">
            <h2 className="text-lg font-bold">Không thể tải gói tour</h2>
            <p className="mt-2 text-sm text-red-800">
              {errorMessage || 'Gói tour với mã trên không tồn tại trong bộ dữ liệu.'}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => setReloadVersion((value) => value + 1)} className="min-h-11 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-xs font-bold focus-visible:ring-2 focus-visible:ring-primary">Thử tải lại</button>
              <Link
                href={withTourDemoMode(OPERATOR_TOUR_ROUTES.list, isDemo)}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-800 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-primary"
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

export default function SubmitTourPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] p-8 text-center text-xs text-slate-500">
          Đang tải...
        </div>
      }
    >
      <SubmitTourContent />
    </Suspense>
  );
}
