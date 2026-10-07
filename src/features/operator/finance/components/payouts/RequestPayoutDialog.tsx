'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { formatVndCurrency } from '../../utils/financeFormat';
import { financeEn } from '../../resources/en';
import type {
  BeneficiaryBankDto,
  SettlementPeriodDto,
} from '../../types/payoutLifecycle';

interface RequestPayoutDialogProps {
  isOpen: boolean;
  period: SettlementPeriodDto | null;
  bankInfo: BeneficiaryBankDto;
  onClose: () => void;
  onSubmit: (periodId: string, bankInfo: BeneficiaryBankDto) => Promise<boolean>;
}

export function RequestPayoutDialog({
  isOpen,
  period,
  bankInfo,
  onClose,
  onSubmit,
}: RequestPayoutDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setConfirmed(false);
    setErrorMessage(null);
    onClose();
  }, [onClose]);

  // Escape key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen || !period) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmed) return;

    if (
      !bankInfo.accountHolder ||
      !bankInfo.bankName ||
      !bankInfo.accountNumber
    ) {
      setErrorMessage(financeEn.messages.MSG01);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const success = await onSubmit(period.id, bankInfo);
      if (success) {
        handleClose();
      }
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
      <div
        ref={dialogRef}
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl transition-all"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 id="request-payout-title" className="text-base font-bold text-[#00152A]">
              {financeEn.requestDialog.title}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {financeEn.requestDialog.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Period Summary Breakdown */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs space-y-2.5">
            <div className="flex justify-between">
              <span className="font-semibold text-slate-500">
                {financeEn.requestDialog.periodLabel}:
              </span>
              <span className="font-bold text-[#00152A]">
                {period.periodLabel}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-500">
                {financeEn.requestDialog.completedToursLabel}:
              </span>
              <span className="font-semibold text-slate-800">
                {period.completedToursCount}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-500">
                {financeEn.requestDialog.grossRevenueLabel}:
              </span>
              <span className="font-semibold text-slate-800">
                {formatVndCurrency(period.grossRevenue)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-500">
                {financeEn.requestDialog.commissionLabel}:
              </span>
              <span className="font-semibold text-amber-700">
                {formatVndCurrency(period.commission)}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
              <span className="text-xs font-bold text-[#00152A]">
                {financeEn.requestDialog.payableAmountLabel}:
              </span>
              <span className="text-base font-extrabold text-[#006B5F]">
                {formatVndCurrency(period.payableNetAmount)}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 italic">
            {financeEn.requestDialog.payableAmountNotice}
          </p>

          {/* Destination Bank Account Card */}
          <div className="rounded-xl border border-slate-200 p-3.5 bg-white text-xs">
            <h3 className="font-bold text-[#00152A] mb-2">
              {financeEn.requestDialog.bankConfirmationTitle}
            </h3>
            <div className="grid grid-cols-2 gap-2 text-slate-600">
              <div>
                <span className="text-slate-400 block text-[10px]">
                  {financeEn.payouts.bank.accountHolder}
                </span>
                <span className="font-bold uppercase text-[#00152A]">
                  {bankInfo.accountHolder || 'Not configured'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">
                  {financeEn.payouts.bank.bankName}
                </span>
                <span className="font-semibold text-[#00152A]">
                  {bankInfo.bankName || 'Not configured'}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block text-[10px]">
                  {financeEn.payouts.bank.accountNumber}
                </span>
                <span className="font-mono font-bold text-[#00152A]">
                  {bankInfo.accountNumber || 'Not configured'}
                </span>
              </div>
            </div>
          </div>

          {/* CR-05 Confirmation Checkbox */}
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
            <div
              role="alert"
              className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700"
            >
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Actions (CR-13: mutation disabled when in-flight) */}
          <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              {financeEn.requestDialog.cancelBtn}
            </button>
            <button
              type="submit"
              disabled={!confirmed || isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#006B5F] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#005249] disabled:cursor-not-allowed disabled:opacity-40"
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
