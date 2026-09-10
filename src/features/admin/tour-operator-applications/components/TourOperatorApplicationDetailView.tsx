'use client';

import { useEffect, useState } from 'react';
import {
  ApproveOperatorApplicationResponseDto,
  RejectOperatorApplicationResponseDto,
  TourOperatorApplicationDetailDto,
} from '@/types/tour-operator-application';
import { fetchOperatorApplicationDetail, ApiError } from '../api/tourOperatorApplicationApi';
import { ApplicationHeader } from './ApplicationHeader';
import { CompanyInfoCard } from './CompanyInfoCard';
import { DocumentsGrid } from './DocumentsGrid';
import { ApproveModal } from './ApproveModal';
import { RejectModal } from './RejectModal';
import { DetailSkeleton } from './DetailSkeleton';

interface TourOperatorApplicationDetailViewProps {
  userId: number;
}

export function TourOperatorApplicationDetailView({ userId }: TourOperatorApplicationDetailViewProps) {
  const [detail, setDetail] = useState<TourOperatorApplicationDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchOperatorApplicationDetail(userId);
        if (!ignore) {
          setDetail(data);
        }
      } catch (err) {
        if (!ignore) {
          if (err instanceof ApiError) {
            if (err.statusCode === 404) {
              setError(`Tour Operator application #${userId} was not found.`);
            } else if (err.statusCode === 401 || err.statusCode === 403) {
              setError('Administrator authorization is required to view this application.');
            } else {
              setError(err.message);
            }
          } else {
            setError('Failed to connect to backend server. Make sure server is running on http://localhost:5021.');
          }
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

  function handleApproveSuccess(result: ApproveOperatorApplicationResponseDto) {
    setIsApproveOpen(false);
    setToastMessage(result.message || `Tour Operator "${detail?.companyName}" approved. Account activated. (MSG114)`);

    if (detail) {
      setDetail({
        ...detail,
        accountStatus: result.accountStatus,
        applicationStatus: 'Approved',
        reviewedBy: result.reviewedBy,
        reviewedAt: result.reviewedAt,
        documents: detail.documents.map((d) => ({
          ...d,
          status: d.status === 'Submitted' ? 'Approved' : d.status,
        })),
      });
    }

    setTimeout(() => setToastMessage(null), 8000);
  }

  function handleRejectSuccess(result: RejectOperatorApplicationResponseDto) {
    setIsRejectOpen(false);
    setToastMessage(result.message || `Application rejected for "${detail?.companyName}". Notification sent to operator. (MSG116)`);

    if (detail) {
      setDetail({
        ...detail,
        accountStatus: result.accountStatus || 'Rejected',
        applicationStatus: 'Rejected',
        rejectionReason: result.rejectionReason,
        reviewedBy: result.reviewedBy,
        reviewedAt: result.reviewedAt,
        documents: detail.documents.map((d) => ({
          ...d,
          status: d.status === 'Submitted' ? 'Rejected' : d.status,
        })),
      });
    }

    setTimeout(() => setToastMessage(null), 8000);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <DetailSkeleton />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-900 shadow-sm">
          <div className="text-3xl mb-2">⚠️</div>
          <h3 className="text-xl font-bold mb-2 text-rose-900">Application Load Error</h3>
          <p className="text-sm text-rose-700 max-w-md mx-auto mb-6">{error}</p>
          <button
            type="button"
            onClick={() => setReloadToken((t) => t + 1)}
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-rose-300 px-4 py-2 text-sm font-bold text-rose-800 shadow-sm hover:bg-rose-100 transition"
          >
            🔄 Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const hasBusinessLicense = detail.documents.some(
    (d) => d.documentType === 'BusinessLicense' && d.status !== 'Rejected'
  );
  const isMissingMandatory = !hasBusinessLicense;

  return (
    <div className="mx-auto max-w-6xl p-6 animate-fadeIn">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-900 p-4 text-sm font-bold text-white shadow-2xl backdrop-blur-md">
          <span className="text-xl">✅</span>
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-4 text-emerald-200 hover:text-white"
          >
            ✕
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
