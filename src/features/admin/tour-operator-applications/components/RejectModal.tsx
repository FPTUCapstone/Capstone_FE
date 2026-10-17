'use client';

import { useRef, useState } from 'react';
import { rejectOperatorApplication } from '../api/tourOperatorApplicationApi';
import { tourOperatorApplicationEn as copy } from '../resources/en';
import { describeApplicationError } from '../utils/applicationErrors';
import { usableDecisionMessage } from '../utils/decisionMessage';
import { useAccessibleDecisionDialog } from './useAccessibleDecisionDialog';

/** Mirrors the Backend limit `OperatorProfile.RejectionReasonMaxLength`. */
export const REJECTION_REASON_MAX_LENGTH = 500;

interface RejectModalProps {
  isOpen: boolean;
  userId: number;
  companyName: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function RejectModal({
  isOpen,
  userId,
  companyName,
  onClose,
  onSuccess,
}: RejectModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  // State updates are asynchronous, so a ref blocks a second submit in the same tick.
  const inFlight = useRef(false);

  const dialogRef = useAccessibleDecisionDialog(isOpen, onClose, loading);

  if (!isOpen) return null;

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (inFlight.current) return;

    const trimmed = reason.trim();
    if (!trimmed) {
      setInvalid(true);
      setError(copy.reject.reasonRequired);
      return;
    }
    if (trimmed.length > REJECTION_REASON_MAX_LENGTH) {
      setInvalid(true);
      setError(copy.reject.reasonTooLong(REJECTION_REASON_MAX_LENGTH));
      return;
    }

    inFlight.current = true;
    try {
      setLoading(true);
      setInvalid(false);
      setError(null);
      const result = await rejectOperatorApplication(userId, trimmed);
      onSuccess(usableDecisionMessage(result.message) ?? copy.reject.successFallback(companyName));
    } catch (err) {
      setError(describeApplicationError(err, userId).message);
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }

  const describedBy = ['rejection-reason-count', error ? 'rejection-reason-error' : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-application-title"
      onClick={(event) => { if (event.target === event.currentTarget && !loading) onClose(); }}
    >
      <div ref={dialogRef} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-900">
        <div className="mb-4 flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 border border-rose-300 text-rose-700 text-xl font-bold"
            aria-hidden="true"
          >
            ✕
          </div>
          <div>
            <h3 id="reject-application-title" className="text-lg font-extrabold text-slate-900">{copy.reject.title}</h3>
            <p className="text-xs font-medium text-slate-500">{copy.reject.subtitle(companyName)}</p>
          </div>
        </div>

        <form onSubmit={handleConfirm} noValidate>
          <div className="mb-4">
            <label htmlFor="rejection-reason" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              {copy.reject.reasonLabel}
            </label>
            <textarea
              id="rejection-reason"
              required
              maxLength={REJECTION_REASON_MAX_LENGTH}
              rows={4}
              value={reason}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              onChange={(e) => {
                setReason(e.target.value);
                if (invalid) setInvalid(false);
              }}
              placeholder={copy.reject.placeholder}
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
            <p id="rejection-reason-count" className="mt-1 text-right text-xs font-medium text-slate-500">
              {copy.reject.counter(reason.length, REJECTION_REASON_MAX_LENGTH)}
            </p>
          </div>

          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-600">
            <span aria-hidden="true">ℹ️ </span>
            {copy.reject.visibilityNote}
          </div>

          {error && (
            <div
              id="rejection-reason-error"
              className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800"
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
            >
              {copy.reject.cancel}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-rose-600/25 hover:bg-rose-700 transition disabled:opacity-50"
            >
              {loading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />
              )}
              {copy.reject.confirm}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
