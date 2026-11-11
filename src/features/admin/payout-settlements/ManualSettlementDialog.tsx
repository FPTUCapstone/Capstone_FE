'use client';

import { useRef, useState } from 'react';

import { useAccessibleDecisionDialog } from '@/features/admin/tour-operator-applications/components/useAccessibleDecisionDialog';
import { validateManualTransferReference } from './payoutSettlements';

/** UC-73 Screen 2: Record Manual Transfer — the one action with an input. Blank/whitespace-only
 * is rejected client-side (same rule the backend enforces, `daily_payout.manual_reference_required`),
 * with the entered value kept visible so the admin can fix a typo rather than retype it. */
export function ManualSettlementDialog({
  isOpen,
  onConfirm,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onConfirm: (transferReference: string) => Promise<void>;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const inFlight = useRef(false);

  const dialogRef = useAccessibleDecisionDialog(isOpen, onClose, loading);

  if (!isOpen) return null;

  async function handleConfirm(event: React.FormEvent) {
    event.preventDefault();
    if (inFlight.current) return;

    const validated = validateManualTransferReference(reference);
    if (!validated.ok) {
      setInvalid(true);
      setError('A transfer reference is required.');
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
      aria-labelledby="manual-settlement-title"
      onClick={(event) => {
        if (event.target === event.currentTarget && !loading) onClose();
      }}
    >
      <div ref={dialogRef} className="w-full max-w-md rounded-2xl border border-[#d7e2ef] bg-white p-6 shadow-2xl">
        <h3 id="manual-settlement-title" className="text-lg font-extrabold text-[#00152a]">
          Record Manual Transfer
        </h3>
        <p className="mt-3 text-sm text-[#486581]">
          Record the reference of a transfer made outside the system. The amount is not recalculated.
        </p>

        <form onSubmit={handleConfirm} noValidate>
          <label htmlFor="manual-transfer-reference" className="mt-4 block text-xs font-bold uppercase tracking-wide text-[#334e68]">
            Transfer Reference
          </label>
          <input
            id="manual-transfer-reference"
            value={reference}
            aria-invalid={invalid}
            aria-describedby={error ? 'manual-transfer-reference-error' : undefined}
            onChange={(event) => {
              setReference(event.target.value);
              if (invalid) setInvalid(false);
            }}
            className="mt-1 w-full rounded-xl border border-[#bcccdc] bg-white px-3 py-2.5 text-sm text-[#102a43] outline-none focus-visible:border-[#006b5f] focus-visible:ring-2 focus-visible:ring-[#71f8e4]/40"
          />

          {error ? (
            <div
              id="manual-transfer-reference-error"
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
              Record Transfer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
