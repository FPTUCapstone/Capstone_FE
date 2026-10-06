'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OPERATOR_TOUR_ROUTES } from '../routes';
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
}

export function SubmitTourApprovalView({ tour, isDemo = false }: SubmitTourApprovalViewProps) {
  const router = useRouter();
  const completeness = evaluateTourCompleteness(tour);
  const isSubmittableStatus = tour.status === 'Draft' || tour.status === 'Rejected';

  let nonSubmittableReason = '';
  if (tour.status === 'Pending') {
    nonSubmittableReason = 'Gói tour đã ở trạng thái chờ duyệt (MSG122).';
  } else if (tour.status === 'Approved') {
    nonSubmittableReason = 'Gói tour đã được phê duyệt. Vui lòng tạo phiên bản nháp mới nếu muốn chỉnh sửa (MSG110).';
  } else if (!isSubmittableStatus) {
    nonSubmittableReason = 'Chỉ gói tour ở trạng thái Bản nháp hoặc Bị từ chối mới có thể gửi xét duyệt (BR-104).';
  }

  const [reviewerNote, setReviewerNote] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConfirmSubmit = async () => {
    setErrorMessage(null);
    setPendingMessage(null);
    setSuccessMessage(null);
    setSubmitting(true);

    try {
      const result = await submitTourForApproval(tour.id, {
        allowDemo: isDemo,
        currentTour: tour,
        note: reviewerNote,
      });

      if (result.status === 'SUCCESS' && result.data) {
        setSuccessMessage(result.message || OPERATOR_TOUR_MESSAGES.SUBMIT_SUCCESS);
        setShowConfirmModal(false);
        // After 1.5s redirect back to tour list
        setTimeout(() => {
          router.push(OPERATOR_TOUR_ROUTES.list);
        }, 1200);
      } else if (result.status === 'PENDING_BE_INTEGRATION') {
        setPendingMessage(result.message || OPERATOR_TOUR_MESSAGES.PENDING_BE_INTEGRATION);
        setShowConfirmModal(false);
      } else if (result.status === 'ERROR') {
        setErrorMessage(result.message || OPERATOR_TOUR_MESSAGES.SYSTEM_FAILURE);
        setShowConfirmModal(false);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : OPERATOR_TOUR_MESSAGES.SYSTEM_FAILURE
      );
      setShowConfirmModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#00152A] sm:text-2xl">
            Gửi duyệt gói tour
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Kiểm tra danh mục yêu cầu trước khi chuyển giao cho Quản trị viên phê duyệt (UC-37, Screen #43).
          </p>
        </div>

        <Link
          href={OPERATOR_TOUR_ROUTES.list}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          Quay lại danh sách
        </Link>
      </div>

      {/* Demo Mode Banner */}
      {isDemo && (
        <div className="flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 shadow-2xs">
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

      {/* Real Mode Pending Backend Integration Banner */}
      {!isDemo && (
        <div
          role="status"
          className="rounded-2xl border border-amber-300 bg-amber-50/90 p-4 text-xs text-amber-950 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[24px] text-amber-600 shrink-0" aria-hidden="true">
              pending_actions
            </span>
            <div>
              <h3 className="text-sm font-bold text-amber-950">
                Tính năng gửi duyệt gói tour đang chờ kết nối dịch vụ máy chủ
              </h3>
              <p className="mt-1 leading-relaxed text-amber-900">
                Danh mục kiểm tra tính đầy đủ (BR-101) và chuyển đổi trạng thái vòng đời (BR-104) đã sẵn sàng.
                Yêu cầu duyệt chưa được ghi nhận vào hàng đợi máy chủ (Capstone_BE).
              </p>
            </div>
          </div>
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
      {pendingMessage && (
        <div
          role="status"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-900 shadow-xs"
        >
          {pendingMessage}
        </div>
      )}
      {errorMessage && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800 shadow-xs"
        >
          {errorMessage}
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
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#006B5F]">
              <span className="material-symbols-outlined text-[28px]">tour</span>
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#00152A] sm:text-lg">{tour.title}</h2>
              <p className="mt-1 font-mono text-xs text-slate-500">
                {tour.tourCode} · {tour.destination} · {tour.durationDays} ngày · {tour.basePrice.toLocaleString()} đ
              </p>
            </div>
          </div>
          <OperatorTourStatusBadge status={tour.status} />
        </div>
      </div>

      {/* 2-Column Responsive Layout (Screen #43) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column: Submission Checklist */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-extrabold text-[#00152A]">
              Danh mục kiểm tra bắt buộc (Checklist)
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Gói tour chỉ đủ điều kiện gửi duyệt khi tất cả tiêu chí bắt buộc đạt chuẩn (BR-101).
            </p>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {completeness.items.map((item) => (
              <div key={item.key} className="flex items-center justify-between py-3.5 text-xs">
                <div className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-[20px] ${
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
                </span>
              </div>
            ))}
          </div>

          {!completeness.isEligibleForSubmission && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 font-medium">
              Còn <strong>{completeness.missingCount}</strong> mục bắt buộc chưa hoàn tất. Vui lòng quay lại màn hình chỉnh sửa để bổ sung đầy đủ trước khi gửi xét duyệt (BR-101, MSG01).
            </div>
          )}
        </section>

        {/* Right Column: Next Steps & Note to Reviewer */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
            <h3 className="text-base font-extrabold text-[#00152A] border-b border-slate-100 pb-3">
              Quy trình tiếp theo
            </h3>
            <div className="mt-4 space-y-3.5 text-xs text-slate-600">
              <div className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#006B5F]/10 text-[11px] font-extrabold text-[#006B5F]">
                  1
                </span>
                <p>
                  Trạng thái gói tour chuyển thành <strong>Chờ duyệt (Pending Approval)</strong>.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#006B5F]/10 text-[11px] font-extrabold text-[#006B5F]">
                  2
                </span>
                <p>Quản trị viên TripMate sẽ kiểm tra tính pháp lý, giá cả và nội dung lịch trình.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#006B5F]/10 text-[11px] font-extrabold text-[#006B5F]">
                  3
                </span>
                <p>
                  Khi được duyệt, gói tour sẽ tự động xuất bản và mở bán công khai cho du khách.
                </p>
              </div>
            </div>

            <p className="mt-4 rounded-xl bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500 border border-slate-100">
              Thời gian kiểm duyệt tiêu chuẩn là 1 ngày làm việc. Trong thời gian này, gói tour sẽ bị khóa chỉnh sửa (MSG122).
            </p>
          </section>

          {/* Note to Reviewer */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
            <label htmlFor="reviewer-note" className="block text-xs font-bold text-[#00152A]">
              Ghi chú gửi Quản trị viên (Tùy chọn)
            </label>
            <textarea
              id="reviewer-note"
              rows={3}
              value={reviewerNote}
              onChange={(e) => setReviewerNote(e.target.value)}
              placeholder="Ví dụ: Chuyến đi khởi hành buổi tối, bao gồm vé tham quan và thuyền hoa đăng..."
              className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 focus:border-[#006B5F] focus:outline-hidden focus:ring-2 focus:ring-[#006B5F]/20"
            />
          </section>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <button
          type="button"
          onClick={() => router.push(OPERATOR_TOUR_ROUTES.edit(tour.id))}
          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          Quay lại chỉnh sửa
        </button>
        <button
          type="button"
          onClick={() => setShowConfirmModal(true)}
          disabled={!isSubmittableStatus || !completeness.isEligibleForSubmission || submitting}
          className="rounded-xl bg-[#006B5F] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#005249] transition disabled:opacity-50"
        >
          Gửi yêu cầu xét duyệt (UC-37)
        </button>
      </div>

      {/* Confirmation Modal (Screen #43 Dialog) */}
      {showConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 id="modal-title" className="text-base font-extrabold text-[#00152A]">
              Gửi gói tour này để xét duyệt?
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Gói tour sẽ chuyển sang trạng thái <strong>Chờ duyệt</strong> và bị khóa chỉnh sửa cho đến khi Quản trị viên đưa ra quyết định. Bạn sẽ nhận được thông báo ngay khi quá trình kiểm duyệt hoàn tất.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={submitting}
                className="rounded-xl bg-[#006B5F] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#005249] transition disabled:opacity-50"
              >
                {submitting ? 'Đang gửi...' : 'Xác nhận gửi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
