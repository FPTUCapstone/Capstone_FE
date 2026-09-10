'use client';

import { useState } from 'react';
import { approveOperatorApplication, ApiError } from '../api/tourOperatorApplicationApi';
import { ApproveOperatorApplicationResponseDto } from '@/types/tour-operator-application';

interface ApproveModalProps {
  isOpen: boolean;
  userId: number;
  companyName: string;
  isMissingMandatory?: boolean;
  onClose: () => void;
  onSuccess: (result: ApproveOperatorApplicationResponseDto) => void;
}

export function ApproveModal({
  isOpen,
  userId,
  companyName,
  isMissingMandatory = false,
  onClose,
  onSuccess,
}: ApproveModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleConfirm() {
    try {
      setLoading(true);
      setError(null);
      const result = await approveOperatorApplication(userId);
      onSuccess(result);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while approving the application.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-900">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 text-xl font-bold">
            ✓
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Approve Application</h3>
            <p className="text-xs font-medium text-slate-500">Account Activation Confirmation</p>
          </div>
        </div>

        {isMissingMandatory && (
          <div className="mb-4 rounded-xl border border-rose-300 bg-rose-50 p-3.5 text-xs font-bold text-rose-900 flex items-start gap-2.5">
            <span className="text-base">⚠️</span>
            <div>
              <p className="font-extrabold text-rose-950">Approval Blocked</p>
              <p className="mt-0.5 font-medium text-rose-800">
                Mandatory <strong>Business License (GPKD/ĐKKD)</strong> document is missing or rejected.
              </p>
            </div>
          </div>
        )}

        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
          <p className="mb-2 font-medium">
            Are you sure you want to approve the Tour Operator application for{' '}
            <strong className="text-emerald-700 font-bold">{companyName}</strong>?
          </p>
          <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
            <li>User account status will change to <strong className="text-slate-900">Active</strong>.</li>
            <li>Operator profile approval status will change to <strong className="text-slate-900">Approved</strong>.</li>
            <li>All submitted documents will be marked as <strong className="text-slate-900">Approved</strong>.</li>
            <li>An audit log entry and activation email notification will be generated.</li>
          </ul>
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
            type="button"
            disabled={loading || isMissingMandatory}
            onClick={handleConfirm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-700 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-600 disabled:shadow-none"
          >
            {loading && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />
            )}
            Confirm Approval
          </button>
        </div>
      </div>
    </div>
  );
}
