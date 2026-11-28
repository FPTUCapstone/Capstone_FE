'use client';

import React, { useState } from 'react';
import { useChatDialog } from './useChatDialog';
import { SplitBillData } from '../types/groupChatTypes';

interface CreateExpenseModalProps {
  initialData?: SplitBillData;
  title?: string;
  submitLabel?: string;
  apiError?: string;
  onClose: () => void;
  onSubmit: (splitBillData: SplitBillData) => Promise<boolean> | boolean;
  currentUserName: string;
  memberCount: number;
}

export function CreateExpenseModal({
  onClose,
  onSubmit,
  currentUserName,
  memberCount,
  apiError,
  initialData,
  title: dialogTitle = 'Chia tiền chuyến đi',
  submitLabel = 'Gửi chia tiền',
}: CreateExpenseModalProps) {
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [totalAmount, setTotalAmount] = useState(initialData ? String(initialData.totalAmount) : '');
  const [payerName, setPayerName] = useState(initialData?.payerName ?? currentUserName);
  const [payerBankName, setPayerBankName] = useState(initialData?.payerBankName ?? 'Vietcombank');
  const [payerBankAccount, setPayerBankAccount] = useState(initialData?.payerBankAccount ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const dialogRef = useChatDialog(onClose);

  const amountNum = /^(?:\d+|\d{1,3}(?:\.\d{3})+|\d{1,3}(?:,\d{3})+)$/.test(totalAmount.trim())
    ? Number(totalAmount.trim().replace(/[.,]/g, '')) : Number.NaN;
  const count = Math.max(memberCount, 1);
  const perPerson = Math.floor(amountNum / count);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Vui lòng nhập tên khoản chi (Ví dụ: Tiền bữa tối).');
      return;
    }
    if (trimmedTitle.length > 200) {
      setError('Tên khoản chi không được quá 200 ký tự.');
      return;
    }
    if (!Number.isSafeInteger(amountNum) || amountNum <= 0 || !Number.isSafeInteger(memberCount) || memberCount < 1) {
      setError('Vui lòng nhập số tiền VND nguyên dương hợp lệ.');
      return;
    }
    if (!/^\d{6,30}$/.test(payerBankAccount.trim())) {
      setError('Số tài khoản phải có từ 6 đến 30 chữ số.');
      return;
    }
    const recipient = payerName.trim() || currentUserName.trim();
    if (!recipient || recipient.length > 120 || !payerBankName.trim() || payerBankName.trim().length > 60) {
      setError('Nhập người nhận tiền tối đa 120 ký tự và ngân hàng hợp lệ.');
      return;
    }

    const data: SplitBillData = {
      title: trimmedTitle,
      payerName: recipient,
      payerBankName: payerBankName.trim() || 'Vietcombank',
      payerBankAccount: payerBankAccount.trim(),
      totalAmount: amountNum,
      perPersonAmount: perPerson,
      participantNames: [],
      paidUserIds: [], // The server records the authenticated payer.
    };

    setSaving(true);
    let saved = false;
    try { saved = await onSubmit(data); }
    catch { setError('Chưa lưu được nội dung. Vui lòng thử lại.'); }
    finally { setSaving(false); }
    if (saved) onClose();
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-expense-title"
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto w-full max-w-sm rounded-2xl border border-brand-border bg-white p-4 shadow-2xl sm:p-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-[#103B39]">
              <span className="material-symbols-outlined text-lg">receipt_long</span>
            </div>
            <div>
              <h3 id="create-expense-title" className="text-sm font-bold text-slate-900">
                {dialogTitle}
              </h3>
              <p className="text-[11px] text-slate-500">Tự động tính toán & sinh mã VietQR chuyển khoản</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 min-w-11 shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tên khoản chi <span className="text-rose-500">*</span>
            </label>
            <input
                aria-label="Tên khoản chi"
                disabled={saving}
              type="text"
              maxLength={200}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError(null);
              }}
              placeholder="VD: Bữa trưa hải sản Năm Đảnh"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-[#103B39] focus:outline-none focus:ring-2 focus:ring-[#103B39]/20"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tổng số tiền (VNĐ) <span className="text-rose-500">*</span>
            </label>
            <input
                aria-label="Tổng số tiền (VND)"
                disabled={saving}
              type="text"
              inputMode="numeric"
              value={totalAmount}
              onKeyDown={e => {
                if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1 && !/[\d.,]/.test(e.key)) e.preventDefault();
              }}
              onChange={(e) => {
                const raw = e.target.value.trim();
                if (!/^[\d.,]*$/.test(raw)) return;
                setTotalAmount(raw);
                setError(null);
              }}
              placeholder="VD: 600.000"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-bold text-[#103B39] placeholder:text-slate-400 focus:border-[#103B39] focus:outline-none focus:ring-2 focus:ring-[#103B39]/20"
            />
            {Number.isSafeInteger(amountNum) && amountNum > 0 && Number.isSafeInteger(memberCount) && memberCount > 0 && (
              <p className="mt-1 text-[11px] text-teal-800 font-medium">
                Chia đều {count} người: <b>từ {perPerson.toLocaleString('vi-VN')} đ / người</b>. Phần lẻ được chia thêm 1 đ cho từng thành viên theo thứ tự ID để tổng khớp chính xác.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2.5 min-[380px]:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ngân hàng nhận <span className="text-rose-500">*</span>
              </label>
              <select
                aria-label="Ngân hàng nhận"
                disabled={saving}
                value={payerBankName}
                onChange={(e) => setPayerBankName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-2.5 py-2 text-xs font-semibold text-slate-800 focus:border-[#103B39] focus:outline-none"
              >
                <option value="Vietcombank">Vietcombank</option>
                <option value="MBBank">MB Bank</option>
                <option value="Techcombank">Techcombank</option>
                <option value="ACB">ACB</option>
                <option value="VPBank">VPBank</option>
                <option value="BIDV">BIDV</option>
                <option value="VietinBank">VietinBank</option>
                <option value="TPBank">TPBank</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Số tài khoản <span className="text-rose-500">*</span>
              </label>
              <input
                aria-label="Số tài khoản"
                disabled={saving}
                type="text"
                inputMode="numeric"
                maxLength={30}
                value={payerBankAccount}
                onKeyDown={e => {
                  if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1 && !/\d/.test(e.key)) e.preventDefault();
                }}
                onChange={(e) => { if (/^\d*$/.test(e.target.value)) { setPayerBankAccount(e.target.value); setError(null); } }}
                placeholder="VD: 1018899889"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono font-semibold text-slate-800 focus:border-[#103B39] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Người đứng ra chi trả
            </label>
            <input
                aria-label="Người nhận tiền"
                disabled={saving}
              type="text"
              value={payerName}
              maxLength={120}
              onChange={(e) => setPayerName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-[#103B39] focus:outline-none"
            />
          </div>

          {(error || apiError) && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-rose-600">error</span>
              <span>{error || apiError}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#103B39] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#174B4A] transition"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
