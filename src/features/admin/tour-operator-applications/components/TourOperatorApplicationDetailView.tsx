'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  ApproveOperatorApplicationResponseDto,
  TourOperatorApplicationDetailDto,
} from '@/types/tour-operator-application';
import { ROUTES } from '@/lib/routes';
import { fetchOperatorApplicationDetail } from '../api/tourOperatorApplicationApi';
import { tourOperatorApplicationEn as copy } from '../resources/en';
import { ApplicationErrorView, describeApplicationError } from '../utils/applicationErrors';
import { usableDecisionMessage } from '../utils/decisionMessage';
import { hasUsableBusinessLicense } from '../utils/documents';
import { ApplicationHeader } from './ApplicationHeader';
import { CompanyInfoCard } from './CompanyInfoCard';
import { DocumentsGrid } from './DocumentsGrid';
import { ApproveModal } from './ApproveModal';
import { RejectModal } from './RejectModal';
import { DetailSkeleton } from './DetailSkeleton';

interface TourOperatorApplicationDetailViewProps {
  userId: number;
}

const TOAST_DURATION_MS = 8000;

export function TourOperatorApplicationDetailView({ userId }: TourOperatorApplicationDetailViewProps) {
  const [detail, setDetail] = useState<TourOperatorApplicationDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApplicationErrorView | null>(null);

  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Set when a decision succeeded and the screen is waiting for the authoritative state.
  const [pendingReconciliation, setPendingReconciliation] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchOperatorApplicationDetail(userId);
        if (!ignore) {
          setDetail(data);
          setPendingReconciliation(null);
        }
      } catch (err) {
        if (!ignore) {
          setDetail(null);
          setError(describeApplicationError(err, userId));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, [userId, reloadToken]);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  function showToast(message: string) {
    setToastMessage(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(null), TOAST_DURATION_MS);
  }

  /** A decision succeeded on the Backend: reload instead of inferring the new state locally. */
  function reconcileAfterDecision(message: string) {
    setPendingReconciliation(message);
    showToast(message);
    setReloadToken((token) => token + 1);
  }

  function handleApproveSuccess(result: ApproveOperatorApplicationResponseDto) {
    setIsApproveOpen(false);
    reconcileAfterDecision(
      usableDecisionMessage(result.message) ?? copy.approve.successFallback(detail?.companyName ?? ''),
    );
  }

  function handleRejectSuccess(message: string) {
    setIsRejectOpen(false);
    reconcileAfterDecision(message);
  }

  function retry() {
    setReloadToken((token) => token + 1);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <DetailSkeleton />
      </div>
    );
  }

  if (error && pendingReconciliation) {
    return (
      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        <section
          className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-amber-950 shadow-sm sm:p-8"
          aria-labelledby="application-reconcile-title"
        >
          <h2 id="application-reconcile-title" className="mb-2 text-xl font-bold">
            {copy.reconcile.title}
          </h2>
          <p className="mb-2 text-sm font-semibold">{pendingReconciliation}</p>
          <p className="mb-6 max-w-2xl text-sm">{copy.reconcile.body}</p>
          <button
            type="button"
            onClick={retry}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-amber-400 bg-white px-4 py-2 text-sm font-bold text-amber-900 shadow-sm transition hover:bg-amber-100"
          >
            {copy.reconcile.retry}
          </button>
        </section>
      </div>
    );
  }

  if (error || !detail) {
    const canRetry = error?.kind !== 'sessionExpired' && error?.kind !== 'forbidden';
    const loginHref = `${ROUTES.admin.login}?returnUrl=${encodeURIComponent(`/admin/tour-operator-applications/${userId}`)}`;

    return (
      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-900 shadow-sm sm:p-8">
          <div className="text-3xl mb-2" aria-hidden="true">⚠️</div>
          <h2 className="text-xl font-bold mb-2 text-rose-900">{copy.errors.loadTitle}</h2>
          <p className="text-sm text-rose-700 max-w-md mx-auto mb-6">{error?.message ?? copy.errors.unexpected}</p>
          {error?.kind === 'sessionExpired' && (
            <Link
              href={loginHref}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white border border-rose-300 px-4 py-2 text-sm font-bold text-rose-800 shadow-sm hover:bg-rose-100 transition"
            >
              {copy.errors.signIn}
            </Link>
          )}
          {canRetry && (
            <button
              type="button"
              onClick={retry}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white border border-rose-300 px-4 py-2 text-sm font-bold text-rose-800 shadow-sm hover:bg-rose-100 transition"
            >
              <span aria-hidden="true">🔄</span> {copy.errors.retry}
            </button>
          )}
        </div>
      </div>
    );
  }

  const isMissingMandatory = !hasUsableBusinessLicense(detail.documents);

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 animate-fade-in">
      {toastMessage && (
        <div
          className="fixed bottom-6 left-4 right-4 z-50 flex items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-900 p-4 text-sm font-bold text-white shadow-2xl backdrop-blur-md sm:left-auto sm:right-6"
          role="status"
          aria-live="polite"
        >
          <span className="text-xl" aria-hidden="true">✅</span>
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            aria-label={copy.toast.dismiss}
            className="ml-auto text-emerald-200 hover:text-white"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
      )}

      <ApplicationHeader
        userId={detail.userId}
        companyName={detail.companyName}
        applicationStatus={detail.applicationStatus}
        isMissingMandatory={isMissingMandatory}
        onOpenApprove={() => setIsApproveOpen(true)}
        onOpenReject={() => setIsRejectOpen(true)}
      />

      <CompanyInfoCard detail={detail} />

      <DocumentsGrid documents={detail.documents} />

      <ApproveModal
        isOpen={isApproveOpen}
        userId={detail.userId}
        companyName={detail.companyName}
        isMissingMandatory={isMissingMandatory}
        onClose={() => setIsApproveOpen(false)}
        onSuccess={handleApproveSuccess}
      />

      <RejectModal
        isOpen={isRejectOpen}
        userId={detail.userId}
        companyName={detail.companyName}
        onClose={() => setIsRejectOpen(false)}
        onSuccess={handleRejectSuccess}
      />
    </div>
  );
}
