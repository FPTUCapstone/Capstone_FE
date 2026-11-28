'use client';

import { useEffect, useRef } from 'react';

import { ModerationDialog } from '@/features/admin/tour-reviews/components/ModerationDialog';
import {
  MAX_LOCK_REASON_LENGTH,
  composeLockReason,
  lockNoteMaxLength,
  lockReasonIssue,
} from '../lockReason';
import { adminUserAccountsEn } from '../resources/en';

export interface LockAccountSummary {
  fullName: string;
  email: string | null;
  role: string;
  statusLabel: string;
}

export interface LockAccountDialogProps {
  open: boolean;
  titleId: string;
  descriptionId: string;
  account: LockAccountSummary;
  category: string;
  note: string;
  busy: boolean;
  reasonError: boolean;
  serverError: string;
  onCategoryChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

const FIELD_CLASS =
  'mt-1.5 block w-full rounded-xl border border-[#DCE2DD] bg-[#F7F5EF]/70 px-3 py-2.5 text-sm font-normal text-[#1C2928] placeholder:text-[#5B6E69]/70 transition focus:border-[#174B4A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174B4A]/20 disabled:cursor-not-allowed disabled:opacity-60';

const copy = adminUserAccountsEn.moderation;
const lockCopy = copy.lock;

/** Presentational lock-account confirmation: all state and submission live in the parent. */
export function LockAccountDialog({
  open,
  titleId,
  descriptionId,
  account,
  category,
  note,
  busy,
  reasonError,
  serverError,
  onCategoryChange,
  onNoteChange,
  onConfirm,
  onClose,
}: LockAccountDialogProps) {
  const serverErrorRef = useRef<HTMLParagraphElement>(null);

  // While busy every control is disabled and the browser may drop focus out of the modal;
  // when a server error arrives, pull focus back onto it so keyboard users stay inside the dialog.
  useEffect(() => {
    if (serverError) serverErrorRef.current?.focus();
  }, [serverError]);

  const issue = lockReasonIssue(category, note);
  const showMissing = reasonError && issue === 'missing';
  const summaryRows: ReadonlyArray<readonly [string, string]> = [
    [lockCopy.summary.fullName, account.fullName],
    [lockCopy.summary.email, account.email ?? lockCopy.summary.noEmail],
    [lockCopy.summary.role, account.role],
    [lockCopy.summary.status, account.statusLabel],
  ];

  return (
    <ModerationDialog
      open={open}
      titleId={titleId}
      title={lockCopy.confirmationTitle}
      descriptionId={descriptionId}
      description={copy.messages.MSG130}
      onClose={onClose}
    >
      <div className="flex items-start justify-between gap-3">
        <dl className="min-w-0 flex-1 space-y-1 rounded-xl border border-brand-border bg-[#F7F5EF]/70 p-3 text-sm text-brand-textPrimary">
          {summaryRows.map(([label, value]) => (
            <div key={label} className="flex gap-2">
              <dt className="w-24 shrink-0 font-semibold">{label}</dt>
              <dd className="min-w-0 break-words">{value}</dd>
            </div>
          ))}
        </dl>
        <button
          type="button"
          aria-label={copy.closeLabel}
          onClick={onClose}
          disabled={busy}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-lg focus-visible:ring-2 disabled:opacity-50"
        >
          <span className="material-symbols-outlined" aria-hidden="true">close</span>
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <label className="block text-xs font-semibold text-[#1C2928]">
          {lockCopy.reasonCategoryLabel}
          <select
            className={FIELD_CLASS}
            value={category}
            disabled={busy}
            onChange={(event) => onCategoryChange(event.target.value)}
          >
            <option value="">{lockCopy.reasonCategoryPlaceholder}</option>
            {lockCopy.reasonCategories.map((reasonCategory) => (
              <option key={reasonCategory} value={reasonCategory}>{reasonCategory}</option>
            ))}
          </select>
        </label>

        <label className="block text-xs font-semibold text-[#1C2928]">
          {lockCopy.noteLabel}
          <textarea
            className={FIELD_CLASS}
            rows={3}
            placeholder={lockCopy.notePlaceholder}
            maxLength={lockNoteMaxLength(category)}
            disabled={busy}
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
          />
        </label>

        <p className="text-right text-xs text-[#5B6E69]">
          {composeLockReason(category, note).length}/{MAX_LOCK_REASON_LENGTH}
        </p>

        {showMissing && (
          <p role="alert" className="text-xs font-semibold text-[#8C1030]">{copy.messages.MSG123}</p>
        )}
        {issue === 'tooLong' && (
          <p role="alert" className="text-xs font-semibold text-[#8C1030]">{lockCopy.reasonTooLong}</p>
        )}
        {serverError && (
          <p ref={serverErrorRef} role="alert" tabIndex={-1} className="text-xs font-semibold text-[#8C1030] focus:outline-none">
            {serverError}
          </p>
        )}

        <p className="text-xs text-[#5B6E69]">{lockCopy.impactNote}</p>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="min-h-11 rounded-xl border border-brand-border px-4 py-2 font-semibold focus-visible:ring-2 disabled:opacity-50"
        >
          {copy.cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy || issue === 'tooLong'}
          className="min-h-11 rounded-xl bg-primary px-4 py-2 font-semibold text-white focus-visible:ring-2 disabled:opacity-50"
        >
          {busy ? copy.updatingLabel : lockCopy.confirmLabel}
        </button>
      </div>
    </ModerationDialog>
  );
}
