'use client';

import { useCallback, useState } from 'react';
import { formatVndCurrency } from '../../utils/financeFormat';
import { financeEn } from '../../resources/en';
import { PAYOUT_ERROR_DISPLAY } from '../../types/payoutLifecycle';
import type {
  AvailableBalanceDto,
  BeneficiaryBankAccountDto,
  PayoutErrorCode,
  SettlementMonthDto,
} from '../../types/payoutLifecycle';
import { useAccessibleFinanceDialog } from '../useAccessibleFinanceDialog';

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface RequestPayoutDialogProps {
  isOpen: boolean;
  balance: AvailableBalanceDto | null;
  claimedMonths: SettlementMonthDto[];
  bankInfo: BeneficiaryBankAccountDto;
  onClose: () => void;
  onSubmit: () => Promise<{ success: boolean; errorCode?: PayoutErrorCode | 'SYSTEM_ERROR' | 'PENDING_BE_INTEGRATION' }>;
}

export function RequestPayoutDialog({ isOpen, balance, claimedMonths, bankInfo, onClose, onSubmit }: RequestPayoutDialogProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setConfirmed(false);
    setErrorMessage(null);
    onClose();
  }, [onClose]);

  const dialogRef = useAccessibleFinanceDialog(isOpen && Boolean(balance), handleClose, isSubmitting);

  if (!isOpen || !balance) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmed) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await onSubmit();
      if (result.success) {
        handleClose();
        return;
      }
      const displayKey = result.errorCode ? PAYOUT_ERROR_DISPLAY[result.errorCode] : undefined;
      const text = displayKey
        ? (financeEn.messages as Record<string, string>)[displayKey]
        : undefined;
      setErrorMessage(text ?? financeEn.messages.MSG127);
    } catch {
      setErrorMessage(financeEn.messages.MSG127);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="request-payout-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
    >
      <div ref={dialogRef} tabIndex={-1} className="w-full max-w-lg rounded-2xl bg-white p-4 sm:p-6 shadow-xl transition-all max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 id="request-payout-title" className="text-base font-bold text-[#00152A]">
              {financeEn.requestDialog.title}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">{financeEn.requestDialog.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {claimedMonths.length > 0 && (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-xs">
              <h3 className="font-bold text-[#00152A] mb-2">{financeEn.requestDialog.monthsIncludedTitle}</h3>
              <ul className="space-y-1.5">
                {claimedMonths.map((m) => (
                  <li key={`${m.year}-${m.month}`} className="flex justify-between">
                    <span className="font-medium text-slate-600">{MONTH_LABELS[m.month - 1]} {m.year}</span>
                    <span className="font-semibold text-slate-800">{formatVndCurrency(m.payableNetAmount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs space-y-2.5">
            <div className="flex justify-between">
              <span className="font-semibold text-slate-500">{financeEn.requestDialog.periodCountLabel}:</span>
              <span className="font-bold text-[#00152A]">{balance.periodCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-500">{financeEn.requestDialog.paymentsLabel}:</span>
              <span className="font-semibold text-slate-800">{formatVndCurrency(balance.paymentsReceived)}</span>
            </div>
            {balance.refundedAmount > 0 && (
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">{financeEn.requestDialog.refundedLabel}:</span>
                <span className="font-semibold text-rose-600">−{formatVndCurrency(balance.refundedAmount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="font-semibold text-slate-500">{financeEn.requestDialog.commissionLabel}:</span>
              <span className="font-semibold text-amber-700">−{formatVndCurrency(balance.commissionAmount)}</span>
            </div>
            {balance.adjustmentsOutstanding > 0 && (
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">{financeEn.requestDialog.adjustmentsLabel}:</span>
                <span className="font-semibold text-rose-600">
                  −{formatVndCurrency(balance.adjustmentsOutstanding)}
                </span>
              </div>
            )}
            <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
              <span className="text-xs font-bold text-[#00152A]">{financeEn.requestDialog.payableAmountLabel}:</span>
              <span className="text-base font-extrabold text-[#006B5F]">
                {formatVndCurrency(balance.payableNetAmount)}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 italic">{financeEn.requestDialog.payableAmountNotice}</p>

          <div className="rounded-xl border border-slate-200 p-3.5 bg-white text-xs">
            <h3 className="font-bold text-[#00152A] mb-2">{financeEn.requestDialog.bankConfirmationTitle}</h3>
            <div className="grid grid-cols-2 gap-2 text-slate-600">
              <div>
                <span className="text-slate-400 block text-[10px]">{financeEn.payouts.bank.accountHolder}</span>
                <span className="font-bold uppercase text-[#00152A]">
                  {bankInfo.accountHolderName || financeEn.payouts.bank.notSet}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">{financeEn.payouts.bank.bankName}</span>
                <span className="font-semibold text-[#00152A]">{bankInfo.bankName || financeEn.payouts.bank.notSet}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block text-[10px]">{financeEn.payouts.bank.accountNumber}</span>
                <span className="font-mono font-bold text-[#00152A]">
                  {bankInfo.maskedAccountNumber || financeEn.payouts.bank.notSet}
                </span>
              </div>
            </div>
          </div>

          <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded text-[#006B5F] focus:ring-[#006B5F]"
            />
            <span>{financeEn.requestDialog.confirmCheckbox}</span>
          </label>

          {errorMessage && (
            <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 text-center"
            >
              {financeEn.requestDialog.cancelBtn}
            </button>
            <button
              type="submit"
              disabled={!confirmed || isSubmitting}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#006B5F] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#005249] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>{financeEn.requestDialog.submittingBtn}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  <span>{financeEn.requestDialog.submitBtn}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
