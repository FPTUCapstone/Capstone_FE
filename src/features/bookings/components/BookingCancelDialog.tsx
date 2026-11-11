'use client';

import { useEffect, useState } from 'react';

import { useAccessibleDialog } from '@/components/ui/useAccessibleDialog';

import {
  fetchBookingCancellationPreview,
  submitBookingCancellation,
  type BookingCancellationPreview,
} from '../services/cancellationApi';
import { cancellationMessages as m } from './cancellationMessages';

const CONFIRMATION_CODE = 'booking.cancellation.confirmation_required';

interface BookingCancelDialogProps {
  bookingId: string;
  onClose: () => void;
  onCancelled: () => void;
}

export function BookingCancelDialog({ bookingId, onClose, onCancelled }: BookingCancelDialogProps) {
  const [preview, setPreview] = useState<BookingCancellationPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [reasonDetail, setReasonDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const dialogRef = useAccessibleDialog({
    isOpen: true,
    onClose,
    locked: submitting,
  });

  useEffect(() => {
    let active = true;
    fetchBookingCancellationPreview(bookingId).then((result) => {
      if (!active) return;
      if (result.ok) setPreview(result.data);
      else setError(m.failed);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [bookingId]);

  const needsConfirmation = preview?.blockingReasonCode === CONFIRMATION_CODE;
  const canConfirm = Boolean(preview?.canCancel) && (!needsConfirmation || confirmed) && !submitting;

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    const result = await submitBookingCancellation(
      bookingId,
      {
        reasonDetail: reasonDetail.trim() || undefined,
        confirmed: needsConfirmation && confirmed,
      },
      idempotencyKey,
    );
    setSubmitting(false);
    if (result.ok) onCancelled();
    else setError(m.failed);
  }

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-cancel-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="booking-cancel-title" className="text-lg font-bold text-slate-900">
          {m.title}
        </h2>

        {loading ? (
          <p className="mt-4 text-sm text-slate-500">{m.loading}</p>
        ) : null}

        {preview ? (
          <div className="mt-4 space-y-3 text-sm text-slate-800">
            <p className="font-semibold">{preview.tourTitle}</p>
            <div>
              <span className="text-slate-500">{m.refundLabel}: </span>
              <span data-testid="cancel-refund-amount" className="font-bold">
                {preview.estimatedRefundAmount > 0
                  ? `${preview.estimatedRefundAmount.toLocaleString('vi-VN')} ₫`
                  : m.noRefund}
              </span>
              {preview.estimatedRefundAmount > 0 ? (
                <p className="text-xs text-amber-700">{m.refundPending}</p>
              ) : null}
            </div>

            {preview.blockingReason ? (
              <p className="rounded-lg bg-rose-50 p-3 text-rose-800">{preview.blockingReason}</p>
            ) : null}

            {needsConfirmation ? (
              <label className="flex items-start gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(event) => setConfirmed(event.target.checked)}
                  className="mt-0.5"
                />
                <span>{m.confirmLabel}</span>
              </label>
            ) : null}

            <label className="block text-xs text-slate-600">
              {m.reasonLabel}
              <textarea
                value={reasonDetail}
                onChange={(event) => setReasonDetail(event.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm"
              />
            </label>
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
            {m.close}
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={handleConfirm}
            className="rounded-xl bg-rose-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            {m.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
