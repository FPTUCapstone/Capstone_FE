'use client';

import { useRef, useState } from 'react';

import { useAccessibleDecisionDialog } from '@/features/admin/tour-operator-applications/components/useAccessibleDecisionDialog';
import { validateResolutionReason } from './payoutSettlements';

/** UC-73 Screen 2 (v2): [Mark as Resolved] — closes a SettlementFailed batch without moving
 * money. Blank/whitespace-only reason is rejected client-side (same rule the backend enforces,
 * `daily_payout.resolution_reason_required`, MSG178), with the entered value kept visible so the
 * admin can fix it rather than retype it. Replaces `ManualSettlementDialog` (v1). */
export function MarkAsResolvedDialog({
  isOpen,
  onConfirm,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onConfirm: (reason: string) => Promise<void>;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const inFlight = useRef(false);

  const dialogRef = useAccessibleDecisionDialog(isOpen, onClose, loading);

  if (!isOpen) return null;

  async function handleConfirm(event: React.FormEvent) {
    event.preventDefault();
    if (inFlight.current) return;

    const validated = validateResolutionReason(reason);
    if (!validated.ok) {
      setInvalid(true);
      setError('A reason is required.');
      return;
    }

    inFlight.current = true;
    try {
      setLoading(true);
      setInvalid(false);
      setError(null);
      await onConfirm(validated.value);
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
      aria-labelledby="mark-as-resolved-title"
      onClick={(event) => {
        if (event.target === event.currentTarget && !loading) onClose();
      }}
    >
      <div ref={dialogRef} className="w-full max-w-md rounded-2xl border border-[#d7e2ef] bg-white p-6 shadow-2xl">
        <h3 id="mark-as-resolved-title" className="text-lg font-extrabold text-[#00152a]">
          Mark as Resolved
        </h3>
        <p className="mt-3 text-sm text-[#486581]">
          Enter the reason this settlement is being closed without a transfer. The amount is not recalculated.
        </p>

        <form onSubmit={handleConfirm} noValidate>
          <label htmlFor="resolution-reason" className="mt-4 block text-xs font-bold uppercase tracking-wide text-[#334e68]">
            Reason
          </label>
          <textarea
            id="resolution-reason"
            value={reason}
            rows={3}
            aria-invalid={invalid}
            aria-describedby={error ? 'resolution-reason-error' : undefined}
            onChange={(event) => {
              setReason(event.target.value);
              if (invalid) setInvalid(false);
            }}
            className="mt-1 w-full rounded-xl border border-[#bcccdc] bg-white px-3 py-2.5 text-sm text-[#102a43] outline-none focus-visible:border-[#006b5f] focus-visible:ring-2 focus-visible:ring-[#71f8e4]/40"
          />

          {error ? (
            <div
              id="resolution-reason-error"
              role="alert"
              className="mt-4 rounded-xl border border-[#F7C9D3] bg-[#FDECEF] p-3 text-xs font-semibold text-[#8c1030]"
            >
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
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#006b5f] px-5 py-2 text-sm font-bold text-white hover:bg-[#005048] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" /> : null}
              Mark as Resolved
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
