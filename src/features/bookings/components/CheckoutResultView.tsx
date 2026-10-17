'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ROUTES } from '@/lib/routes';
import { createOrReusePayment, getBookingPaymentStatus } from '../services/paymentApi';
import type { BookingPaymentStatusDto } from '../types/payment';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDatetime(isoString?: string): string {
  if (!isoString) return 'Vừa xong';
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

export function CheckoutResultView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  const [loading, setLoading] = useState<boolean>(Boolean(bookingId));
  const [retrying, setRetrying] = useState<boolean>(false);
  const [statusDto, setStatusDto] = useState<BookingPaymentStatusDto | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchStatus = () => {
    if (!bookingId) return;
    setLoading(true);
    getBookingPaymentStatus(bookingId)
      .then((data) => {
        setStatusDto(data);
        setErrorMessage(null);
      })
      .catch((err: unknown) => {
        const msg =
          err instanceof Error ? err.message : 'Không thể tải thông tin thanh toán từ hệ thống.';
        setErrorMessage(msg);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!bookingId) return;

    let isMounted = true;
    getBookingPaymentStatus(bookingId)
      .then((data) => {
        if (!isMounted) return;
        setStatusDto(data);
        setErrorMessage(null);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const msg =
          err instanceof Error ? err.message : 'Không thể tải thông tin thanh toán từ hệ thống.';
        setErrorMessage(msg);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  const handlePayAgain = async () => {
    if (!bookingId || retrying) return;
    setRetrying(true);
    setErrorMessage(null);

    try {
      const res = await createOrReusePayment(bookingId);
      if (res.checkoutUrl.startsWith('http')) {
        window.location.href = res.checkoutUrl;
      } else {
        router.push(res.checkoutUrl);
      }
    } catch (err: unknown) {
      setRetrying(false);
      const msg =
        err instanceof Error ? err.message : 'Không thể kết nối cổng thanh toán. Vui lòng thử lại sau.';
      setErrorMessage(msg);
    }
  };

  if (!bookingId) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center font-sans" lang="vi">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 mb-4">
            <span className="material-symbols-outlined text-3xl">info</span>
          </div>

          <h2 className="text-lg font-bold text-slate-900 mb-2">
            Thông tin thanh toán
          </h2>

          <p className="text-xs text-slate-600 leading-relaxed mb-6">
            Không tìm thấy thông tin mã đặt tour (bookingId).
          </p>

          <div className="flex justify-center">
            <Link
              href={ROUTES.home}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
            >
              Về Trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-10 w-10 animate-spin rounded-full border-3 border-[#007d6e] border-t-transparent"
            aria-hidden="true"
          />
          <p className="text-xs font-semibold text-slate-500">
            Đang xác thực kết quả thanh toán từ hệ thống…
          </p>
        </div>
      </div>
    );
  }

  // Error fetching canonical status
  if (errorMessage || !statusDto) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center font-sans" lang="vi">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 mb-4">
            <span className="material-symbols-outlined text-3xl">info</span>
          </div>

          <h2 className="text-lg font-bold text-slate-900 mb-2">
            Thông tin thanh toán
          </h2>

          <p className="text-xs text-slate-600 leading-relaxed mb-6">
            {errorMessage ?? 'Không tìm thấy dữ liệu giao dịch thanh toán.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={fetchStatus}
              className="rounded-xl bg-[#007d6e] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#006b5f] transition"
            >
              Thử tải lại
            </button>
            <Link
              href={ROUTES.home}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
            >
              Về Trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isPaid =
    statusDto.bookingStatus === 'Confirmed' || statusDto.paymentStatus === 'Paid';
  const isExpired = statusDto.bookingStatus === 'Expired';
  const activeTx = statusDto.activePayment;
  const isCancelledTx = activeTx?.status === 'Cancelled';
  const amount = activeTx?.amount ?? 0;

  // 1. Success / Paid State
  if (isPaid) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 font-sans" lang="vi">
        <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-xl">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm mb-4">
              <span className="material-symbols-outlined text-4xl">verified</span>
            </div>
            <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold tracking-wide uppercase">
              Giao dịch thành công
            </span>
            <h1 className="mt-2 text-2xl font-black">Thanh Toán Hoàn Tất!</h1>
            <p className="mt-1 text-xs text-emerald-100">
              Đơn đặt tour của bạn đã được xác nhận thanh toán điện tử an toàn.
            </p>
          </div>

          <div className="p-8">
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5 space-y-3 mb-6">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Mã đặt tour:</span>
                <span className="font-bold text-slate-900">{statusDto.bookingCode}</span>
              </div>
              {activeTx?.orderCode ? (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Mã giao dịch (Order Code):</span>
                  <span className="font-mono text-slate-800 font-semibold">{activeTx.orderCode}</span>
                </div>
              ) : null}
              {activeTx?.gateway ? (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Cổng thanh toán:</span>
                  <span className="font-semibold text-slate-800">{activeTx.gateway}</span>
                </div>
              ) : null}
              <div className="pt-3 border-t border-slate-200/60 flex justify-between items-baseline">
                <span className="text-sm font-semibold text-slate-700">Tổng đã thanh toán:</span>
                <span className="text-2xl font-black text-emerald-600">
                  {formatCurrency(amount)}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={`/bookings/${encodeURIComponent(String(statusDto.bookingId))}/ticket`}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#007d6e] px-6 py-3.5 text-xs font-bold text-white shadow-md hover:bg-[#006b5f] transition text-center"
              >
                <span className="material-symbols-outlined text-sm">confirmation_number</span>
                <span>Xem Vé Điện Tử QR</span>
              </Link>
              <Link
                href={ROUTES.account.trips}
                className="flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition text-center"
              >
                Quản lý chuyến đi
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Expired State
  if (isExpired) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 font-sans" lang="vi">
        <div className="overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-xl">
          <div className="bg-gradient-to-r from-rose-600 to-rose-700 p-8 text-white text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm mb-4">
              <span className="material-symbols-outlined text-4xl">timer_off</span>
            </div>
            <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold tracking-wide uppercase">
              Hết hạn giữ chỗ
            </span>
            <h1 className="mt-2 text-2xl font-black">Đơn Tour Đã Hết Hạn</h1>
            <p className="mt-1 text-xs text-rose-100">
              Thời gian giữ chỗ thanh toán đã kết thúc. Chỗ ngồi đã được giải phóng.
            </p>
          </div>

          <div className="p-8 text-center">
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Mã đặt tour <strong className="text-slate-900">{statusDto.bookingCode}</strong> không còn hiệu lực thanh toán. Quý khách vui lòng chọn lịch khởi hành mới để tiếp tục đặt tour.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={ROUTES.tours}
                className="rounded-2xl bg-[#007d6e] px-6 py-3.5 text-xs font-bold text-white hover:bg-[#006b5f] transition"
              >
                Khám phá các tour khác
              </Link>
              <Link
                href={ROUTES.home}
                className="rounded-2xl border border-slate-200 px-5 py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Về Trang chủ
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Pending Payment (with Cancelled or Open transaction)
  return (
    <div className="mx-auto max-w-xl px-4 py-12 font-sans" lang="vi">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div
          className={`p-8 text-white text-center ${
            isCancelledTx
              ? 'bg-gradient-to-r from-amber-600 to-amber-700'
              : 'bg-gradient-to-r from-teal-700 to-[#007d6e]'
          }`}
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm mb-4">
            <span className="material-symbols-outlined text-4xl">
              {isCancelledTx ? 'cancel' : 'pending_actions'}
            </span>
          </div>
          <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold tracking-wide uppercase">
            {isCancelledTx ? 'Giao dịch đã hủy' : 'Chờ thanh toán'}
          </span>
          <h1 className="mt-2 text-2xl font-black">
            {isCancelledTx ? 'Thanh Toán Chưa Hoàn Tất' : 'Đang Chờ Thanh Toán'}
          </h1>
          <p className="mt-1 text-xs text-slate-100">
            {isCancelledTx
              ? 'Bạn đã hủy thao tác tại cổng thanh toán. Chỗ giữ vẫn được bảo lưu.'
              : 'Giao dịch đang chờ thanh toán qua cổng điện tử.'}
          </p>
        </div>

        <div className="p-8">
          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5 space-y-3 mb-6">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Mã đặt tour:</span>
              <span className="font-bold text-slate-900">{statusDto.bookingCode}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Hạn giữ chỗ thanh toán:</span>
              <span className="font-semibold text-rose-600">
                {formatDatetime(statusDto.paymentExpiresAt)}
              </span>
            </div>
            <div className="pt-3 border-t border-slate-200/60 flex justify-between items-baseline">
              <span className="text-sm font-semibold text-slate-700">Số tiền cần thanh toán:</span>
              <span className="text-2xl font-black text-[#007d6e]">
                {formatCurrency(amount)}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              disabled={retrying}
              onClick={handlePayAgain}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#007d6e] px-6 py-3.5 text-xs font-bold text-white shadow-md hover:bg-[#006b5f] disabled:opacity-50 transition"
            >
              <span className="material-symbols-outlined text-sm">payment</span>
              <span>{retrying ? 'Đang tạo liên kết…' : 'Tiến hành thanh toán ngay'}</span>
            </button>

            <button
              type="button"
              disabled={retrying}
              onClick={() => {
                setLoading(true);
                fetchStatus();
              }}
              className="w-full flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Kiểm tra lại trạng thái
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
