'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { ModerationDialog } from '@/features/admin/tour-reviews/components/ModerationDialog';
import { readOutstandingAmountVnd } from '../moderationProblem';
import { adminUserAccountsEn } from '../resources/en';

const TOAST_DURATION_MS = 8000;
const vndNumber = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });

interface AccountModerationFormProps {
  accountId: string;
  account: { fullName: string; email: string | null; role: string; status: string };
  locked: boolean;
  currentLock?: { reason: string | null; actor: string; at: string };
}

export function AccountModerationForm({ accountId, account, locked, currentLock }: AccountModerationFormProps) {
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const inFlight = useRef(false);
  const reasonInput = useRef<HTMLTextAreaElement>(null);
  const dialogId = useId();
  const action = locked ? 'unlock' : 'lock';
  const copy = adminUserAccountsEn.moderation;
  const actionCopy = copy[action];
  const validReason = Boolean(reason.trim()) && reason.length <= 200;

  const closeConfirmation = useCallback(() => {
    if (!inFlight.current) setConfirmationOpen(false);
  }, []);

  useEffect(() => {
    if (!successMessage) return;
    reasonInput.current?.focus();
    const timer = setTimeout(() => setSuccessMessage(''), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [successMessage]);

  async function confirmModeration() {
    if (inFlight.current || !confirmationOpen || !validReason) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    setSuccessMessage('');
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(accountId)}/${action}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason }),
      });
      if (!response.ok) {
        const problem: unknown = await response.json().catch(() => null);
        const outstandingAmount = locked && response.status === 409 ? readOutstandingAmountVnd(problem) : null;
        const title = problem && typeof problem === 'object' && 'title' in problem && typeof problem.title === 'string'
          ? problem.title
          : copy.updateFailed;
        setError(outstandingAmount === null ? title : copy.messages.MSG199(vndNumber.format(outstandingAmount)));
        return;
      }
      setReason('');
      setSuccessMessage(locked ? copy.messages.MSG190 : copy.messages.MSG189);
      router.refresh();
    } catch {
      setError(copy.unavailable);
    } finally {
      setConfirmationOpen(false);
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <>
      <form className="space-y-3" onSubmit={(event) => {
        event.preventDefault();
        if (!validReason || inFlight.current || confirmationOpen) return;
        setError('');
        setConfirmationOpen(true);
      }}>
        {!locked && (
          <label className="block text-xs font-semibold text-brand-textPrimary">
            {copy.lock.suggestedReasonLabel}
            <select
              className="mt-1.5 block min-h-11 w-full rounded-xl border border-brand-border bg-brand-surface px-3 text-sm font-normal text-brand-textPrimary focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
              value={copy.lock.suggestedReasons.find((item) => item === reason) ?? ''}
              onChange={(event) => {
                if (event.target.value) setReason(event.target.value);
              }}
              disabled={busy || confirmationOpen}
            >
              <option value="" disabled>{copy.lock.selectReasonLabel}</option>
              {copy.lock.suggestedReasons.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        )}
        <label className="block text-xs font-semibold text-[#1C2928]">
          {actionCopy.reasonLabel}
          <textarea
            className="mt-1.5 block w-full rounded-xl border border-[#DCE2DD] bg-[#F7F5EF]/70 px-3 py-2.5 text-sm font-normal text-[#1C2928] placeholder:text-[#5B6E69]/70 transition focus:border-[#174B4A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174B4A]/20 disabled:cursor-not-allowed disabled:opacity-60"
            rows={3}
            placeholder="Enter reason for this moderation action..."
            required
            maxLength={200}
            ref={reasonInput}
            disabled={busy || confirmationOpen}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </label>
        {error && <p role="alert" className="text-xs font-semibold text-[#8C1030]">{error}</p>}
        <button
          type="submit"
          className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-[#103B39] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#174B4A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174B4A] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={busy || !validReason}
        >
          {busy ? copy.updatingLabel : actionCopy.label}
        </button>
      </form>
      <ModerationDialog open={confirmationOpen} titleId={`${dialogId}-title`}
        title={actionCopy.confirmationTitle} descriptionId={`${dialogId}-description`}
        description={copy.messages.MSG130} onClose={closeConfirmation}>
        <p className="mb-4 text-sm text-brand-textSecondary">{actionCopy.impact}</p>
        <div className="flex items-start justify-between gap-3">
          <dl className="grid min-w-0 grid-cols-[auto_1fr] gap-x-3 gap-y-1 break-words text-sm text-brand-textPrimary">
            <dt className="font-semibold">Account</dt><dd className="min-w-0">{account.fullName}</dd>
            <dt className="font-semibold">Email</dt><dd className="min-w-0">{account.email ?? '—'}</dd>
            <dt className="font-semibold">Role</dt><dd>{account.role}</dd>
            <dt className="font-semibold">Current status</dt><dd>{account.status}</dd>
          </dl>
          <button type="button" aria-label={copy.closeLabel} onClick={closeConfirmation} disabled={busy}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg focus-visible:ring-2 disabled:opacity-50">
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>
        {locked && currentLock && (
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-xl border border-brand-border bg-brand-surface p-3 text-sm text-brand-textPrimary">
            <dt className="font-semibold">Locked on</dt><dd>{currentLock.at}</dd>
            <dt className="font-semibold">Locked by</dt><dd className="min-w-0 break-words">{currentLock.actor}</dd>
            <dt className="font-semibold">Lock reason</dt><dd className="min-w-0 break-words">{currentLock.reason ?? '—'}</dd>
          </dl>
        )}
        <div className="mt-4 text-sm text-brand-textPrimary">
          <p className="font-semibold">{copy.reasonSummary}</p>
          <p className="mt-1 break-words whitespace-pre-wrap">{reason.trim()}</p>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={closeConfirmation} disabled={busy}
            className="min-h-11 rounded-xl border border-brand-border px-4 py-2 font-semibold focus-visible:ring-2 disabled:opacity-50">
            {copy.cancelLabel}
          </button>
          <button type="button" onClick={confirmModeration} disabled={busy}
            className="min-h-11 rounded-xl bg-primary px-4 py-2 font-semibold text-white focus-visible:ring-2 disabled:opacity-50">
            {busy ? copy.updatingLabel : actionCopy.confirmLabel}
          </button>
        </div>
      </ModerationDialog>
      {successMessage && (
        <div className="fixed bottom-6 left-4 right-4 z-50 shadow-xl sm:left-auto sm:right-6 sm:max-w-md">
          <FeedbackAlert tone="success">
            <div className="flex items-center gap-3">
              <p>{successMessage}</p>
              <button type="button" aria-label={copy.dismissToastLabel} onClick={() => setSuccessMessage('')}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-lg focus-visible:ring-2">
                <span className="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            </div>
          </FeedbackAlert>
        </div>
      )}
    </>
  );
}
