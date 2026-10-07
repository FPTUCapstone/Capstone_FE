'use client';

import { useState } from 'react';
import { financeEn } from '../../resources/en';
import type { BeneficiaryBankDto } from '../../types/payoutLifecycle';

interface BeneficiaryBankCardProps {
  bankInfo: BeneficiaryBankDto;
  onUpdateBank: (updated: BeneficiaryBankDto) => Promise<boolean>;
  isLoading?: boolean;
}

export function BeneficiaryBankCard({
  bankInfo,
  onUpdateBank,
  isLoading = false,
}: BeneficiaryBankCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftBank, setDraftBank] = useState<BeneficiaryBankDto>(bankInfo);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStartEdit = () => {
    setDraftBank(bankInfo);
    setErrorMessage(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setDraftBank(bankInfo);
    setErrorMessage(null);
    setIsEditing(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (
      !draftBank.accountHolder.trim() ||
      !draftBank.bankName.trim() ||
      !draftBank.accountNumber.trim()
    ) {
      setErrorMessage(financeEn.messages.MSG01);
      return;
    }

    const success = await onUpdateBank({
      ...draftBank,
      accountHolder: draftBank.accountHolder.trim().toUpperCase(),
      bankName: draftBank.bankName.trim(),
      accountNumber: draftBank.accountNumber.trim(),
    });

    if (success) {
      setIsEditing(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-[#00152A]">
            {financeEn.payouts.bank.title}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {financeEn.payouts.bank.subtitle}
          </p>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={handleStartEdit}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            <span>{financeEn.payouts.bank.editBtn}</span>
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="bank-holder"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                {financeEn.payouts.bank.accountHolder}
              </label>
              <input
                id="bank-holder"
                type="text"
                value={draftBank.accountHolder}
                onChange={(e) =>
                  setDraftBank((prev) => ({
                    ...prev,
                    accountHolder: e.target.value.toUpperCase(),
                  }))
                }
                placeholder="NGUYEN VAN AN"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium uppercase text-slate-800 transition-colors focus:border-[#006B5F] focus:outline-hidden"
              />
            </div>

            <div>
              <label
                htmlFor="bank-name"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                {financeEn.payouts.bank.bankName}
              </label>
              <input
                id="bank-name"
                type="text"
                value={draftBank.bankName}
                onChange={(e) =>
                  setDraftBank((prev) => ({
                    ...prev,
                    bankName: e.target.value,
                  }))
                }
                placeholder="Vietcombank"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 transition-colors focus:border-[#006B5F] focus:outline-hidden"
              />
            </div>

            <div>
              <label
                htmlFor="bank-number"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                {financeEn.payouts.bank.accountNumber}
              </label>
              <input
                id="bank-number"
                type="text"
                value={draftBank.accountNumber}
                onChange={(e) =>
                  setDraftBank((prev) => ({
                    ...prev,
                    accountNumber: e.target.value,
                  }))
                }
                placeholder="1029384756"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-medium text-slate-800 transition-colors focus:border-[#006B5F] focus:outline-hidden"
              />
            </div>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700"
            >
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              {financeEn.payouts.bank.cancelBtn}
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#006B5F] px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#005249]"
            >
              {financeEn.payouts.bank.saveBtn}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400">
              {financeEn.payouts.bank.accountHolder}
            </span>
            <p className="mt-1 text-xs font-bold text-[#00152A] uppercase">
              {bankInfo.accountHolder || '—'}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400">
              {financeEn.payouts.bank.bankName}
            </span>
            <p className="mt-1 text-xs font-bold text-[#00152A]">
              {bankInfo.bankName || '—'}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400">
              {financeEn.payouts.bank.accountNumber}
            </span>
            <p className="mt-1 text-xs font-bold font-mono text-[#00152A]">
              {bankInfo.accountNumber || '—'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
