"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type LogoutDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  errorMessage?: string | null;
};

export default function LogoutDialog({
  open,
  onClose,
  onConfirm,
  errorMessage,
}: LogoutDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleClose = useCallback(() => {
    setLoading(false);
    onClose();
  }, [onClose]);

  // Esc để đóng + khóa cuộn nền
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) handleClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [handleClose, open, loading]);

  if (!open) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  const dialog = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-brand-navy/50 p-4 backdrop-blur-sm sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) handleClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-title"
        aria-describedby="logout-desc"
        className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-[440px] overflow-y-auto rounded-3xl border border-slate-100 bg-brand-card p-6 shadow-card-lg sm:p-8"
      >
        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-brand-coral/10 text-brand-coral flex items-center justify-center mb-5">
          <span className="material-symbols-outlined text-[28px]">logout</span>
        </div>

        {/* Header */}
        <h2
          id="logout-title"
          className="text-2xl font-bold text-brand-navy tracking-tight mb-2"
        >
          Xác nhận đăng xuất
        </h2>
        <p
          id="logout-desc"
          className="text-sm text-brand-textSecondary leading-relaxed mb-4"
        >
          Bạn có chắc chắn muốn đăng xuất khỏi TripMate không?
        </p>

        {errorMessage ? (
          <p
            role="alert"
            className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
          >
            {errorMessage}
          </p>
        ) : null}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            autoFocus
            className="h-12 bg-white hover:bg-slate-50 active:scale-[0.98] border border-[#CBD5E1] rounded-xl text-[#1E293B] font-semibold text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="h-12 active:scale-[0.98] bg-brand-teal hover:bg-brand-brightTeal text-white font-semibold text-sm rounded-xl shadow-btn transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">
                  progress_activity
                </span>
                <span>Đang xử lý...</span>
              </>
            ) : (
              <span>Đăng xuất</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // The sticky navigation uses backdrop-filter, which establishes a containing
  // block for fixed descendants. Portalling keeps the overlay viewport-bound.
  return typeof document === "undefined"
    ? null
    : createPortal(dialog, document.body);
}
