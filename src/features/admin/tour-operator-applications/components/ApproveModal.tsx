'use client';

import { useRef, useState } from 'react';
import { approveOperatorApplication } from '../api/tourOperatorApplicationApi';
import { ApproveOperatorApplicationResponseDto } from '@/types/tour-operator-application';
import { tourOperatorApplicationEn as copy } from '../resources/en';
import { describeApplicationError } from '../utils/applicationErrors';
import { useAccessibleDecisionDialog } from './useAccessibleDecisionDialog';

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
  const inFlight = useRef(false);

  const dialogRef = useAccessibleDecisionDialog(isOpen, onClose, loading);

  if (!isOpen) return null;

  async function handleConfirm() {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      setLoading(true);
      setError(null);
      const result = await approveOperatorApplication(userId);
      onSuccess(result);
    } catch (err) {
      setError(describeApplicationError(err, userId).message);
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="approve-application-title"
      onClick={(event) => { if (event.target === event.currentTarget && !loading) onClose(); }}
    >
      <div ref={dialogRef} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-900">
        <div className="mb-4 flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 text-xl font-bold"
            aria-hidden="true"
          >
            ✓
          </div>
          <div>
            <h3 id="approve-application-title" className="text-lg font-extrabold text-slate-900">{copy.approve.title}</h3>
            <p className="text-xs font-medium text-slate-500">{copy.approve.subtitle}</p>
          </div>
        </div>

        {isMissingMandatory && (
          <div className="mb-4 rounded-xl border border-rose-300 bg-rose-50 p-3.5 text-xs font-bold text-rose-900 flex items-start gap-2.5">
            <span className="text-base" aria-hidden="true">⚠️</span>
            <div>
              <p className="font-extrabold text-rose-950">{copy.approve.blockedTitle}</p>
              <p className="mt-0.5 font-medium text-rose-800">{copy.approve.blockedBody}</p>
            </div>
          </div>
        )}

        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
          <p className="mb-2 font-medium">{copy.approve.question(companyName)}</p>
          <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
            {copy.approve.effects.map((effect) => (
              <li key={effect}>{effect}</li>
            ))}
          </ul>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800" role="alert">
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
            {copy.approve.cancel}
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
            {copy.approve.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
