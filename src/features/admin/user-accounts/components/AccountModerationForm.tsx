'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { ModerationDialog } from '@/features/admin/tour-reviews/components/ModerationDialog';
import { adminUserAccountsEn } from '../resources/en';

const TOAST_DURATION_MS = 8000;

export function AccountModerationForm({ accountId, locked }: { accountId: string; locked: boolean }) {
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
        const problem = await response.json().catch(() => null);
        setError(typeof problem?.title === 'string' ? problem.title : copy.updateFailed);
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
        <label className="block">
          {actionCopy.reasonLabel}
          <textarea className="mt-1 block w-full rounded border p-2" required maxLength={200}
            ref={reasonInput}
            disabled={busy || confirmationOpen}
            value={reason} onChange={(event) => setReason(event.target.value)} />
        </label>
        {error && <p role="alert">{error}</p>}
        <button type="submit" className="rounded bg-teal-800 px-4 py-2 text-white disabled:opacity-50"
          disabled={busy || !validReason}>
          {busy ? copy.updatingLabel : actionCopy.label}
        </button>
      </form>
      <ModerationDialog open={confirmationOpen} titleId={`${dialogId}-title`}
        title={actionCopy.confirmationTitle} descriptionId={`${dialogId}-description`}
        description={copy.messages.MSG130} onClose={closeConfirmation}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 text-sm text-brand-textPrimary">
            <p className="font-semibold">{copy.reasonSummary}</p>
            <p className="mt-1 break-words whitespace-pre-wrap">{reason}</p>
          </div>
          <button type="button" aria-label={copy.closeLabel} onClick={closeConfirmation} disabled={busy}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg focus-visible:ring-2 disabled:opacity-50">
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
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
