'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useChatDialog } from './useChatDialog';
import { SplitBillData } from '../types/groupChatTypes';

interface VietQrModalProps {
  data: SplitBillData;
  onClose: () => void;
  onMarkPaid?: () => Promise<void> | void;
  apiError?: string;
  isPaid?: boolean;
}

const BANK_CODES: Record<string, string> = {
  Vietcombank: 'VCB',
  MBBank: 'MB',
  Techcombank: 'TCB',
  ACB: 'ACB',
  VPBank: 'VPB',
  BIDV: 'BIDV',
  VietinBank: 'ICB',
  TPBank: 'TPB',
};

const BANK_LABELS: Record<string, string> = {
  Vietcombank: 'Vietcombank',
  MBBank: 'MB Bank',
  Techcombank: 'Techcombank',
  ACB: 'ACB',
  VPBank: 'VPBank',
  BIDV: 'BIDV',
  VietinBank: 'VietinBank',
  TPBank: 'TPBank',
};

const QR_LOAD_TIMEOUT_MS = 12000;

export function VietQrModal({ data, onClose, onMarkPaid, isPaid, apiError }: VietQrModalProps) {
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState(false);
  const [copyError, setCopyError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const dialogRef = useChatDialog(onClose);

  // Generate VietQR Quick Link URL (NAPAS standard format supported by all Vietnam mobile banking apps)
  const bank = encodeURIComponent(BANK_CODES[data.payerBankName] ?? data.payerBankName);
  const bankLabel = BANK_LABELS[data.payerBankName] ?? data.payerBankName;
  const account = encodeURIComponent(data.payerBankAccount);
  const amount = data.perPersonAmount;
  const description = encodeURIComponent(`TripMate: ${data.title}`);
  const baseQrUrl = `https://img.vietqr.io/image/${bank}-${account}-compact2.png?amount=${amount}&addInfo=${description}&accountName=${encodeURIComponent(
    data.payerName,
  )}`;
  const qrUrl = retryKey > 0 ? `${baseQrUrl}&retry=${retryKey}` : baseQrUrl;

  const handleCopyAccount = async () => {
    try { await navigator.clipboard.writeText(data.payerBankAccount); setCopied(true); setCopyError(''); }
    catch { setCopyError('Không sao chép được. Bạn có thể chọn và sao chép số tài khoản bên dưới.'); }
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="vietqr-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
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
              <p className="text-[11px] text-slate-500">Quét mã trong app ngân hàng; TripMate không tự chuyển tiền</p>
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

        {(apiError || copyError) && <p role="alert" className="mt-3 text-sm text-red-700">{apiError || copyError}</p>}
        {/* QR Code Container */}
        <div className="my-4 flex flex-col items-center rounded-2xl bg-slate-50 p-4 border border-slate-100">
          <VietQrImageFrame
            key={qrUrl}
            qrUrl={qrUrl}
            onRetry={() => setRetryKey((k) => k + 1)}
          />
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
            <span className="font-semibold text-slate-800">{bankLabel}</span>
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
              disabled={pending || isPaid}
              onClick={async () => {
                setPending(true);
                try { await onMarkPaid(); } finally { setPending(false); }
              }}
              className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition shadow-xs ${
                isPaid
                  ? 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  : 'bg-[#103B39] text-white hover:bg-[#174B4A]'
              }`}
            >
              {isPaid ? 'Đã đánh dấu chuyển tiền' : pending ? 'Đang lưu…' : 'Tôi đã chuyển tiền'}
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

function VietQrImageFrame({ qrUrl, onRetry }: { qrUrl: string; onRetry: () => void }) {
  const [qrStatus, setQrStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (qrStatus !== 'loading') return;
    const img = imgRef.current;
    const doneId =
      img?.complete && img.naturalWidth > 0
        ? window.setTimeout(() => setQrStatus('loaded'), 0)
        : undefined;
    const timeoutId = window.setTimeout(() => {
      setQrStatus((prev) => (prev === 'loading' ? 'error' : prev));
    }, QR_LOAD_TIMEOUT_MS);
    return () => {
      if (doneId !== undefined) window.clearTimeout(doneId);
      window.clearTimeout(timeoutId);
    };
  }, [qrStatus]);

  return (
    <div className="relative flex h-60 w-60 items-center justify-center overflow-hidden rounded-xl bg-white p-2 shadow-xs border border-slate-200">
      {qrStatus === 'loading' && (
        <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/95 p-4 text-center text-xs text-slate-600">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-[#103B39]" aria-hidden="true" />
          <span>Đang tải mã VietQR…</span>
        </div>
      )}
      {qrStatus === 'error' ? (
        <div role="alert" className="flex flex-col items-center justify-center gap-3 p-4 text-center">
          <span className="material-symbols-outlined text-3xl text-amber-600" aria-hidden="true">qr_code_2</span>
          <p className="text-xs text-slate-700">
            Không thể tải ảnh mã VietQR lúc này. Vui lòng thử lại hoặc chuyển khoản thủ công theo thông tin bên dưới.
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition"
          >
            Thử tải lại mã QR
          </button>
        </div>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          ref={imgRef}
          src={qrUrl}
          alt="Mã VietQR chuyển khoản"
          className="h-56 w-56 object-contain"
          onLoad={() => setQrStatus('loaded')}
          onError={() => setQrStatus('error')}
        />
      )}
    </div>
  );
}
