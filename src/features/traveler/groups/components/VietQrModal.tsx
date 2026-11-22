'use client';

import React, { useState } from 'react';
import { SplitBillData } from '../types/groupChatTypes';

interface VietQrModalProps {
  data: SplitBillData;
  onClose: () => void;
  onMarkPaid?: () => void;
  isPaid?: boolean;
}

export function VietQrModal({ data, onClose, onMarkPaid, isPaid }: VietQrModalProps) {
  const [copied, setCopied] = useState(false);

  // Generate VietQR Quick Link URL (NAPAS standard format supported by all Vietnam mobile banking apps)
  const bank = encodeURIComponent(data.payerBankName || 'Vietcombank');
  const account = encodeURIComponent(data.payerBankAccount || '1018899889');
  const amount = data.perPersonAmount;
  const description = encodeURIComponent(`TripMate: ${data.title}`);
  const qrUrl = `https://img.vietqr.io/image/${bank}-${account}-compact2.png?amount=${amount}&addInfo=${description}&accountName=${encodeURIComponent(
    data.payerName,
  )}`;

  const handleCopyAccount = () => {
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(data.payerBankAccount);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vietqr-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-[#103B39]">
              <span className="material-symbols-outlined text-lg">qr_code_2</span>
            </div>
            <div>
              <h3 id="vietqr-title" className="text-sm font-bold text-slate-900">
                Thanh toán VietQR
              </h3>
              <p className="text-[11px] text-slate-500">Chuyển tiền tự động qua app ngân hàng</p>
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

        {/* QR Code Container */}
        <div className="my-4 flex flex-col items-center rounded-2xl bg-slate-50 p-4 border border-slate-100">
          <div className="overflow-hidden rounded-xl bg-white p-2 shadow-xs border border-slate-200">
            {/* VietQR Image */}
            <img
              src={qrUrl}
              alt="Mã VietQR chuyển khoản"
              className="h-56 w-56 object-contain"
              loading="lazy"
            />
          </div>
          <p className="mt-2 text-center text-[11px] text-slate-500">
            Mở app ngân hàng bất kỳ (Vietcombank, MB, Techcombank,...) quét mã để chuyển khoản chính
            xác.
          </p>
        </div>

        {/* Amount & Account Details */}
        <div className="space-y-2 rounded-xl bg-teal-50/70 p-3.5 border border-teal-100 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Số tiền cần chuyển:</span>
            <span className="font-extrabold text-base text-[#103B39]">
              {data.perPersonAmount.toLocaleString('vi-VN')} đ
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-teal-200/50 pt-2">
            <span className="text-slate-600">Người nhận:</span>
            <span className="font-bold text-slate-900">{data.payerName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Ngân hàng:</span>
            <span className="font-semibold text-slate-800">{data.payerBankName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Số tài khoản:</span>
            <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
              <span>{data.payerBankAccount}</span>
              <button
                type="button"
                onClick={handleCopyAccount}
                className="rounded p-0.5 text-teal-700 hover:bg-teal-100 transition"
                title="Sao chép số tài khoản"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {copied ? 'check' : 'content_copy'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-5 flex gap-2">
          {onMarkPaid && (
            <button
              type="button"
              onClick={() => {
                onMarkPaid();
                onClose();
              }}
              className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition shadow-xs ${
                isPaid
                  ? 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  : 'bg-[#103B39] text-white hover:bg-[#174B4A]'
              }`}
            >
              {isPaid ? 'Đánh dấu chưa chuyển' : 'Đã chuyển tiền xong'}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
