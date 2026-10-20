'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { completeMockPayment, getBookingPaymentStatus } from '../services/paymentApi';
import type { BookingPaymentStatusDto, MockOutcomeType } from '../types/payment';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDatetime(isoString?: string): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return isoString;
  }
}

export function MockCheckoutView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const paymentIdStr = searchParams.get('paymentId');
  const bookingIdStr = searchParams.get('bookingId');
  const paymentId = paymentIdStr ? parseInt(paymentIdStr, 10) : 0;
  const bookingId = bookingIdStr ?? '';

  const [loading, setLoading] = useState<boolean>(Boolean(bookingId));
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [statusDto, setStatusDto] = useState<BookingPaymentStatusDto | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    bookingId ? null : 'Thiếu thông tin mã đơn đặt tour (bookingId).',
  );

  useEffect(() => {
    if (!bookingId) return;

    let isMounted = true;
    getBookingPaymentStatus(bookingId)
      .then((data) => {
        if (!isMounted) return;
        setStatusDto(data);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const msg =
          err instanceof Error ? err.message : 'Không thể tải thông tin thanh toán.';
        setErrorMessage(msg);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  const handleOutcome = async (outcome: MockOutcomeType, targetPaymentId: number) => {
    if (!targetPaymentId || submitting) return;
    setSubmitting(true);
    setErrorMessage(null);

    try {
      await completeMockPayment(targetPaymentId, outcome);
      router.push(`/checkout/result?bookingId=${encodeURIComponent(bookingId)}`);
    } catch (err: unknown) {
      setSubmitting(false);
      const msg =
        err instanceof Error
          ? err.message
          : 'Không thể xử lý kết quả thanh toán thử nghiệm.';
      setErrorMessage(msg);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-9 w-9 animate-spin rounded-full border-3 border-[#007d6e] border-t-transparent"
            aria-hidden="true"
          />
          <p className="text-xs font-semibold text-slate-500">
            Đang tải thông tin cổng thanh toán giả lập…
          </p>
        </div>
      </div>
    );
  }

  const active = statusDto?.activePayment;
  // Mock links are generated before SQL assigns the transaction identity, so
  // their URL cannot contain paymentId. Resolve it from the canonical status
  // response after loading instead.
  const resolvedPaymentId = paymentId || statusDto?.paymentId || 0;
  const displayAmount = active?.amount ?? 0;
  const displayOrderCode = active?.orderCode ?? '—';
  const displayBookingCode = statusDto?.bookingCode ?? bookingId;

  return (
    <div className="mx-auto max-w-lg px-4 py-8 font-sans" lang="vi">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl transition-all">
        {/* Mock Environment Header */}
        <div className="bg-gradient-to-r from-teal-700 to-[#007d6e] p-6 text-white text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm mb-3">
            <span className="material-symbols-outlined text-3xl">developer_mode</span>
          </div>
          <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold tracking-wide uppercase">
            TripMate Mock Gateway
          </span>
          <h1 className="mt-2 text-xl font-bold">Cổng Thanh Toán Thử Nghiệm</h1>
          <p className="mt-1 text-xs text-teal-100">
            Môi trường giả lập dùng cho phát triển và kiểm thử UC-28
          </p>
        </div>

        {/* Transaction Summary Box */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-700 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-lg shrink-0 mt-0.5">
                error
              </span>
              <div>
                <p className="font-bold">Lỗi xử lý</p>
                <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Mã đặt tour:</span>
              <span className="font-bold text-slate-800">{displayBookingCode}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Mã thanh toán (Order Code):</span>
              <span className="font-mono text-slate-800 font-semibold">{displayOrderCode}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Hạn thanh toán:</span>
              <span className="text-slate-700 font-medium">
                {formatDatetime(statusDto?.paymentExpiresAt ?? undefined)}
              </span>
            </div>
            <div className="pt-3 border-t border-slate-200/60 flex justify-between items-baseline">
              <span className="text-sm font-semibold text-slate-700">Tổng thanh toán:</span>
              <span className="text-2xl font-black text-[#007d6e]">
                {formatCurrency(displayAmount)}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold text-slate-700 mb-3 text-center">
              Chọn kết quả mô phỏng giao dịch:
            </p>

            <div className="space-y-3">
              <button
                type="button"
                disabled={submitting || !resolvedPaymentId}
                onClick={() => handleOutcome('Success', resolvedPaymentId)}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 transition"
              >
                <span className="material-symbols-outlined text-lg">check_circle</span>
                <span>Thanh toán thành công (Success)</span>
              </button>

              <button
                type="button"
                disabled={submitting || !resolvedPaymentId}
                onClick={() => handleOutcome('Cancelled', resolvedPaymentId)}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 transition"
              >
                <span className="material-symbols-outlined text-lg">cancel</span>
                <span>Hủy thanh toán (Cancel)</span>
              </button>

            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <button
              type="button"
              disabled={submitting}
              onClick={() =>
                router.push(
                  bookingId
                    ? `/checkout/result?bookingId=${encodeURIComponent(bookingId)}`
                    : '/bookings',
                )
              }
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
            >
              ← Quay lại trang kết quả đặt tour
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
