'use client';

import React, { useState } from 'react';
import { SplitBillData } from '../types/groupChatTypes';

interface CreateExpenseModalProps {
  onClose: () => void;
  onSubmit: (splitBillData: SplitBillData) => void;
  currentUserName: string;
  memberCount: number;
}

export function CreateExpenseModal({
  onClose,
  onSubmit,
  currentUserName,
  memberCount,
}: CreateExpenseModalProps) {
  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [payerName, setPayerName] = useState(currentUserName);
  const [payerBankName, setPayerBankName] = useState('Vietcombank');
  const [payerBankAccount, setPayerBankAccount] = useState('1018899889');
  const [error, setError] = useState<string | null>(null);

  const amountNum = parseFloat(totalAmount.replace(/[^0-9]/g, '')) || 0;
  const count = Math.max(memberCount, 1);
  const perPerson = Math.round(amountNum / count);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Vui lòng nhập tên khoản chi (Ví dụ: Tiền bữa tối).');
      return;
    }
    if (amountNum <= 0) {
      setError('Số tiền chi tiêu phải lớn hơn 0.');
      return;
    }
    if (!payerBankAccount.trim()) {
      setError('Vui lòng nhập số tài khoản ngân hàng để nhận tiền chuyển khoản.');
      return;
    }

    const data: SplitBillData = {
      title: trimmedTitle,
      payerName: payerName.trim() || currentUserName,
      payerBankName: payerBankName.trim() || 'Vietcombank',
      payerBankAccount: payerBankAccount.trim(),
      totalAmount: amountNum,
      perPersonAmount: perPerson,
      participantNames: ['Bạn bè trong nhóm'],
      paidUserIds: [1], // Current payer is marked as paid
    };

    onSubmit(data);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-expense-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-[#103B39]">
              <span className="material-symbols-outlined text-lg">receipt_long</span>
            </div>
            <div>
              <h3 id="create-expense-title" className="text-sm font-bold text-slate-900">
                Chia tiền chuyến đi (Campuchia)
              </h3>
              <p className="text-[11px] text-slate-500">Tự động tính toán & sinh mã VietQR chuyển khoản</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
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
              type="text"
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
              type="text"
              value={totalAmount ? Number(totalAmount.replace(/[^0-9]/g, '')).toLocaleString('vi-VN') : ''}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, '');
                setTotalAmount(raw);
                setError(null);
              }}
              placeholder="VD: 600.000"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-bold text-[#103B39] placeholder:text-slate-400 focus:border-[#103B39] focus:outline-none focus:ring-2 focus:ring-[#103B39]/20"
            />
            {amountNum > 0 && (
              <p className="mt-1 text-[11px] text-teal-800 font-medium">
                Chia đều {count} người: <b>{perPerson.toLocaleString('vi-VN')} đ / người</b>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ngân hàng nhận <span className="text-rose-500">*</span>
              </label>
              <select
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
                type="text"
                value={payerBankAccount}
                onChange={(e) => setPayerBankAccount(e.target.value)}
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
              type="text"
              value={payerName}
              onChange={(e) => setPayerName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-[#103B39] focus:outline-none"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-rose-600">error</span>
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#103B39] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#174B4A] transition"
            >
              Gửi chia tiền
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
