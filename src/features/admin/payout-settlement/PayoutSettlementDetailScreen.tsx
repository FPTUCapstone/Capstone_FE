'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { ROUTES } from '@/lib/routes';

import { formatPeriodRange, formatRequestedAt, formatVnd } from '../payout-records/payoutRecords';
import { formatCommissionRate } from '../payout-review/payoutReview';
import { PayoutSettlementAuthorizeDialog } from './PayoutSettlementAuthorizeDialog';
import {
  SETTLEMENT_MESSAGES,
  authorizeBlockedReason,
  canAuthorize,
  failureMessage,
  formatSettlementStatus,
  gatewayStateText,
  type SettlementDetail,
} from './payoutSettlement';
import { PayoutSettlementError, fetchSettlementDetail } from './payoutSettlementService';
import { InfoCard, SectionTitle, StatusBadge } from './settlementUi';
import { useSettlementPolling } from './useSettlementPolling';

type LoadState = 'loading' | 'ready' | 'not-found' | 'forbidden' | 'unavailable' | 'signed-out';
type LoadMode = 'initial' | 'refresh' | 'poll';
type Toast = { tone: 'success' | 'warning' | 'error'; message: string };

export function PayoutSettlementDetailScreen({ payoutId }: { payoutId: string }) {
  const { replace } = useRouter();
  const [detail, setDetail] = useState<SettlementDetail | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [toast, setToast] = useState<Toast | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const latestRequest = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);

  // Every load supersedes the previous one: the older request is aborted and, if its promise still settles
  // (for example a transport that ignores the signal), its result is dropped by the request counter.
  const load = useCallback((mode: LoadMode): Promise<void> => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const requestId = ++latestRequest.current;
    const isCurrent = () => requestId === latestRequest.current && !controller.signal.aborted;

    return fetchSettlementDetail(payoutId, controller.signal)
      .then((response) => {
        if (!isCurrent()) return;
        setDetail(response);
        setState('ready');
      })
      .catch((error: unknown) => {
        if (!isCurrent() || (error instanceof DOMException && error.name === 'AbortError')) return;
        const status = error instanceof PayoutSettlementError ? error.status : 0;
        if (status === 401) {
          setState('signed-out');
          replace(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(ROUTES.admin.payoutSettlementDetails(payoutId))}`);
        } else if (status === 404) {
          setState('not-found');
        } else if (status === 403) {
          setState('forbidden');
        } else if (mode === 'initial') {
          setState('unavailable');
        } else if (mode === 'refresh') {
          setToast({ tone: 'warning', message: SETTLEMENT_MESSAGES.unavailable });
        }
      });
  }, [payoutId, replace]);

  useEffect(() => {
    void load('initial');
    return () => {
      latestRequest.current += 1;
      controllerRef.current?.abort();
    };
  }, [load]);

  const keepPolling = state === 'ready' && detail?.status === 'SettlementProcessing'
    && detail.outcome?.reconciliationRequired !== true;
  useSettlementPolling(keepPolling, () => load('poll'));

  const retry = () => { setState('loading'); setDetail(null); void load('initial'); };
  const refresh = () => { setToast(null); void load('refresh'); };

  const onAuthorized = () => {
    setDialogOpen(false);
    setToast({ tone: 'success', message: SETTLEMENT_MESSAGES.authorized });
    void load('refresh');
  };

  // A definitive refusal closes the dialog. The server's answer is authoritative, so the detail is reloaded
  // (except when the payout or the session is gone).
  const onRefused = (error: PayoutSettlementError) => {
    setDialogOpen(false);
    if (error.status === 401) {
      setState('signed-out');
      replace(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(ROUTES.admin.payoutSettlementDetails(payoutId))}`);
      return;
    }
    if (error.status === 404) { setState('not-found'); return; }
    if (error.status === 403) { setState('forbidden'); return; }
    if (error.status === 409) {
      setToast({ tone: 'warning', message: SETTLEMENT_MESSAGES.conflict });
    } else {
      setToast({ tone: 'error', message: refusalMessage(error.errorCode) });
    }
    void load('refresh');
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8">
      <header className="mb-6">
        <Link
          href={ROUTES.admin.payoutSettlement}
          className="inline-flex items-center gap-1 text-sm font-bold text-[#006b5f] hover:underline"
        >
          ← Back to Payout Settlement
        </Link>
        <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-[#006b5f]">Financial governance</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-extrabold text-[#00152a]">{detail?.payoutCode ?? `PO-${payoutId}`}</h1>
          {detail ? <StatusBadge status={detail.status} /> : null}
          {state === 'ready' ? (
            <button
              type="button"
              onClick={refresh}
              className="ml-auto rounded-xl border border-[#9fb3c8] px-4 py-2 text-sm font-bold text-[#243b53] hover:bg-[#edf2f7]"
            >
              Refresh
            </button>
          ) : null}
        </div>
        {detail ? (
          <p className="mt-2 text-sm text-[#486581]">
            {detail.tourOperator.companyName} · {formatPeriodRange(detail.settlementPeriod.startDate, detail.settlementPeriod.endDate)}
          </p>
        ) : null}
      </header>

      {toast ? <div className="mb-4"><FeedbackAlert tone={toast.tone}>{toast.message}</FeedbackAlert></div> : null}

      {state === 'signed-out' ? <div role="status" className="rounded-2xl border border-[#d7e2ef] bg-white p-8 text-center text-[#486581]">Redirecting to sign-in…</div> : null}
      {state === 'loading' ? <div role="status" className="rounded-2xl border border-[#d7e2ef] bg-white p-8 text-center text-[#486581]">Loading payout details…</div> : null}
      {state === 'not-found' ? <FeedbackAlert tone="error" title="Payout unavailable">{SETTLEMENT_MESSAGES.notFound}</FeedbackAlert> : null}
      {state === 'forbidden' ? <FeedbackAlert tone="error" title="Access denied">{SETTLEMENT_MESSAGES.forbidden}</FeedbackAlert> : null}
      {state === 'unavailable' ? (
        <FeedbackAlert tone="error" title="Unable to load the payout details">
          <p>{SETTLEMENT_MESSAGES.unavailable}</p>
          <button type="button" onClick={retry} className="mt-2 rounded-lg border border-current px-3 py-1 font-bold">Retry</button>
        </FeedbackAlert>
      ) : null}

      {state === 'ready' && detail ? <DetailSections detail={detail} onAuthorize={() => setDialogOpen(true)} /> : null}
      {detail ? (
        <PayoutSettlementAuthorizeDialog
          open={dialogOpen && state === 'ready'}
          detail={detail}
          onClose={() => setDialogOpen(false)}
          onAuthorized={onAuthorized}
          onRefused={onRefused}
        />
      ) : null}
      {detail ? (
        <p role="status" aria-live="polite" className="sr-only">
          Payout {detail.payoutCode} status: {formatSettlementStatus(detail.status)}
        </p>
      ) : null}
    </main>
  );
}

function refusalMessage(errorCode: string | undefined): string {
  switch (errorCode) {
    case 'payout.beneficiary_incomplete': return SETTLEMENT_MESSAGES.beneficiaryIncomplete;
    case 'payout.bank_bin_unresolved': return SETTLEMENT_MESSAGES.bankBinUnresolved;
    case 'payout.amount_invalid': return SETTLEMENT_MESSAGES.amountInvalid;
    default: return SETTLEMENT_MESSAGES.authorizeFailed;
  }
}

const userLabel = (role: string, id: string | null) => (id === null ? SETTLEMENT_MESSAGES.notAvailable : `${role} user #${id}`);

function DetailSections({ detail, onAuthorize }: { detail: SettlementDetail; onAuthorize: () => void }) {
  const { beneficiary } = detail;
  return (
    <div className="space-y-6">
      <section aria-label="Amount breakdown" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <InfoCard label="Gross Revenue" value={formatVnd(detail.grossRevenue)} />
        <InfoCard label="Commission" value={`${formatVnd(detail.commissionAmount)} (${formatCommissionRate(detail.commissionRate)})`} />
        <InfoCard label="Net Payout" value={formatVnd(detail.netPayoutAmount)} />
      </section>

      <ActionArea detail={detail} onAuthorize={onAuthorize} />

      {detail.outcome ? <OutcomePanel detail={detail} outcome={detail.outcome} /> : null}

      <section aria-label="Payout timeline" className="rounded-2xl border border-[#d7e2ef] bg-white p-5 shadow-sm">
        <SectionTitle>Timeline</SectionTitle>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Fact label="Requested" value={formatRequestedAt(detail.requestedAtUtc)} />
          <Fact label="Reviewed" value={formatRequestedAt(detail.reviewedAtUtc)} />
          <Fact label="Reviewed by" value={userLabel('Staff', detail.reviewedBy)} />
          {detail.settlementAuthorizedAtUtc !== null || detail.settlementAuthorizedBy !== null ? (
            <>
              <Fact label="Settlement authorized" value={formatRequestedAt(detail.settlementAuthorizedAtUtc)} />
              <Fact label="Authorized by" value={userLabel('Administrator', detail.settlementAuthorizedBy)} />
            </>
          ) : null}
        </dl>
      </section>

      <section aria-label="Beneficiary bank information" className="rounded-2xl border border-[#d7e2ef] bg-white p-5 shadow-sm">
        <SectionTitle>Beneficiary</SectionTitle>
        <dl className="mt-3 grid gap-3 sm:grid-cols-3">
          <Fact label="Bank Name" value={beneficiary.bankName ?? SETTLEMENT_MESSAGES.notAvailable} />
          <Fact label="Account Holder" value={beneficiary.accountHolder ?? SETTLEMENT_MESSAGES.notAvailable} />
          <Fact label="Account Number" value={beneficiary.maskedAccountNumber ?? SETTLEMENT_MESSAGES.notAvailable} mono />
        </dl>
      </section>
    </div>
  );
}

const NO_ACTION_TEXT: Record<Exclude<SettlementDetail['status'], 'ApprovedForSettlement'>, string> = {
  SettlementProcessing: 'The transfer runs automatically. This page refreshes by itself until it finishes.',
  Settled: 'This payout has been settled. There is no further action.',
  SettlementFailed: 'This payout failed to settle. There is no further action here in this release.',
};

function ActionArea({ detail, onAuthorize }: { detail: SettlementDetail; onAuthorize: () => void }) {
  if (detail.status !== 'ApprovedForSettlement') {
    return (
      <section aria-label="Settlement action" className="rounded-2xl border border-[#d7e2ef] bg-white p-5 shadow-sm">
        <p className="text-sm text-[#486581]">
          This payout is <strong className="text-[#00152a]">{formatSettlementStatus(detail.status)}</strong>.{' '}
          {NO_ACTION_TEXT[detail.status]}
        </p>
      </section>
    );
  }

  const blockedReason = authorizeBlockedReason(detail);
  return (
    <section aria-label="Settlement action" className="rounded-2xl border border-[#d7e2ef] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-[#486581]">This payout is approved and waiting for your authorization.</p>
        <button
          type="button"
          disabled={!canAuthorize(detail)}
          aria-describedby={blockedReason ? 'authorize-blocked-reason' : undefined}
          onClick={onAuthorize}
          className="ml-auto min-h-11 rounded-xl bg-[#006b5f] px-4 text-sm font-bold text-white hover:bg-[#005048] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006b5f]"
        >
          Authorize settlement
        </button>
      </div>
      {blockedReason ? (
        <p id="authorize-blocked-reason" className="mt-3 rounded-xl border border-[#f2d8b3] bg-[#fbf3e8] p-3 text-sm text-[#5c3a0a]">
          {blockedReason}
        </p>
      ) : null}
    </section>
  );
}

function OutcomePanel({ detail, outcome }: { detail: SettlementDetail; outcome: NonNullable<SettlementDetail['outcome']> }) {
  return (
    <section aria-label="Settlement outcome" className="rounded-2xl border border-[#d7e2ef] bg-white p-5 shadow-sm">
      <SectionTitle>Settlement outcome</SectionTitle>
      <dl className="mt-3 grid gap-3 sm:grid-cols-3">
        <Fact label="Status" value={formatSettlementStatus(detail.status)} />
        <Fact label="Transfer" value={gatewayStateText(outcome.gatewayState)} />
        <Fact label="Sent to the bank" value={formatRequestedAt(outcome.submittedAtUtc)} />
      </dl>

      {detail.status === 'SettlementFailed' ? (
        <div className="mt-4 rounded-xl border border-[#f3a79d] bg-[#fdecef] p-4">
          <p className="text-sm font-bold text-[#8c1030]">{failureMessage(outcome.failureCode)}</p>
          {outcome.failureCode ? (
            <p className="mt-1 text-xs text-[#8c1030]">Support code: <span className="font-mono">{outcome.failureCode}</span></p>
          ) : null}
          <p className="mt-2 text-xs text-[#486581]">This payout cannot be retried from here in this release.</p>
        </div>
      ) : null}

      {outcome.reconciliationRequired ? (
        <div role="alert" className="mt-4 rounded-xl border border-[#f2d8b3] bg-[#fbf3e8] p-4 text-sm text-[#5c3a0a]">
          <p className="font-bold">Manual reconciliation required</p>
          <p className="mt-1">
            The system stopped checking after 24 hours without a final answer from the payment provider. The payout stays
            Processing and no second transfer is created automatically. Finance must reconcile payout{' '}
            <span className="font-mono font-bold">{detail.payoutCode}</span> with the payment provider.
          </p>
        </div>
      ) : null}
    </section>
  );
}

function Fact({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-[#627d98]">{label}</dt>
      <dd className={`mt-1 text-sm text-[#102a43] ${mono ? 'font-mono' : ''}`}>{value}</dd>
    </div>
  );
}
