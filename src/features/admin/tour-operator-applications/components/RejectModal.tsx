'use client';

import { useState } from 'react';
import { RejectOperatorApplicationResponseDto } from '@/types/tour-operator-application';
import { rejectOperatorApplication, ApiError } from '../api/tourOperatorApplicationApi';

interface RejectModalProps {
  isOpen: boolean;
  userId: number;
  companyName: string;
  onClose: () => void;
  onSuccess: (result: RejectOperatorApplicationResponseDto) => void;
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

  if (!isOpen) return null;

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a specific rejection reason.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await rejectOperatorApplication(userId, reason.trim());
      onSuccess(res);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-900">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 border border-rose-300 text-rose-700 text-xl font-bold">
            ✕
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Reject Application</h3>
            <p className="text-xs font-medium text-slate-500">Application for &quot;{companyName}&quot;</p>
          </div>
        </div>

        <form onSubmit={handleConfirm}>
          <div className="mb-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Reason for Rejection (MSG115)
            </label>
            <textarea
              required
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter specific rejection reason to send to applicant (e.g. Invalid license number, expired document)..."
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-600">
            ℹ️ <strong>Note:</strong> Reject action UI dependency for UC-50. Full rejection processing is owned by UC-51.
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
              ❌ {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-rose-600/25 hover:bg-rose-700 transition disabled:opacity-50"
            >
              {loading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />
              )}
              Confirm Rejection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
