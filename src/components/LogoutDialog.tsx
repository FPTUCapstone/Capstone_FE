"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

export type LogoutScope = "current" | "all";

type LogoutDialogProps = {
  open: boolean;
  onClose: () => void;
  /** Gọi khi người dùng xác nhận. scope = "all" nghĩa là đăng xuất mọi thiết bị. */
  onConfirm: (scope: LogoutScope) => Promise<void> | void;
};

const options: {
  value: LogoutScope;
  icon: string;
  title: string;
  desc: string;
}[] = [
  {
    value: "current",
    icon: "devices",
    title: "Chỉ thiết bị này",
    desc: "Các thiết bị khác vẫn giữ nguyên phiên đăng nhập.",
  },
  {
    value: "all",
    icon: "devices_off",
    title: "Tất cả thiết bị",
    desc: "Đăng xuất khỏi mọi trình duyệt và điện thoại đang dùng tài khoản này.",
  },
];

export default function LogoutDialog({
  open,
  onClose,
  onConfirm,
}: LogoutDialogProps) {
  const [scope, setScope] = useState<LogoutScope>("current");
  const [loading, setLoading] = useState(false);

  const handleClose = useCallback(() => {
    setScope("current");
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
      await onConfirm(scope);
    } finally {
      setLoading(false);
      setScope("current");
    }
  };

  const isAll = scope === "all";

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
          className="text-sm text-brand-textSecondary leading-relaxed mb-6"
        >
          Bạn có chắc chắn muốn đăng xuất khỏi TripMate không?
        </p>

        {/* Scope options */}
        <div role="radiogroup" aria-label="Phạm vi đăng xuất" className="space-y-3 mb-6">
          {options.map((opt) => {
            const selected = scope === opt.value;
            return (
              <label
                key={opt.value}
                className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer select-none transition-all duration-200 ${
                  selected
                    ? "border-brand-teal bg-brand-lightTeal ring-2 ring-brand-teal/20"
                    : "border-slate-200 bg-brand-surface hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="logout-scope"
                  value={opt.value}
                  checked={selected}
                  onChange={() => setScope(opt.value)}
                  disabled={loading}
                  className="sr-only"
                />
                <div
                  className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${
                    selected
                      ? "bg-brand-teal text-white"
                      : "bg-white text-slate-500 border border-slate-200"
                  }`}
                >
                  <span className="material-symbols-outlined text-[22px]">
                    {opt.icon}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-brand-navy">{opt.title}</div>
                  <div className="text-xs text-brand-textSecondary mt-0.5 leading-snug">
                    {opt.desc}
                  </div>
                </div>
                <span
                  className={`material-symbols-outlined text-[22px] mt-1 ${
                    selected ? "text-brand-teal" : "text-slate-300"
                  }`}
                  aria-hidden
                >
                  {selected ? "radio_button_checked" : "radio_button_unchecked"}
                </span>
              </label>
            );
          })}
        </div>

        {/* Cảnh báo khi chọn tất cả thiết bị */}
        {isAll && (
          <p className="mb-6 flex items-start gap-1.5 text-[11px] text-brand-textSecondary leading-snug">
            <span className="material-symbols-outlined text-[14px] text-brand-coral mt-px">
              warning
            </span>
            <span>
              Bạn sẽ phải đăng nhập lại trên tất cả thiết bị, kể cả thiết bị này.
            </span>
          </p>
        )}

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
            className={`h-12 active:scale-[0.98] text-white font-semibold text-sm rounded-xl shadow-btn transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${
              isAll
                ? "bg-brand-coral hover:bg-[#f4602f]"
                : "bg-brand-teal hover:bg-brand-brightTeal"
            }`}
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">
                  progress_activity
                </span>
                <span>Đang xử lý...</span>
              </>
            ) : (
              <span>{isAll ? "Đăng xuất tất cả" : "Đăng xuất"}</span>
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
