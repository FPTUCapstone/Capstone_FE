import React, { useState } from 'react';
import type { WeatherSafetyReview } from '../types';

interface AcknowledgeReviewFormProps {
  review: WeatherSafetyReview;
  onAcknowledge: (immediateInstructions: string | null) => Promise<void>;
  className?: string;
}

export function AcknowledgeReviewForm({
  review,
  onAcknowledge,
  className = '',
}: AcknowledgeReviewFormProps) {
  const [instructions, setInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isClosed = review.status === 'Closed';
  const isAcknowledged = review.status === 'Acknowledged';
  const acknowledgedAt = review.acknowledgedAtUtc
    ? `${new Date(review.acknowledgedAtUtc).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })} (ICT)`
    : null;

  if (isAcknowledged || isClosed) {
    return (
      <div className={`rounded-xl border border-blue-200 bg-blue-50/60 p-5 ${className}`}>
        <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
          <span className="material-symbols-outlined text-[20px] text-blue-600" aria-hidden="true">
            check_circle
          </span>
          <span>{isClosed ? 'Hồ sơ đã đóng' : `Đã xác nhận lúc: ${acknowledgedAt ?? 'N/A'}`}</span>
        </div>

        {isClosed && acknowledgedAt && (
          <p className="mt-2 text-xs text-slate-600">Đã xác nhận lúc: {acknowledgedAt}</p>
        )}

        {/* Before an acknowledgement this field only holds the system's evaluation text. */}
        {acknowledgedAt && review.immediateInstructions && (
          <div className="mt-3 rounded-lg border border-blue-100 bg-white p-3 text-xs text-slate-700">
            <span className="block font-semibold text-slate-500 mb-1">
              Internal acknowledgement note
            </span>
            <p className="whitespace-pre-wrap">{review.immediateInstructions}</p>
          </div>
        )}

        {!isClosed && (
          <p className="mt-3 text-xs text-slate-600">
            Xác nhận này chỉ ghi nhận bạn đã tiếp nhận thông tin cảnh báo. Trạng thái tour và các
            đơn đặt chỗ giữ nguyên trừ khi bạn chủ động thao tác hủy/dừng.
          </p>
        )}
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const payload = instructions.trim().length > 0 ? instructions.trim() : null;
      await onAcknowledge(payload);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi gửi xác nhận';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4 ${className}`}
    >
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <span className="material-symbols-outlined text-teal-700" aria-hidden="true">
            assignment_turned_in
          </span>
          Xác nhận tiếp nhận cảnh báo (Acknowledge)
        </h3>
        <p className="mt-1 text-xs text-slate-600">
          Xác nhận đã đọc để hoàn thành nghĩa vụ SLA kiểm tra an toàn. Hệ thống tuyệt đối{' '}
          <strong>không tự động hủy hay dừng tour</strong>; bạn hoàn toàn chủ động quyết định.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="immediate-instructions"
          className="block text-xs font-semibold text-slate-700 mb-1.5"
        >
          Internal acknowledgement note
        </label>
        <p id="immediate-instructions-help" className="mb-1.5 text-[11px] text-slate-600">
          This note is recorded for the Operator workflow and is not sent to Travelers. Add Traveler safety instructions when cancelling or stopping the tour.
        </p>
        <textarea
          id="immediate-instructions"
          rows={3}
          maxLength={1000}
          aria-describedby="immediate-instructions-help"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          disabled={submitting}
          placeholder="Optional note for your team"
          className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-teal-600 focus:outline-hidden focus:ring-1 focus:ring-teal-600 disabled:bg-slate-100 disabled:cursor-not-allowed"
        />
        <div className="mt-1 flex justify-end text-[11px] text-slate-500">
          <span>{instructions.length} / 1000 ký tự</span>
        </div>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
        <span className="text-xs text-slate-500">
          Sau khi xác nhận, bạn vẫn có thể mở Impact Preview để quyết định hủy hoặc dừng tour nếu cần.
        </span>
        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-teal-800 focus:outline-hidden focus:ring-2 focus:ring-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {submitting ? (
            <>
              <span className="material-symbols-outlined text-[16px] animate-spin" aria-hidden="true">
                progress_activity
              </span>
              <span>Đang gửi xác nhận...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                done_all
              </span>
              <span>Đã xem cảnh báo</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
