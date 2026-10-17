'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { ROUTES } from '@/lib/routes';
import { getBooking, initiatePayment } from '../services/bookingApi';
import { BookingApiError } from '../types/booking';
import type { BookingDto, PaymentMethod } from '../types/booking';

interface PaymentHandoffViewProps {
  bookingId: string;
  isDemo?: boolean;
}

function formatCurrency(amount: number, currency: string = 'VND'): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency === 'VND' ? 'VND' : currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * UC-28 Make Electronic Payment — entry point. UC-27 only navigates here with a bookingId;
 * this component owns payment-method selection and gateway initiation, loading the booking
 * itself so no PendingPayment amount/expiry is ever trusted from a client-held value.
 */
export function PaymentHandoffView({ bookingId, isDemo = false }: PaymentHandoffViewProps) {
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('VNPay');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const expiryRefreshRequested = useRef(false);

  useEffect(() => {
    expiryRefreshRequested.current = false;
    let isMounted = true;
    getBooking(bookingId, { allowDemo: isDemo })
      .then((result) => {
        if (!isMounted) return;
        setBooking(result);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setLoadError(err instanceof Error ? err.message : 'Không thể tải thông tin đơn đặt tour.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [bookingId, isDemo]);

  // Countdown is derived from the server's paymentExpiresAt, never a client-started timer, so a
  // page refresh or a slow network fetch cannot grant extra hold time.
  useEffect(() => {
    if (!booking) return;
    const expiryMs = new Date(booking.paymentExpiresAt).getTime();
    const tick = () => {
      const remainingMs = expiryMs - Date.now();
      setSecondsRemaining(Math.max(0, Math.floor(remainingMs / 1000)));
      if (remainingMs <= 0) setIsExpired(true);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [booking]);

  // On expiry the client stops trusting its own state and asks the server what actually happened —
  // the hold may have been released, or payment may have completed in another tab.
  useEffect(() => {
    if (!isExpired || !booking || expiryRefreshRequested.current) return;
    expiryRefreshRequested.current = true;
    let isMounted = true;
    getBooking(bookingId, { allowDemo: isDemo })
      .then((result) => {
        if (isMounted) setBooking(result);
      })
      .catch(() => {
        /* Keep the expired state. A later page visit retries against the server. */
      });
    return () => {
      isMounted = false;
    };
  }, [isExpired, bookingId, isDemo]);

  const countdownText = useMemo(() => {
    const mins = Math.floor(secondsRemaining / 60);
    const secs = secondsRemaining % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [secondsRemaining]);

  const handleProceedPayment = async () => {
    if (!booking) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await initiatePayment(booking.bookingId, selectedPaymentMethod, { allowDemo: isDemo });
      if (res.paymentUrl) router.push(res.paymentUrl);
    } catch (err: unknown) {
      setActionError(
        err instanceof BookingApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Không thể kết nối cổng thanh toán.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div
          className="h-9 w-9 animate-spin rounded-full border-3 border-[#007d6e] border-t-transparent"
          aria-hidden="true"
        />
      </div>
    );
  }

  if (loadError || !booking) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Không thể tải đơn đặt tour</h2>
          <p className="text-xs text-slate-600 leading-relaxed mb-6">
            {loadError ?? 'Đơn đặt tour không tồn tại hoặc bạn không có quyền xem.'}
          </p>
          <Link
            href={ROUTES.tours}
            className="inline-flex rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
          >
            Quay lại danh sách tour
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6 font-sans" lang="vi">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Mã đơn đặt tour</p>
            <p className="text-base font-black font-mono text-slate-900">{booking.bookingCode}</p>
          </div>
          <div className="text-right">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
              Chờ thanh toán
            </span>
            <p className="text-2xl font-black text-[#007d6e] mt-1">{formatCurrency(booking.totalAmount, booking.currency)}</p>
          </div>
        </div>

        {isExpired ? (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-center text-xs text-red-800 flex items-center justify-center gap-2 mt-3">
            <span className="material-symbols-outlined text-red-600 text-sm">error</span>
            <span>Thời gian giữ chỗ đã hết. Vui lòng đặt lại tour để tiếp tục.</span>
          </div>
        ) : (
          <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-3 text-center text-xs text-amber-900 flex items-center justify-center gap-2 mt-3">
            <span className="material-symbols-outlined text-amber-700 text-sm">schedule</span>
            <span>
              Giữ chỗ trong <strong className="font-mono text-amber-950 font-bold">{countdownText}</strong> trước khi hệ thống tự động giải phóng chỗ.
            </span>
          </div>
        )}
      </div>

      {!isExpired && (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#007d6e] text-base">payments</span>
              Chọn phương thức thanh toán
            </h3>

            <div className="space-y-3">
              <label
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition ${
                  selectedPaymentMethod === 'VNPay'
                    ? 'border-[#007d6e] bg-teal-50/30 ring-1 ring-[#007d6e]'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="VNPay"
                    checked={selectedPaymentMethod === 'VNPay'}
                    onChange={() => setSelectedPaymentMethod('VNPay')}
                    className="h-4 w-4 text-[#007d6e] focus:ring-[#007d6e]"
                  />
                  <div>
                    <span className="block text-sm font-bold text-slate-900">VNPay Gateway</span>
                    <span className="text-xs text-slate-500">
                      Thẻ ATM nội địa, Internet Banking, Thẻ quốc tế Visa/Mastercard
                    </span>
                  </div>
                </div>
                <span className="rounded-md bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800">Khuyên dùng</span>
              </label>

              <label
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition ${
                  selectedPaymentMethod === 'VNPayQR'
                    ? 'border-[#007d6e] bg-teal-50/30 ring-1 ring-[#007d6e]'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="VNPayQR"
                    checked={selectedPaymentMethod === 'VNPayQR'}
                    onChange={() => setSelectedPaymentMethod('VNPayQR')}
                    className="h-4 w-4 text-[#007d6e] focus:ring-[#007d6e]"
                  />
                  <div>
                    <span className="block text-sm font-bold text-slate-900">VNPay QR Code</span>
                    <span className="text-xs text-slate-500">
                      Quét mã thanh toán trực tiếp qua 30+ ứng dụng ngân hàng &amp; ví điện tử
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-400">qr_code_2</span>
              </label>
            </div>

            <div className="mt-5 rounded-xl bg-blue-50/70 border border-blue-200 p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-blue-600 text-lg">verified_user</span>
              <div>
                <p className="font-bold">Bảo chứng an toàn thanh toán</p>
                <p className="text-blue-800 text-[11px] mt-0.5">
                  Bạn sẽ được chuyển hướng an toàn tới cổng thanh toán VNPay chuẩn PCI DSS. TripMate không bao giờ lưu trữ thông tin thẻ của bạn.
                </p>
              </div>
            </div>
          </div>

          {actionError && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 shadow-sm">
              {actionError}
            </div>
          )}

          <button
            type="button"
            disabled={isSubmitting || secondsRemaining <= 0}
            onClick={handleProceedPayment}
            className="w-full rounded-xl bg-[#007d6e] py-3.5 px-4 text-center text-sm font-bold text-white shadow-md transition hover:bg-[#006b5f] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Đang kết nối cổng VNPay…</span>
              </>
            ) : (
              <>
                <span>
                  Thanh toán {formatCurrency(booking.totalAmount, booking.currency)} với {selectedPaymentMethod}
                </span>
                <span className="material-symbols-outlined text-base">lock</span>
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}
