'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ROUTES } from '@/lib/routes';
import { getTicket } from '../services/bookingApi';
import type { TicketDto } from '../types/ticket';
import { QrCodeDisplay } from './QrCodeDisplay';

interface BookingTicketViewProps {
  bookingId: string;
}

function formatCurrency(amount: number, currency: string = 'VND'): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency === 'VND' ? 'VND' : currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDatetime(isoString: string): string {
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

export function BookingTicketView({ bookingId }: BookingTicketViewProps) {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === '1';

  const [loading, setLoading] = useState<boolean>(true);
  const [ticket, setTicket] = useState<TicketDto | null>(null);
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getTicket(bookingId, { allowDemo: isDemo })
      .then((data) => {
        if (!isMounted) return;
        setTicket(data);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Không thể tải chi tiết vé điện tử.';
        setPendingNotice(msg);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [bookingId, isDemo]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-10 w-10 animate-spin rounded-full border-3 border-[#007d6e] border-t-transparent"
            aria-hidden="true"
          />
          <p className="text-xs font-semibold text-slate-500">
            Đang tải dữ liệu vé điện tử QR…
          </p>
        </div>
      </div>
    );
  }

  // Pending BE Integration State
  if (pendingNotice || !ticket) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center font-sans" lang="vi">
        <div className="rounded-3xl border border-amber-200 bg-white p-8 shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 mb-4">
            <span className="material-symbols-outlined text-3xl">pending_actions</span>
          </div>

          <h2 className="text-lg font-bold text-slate-900 mb-2">
            Vé điện tử QR: PENDING_BE_INTEGRATION
          </h2>

          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            {pendingNotice || 'Dịch vụ phát hành vé điện tử đang chờ kết nối máy chủ.'}
          </p>

          {process.env.NODE_ENV !== 'production' && !isDemo && (
            <div className="mb-6 rounded-2xl bg-teal-50 border border-teal-200 p-4 text-xs text-teal-900 text-left">
              <p className="font-bold mb-1">Kiểm thử giao diện (Demo Preview):</p>
              <p className="text-teal-700 text-[11px] mb-3">
                Bạn có thể xem trước giao diện vé điện tử QR hoàn chỉnh đã phê duyệt (UC-29) bằng tham số demo:
              </p>
              <Link
                href={`/bookings/${bookingId}/ticket?demo=1`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#007d6e] px-4 py-2 text-xs font-bold text-white hover:bg-[#006b5f] transition"
              >
                <span className="material-symbols-outlined text-sm">science</span>
                <span>Xem vé điện tử QR Demo (?demo=1)</span>
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 font-sans print:p-0" lang="vi">
      {/* Breadcrumb Navigation (Hidden when printing) */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-slate-500 print:hidden">
        <Link href={ROUTES.home} className="hover:text-[#007d6e] transition">
          Trang chủ
        </Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <Link href={ROUTES.tours} className="hover:text-[#007d6e] transition">
          Gói tour
        </Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="font-semibold text-slate-900">Vé điện tử QR (UC-29)</span>
      </nav>

      {/* Demo notice (Hidden when printing) */}
      {isDemo && (
        <div className="mb-6 rounded-2xl border border-teal-200 bg-teal-50/70 p-3.5 text-xs text-teal-900 flex items-center justify-between shadow-xs print:hidden">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-600 text-base">science</span>
            <span className="font-semibold">Mô phỏng vé điện tử QR hoàn tất (UC-29 Demo)</span>
          </div>
          <span className="rounded-md bg-teal-200 px-2 py-0.5 text-[10px] font-extrabold uppercase text-teal-900">
            DEMO ONLY
          </span>
        </div>
      )}

      {/* Confirmed check-in banner */}
      <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs text-emerald-900 flex items-start gap-3 shadow-xs">
        <span className="material-symbols-outlined text-emerald-600 text-xl shrink-0">check_circle</span>
        <div>
          <p className="font-bold text-emerald-950">Đã xác nhận thanh toán thành công!</p>
          <p className="text-emerald-800 text-[11px] mt-0.5">
            Vui lòng xuất trình mã QR này cho Điều hành tour hoặc Hướng dẫn viên tại điểm tập trung khi làm thủ tục check-in.
          </p>
        </div>
      </div>

      {/* E-Ticket Card (Boarding Pass Motif) */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        {/* Ticket Header */}
        <div className="bg-gradient-to-r from-teal-800 to-[#00152a] p-6 text-white text-center">
          <span className="inline-block rounded-full bg-emerald-500/20 border border-emerald-400/40 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-300">
            ĐÃ XÁC NHẬN (CONFIRMED)
          </span>

          <h1 className="mt-3 text-lg sm:text-xl font-black leading-tight text-white drop-shadow-xs">
            {ticket.tourTitle}
          </h1>

          <p className="mt-1 text-xs text-teal-200">
            {ticket.operatorName} • Bảo chứng TripMate Escrow
          </p>
        </div>

        {/* QR Section */}
        <div className="p-6 text-center bg-slate-50/60 border-b border-dashed border-slate-200">
          <div className="mx-auto flex justify-center">
            <QrCodeDisplay
              value={ticket.qrPayload || ticket.ticketCode}
              size={180}
              ariaLabel={`Mã QR vé ${ticket.ticketCode}`}
            />
          </div>

          <p className="mt-3 font-mono text-base font-black tracking-widest text-slate-900">
            {ticket.ticketCode}
          </p>

          <p className="text-[11px] text-slate-400 mt-1">
            Độ sáng màn hình sẽ tự động nâng cao khi mở vé trên ứng dụng di động.
          </p>
        </div>

        {/* Ticket Metadata Grid */}
        <div className="p-6 text-xs divide-y divide-slate-100 space-y-3">
          <div className="flex justify-between items-center pt-1">
            <span className="text-slate-500">Thời gian khởi hành:</span>
            <strong className="text-slate-900 font-bold">
              {formatDatetime(ticket.departureDatetime)}
            </strong>
          </div>

          <div className="flex justify-between items-start pt-3">
            <span className="text-slate-500 shrink-0 mr-4">Điểm tập trung / Đón:</span>
            <strong className="text-slate-900 font-bold text-right">
              {ticket.meetingPoint}
            </strong>
          </div>

          <div className="flex justify-between items-center pt-3">
            <span className="text-slate-500">Khách tham gia:</span>
            <strong className="text-slate-900 font-bold">{ticket.travelerSummary}</strong>
          </div>

          <div className="flex justify-between items-center pt-3">
            <span className="text-slate-500">Trưởng đoàn:</span>
            <strong className="text-slate-900 font-bold">
              {ticket.leadTravelerName} ({ticket.leadTravelerPhone})
            </strong>
          </div>

          <div className="flex justify-between items-center pt-3">
            <span className="text-slate-500">Mã đơn đặt tour:</span>
            <span className="font-mono font-bold text-slate-800">{ticket.bookingCode}</span>
          </div>

          <div className="flex justify-between items-center pt-3">
            <span className="text-slate-500">Đã thanh toán:</span>
            <strong className="text-[#007d6e] font-black text-sm">
              {formatCurrency(ticket.paidAmount, ticket.currency)} • {ticket.paymentMethod}
            </strong>
          </div>
        </div>

        {/* Offline Banner Footer */}
        <div className="bg-blue-50/60 border-t border-blue-100 p-4 text-center text-xs text-blue-900 flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-blue-600 text-base">cloud_download</span>
          <span>Vé điện tử có thể xem ngoại tuyến trên thiết bị khi đã lưu về máy.</span>
        </div>
      </div>

      {/* Action Buttons (Hidden when printing) */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">print</span>
          <span>In vé / Lưu file PDF</span>
        </button>

        <Link
          href={ROUTES.tours}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
        >
          <span className="material-symbols-outlined text-base">explore</span>
          <span>Khám phá thêm các tour khác</span>
        </Link>
      </div>
    </div>
  );
}
