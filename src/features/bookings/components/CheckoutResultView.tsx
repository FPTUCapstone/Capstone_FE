'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ROUTES } from '@/lib/routes';
import { verifyPayment } from '../services/bookingApi';
import type { PaymentVerifyResultDto } from '../types/booking';

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
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === '1';

  const [loading, setLoading] = useState<boolean>(true);
  const [result, setResult] = useState<PaymentVerifyResultDto | null>(null);
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    verifyPayment(searchParams, { allowDemo: isDemo })
      .then((data) => {
        if (!isMounted) return;
        setResult(data);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Không thể xác thực giao dịch.';
        setPendingNotice(msg);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [searchParams, isDemo]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-10 w-10 animate-spin rounded-full border-3 border-[#007d6e] border-t-transparent"
            aria-hidden="true"
          />
          <p className="text-xs font-semibold text-slate-500">
            Đang xác thực kết quả thanh toán từ cổng điện tử…
          </p>
        </div>
      </div>
    );
  }

  // Pending BE Integration State (Truthful Real Mode)
  if (pendingNotice) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center font-sans" lang="vi">
        <div className="rounded-3xl border border-amber-200 bg-white p-8 shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 mb-4">
            <span className="material-symbols-outlined text-3xl">pending_actions</span>
          </div>

          <h2 className="text-lg font-bold text-slate-900 mb-2">
            Xác thực thanh toán: PENDING_BE_INTEGRATION
          </h2>

          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            {pendingNotice}
          </p>

          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600 text-left mb-6 space-y-2">
            <p className="font-bold text-slate-900">Quy tắc bảo mật hệ thống:</p>
            <p className="text-[11px] leading-relaxed">
              Theo tiêu chuẩn bảo mật thanh toán tài chính, kết quả thanh toán từ VNPay bắt buộc phải được Backend xác thực chữ ký điện tử (HMAC-SHA512) để tránh gian lận thay đổi tham số URL từ phía client.
            </p>
          </div>

          {process.env.NODE_ENV !== 'production' && !isDemo && (
            <div className="mb-6 rounded-2xl bg-teal-50 border border-teal-200 p-4 text-xs text-teal-900 text-left">
              <p className="font-bold mb-1">Kiểm thử giao diện (Demo Preview):</p>
              <p className="text-teal-700 text-[11px] mb-3">
                Bạn có thể xem trước trạng thái thanh toán thành công và vé điện tử QR bằng cách kích hoạt chế độ Demo:
              </p>
              <Link
                href="/checkout/result?vnp_ResponseCode=00&vnp_TxnRef=VNPTXN-884920&bookingId=bk-demo-0148&demo=1"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#007d6e] px-4 py-2 text-xs font-bold text-white hover:bg-[#006b5f] transition"
              >
                <span className="material-symbols-outlined text-sm">science</span>
                <span>Xem kết quả thanh toán Demo (?demo=1)</span>
              </Link>
            </div>
          )}

          <div className="flex justify-center gap-3">
            <Link
              href={ROUTES.tours}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
            >
              Về danh sách tour
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Payment Success
  if (result?.isSuccess) {
    const bookingId = result.bookingId || 'bk-demo-0148';
    const ticketUrl = `${ROUTES.bookingTicket(bookingId)}${isDemo ? '?demo=1' : ''}`;

    return (
      <div className="mx-auto max-w-xl px-4 py-12 font-sans" lang="vi">
        {/* Demo banner */}
        {isDemo && (
          <div className="mb-6 rounded-2xl border border-teal-200 bg-teal-50/70 p-3.5 text-xs text-teal-900 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-600 text-base">science</span>
              <span className="font-semibold">Mô phỏng kết quả thanh toán thành công (Demo Mode)</span>
            </div>
            <span className="rounded-md bg-teal-200 px-2 py-0.5 text-[10px] font-extrabold uppercase text-teal-900">
              DEMO ONLY
            </span>
          </div>
        )}

        {/* Success Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 mb-4 animate-in zoom-in-95 duration-200">
            <span className="material-symbols-outlined text-3xl">check_circle</span>
          </div>

          <h2 className="text-xl font-bold text-slate-900 mb-1">Thanh toán thành công!</h2>
          <p className="text-xs text-slate-500 mb-6">
            Đơn đặt tour của bạn đã được ghi nhận. Vé điện tử QR đã được phát hành tự động.
          </p>

          {/* Transaction Summary Details */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 text-left text-xs space-y-3 mb-6">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500">Mã đơn đặt:</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {result.bookingCode}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500">Mã giao dịch cổng:</span>
              <span className="font-mono font-semibold text-slate-800">
                {result.transactionRef}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500">Phương thức thanh toán:</span>
              <span className="font-semibold text-slate-800">{result.paymentMethod}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500">Thời gian giao dịch:</span>
              <span className="font-semibold text-slate-800">
                {formatDatetime(result.paidAtUtc)}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-900">Tổng tiền đã thanh toán:</span>
              <span className="text-base font-black text-[#007d6e]">
                {formatCurrency(result.amount)}
              </span>
            </div>
          </div>

          {/* Next Action: Go to Ticket */}
          <div className="space-y-3">
            <Link
              href={ticketUrl}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#007d6e] py-3.5 px-4 text-xs font-bold text-white shadow-md transition hover:bg-[#006b5f]"
            >
              <span>Xem vé điện tử QR ngay (UC-29)</span>
              <span className="material-symbols-outlined text-base">qr_code_2</span>
            </Link>

            <Link
              href={ROUTES.tours}
              className="w-full inline-flex items-center justify-center rounded-xl border border-slate-200 py-3 px-4 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
            >
              Khám phá thêm các tour khác
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Payment Failed or Cancelled
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center font-sans" lang="vi">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-700 mb-4">
          <span className="material-symbols-outlined text-3xl">error</span>
        </div>

        <h2 className="text-lg font-bold text-slate-900 mb-1">
          Giao dịch thanh toán chưa hoàn tất
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          {result?.errorMessage || 'Giao dịch bị gián đoạn hoặc đã bị hủy bỏ bởi người dùng.'}
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Link
            href={ROUTES.tours}
            className="rounded-xl bg-[#007d6e] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#006b5f] transition"
          >
            Quay lại danh sách tour
          </Link>
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
