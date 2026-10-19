'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { couponEn } from '../resources/en';

interface DeactivateCouponDialogProps {
  open: boolean;
  action: 'deactivate' | 'activate';
  couponCode: string;
  usageCount: number;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export function DeactivateCouponDialog({
  open,
  action,
  couponCode,
  usageCount,
  loading = false,
  onClose,
  onConfirm,
}: DeactivateCouponDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  const handleClose = useCallback(() => {
    if (!loading) onClose();
  }, [loading, onClose]);

  // Initial focus and restoration
  useLayoutEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement;
    cancelBtnRef.current?.focus();

    return () => {
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    };
  }, [open]);

  // Escape key and focus trap
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [handleClose, open]);

  if (!open) return null;

  const isDeactivating = action === 'deactivate';

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) handleClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="coupon-dialog-title"
        aria-describedby="coupon-dialog-desc"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              isDeactivating ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">
              {isDeactivating ? 'block' : 'check_circle'}
            </span>
          </div>
          <h3 id="coupon-dialog-title" className="text-base font-extrabold text-[#00152A]">
            {isDeactivating
              ? couponEn.dialog.deactivateTitle.replace('{code}', couponCode)
              : couponEn.dialog.activateTitle.replace('{code}', couponCode)}
          </h3>
        </div>

        <div id="coupon-dialog-desc" className="mt-3 text-xs leading-relaxed text-slate-600 space-y-2">
          <p>
            {isDeactivating
              ? couponEn.dialog.deactivateDesc
              : couponEn.dialog.activateDesc}
          </p>
          {isDeactivating && usageCount > 0 && (
            <p className="font-medium text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              {couponEn.dialog.deactivateNotice.replace('{count}', String(usageCount))}
            </p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
          >
            {couponEn.dialog.cancelBtn}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs transition disabled:opacity-50 ${
              isDeactivating
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-[#006B5F] hover:bg-[#005249]'
            }`}
          >
            {loading
              ? couponEn.dialog.processing
              : isDeactivating
              ? couponEn.dialog.confirmDeactivate
              : couponEn.dialog.confirmActivate}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document === 'undefined' ? null : createPortal(modalContent, document.body);
}
