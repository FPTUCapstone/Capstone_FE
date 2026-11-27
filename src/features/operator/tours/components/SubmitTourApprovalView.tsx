'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import { useRouter } from 'next/navigation';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { OperatorTourApiError } from '../services/operatorTourApi';
import { OPERATOR_TOUR_ROUTES, withTourDemoMode } from '../routes';
import { OperatorTourStatusBadge } from './OperatorTourStatusBadge';
import {
  evaluateTourCompleteness,
  submitTourForApproval,
} from '../services/operatorTourService';
import {
  OPERATOR_TOUR_MESSAGES,
  type TourPackageDto,
} from '../types/tourLifecycle';

interface SubmitTourApprovalViewProps {
  tour: TourPackageDto;
  isDemo?: boolean;
  onReload?: () => void;
  initialShowConfirmModal?: boolean;
  initialSuccessMessage?: string | null;
}

export function SubmitTourApprovalView({
  tour: initialTour,
  isDemo = false,
  onReload,
  initialShowConfirmModal = false,
  initialSuccessMessage = null,
}: SubmitTourApprovalViewProps) {
  const router = useRouter();
  const [tour, setTour] = useState(initialTour);
  const completeness = evaluateTourCompleteness(tour);
  const isSubmittableStatus = tour.status === 'Draft' || tour.status === 'Rejected';

  let nonSubmittableReason = '';
  if (tour.status === 'Pending') {
    nonSubmittableReason = 'Gói tour đã ở trạng thái chờ duyệt.';
  } else if (tour.status === 'Approved') {
    nonSubmittableReason = 'Gói tour đã được phê duyệt. Vui lòng tạo phiên bản nháp mới nếu muốn chỉnh sửa.';
  } else if (tour.status === 'Published') {
    nonSubmittableReason = 'Gói tour đã được xuất bản. Thay đổi cần được lưu thành phiên bản mới.';
  } else if (!isSubmittableStatus) {
    nonSubmittableReason = 'Chỉ gói tour ở trạng thái Bản nháp hoặc Bị từ chối mới có thể gửi xét duyệt.';
  }

  const [reviewerNote, setReviewerNote] = useState(initialTour.submissionNote ?? '');
  const [showConfirmModal, setShowConfirmModal] = useState(initialShowConfirmModal);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(initialSuccessMessage);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadRequired, setReloadRequired] = useState(false);
  const requestLock = useRef(false);
  const mounted = useRef(false);
  const navigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locked = submitting || !isSubmittableStatus || reloadRequired;
  const noteTooLong = reviewerNote.trim().length > 4000;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (navigationTimer.current) clearTimeout(navigationTimer.current);
    };
  }, []);

  function handleFailure(error: unknown) {
    const status = error instanceof OperatorTourApiError ? error.status : 0;
    const uncertain = status === 0 || status === 409 || status >= 500;
    requestLock.current = !(status === 400 || status === 422 || status === 429);
    setReloadRequired(uncertain || status === 403 || status === 404 || status === 401);
    setErrorMessage(status === 401 ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
      : status === 403 ? 'Bạn không có quyền gửi duyệt gói tour này hoặc tài khoản chưa được phê duyệt.'
      : status === 404 ? 'Không tìm thấy gói tour hoặc tour không còn khả dụng. Vui lòng tải lại danh sách.'
      : status === 409 ? 'Trạng thái tour đã thay đổi. Vui lòng tải lại tour trước khi gửi lại.'
      : status === 400 || status === 422 ? 'Không thể gửi duyệt. Hãy kiểm tra các mục bắt buộc và ghi chú (tối đa 4.000 ký tự), rồi tải lại tour để cập nhật danh mục kiểm tra.'
      : status === 429 ? 'Có quá nhiều yêu cầu. Vui lòng chờ một lát trước khi thử lại.'
      : 'Chưa xác định được kết quả gửi duyệt. Vui lòng tải lại tour để kiểm tra trạng thái trước khi gửi lại.');
    if (status === 401) router.replace(`/sign-in?returnUrl=${encodeURIComponent(OPERATOR_TOUR_ROUTES.submit(tour.id))}`);
  }

  const handleConfirmSubmit = async () => {
    if (requestLock.current || locked || noteTooLong || !completeness.isEligibleForSubmission) return;
    requestLock.current = true;
    setErrorMessage(null);
    setSuccessMessage(null);
    setSubmitting(true);

    try {
      const result = await submitTourForApproval(tour.id, {
        allowDemo: isDemo,
        currentTour: tour,
        note: reviewerNote,
      });
      if (!mounted.current) return;

      if (result.status === 'SUCCESS' && result.data?.status === 'Pending' && result.data.id === tour.id) {
        setTour(result.data);
        setSuccessMessage(result.message || OPERATOR_TOUR_MESSAGES.SUBMIT_SUCCESS);
        setShowConfirmModal(false);
        // After 1.5s redirect back to tour list
        navigationTimer.current = setTimeout(() => {
          if (mounted.current) router.push(withTourDemoMode(OPERATOR_TOUR_ROUTES.list, isDemo));
        }, 1200);
      } else {
        handleFailure(null);
        setShowConfirmModal(false);
      }
    } catch (err) {
      if (!mounted.current) return;
      handleFailure(err);
      setShowConfirmModal(false);
    } finally {
      if (mounted.current) {
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="min-w-0 space-y-6 [overflow-wrap:anywhere]" aria-busy={submitting}>
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#1C2928] sm:text-2xl">
            Gửi duyệt gói tour
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Kiểm tra các thông tin bắt buộc trước khi chuyển giao cho nhân viên TripMate (Staff) phê duyệt.
          </p>
        </div>

        <Link
          href={withTourDemoMode(OPERATOR_TOUR_ROUTES.list, isDemo)}
          className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-primary transition"
        >
          Quay lại danh sách
        </Link>
      </div>

      {/* Demo Mode Banner */}
      {isDemo && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-amber-600" aria-hidden="true">
              preview
            </span>
            <span>
              <strong>Bản xem trước DEMO:</strong> Đang thao tác trên dữ liệu mẫu ({tour.tourCode}).
            </span>
          </div>
          <span className="rounded bg-amber-200 px-2 py-0.5 font-bold uppercase text-[10px] text-amber-800">
            DEMO ONLY
          </span>
        </div>
      )}

      {/* Notifications */}
      {successMessage && (
        <div
          role="status"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-900 shadow-xs"
        >
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800 shadow-xs"
        >
          {errorMessage}
          {reloadRequired && (
            <button type="button" onClick={() => onReload ? onReload() : window.location.reload()} className="mt-3 block min-h-11 rounded-xl border border-rose-300 px-4 py-2 focus-visible:ring-2 focus-visible:ring-primary">
              Tải lại tour để kiểm tra
            </button>
          )}
        </div>
      )}
      {nonSubmittableReason && (
        <div
          role="alert"
          className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs font-bold text-amber-900 shadow-xs"
        >
          {nonSubmittableReason}
        </div>
      )}

      {/* Tour Summary Card (Screen #43 header) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 max-w-full items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#174B4A]">
              <span className="material-symbols-outlined text-[28px]">tour</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-extrabold text-[#1C2928] sm:text-lg">{tour.title}</h2>
              <p className="mt-1 font-mono text-xs text-slate-500">
                {tour.tourCode} · {tour.destination} · {tour.durationDays} ngày · {tour.basePrice.toLocaleString()} đ
              </p>
            </div>
          </div>
          <OperatorTourStatusBadge status={tour.status} />
        </div>
      </div>

      {/* 2-Column Responsive Layout (Screen #43) */}
      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column: Submission Checklist */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-extrabold text-[#1C2928]">
              Danh mục kiểm tra bắt buộc (Checklist)
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Gói tour chỉ đủ điều kiện gửi duyệt khi tất cả tiêu chí bắt buộc đạt chuẩn.
            </p>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {completeness.items.map((item) => (
              <div key={item.key} className="flex flex-wrap items-center justify-between gap-2 py-3.5 text-xs">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`material-symbols-outlined shrink-0 text-[20px] ${
                      item.isComplete ? 'text-emerald-600' : 'text-slate-300'
                    }`}
                  >
                    {item.isComplete ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  <span className="font-bold text-slate-800">{item.label}</span>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    item.isComplete
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  {item.summaryText}
                  {item.key === 'payment_channel_not_ready' && <> · <Link className="inline-flex min-h-11 items-center underline focus-visible:outline-2" href={ROUTES.partner.paymentSettings}>Kết nối payOS</Link></>}
                </span>
              </div>
            ))}
          </div>

          {!completeness.isEligibleForSubmission && isSubmittableStatus && !submitting && !reloadRequired && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 font-medium">
              Còn <strong>{completeness.missingCount}</strong> mục bắt buộc chưa hoàn tất. Vui lòng quay lại màn hình chỉnh sửa để bổ sung đầy đủ trước khi gửi xét duyệt.{' '}
              <Link
                href={withTourDemoMode(OPERATOR_TOUR_ROUTES.edit(tour.id), isDemo)}
                className="inline-flex min-h-11 items-center font-bold underline focus-visible:ring-2 focus-visible:ring-primary"
              >
                Mở màn hình chỉnh sửa
              </Link>
            </div>
          )}
        </section>

        {/* Right Column: Next Steps & Note to Reviewer */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
            <h3 className="text-base font-extrabold text-[#1C2928] border-b border-slate-100 pb-3">
              Quy trình tiếp theo
            </h3>
            <div className="mt-4 space-y-3.5 text-xs text-slate-600">
              <div className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#174B4A]/10 text-[11px] font-extrabold text-[#174B4A]">
                  1
                </span>
                <p>
                  Trạng thái gói tour chuyển thành <strong>Chờ duyệt (Pending Approval)</strong>.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#174B4A]/10 text-[11px] font-extrabold text-[#174B4A]">
                  2
                </span>
                <p>Nhân viên TripMate (Staff) sẽ kiểm tra gói tour theo quy trình xét duyệt.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#174B4A]/10 text-[11px] font-extrabold text-[#174B4A]">
                  3
                </span>
                <p>
                  Gói tour chưa hiển thị công khai và chưa thể đặt chỗ cho tới khi được Staff phê duyệt và xuất bản.
                </p>
              </div>
            </div>

            <p className="mt-4 rounded-xl bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500 border border-slate-100">
              Trong thời gian chờ duyệt, gói tour ở chế độ chỉ đọc và bị khóa chỉnh sửa.
            </p>
          </section>

          {/* Note to Reviewer */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
            <label htmlFor="reviewer-note" className="block text-xs font-bold text-[#1C2928]">
              Ghi chú gửi nhân viên TripMate (Staff) (Tùy chọn)
            </label>
            <textarea
              id="reviewer-note"
              rows={3}
              value={reviewerNote}
              disabled={locked}
              maxLength={4000}
              aria-describedby="reviewer-note-limit"
              aria-invalid={noteTooLong}
              onChange={(e) => { setReviewerNote(e.target.value); setErrorMessage(null); }}
              placeholder="Ví dụ: Chuyến đi khởi hành buổi tối, bao gồm vé tham quan và thuyền hoa đăng..."
              className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 focus:border-[#174B4A] focus:outline-hidden focus:ring-2 focus:ring-[#174B4A]/20"
            />
            <p id="reviewer-note-limit" className="mt-2 text-xs text-slate-500">{reviewerNote.length.toLocaleString('vi-VN')}/4.000 ký tự (giới hạn lưu trữ).</p>
            {noteTooLong && <p role="alert" className="mt-2 text-xs text-rose-800">Ghi chú không được vượt quá 4.000 ký tự.</p>}
            {tour.submittedAtUtc && <p className="mt-2 text-xs text-slate-500">Đã gửi lúc: {new Date(tour.submittedAtUtc).toLocaleString('vi-VN')}</p>}
          </section>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <button
          type="button"
          disabled={locked}
          onClick={() => router.push(withTourDemoMode(OPERATOR_TOUR_ROUTES.edit(tour.id), isDemo))}
          className="min-h-11 w-full sm:w-auto text-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-primary transition disabled:opacity-50"
        >
          Quay lại chỉnh sửa
        </button>
        <button
          type="button"
          onClick={() => { setErrorMessage(null); setShowConfirmModal(true); }}
          disabled={locked || !completeness.isEligibleForSubmission || noteTooLong}
          className="min-h-11 w-full sm:w-auto text-center rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary transition disabled:opacity-50"
        >
          Gửi yêu cầu xét duyệt
        </button>
      </div>

      {/* Confirmation Modal (Screen #43 Dialog) */}
      {showConfirmModal && (
        <ConfirmationDialog title="Gửi gói tour này để xét duyệt?" pending={submitting}
          onCancel={() => { if (!requestLock.current) setShowConfirmModal(false); }} onConfirm={handleConfirmSubmit}>
          <p className="font-bold">{tour.title} · {tour.tourCode}</p>
          <p>Gói tour sẽ chuyển sang trạng thái <strong>Chờ duyệt</strong> và bị khóa chỉnh sửa cho đến khi nhân viên TripMate (Staff) đưa ra quyết định.</p>
          <p>Tour chưa hiển thị công khai và chưa thể đặt chỗ cho tới khi được Staff phê duyệt và xuất bản.</p>
        </ConfirmationDialog>
      )}
    </div>
  );
}
