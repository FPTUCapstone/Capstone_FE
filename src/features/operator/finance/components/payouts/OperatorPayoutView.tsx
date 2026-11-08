'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWebSession } from '@/features/auth/session/useWebSession';
import { ROUTES } from '@/lib/routes';
import {
  getBeneficiaryBankAccount,
  PayoutLoadError,
  updateBeneficiaryBankAccount,
} from '../../services/operatorPayoutService';
import { isFinanceDemoAllowedInCurrentEnv } from '../../data/operatorRevenueDemoFixtures';
import { financeEn } from '../../resources/en';
import type {
  BeneficiaryBankAccountDto,
  BeneficiaryBankAccountInput,
} from '../../types/payoutLifecycle';

import { BeneficiaryBankCard } from './BeneficiaryBankCard';

const EMPTY_BANK: BeneficiaryBankAccountDto = {
  bankName: null,
  accountHolderName: null,
  maskedAccountNumber: null,
  updatedAtUtc: null,
};

/**
 * Beneficiary bank account settings for the Tour Operator finance workspace
 * (`/partner/payouts`). The UC-46 request-flow sections (available balance, settlement months,
 * payout request history, request/cancel dialogs) were removed along with that model
 * (DAILY-PAYOUT-TRANSFER, SRS v11). The new model's settlement history is a separate screen,
 * `/partner/payout-settlements` (src/features/operator/payout-settlements).
 */
export function OperatorPayoutView() {
  const { context } = useWebSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const demoQuery = searchParams.get('demo') === '1';
  const isDemo = demoQuery && isFinanceDemoAllowedInCurrentEnv();
  const actorUserId = context?.userId;

  const [bankInfo, setBankInfo] = useState<BeneficiaryBankAccountDto>(EMPTY_BANK);
  const [isLoadingBank, setIsLoadingBank] = useState(true);
  const [bankError, setBankError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // A 401 means the session has expired server-side.
  const redirectToSignInIfExpired = useCallback(
    (error: unknown): boolean => {
      if (error instanceof PayoutLoadError && error.status === 401) {
        router.replace(ROUTES.signIn);
        return true;
      }
      return false;
    },
    [router]
  );

  const loadBank = useCallback(async () => {
    try {
      const data = await getBeneficiaryBankAccount({ isDemo, demoActorUserId: actorUserId });
      setBankInfo(data);
      setBankError(null);
    } catch (error) {
      if (redirectToSignInIfExpired(error)) return;
      setBankError(financeEn.messages.MSG127);
    } finally {
      setIsLoadingBank(false);
    }
  }, [isDemo, actorUserId, redirectToSignInIfExpired]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadBank();
  }, [loadBank]);

  const handleUpdateBank = async (updated: BeneficiaryBankAccountInput) => {
    const result = await updateBeneficiaryBankAccount(updated, { isDemo, demoActorUserId: actorUserId });
    if (result.success) {
      showToast(financeEn.payouts.bank.savedSuccess);
      await loadBank();
      return true;
    }
    return false;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#00152A] tracking-tight">{financeEn.payouts.title}</h1>
        <p className="mt-1 text-xs text-slate-500">{financeEn.payouts.subtitle}</p>
      </div>

      {isDemo && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-xs text-amber-900">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-600 text-lg">science</span>
            <div>
              <p className="font-bold">{financeEn.payouts.demoNoticeTitle}</p>
              <p className="mt-0.5 text-amber-700">{financeEn.payouts.demoNoticeDesc}</p>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div
          role="status"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {bankError ? (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center justify-between gap-3">
          <span>{bankError}</span>
          <button type="button" onClick={() => void loadBank()} className="font-semibold underline">
            Retry
          </button>
        </div>
      ) : (
        <BeneficiaryBankCard bankInfo={bankInfo} onUpdateBank={handleUpdateBank} isLoading={isLoadingBank} />
      )}
    </div>
  );
}
