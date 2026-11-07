import React from 'react';

interface EmergencyConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  actionType: 'CancelBeforeDeparture' | 'EmergencyStopActive';
  affectedBookings: number;
  affectedPassengers: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const PAYMENT_HANDLING_NOTICE =
  'Việc thanh toán và hoàn tiền được xử lý riêng theo chính sách hủy booking áp dụng.';

export function EmergencyConfirmationDialog({
  isOpen,
  title,
  actionType,
  affectedBookings,
  affectedPassengers,
  onConfirm,
  onCancel,
}: EmergencyConfirmationDialogProps) {
  if (!isOpen) return null;

  const isStop = actionType === 'EmergencyStopActive';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 text-rose-600 border-b border-slate-100 pb-3">
          <span className="material-symbols-outlined text-3xl" aria-hidden="true">
            warning
          </span>
          <h3 id="dialog-title" className="text-lg font-bold text-slate-900">
            {title}
          </h3>
        </div>

        <div className="space-y-3 text-xs text-slate-700">
          <p className="font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-lg p-3">
            {isStop
              ? 'Lưu ý khẩn cấp: Thao tác này sẽ dừng ngay lập tức tour đang diễn ra. Mọi phiên đi tour và đơn đặt chỗ sẽ chuyển sang trạng thái Gián đoạn. Thao tác không thể hoàn tác.'
              : 'Lưu ý khẩn cấp: Thao tác này sẽ hủy lịch khởi hành và chuyển các đơn đặt chỗ sang trạng thái Đã hủy. Thao tác không thể hoàn tác.'}
          </p>

          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Đơn đặt chỗ ảnh hưởng:</span>
              <span className="font-bold text-slate-900">{affectedBookings} đơn</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Hành khách ảnh hưởng:</span>
              <span className="font-bold text-slate-900">{affectedPassengers} hành khách</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500">{PAYMENT_HANDLING_NOTICE}</p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-xs font-bold text-white shadow-2xs transition ${
              isStop
                ? 'bg-rose-600 hover:bg-rose-700 focus:ring-2 focus:ring-rose-500'
                : 'bg-amber-600 hover:bg-amber-700 focus:ring-2 focus:ring-amber-500'
            }`}
          >
            {isStop ? 'Đồng ý dừng tour' : 'Đồng ý hủy'}
          </button>
        </div>
      </div>
    </div>
  );
}
