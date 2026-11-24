'use client';

import { useEffect, useId, useLayoutEffect, useRef, type ReactNode } from 'react';

/** Shared confirmation pattern: cancel first, contained focus, dismiss, then restore focus. */
export function ConfirmationDialog({ title, children, pending, onCancel, onConfirm, confirmLabel = 'Xác nhận gửi' }: {
  title: string;
  children: ReactNode;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
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

  return (
    <div role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} aria-busy={pending}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
      onClick={(event) => { if (event.target === event.currentTarget && !pending) onCancel(); }}>
      <div ref={panel} tabIndex={-1} className="max-h-[90dvh] w-full min-w-0 max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl outline-none [overflow-wrap:anywhere] sm:p-6">
        <h2 id={titleId} className="text-base font-extrabold text-brand-textPrimary">{title}</h2>
        <div id={descriptionId} className="mt-2 space-y-2 text-xs leading-relaxed text-slate-600">{children}</div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} disabled={pending} className="min-h-11 min-w-11 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50">Hủy bỏ</button>
          <button type="button" onClick={onConfirm} disabled={pending} className="min-h-11 min-w-11 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50">{pending ? 'Đang gửi...' : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
