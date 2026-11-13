'use client';

import { useRef, useState } from 'react';

import { useAccessibleDecisionDialog } from '@/features/admin/tour-operator-applications/components/useAccessibleDecisionDialog';

/**
 * UC-73 Screen 2: a no-input confirm dialog, currently used only by Retry Transfer (v2: Carry
 * Over, the other former user of this shape, was removed with the backend action). The caller
 * owns closing the dialog and re-fetching the detail on success (never assume the new status
 * locally, per spec); this component only runs `onConfirm` and reports the outcome.
 */
export function ConfirmActionDialog({
  isOpen,
  title,
  body,
  confirmLabel,
  onConfirm,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
  onSuccess: () => void;
}) {
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
      await onConfirm();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The request could not be completed.');
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#00152a]/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-action-title"
      onClick={(event) => {
        if (event.target === event.currentTarget && !loading) onClose();
      }}
    >
      <div ref={dialogRef} className="w-full max-w-md rounded-2xl border border-[#d7e2ef] bg-white p-6 shadow-2xl">
        <h3 id="confirm-action-title" className="text-lg font-extrabold text-[#00152a]">
          {title}
        </h3>
        <p className="mt-3 text-sm text-[#486581]">{body}</p>

        {error ? (
          <div role="alert" className="mt-4 rounded-xl border border-[#F7C9D3] bg-[#FDECEF] p-3 text-xs font-semibold text-[#8c1030]">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#e6edf5] pt-4">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="rounded-xl border border-[#9fb3c8] bg-white px-4 py-2 text-sm font-bold text-[#243b53] hover:bg-[#edf2f7] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleConfirm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#006b5f] px-5 py-2 text-sm font-bold text-white hover:bg-[#005048] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
