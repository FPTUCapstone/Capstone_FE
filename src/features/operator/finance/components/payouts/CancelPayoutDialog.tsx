'use client';

import { useCallback, useState } from 'react';
import { formatVndCurrency } from '../../utils/financeFormat';
import { financeEn } from '../../resources/en';
import { PAYOUT_ERROR_DISPLAY } from '../../types/payoutLifecycle';
import type { PayoutErrorCode, PayoutHistoryItemDto } from '../../types/payoutLifecycle';
import { useAccessibleFinanceDialog } from '../useAccessibleFinanceDialog';

interface CancelPayoutDialogProps {
  isOpen: boolean;
  request: PayoutHistoryItemDto | null;
  onClose: () => void;
  onConfirmCancel: (
    payoutCode: string
  ) => Promise<{ success: boolean; errorCode?: PayoutErrorCode | 'SYSTEM_ERROR' | 'PENDING_BE_INTEGRATION' }>;
}

export function CancelPayoutDialog({ isOpen, request, onClose, onConfirmCancel }: CancelPayoutDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setErrorMessage(null);
    onClose();
  }, [onClose]);
  const dialogRef = useAccessibleFinanceDialog(isOpen && Boolean(request), handleClose, isSubmitting);

  if (!isOpen || !request) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await onConfirmCancel(request.payoutCode);
      if (result.success) {
        handleClose();
        return;
      }
      // 409 PAYOUT_NOT_CANCELLABLE: the caller re-fetches months/balance/history right after this
      // call regardless of outcome, so the underlying table is already corrected by the time this
      // error renders — only this dialog's own copy of `request` is stale until it is closed.
      const displayKey = result.errorCode ? PAYOUT_ERROR_DISPLAY[result.errorCode] : undefined;
      const text = displayKey ? (financeEn.messages as Record<string, string>)[displayKey] : undefined;
      setErrorMessage(text ?? financeEn.messages.MSG127);
    } catch {
      setErrorMessage(financeEn.messages.MSG127);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedAmount = formatVndCurrency(request.payableNetAmount);
  const subtitle = financeEn.cancelDialog.subtitle
    .replace('{code}', request.payoutCode)
    .replace('{amount}', formattedAmount);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-payout-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
    >
      <div ref={dialogRef} tabIndex={-1} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl transition-all">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <span className="material-symbols-outlined text-xl">warning</span>
          </div>
          <div>
            <h2 id="cancel-payout-title" className="text-base font-bold text-[#00152A]">
              {financeEn.cancelDialog.title}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-xs text-slate-600">
          <p>{financeEn.cancelDialog.explanation}</p>
        </div>

        {errorMessage && (
          <div role="alert" className="mt-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            {financeEn.cancelDialog.keepBtn}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-rose-700 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>{financeEn.cancelDialog.cancellingBtn}</span>
              </>
            ) : (
              <span>{financeEn.cancelDialog.confirmBtn}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
