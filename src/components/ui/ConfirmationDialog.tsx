'use client';

import { useEffect, useId, useLayoutEffect, useRef, type ReactNode } from 'react';

/** Shared confirmation pattern: cancel first, contained focus, dismiss, then restore focus. */
export function ConfirmationDialog({
  title,
  children,
  pending,
  onCancel,
  onConfirm,
  confirmLabel = 'Xác nhận gửi',
  cancelLabel = 'Hủy bỏ',
  pendingLabel = 'Đang gửi...',
  variant = 'primary',
}: {
  title: string;
  children: ReactNode;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  pendingLabel?: string;
  variant?: 'primary' | 'danger';
}) {
  const titleId = useId();
  const descriptionId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const active = useRef(false);

  useLayoutEffect(() => {
    active.current = true;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    (panel.current?.querySelector('button') ?? panel.current)?.focus();
    return () => {
      active.current = false;
      document.body.style.overflow = overflow;
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, []);

  useEffect(() => {
    const controls = () => Array.from(panel.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') ?? []);
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!pending) onCancel();
      }
      if (event.key === 'Tab') {
        const available = controls();
        const first = available[0];
        const last = available[available.length - 1];
        if (!first) { event.preventDefault(); panel.current?.focus(); }
        else if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel.current)) {
          event.preventDefault(); first.focus();
        }
      }
    }
    function containFocus(event: FocusEvent) {
      if (active.current && event.target instanceof Node && !panel.current?.contains(event.target)) {
        (controls()[0] ?? panel.current)?.focus();
      }
    }
    if (pending) panel.current?.focus();
    document.addEventListener('keydown', onKey);
    document.addEventListener('focusin', containFocus);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('focusin', containFocus);
    };
  }, [pending, onCancel]);

  const confirmButtonClass =
    variant === 'danger'
      ? 'min-h-10 min-w-11 rounded-xl bg-rose-700 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-rose-800 focus-visible:ring-2 focus-visible:ring-rose-700 disabled:opacity-50'
      : 'min-h-10 min-w-11 rounded-xl bg-[#174B4A] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#103B39] focus-visible:ring-2 focus-visible:ring-[#174B4A] disabled:opacity-50';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-busy={pending}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1C2928]/40 p-4 backdrop-blur-[2px]"
      onClick={(event) => {
        if (event.target === event.currentTarget && !pending) onCancel();
      }}
    >
      <div
        ref={panel}
        tabIndex={-1}
        className="max-h-[90dvh] w-full min-w-0 max-w-[430px] overflow-y-auto rounded-2xl border border-[#DCE2DD] bg-white p-5 shadow-xl outline-none [overflow-wrap:anywhere] sm:p-6"
      >
        <h2 id={titleId} className="text-[16.5px] font-bold leading-snug text-[#1C2928]">
          {title}
        </h2>
        <div id={descriptionId} className="mt-2 space-y-3 text-[13.5px] leading-relaxed text-[#5B6E69]">
          {children}
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="min-h-10 min-w-11 rounded-xl border border-[#DCE2DD] bg-white px-4 py-2 text-[13px] font-semibold text-[#1C2928] transition hover:bg-[#F7F5EF] focus-visible:ring-2 focus-visible:ring-[#174B4A] disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} disabled={pending} className={confirmButtonClass}>
            {pending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
