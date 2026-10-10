'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWebSession } from '@/features/auth/session/useWebSession';
import {
  cancelPayoutRequest,
  getPayoutWorkspaceData,
  requestPayoutSettlement,
  updateBeneficiaryBank,
} from '../../services/operatorPayoutService';
import { isFinanceDemoAllowedInCurrentEnv } from '../../data/operatorRevenueDemoFixtures';
import { financeEn } from '../../resources/en';
import type {
  BeneficiaryBankDto,
  PayoutRequestDto,
  PayoutWorkspaceData,
  SettlementPeriodDto,
} from '../../types/payoutLifecycle';

import { SettlementPeriodsTable } from './SettlementPeriodsTable';
import { BeneficiaryBankCard } from './BeneficiaryBankCard';
import { PayoutRequestHistoryTable } from './PayoutRequestHistoryTable';
import { RequestPayoutDialog } from './RequestPayoutDialog';
import { CancelPayoutDialog } from './CancelPayoutDialog';

export function OperatorPayoutView() {
  const { context } = useWebSession();
  const searchParams = useSearchParams();

  const demoQuery = searchParams.get('demo') === '1';
  const isDemo = demoQuery && isFinanceDemoAllowedInCurrentEnv();
  const actorUserId = context?.userId;

  const [workspaceData, setWorkspaceData] = useState<PayoutWorkspaceData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriodForPayout, setSelectedPeriodForPayout] =
    useState<SettlementPeriodDto | null>(null);
  const [requestToCancel, setRequestToCancel] =
    useState<PayoutRequestDto | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getPayoutWorkspaceData({
        isDemo,
        demoActorUserId: actorUserId,
      });
      setWorkspaceData(data);
    } finally {
      setIsLoading(false);
    }
  }, [isDemo, actorUserId]);

  useEffect(() => {
    let isMounted = true;
    void getPayoutWorkspaceData({
      isDemo,
      demoActorUserId: actorUserId,
    }).then((data) => {
      if (isMounted) {
        setWorkspaceData(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [isDemo, actorUserId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Submit Payout Request (UC-46 Screen #92)
  const handleRequestPayoutSubmit = async (
    periodId: string,
    bankInfo: BeneficiaryBankDto
  ) => {
    const result = await requestPayoutSettlement(
      { periodId, bankInfo },
      { isDemo, demoActorUserId: actorUserId }
    );

    if (result.success) {
      showToast(result.message || financeEn.messages.MSG118);
      await loadData();
      return true;
    }
    return false;
  };

  // Cancel Payout Request
  const handleCancelRequestConfirm = async (requestId: string) => {
    const result = await cancelPayoutRequest(requestId, {
      isDemo,
      demoActorUserId: actorUserId,
    });

    if (result.success) {
      showToast(result.message || financeEn.messages.MSG129);
      await loadData();
      return true;
    }
    return false;
  };

  // Update Beneficiary Bank details
  const handleUpdateBank = async (updated: BeneficiaryBankDto) => {
    const result = await updateBeneficiaryBank(updated, {
      isDemo,
      demoActorUserId: actorUserId,
    });

    if (result.success) {
      showToast(financeEn.payouts.bank.savedSuccess);
      await loadData();
      return true;
    }
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div>
        <h1 className="text-xl font-bold text-[#00152A] tracking-tight">
          {financeEn.payouts.title}
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          {financeEn.payouts.subtitle}
        </p>
      </div>

      {/* Production NO_BACKEND Notice */}
      {!isDemo && (
        <div
          role="status"
          className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 text-xs text-sky-900"
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-sky-600 text-lg">
              info
            </span>
            <div>
              <p className="font-bold">
                {financeEn.payouts.pendingNoticeTitle}
              </p>
              <p className="mt-0.5 text-sky-700">
                {workspaceData?.pendingBackendNotice ||
                  financeEn.messages.PENDING_BE_INTEGRATION}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Demo Mode Notice */}
      {isDemo && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-xs text-amber-900">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-600 text-lg">
              science
            </span>
            <div>
              <p className="font-bold">
                {financeEn.payouts.demoNoticeTitle}
              </p>
              <p className="mt-0.5 text-amber-700">
                {financeEn.payouts.demoNoticeDesc}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-emerald-600 text-[18px]">
            check_circle
          </span>
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Semantic Error / Notice Banner */}
      {workspaceData?.errorMessage && (
        <div
          role="alert"
          className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-800 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-amber-600 text-[18px]">
            info
          </span>
          <span className="font-medium">{workspaceData.errorMessage}</span>
        </div>
      )}

      {/* Settlement Periods List (Screen #91) */}
      <SettlementPeriodsTable
        periods={workspaceData?.settlementPeriods || []}
        onRequestPayout={(period) => setSelectedPeriodForPayout(period)}
        isLoading={isLoading}
      />

      {/* Beneficiary Bank Account Area */}
      {workspaceData && (
        <BeneficiaryBankCard
          bankInfo={workspaceData.beneficiaryBank}
          onUpdateBank={handleUpdateBank}
          isLoading={isLoading}
        />
      )}

      {/* Payout Request History */}
      <PayoutRequestHistoryTable
        requests={workspaceData?.payoutRequests || []}
        onCancelRequest={(request) => setRequestToCancel(request)}
        isLoading={isLoading}
      />

      {/* Submit Payout Request Dialog (Screen #92) */}
      {workspaceData && (
        <RequestPayoutDialog
          isOpen={Boolean(selectedPeriodForPayout)}
          period={selectedPeriodForPayout}
          bankInfo={workspaceData.beneficiaryBank}
          onClose={() => setSelectedPeriodForPayout(null)}
          onSubmit={handleRequestPayoutSubmit}
        />
      )}

      {/* Cancel Payout Request Dialog */}
      <CancelPayoutDialog
        isOpen={Boolean(requestToCancel)}
        request={requestToCancel}
        onClose={() => setRequestToCancel(null)}
        onConfirmCancel={handleCancelRequestConfirm}
      />
    </div>
  );
}
