'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ActionButton } from '@/components/ui/ActionButton';
import {
  type DirectRefundCase,
  type DirectRefundCaseEnvelope,
  completionLabel,
  formatDt,
  formatVnd,
  parseDirectRefundCaseEnvelope,
  sourceLabel,
} from '@/features/bookings/types/directRefund';
import { ROUTES } from '@/lib/routes';

type PageState =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'ready'; envelope: DirectRefundCaseEnvelope };

type MutationState = 'idle' | 'submitting' | 'error';

function localDateTime(iso: string): string {
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function statusBadge(status: DirectRefundCase['status']): { label: string; tone: string } {
  switch (status) {
    case 'AwaitingRecipient':
      return { label: 'Awaiting traveler bank account', tone: 'bg-slate-100 text-slate-700' };
    case 'AwaitingTransfer':
      return { label: 'Upload evidence & report transfer', tone: 'bg-amber-100 text-amber-800' };
    case 'AwaitingTravelerConfirmation':
      return { label: 'Awaiting traveler confirmation', tone: 'bg-blue-100 text-blue-800' };
    case 'Disputed':
      return { label: 'Disputed — under review', tone: 'bg-orange-100 text-orange-800' };
    case 'Completed':
      return { label: 'Completed', tone: 'bg-emerald-100 text-emerald-800' };
  }
}

function statusDescription(status: DirectRefundCase['status']): string {
  switch (status) {
    case 'AwaitingRecipient':
      return 'The traveler has not yet confirmed their bank account. No action required from you at this stage.';
    case 'AwaitingTransfer':
      return 'Please upload proof of transfer and report the bank transfer details below.';
    case 'AwaitingTravelerConfirmation':
      return 'You have reported the transfer. Waiting for the traveler to confirm receipt (72-hour window).';
    case 'Disputed':
      return 'The traveler has disputed the transfer. TripMate is reviewing the case.';
    case 'Completed':
      return 'The refund process is complete.';
  }
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`text-right font-semibold text-slate-800 ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </dd>
    </div>
  );
}

export function OperatorDirectRefundCasePage({ caseId }: { caseId: string }) {
  const [state, setState] = useState<PageState>({ phase: 'loading' });
  const [mutation, setMutation] = useState<MutationState>('idle');
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [mutationSuccess, setMutationSuccess] = useState<string | null>(null);
  const versionRef = useRef<string | null>(null);

  // Evidence upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedEvidenceIds, setUploadedEvidenceIds] = useState<number[]>([]);

  // Transfer report state
  const [reportedAmount, setReportedAmount] = useState('');
  const [bankReference, setBankReference] = useState('');
  const [transferDate, setTransferDate] = useState('');

  const load = useCallback(async () => {
    setState({ phase: 'loading' });
    try {
      const res = await fetch(
        `/api/v1/operator/direct-refunds/${encodeURIComponent(caseId)}`,
        { cache: 'no-store' },
      );
      const payload: unknown = await res.json().catch(() => null);
      if (!res.ok || !payload) {
        setState({
          phase: 'error',
          message: res.status === 404 ? 'Refund case not found.' : 'Could not load case. Please try again.',
        });
        return;
      }
      const inner =
        payload && typeof payload === 'object' && 'data' in payload
          ? (payload as { data: unknown }).data
          : payload;
      const envelope = parseDirectRefundCaseEnvelope({ serverNowUtc: new Date().toISOString(), case: inner });
      versionRef.current = envelope.case.rowVersion;
      const previous = envelope.case.pendingTransfer;
      if (previous && envelope.case.allowedActions.includes('ReportTransfer')) {
        setReportedAmount(String(previous.reportedAmountVnd));
        setBankReference(previous.bankReference);
        setTransferDate(localDateTime(previous.actualTransferredAtUtc));
      }
      setState({ phase: 'ready', envelope });
    } catch {
      setState({ phase: 'error', message: 'Could not load case. Please check your connection.' });
    }
  }, [caseId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function uploadEvidence() {
    if (!selectedFile) return;
    if (uploadedEvidenceIds.length >= 3) {
      setMutationError('Maximum 3 evidence files allowed.');
      return;
    }
    setMutation('submitting');
    setMutationError(null);
    setMutationSuccess(null);
    try {
      const form = new FormData();
      form.append('file', selectedFile);
      const res = await fetch(
        `/api/v1/operator/direct-refunds/${encodeURIComponent(caseId)}/evidence`,
        { method: 'POST', body: form, credentials: 'same-origin' },
      );
      const body: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const raw422 = body as Record<string, unknown> | null;
        const detail = raw422?.['detail'] ?? raw422?.['title'];
        setMutation('error');
        setMutationError(
          typeof detail === 'string'
            ? detail
            : res.status === 422
              ? 'File rejected by server (check format or size: max 5 MB, PDF/JPG/PNG).'
              : 'Could not upload evidence. Please try again.',
        );
        return;
      }
      // BE returns { evidenceId: 123 } (UploadDirectRefundEvidenceResponse); handle wrapped too
      const raw = body as Record<string, unknown> | null;
      const evidenceId: unknown =
        raw?.['evidenceId'] ?? (raw?.['data'] as Record<string, unknown> | undefined)?.['evidenceId'];
      if (typeof evidenceId === 'number' && Number.isSafeInteger(evidenceId)) {
        setUploadedEvidenceIds((prev) => [...prev, evidenceId]);
      }
      setSelectedFile(null);
      setMutation('idle');
      setMutationSuccess('Evidence uploaded. Review the transfer details and submit your report.');
    } catch {
      setMutation('error');
      setMutationError('Network error. Please try again.');
    }
  }

  async function reportTransfer(refundAmountVnd: number) {
    const amount = Number(reportedAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setMutationError('Please enter a valid transfer amount.');
      return;
    }
    if (amount > refundAmountVnd) {
      setMutationError(`Amount cannot exceed the refund amount (${formatVnd(refundAmountVnd)}).`);
      return;
    }
    if (!bankReference.trim()) {
      setMutationError('Bank reference is required.');
      return;
    }
    if (!transferDate) {
      setMutationError('Transfer date/time is required.');
      return;
    }
    if (new Date(transferDate) > new Date()) {
      setMutationError('Transfer date cannot be in the future.');
      return;
    }
    if (uploadedEvidenceIds.length === 0) {
      setMutationError('Please upload at least one evidence file first.');
      return;
    }
    setMutation('submitting');
    setMutationError(null);
    setMutationSuccess(null);
    try {
      const res = await fetch(
        `/api/v1/operator/direct-refunds/${encodeURIComponent(caseId)}/transfers`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            reportedAmountVnd: amount,
            bankReference: bankReference.trim(),
            actualTransferredAtUtc: new Date(transferDate).toISOString(),
            evidenceIds: uploadedEvidenceIds,
            expectedVersion: versionRef.current,
          }),
        },
      );
      if (!res.ok) {
        const err: unknown = await res.json().catch(() => null);
        const code =
          err && typeof err === 'object' && 'errorCode' in err
            ? String((err as { errorCode: unknown }).errorCode)
            : 'ERROR';
        setMutation('error');
        setMutationError(
          code === 'VERSION_CONFLICT'
            ? 'Case was updated concurrently. Reloading…'
            : 'Could not report transfer. Please try again.',
        );
        if (code === 'VERSION_CONFLICT') setTimeout(() => void load(), 1500);
        return;
      }
      setMutation('idle');
      setMutationSuccess('Transfer reported successfully. Waiting for traveler confirmation.');
      setUploadedEvidenceIds([]);
      setReportedAmount('');
      setBankReference('');
      setTransferDate('');
      await load();
    } catch {
      setMutation('error');
      setMutationError('Network error. Please try again.');
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={ROUTES.partner.refunds}
          className="text-sm font-semibold text-[#174B4A]"
        >
          ← Back to refunds
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-[#1C2928]">Direct Refund Case</h1>
        <p className="text-sm text-slate-500">Case #{caseId}</p>
      </div>

      {state.phase === 'loading' && (
        <p className="py-12 text-center text-sm text-slate-500">Loading…</p>
      )}

      {state.phase === 'error' && (
        <div className="rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-rose-700">{state.message}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-4 rounded-xl bg-[#174B4A] px-4 py-2 text-sm font-bold text-white"
          >
            Try again
          </button>
        </div>
      )}

      {state.phase === 'ready' && (() => {
        const { case: c } = state.envelope;
        const badge = statusBadge(c.status);
        return (
          <div className="space-y-4">
            {/* Status card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Booking</p>
                  <p className="mt-1 font-mono text-lg font-bold text-[#1C2928]">{c.bookingCode}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${badge.tone}`}>
                  {badge.label}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-600">{statusDescription(c.status)}</p>
            </div>

            {/* Core details */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <dl className="divide-y divide-slate-100 text-sm">
                <Row label="Refund amount" value={formatVnd(c.refundAmountVnd)} />
                <Row label="Reason" value={sourceLabel(c.sourceType)} />
                <Row label="Opened" value={formatDt(c.createdAtUtc)} />
                {c.transferDeadlineAtUtc && (
                  <Row label="Transfer deadline" value={formatDt(c.transferDeadlineAtUtc)} />
                )}
                {c.completedAtUtc && (
                  <Row label="Completed" value={formatDt(c.completedAtUtc)} />
                )}
                {c.completionMethod && (
                  <Row label="Closed by" value={completionLabel(c.completionMethod)} />
                )}
              </dl>
            </div>

            {/* Traveler bank account (shown once confirmed) */}
            {c.recipientBankCode && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
                <p className="font-semibold text-emerald-900">Traveler bank account</p>
                <dl className="mt-2 space-y-1">
                  <Row label="Bank" value={c.recipientBankCode} />
                  {c.recipientAccountNumberMasked && (
                    <Row label="Account" value={c.recipientAccountNumberMasked} mono />
                  )}
                  {c.recipientAccountHolder && (
                    <Row label="Account holder" value={c.recipientAccountHolder} />
                  )}
                </dl>
              </div>
            )}

            {/* Pending transfer info */}
            {c.pendingTransfer && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm space-y-2">
                <p className="font-semibold text-blue-900">Transfer reported</p>
                <dl className="space-y-1">
                  <Row label="Amount" value={formatVnd(c.pendingTransfer.reportedAmountVnd)} />
                  <Row label="Bank reference" value={c.pendingTransfer.bankReference} mono />
                  <Row label="Transferred at" value={formatDt(c.pendingTransfer.actualTransferredAtUtc)} />
                  <Row label="Confirmation deadline" value={formatDt(c.pendingTransfer.confirmationDeadlineAtUtc)} />
                </dl>
                {c.pendingTransfer.evidence.length > 0 && (
                  <p className="text-xs text-blue-700">
                    {c.pendingTransfer.evidence.length} evidence file(s) attached.
                  </p>
                )}
              </div>
            )}

            {/* Mutation feedback */}
            {mutationError && (
              <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">{mutationError}</p>
            )}
            {mutationSuccess && (
              <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{mutationSuccess}</p>
            )}

            {/* AwaitingTransfer: upload evidence + report transfer */}
            {c.allowedActions.includes('UploadEvidence') && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <h2 className="font-semibold text-[#1C2928]">1. Upload transfer evidence</h2>
                <p className="text-sm text-slate-500">
                  Upload a screenshot or PDF of your bank transfer confirmation (max 5 MB, PDF/JPG/PNG).
                </p>

                {uploadedEvidenceIds.length > 0 && (
                  <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                    {uploadedEvidenceIds.length} file(s) uploaded for this report.
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                    className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#174B4A] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
                  />
                  <ActionButton
                    type="button"
                    variant="secondary"
                    disabled={!selectedFile || mutation === 'submitting'}
                    onClick={() => void uploadEvidence()}
                  >
                    {mutation === 'submitting' ? 'Uploading…' : 'Upload'}
                  </ActionButton>
                </div>
              </div>
            )}

            {c.allowedActions.includes('ReportTransfer') && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <h2 className="font-semibold text-[#1C2928]">2. Report the transfer</h2>

                <label className="block">
                  <span className="text-xs text-slate-500">
                    Amount transferred (VND) — max {formatVnd(c.refundAmountVnd)}
                  </span>
                  <input
                    type="number"
                    min="1"
                    max={c.refundAmountVnd}
                    value={reportedAmount}
                    onChange={(e) => setReportedAmount(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#174B4A]"
                    placeholder={String(c.refundAmountVnd)}
                  />
                  {reportedAmount && Number(reportedAmount) > c.refundAmountVnd && (
                    <p className="mt-1 text-xs text-rose-600">Cannot exceed {formatVnd(c.refundAmountVnd)}</p>
                  )}
                </label>

                <label className="block">
                  <span className="text-xs text-slate-500">Bank reference / transaction ID</span>
                  <input
                    type="text"
                    value={bankReference}
                    onChange={(e) => setBankReference(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#174B4A]"
                    placeholder="FT26330123456"
                    maxLength={200}
                  />
                </label>

                <label className="block">
                  <span className="text-xs text-slate-500">Date &amp; time of transfer (cannot be future)</span>
                  <input
                    type="datetime-local"
                    value={transferDate}
                    max={localDateTime(new Date().toISOString())}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#174B4A]"
                  />
                </label>

                <ActionButton
                  type="button"
                  variant="primary"
                  disabled={mutation === 'submitting' || uploadedEvidenceIds.length === 0}
                  onClick={() => void reportTransfer(c.refundAmountVnd)}
                >
                  {mutation === 'submitting' ? 'Submitting…' : 'Report transfer'}
                </ActionButton>

                {uploadedEvidenceIds.length === 0 && (
                  <p className="text-xs text-amber-700">Upload at least one evidence file before reporting.</p>
                )}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
