'use client';

import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { adminUserAccountsEn } from '@/features/admin/user-accounts/resources/en';

export interface UserAccountStatusConfirmPayload {
  reason: string;
  category?: string;
}

export interface UserAccountStatusDialogProps {
  accountLabel: string;
  isOpen: boolean;
  operation?: 'lock';
  onCancel: () => void;
  onConfirm: (payload: UserAccountStatusConfirmPayload) => void;
}

export function UserAccountStatusDialog({
  accountLabel,
  isOpen,
  onCancel,
  onConfirm,
}: UserAccountStatusDialogProps) {
  const copy = adminUserAccountsEn.statusDialog;
  const lockCopy = copy.lock;
  const [reason, setReason] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(
    lockCopy.reasonCategories[0] || '',
  );
  const [prevAccountLabel, setPrevAccountLabel] = useState(accountLabel);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  const dialogRef = useRef<HTMLDivElement>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const normalizedReason = reason.trim();

  if (isOpen !== prevIsOpen || accountLabel !== prevAccountLabel) {
    setPrevIsOpen(isOpen);
    setPrevAccountLabel(accountLabel);
    setReason('');
    setSelectedCategory(lockCopy.reasonCategories[0]);
  }

  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement | null;
      reasonRef.current?.focus();
    } else if (triggerRef.current) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function handleConfirm() {
    if (!normalizedReason) return;
    onConfirm({ reason: normalizedReason, category: selectedCategory });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
      'input:not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not(:disabled)',
    );
    if (!focusableElements?.length) return;

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs transition-all"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lock-modal-title"
      aria-describedby="lock-modal-description"
      ref={dialogRef}
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-[#e2e8f0]">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-white flex items-center justify-between border-b border-[#e2e8f0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ffdad6] flex items-center justify-center text-[#ba1a1a]">
              <span className="material-symbols-outlined text-[24px]">gavel</span>
            </div>
            <div>
              <h2 id="lock-modal-title" className="text-xl font-extrabold text-[#00152a] leading-tight">
                {lockCopy.title}
              </h2>
              <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                {lockCopy.subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onCancel}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#64748b] hover:bg-[#eceef1] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Target User Summary Card */}
          <div
            id="lock-modal-description"
            className="p-4 rounded-xl bg-[#f2f4f7] flex items-center justify-between border border-[#e2e8f0]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#102a43] text-white flex items-center justify-center text-xs font-bold shrink-0">
                <span className="material-symbols-outlined text-[20px]">person</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-[#00152a] truncate">
                  {accountLabel}
                </span>
                <span className="text-xs text-[#64748b] truncate">
                  {lockCopy.description}
                </span>
              </div>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#9cefdf]/40 text-[#0b6f63] text-xs font-semibold shrink-0">
              Active
            </span>
          </div>

          {/* Reason Category Selection */}
          <div className="space-y-1.5">
            <label
              htmlFor="lock-reason-category"
              className="block text-xs font-bold uppercase tracking-wider text-[#191c1e]"
            >
              {lockCopy.reasonCategoryLabel} <span className="text-[#ba1a1a]">*</span>
            </label>
            <div className="relative">
              <select
                id="lock-reason-category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full appearance-none rounded-lg bg-[#f2f4f7] py-2.5 pl-3.5 pr-10 text-xs font-semibold text-[#191c1e] outline-none border border-transparent focus:border-[#006b5f] focus:bg-white cursor-pointer"
              >
                {lockCopy.reasonCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] text-[20px]">
                expand_more
              </span>
            </div>
          </div>

          {/* Internal Notes Textarea */}
          <div className="space-y-1.5">
            <label
              htmlFor="lock-internal-notes"
              className="block text-xs font-bold uppercase tracking-wider text-[#191c1e]"
            >
              {lockCopy.reasonLabel} <span className="text-[#ba1a1a]">*</span>
            </label>
            <textarea
              id="lock-internal-notes"
              aria-label={lockCopy.reasonLabel}
              ref={reasonRef}
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={lockCopy.internalNotesPlaceholder}
              className="w-full rounded-lg bg-[#f2f4f7] p-3 text-xs text-[#191c1e] placeholder:text-[#64748b] outline-none border border-transparent focus:border-[#006b5f] focus:bg-white transition-all"
            />
          </div>

          {/* Administrative Policy Scope (SRS V2 BR-117) */}
          <div className="rounded-xl bg-[#f2f4f7] p-3.5 border border-[#e2e8f0]">
            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[18px] text-[#43474d] mt-0.5">
                policy
              </span>
              <div>
                <span className="text-xs font-bold text-[#191c1e]">
                  {lockCopy.durationPermanentTitle} (BR-117)
                </span>
                <p className="mt-0.5 text-[11px] text-[#64748b]">
                  {lockCopy.durationPermanentDesc}
                </p>
              </div>
            </div>
          </div>

          {/* Warning Callout Box */}
          <div className="p-3.5 rounded-xl bg-[#ffdad6]/40 flex items-start gap-3 border border-[#ffdad6]">
            <span className="material-symbols-outlined text-[#ba1a1a] text-[20px] shrink-0 mt-0.5">
              warning
            </span>
            <p className="text-xs text-[#93000a] leading-relaxed">
              <span className="font-bold">{lockCopy.warningTitle}</span> {lockCopy.warningBody}
            </p>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-[#f2f4f7] flex items-center justify-end gap-3 border-t border-[#e2e8f0]">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-lg bg-white border border-[#e2e8f0] text-xs font-bold text-[#191c1e] hover:bg-[#eceef1] transition-colors"
          >
            {copy.cancelLabel}
          </button>
          <button
            type="button"
            disabled={!normalizedReason}
            onClick={handleConfirm}
            className="px-5 py-2.5 rounded-lg bg-[#ba1a1a] text-xs font-bold text-white shadow-xs transition-colors hover:bg-[#93000a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {lockCopy.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
