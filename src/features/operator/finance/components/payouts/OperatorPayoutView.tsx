'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWebSession } from '@/features/auth/session/useWebSession';
import {
  cancelPayout,
  getAvailableBalance,
  getBeneficiaryBankAccount,
  getPayoutHistory,
  getSettlementMonths,
  requestPayout,
  updateBeneficiaryBankAccount,
} from '../../services/operatorPayoutService';
import { isFinanceDemoAllowedInCurrentEnv } from '../../data/operatorRevenueDemoFixtures';
import { formatVndCurrency } from '../../utils/financeFormat';
import { financeEn } from '../../resources/en';
import type {
  AvailableBalanceDto,
  BeneficiaryBankAccountDto,
  BeneficiaryBankAccountInput,
  PayoutHistoryItemDto,
  SettlementMonthDto,
} from '../../types/payoutLifecycle';

import { SettlementMonthsTable } from './SettlementMonthsTable';
import { BeneficiaryBankCard } from './BeneficiaryBankCard';
import { PayoutRequestHistoryTable } from './PayoutRequestHistoryTable';
import { RequestPayoutDialog } from './RequestPayoutDialog';
import { CancelPayoutDialog } from './CancelPayoutDialog';

const EMPTY_BANK: BeneficiaryBankAccountDto = {
  bankName: null,
  accountHolderName: null,
  maskedAccountNumber: null,
  updatedAtUtc: null,
};

const EMPTY_BALANCE: AvailableBalanceDto = {
  periodCount: 0,
  paymentsReceived: 0,
  discountsGiven: 0,
  refundedAmount: 0,
  netSales: 0,
  commissionAmount: 0,
  adjustmentsOutstanding: 0,
  payableNetAmount: 0,
  requestable: false,
  blockReason: null,
  activePayoutCode: null,
};

export function OperatorPayoutView() {
  const { context } = useWebSession();
  const searchParams = useSearchParams();

  const demoQuery = searchParams.get('demo') === '1';
  const isDemo = demoQuery && isFinanceDemoAllowedInCurrentEnv();
  const actorUserId = context?.userId;

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [months, setMonths] = useState<SettlementMonthDto[]>([]);
  const [balance, setBalance] = useState<AvailableBalanceDto>(EMPTY_BALANCE);
  const [bankInfo, setBankInfo] = useState<BeneficiaryBankAccountDto>(EMPTY_BANK);
  const [history, setHistory] = useState<PayoutHistoryItemDto[]>([]);

  const [isLoadingMonths, setIsLoadingMonths] = useState(true);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [isLoadingBank, setIsLoadingBank] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const [monthsError, setMonthsError] = useState<string | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [bankError, setBankError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState<PayoutHistoryItemDto | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // These never set isLoading(true) themselves — only the handler/effect that triggers a load
  // does that (synchronously, outside any effect body), consistent with the OperatorRevenueView
  // pattern: effects may only set state after an await, never as the first synchronous act.
  const loadMonths = useCallback(async () => {
    try {
      const data = await getSettlementMonths(year, { isDemo, demoActorUserId: actorUserId });
      setMonths(data);
      setMonthsError(null);
    } catch {
      setMonthsError(financeEn.messages.MSG127);
    } finally {
      setIsLoadingMonths(false);
    }
  }, [year, isDemo, actorUserId]);

  const loadBalance = useCallback(async () => {
    try {
      const data = await getAvailableBalance({ isDemo, demoActorUserId: actorUserId });
      setBalance(data);
      setBalanceError(null);
    } catch {
      setBalanceError(financeEn.messages.MSG127);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [isDemo, actorUserId]);

  const loadBank = useCallback(async () => {
    try {
      const data = await getBeneficiaryBankAccount({ isDemo, demoActorUserId: actorUserId });
      setBankInfo(data);
      setBankError(null);
    } catch {
      setBankError(financeEn.messages.MSG127);
    } finally {
      setIsLoadingBank(false);
    }
  }, [isDemo, actorUserId]);

  const loadHistory = useCallback(async () => {
    try {
      const data = await getPayoutHistory(1, 20, { isDemo, demoActorUserId: actorUserId });
      setHistory(data.items);
      setHistoryError(null);
    } catch {
      setHistoryError(financeEn.messages.MSG127);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [isDemo, actorUserId]);

  // The catch block in each load function only ever runs after its internal `await` settles
  // (there is no synchronous code before that await that could throw), so calling these from
  // an effect is safe despite the lint rule's conservative static check, which cannot see that
  // guarantee through useCallback. Same category of false positive as the UC-44 requestToken case.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadMonths();
  }, [loadMonths]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadBalance();
  }, [loadBalance]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadBank();
  }, [loadBank]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadHistory();
  }, [loadHistory]);

  const handleYearChange = (nextYear: number) => {
    setIsLoadingMonths(true);
    setYear(nextYear);
  };

  const handleRequestPayoutSubmit = async () => {
    const result = await requestPayout({ isDemo, demoActorUserId: actorUserId });
    if (result.success) {
      showToast(financeEn.messages.MSG129);
      await Promise.all([loadMonths(), loadBalance(), loadHistory()]);
    }
    return { success: result.success, errorCode: result.errorCode };
  };

  const handleCancelRequestConfirm = async (payoutCode: string) => {
    const result = await cancelPayout(payoutCode, { isDemo, demoActorUserId: actorUserId });
    if (result.success) {
      showToast(financeEn.messages.MSG129);
      await Promise.all([loadMonths(), loadBalance(), loadHistory()]);
    }
    return { success: result.success, errorCode: result.errorCode };
  };

  const handleUpdateBank = async (updated: BeneficiaryBankAccountInput) => {
    const result = await updateBeneficiaryBankAccount(updated, { isDemo, demoActorUserId: actorUserId });
    if (result.success) {
      showToast(financeEn.payouts.bank.savedSuccess);
      await loadBank();
      return true;
    }
    return false;
  };

  const claimedMonths = months.filter((m) => m.coverage === 'AvailableBalance');

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
        <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* "Available to withdraw" summary — aggregates every outstanding closed month at once. */}
      <div className="rounded-2xl border border-[#006B5F]/20 bg-[#006B5F]/5 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">{financeEn.payouts.availableToWithdraw}</p>
            <p className="mt-1 text-2xl font-extrabold text-[#006B5F]">{formatVndCurrency(balance.payableNetAmount)}</p>
          </div>
          <button
            type="button"
            onClick={() => setIsRequestDialogOpen(true)}
            disabled={!balance.requestable || isLoadingBalance}
            title={balance.activePayoutCode ?? undefined}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#006B5F] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#005249] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[16px]">send</span>
            <span>{financeEn.payouts.months.btnRequestPayout}</span>
          </button>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">{financeEn.payouts.availableToWithdrawHelp}</p>
        {balanceError && (
          <div role="alert" className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800">
            <span>{balanceError}</span>
            <button type="button" onClick={() => void loadBalance()} className="font-semibold underline">
              Retry
            </button>
          </div>
        )}
      </div>

      {monthsError ? (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center justify-between gap-3">
          <span>{monthsError}</span>
          <button type="button" onClick={() => void loadMonths()} className="font-semibold underline">
            Retry
          </button>
        </div>
      ) : (
        <SettlementMonthsTable
          months={months}
          year={year}
          onYearChange={handleYearChange}
          isLoading={isLoadingMonths}
        />
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

      {historyError ? (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center justify-between gap-3">
          <span>{historyError}</span>
          <button type="button" onClick={() => void loadHistory()} className="font-semibold underline">
            Retry
          </button>
        </div>
      ) : (
        <PayoutRequestHistoryTable
          requests={history}
          onCancelRequest={(request) => setRequestToCancel(request)}
          isLoading={isLoadingHistory}
        />
      )}

      <RequestPayoutDialog
        isOpen={isRequestDialogOpen}
        balance={isRequestDialogOpen ? balance : null}
        claimedMonths={claimedMonths}
        bankInfo={bankInfo}
        onClose={() => setIsRequestDialogOpen(false)}
        onSubmit={handleRequestPayoutSubmit}
      />

      <CancelPayoutDialog
        isOpen={Boolean(requestToCancel)}
        request={requestToCancel}
        onClose={() => setRequestToCancel(null)}
        onConfirmCancel={handleCancelRequestConfirm}
      />
    </div>
  );
}
