'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { formatTripDateTime } from '@/features/trips/utils/formatTripDate';
import { ROUTES } from '@/lib/routes';

import { ticketMessages } from '../resources/ticketMessages';
import { isBookingDemoAllowedInCurrentEnv } from '../services/bookingApi';
import { fetchTicket, refreshTicketQr, TicketClientError, type TicketKey } from '../services/ticketClient';
import type { TicketStatus, TicketView } from '../types/ticket';
import { QrCodeDisplay } from './QrCodeDisplay';

interface BookingTicketViewProps {
  ticketKey: TicketKey;
  /** The page path, used as the sign-in `returnUrl`. */
  returnPath: string;
}

type LoadState =
  | { kind: 'loading' }
  | { kind: 'failed'; error: TicketClientError }
  | { kind: 'ready'; ticket: TicketView; notice: string | null };

const STATUS_STYLE: Record<TicketStatus, string> = {
  NotYetActive: 'bg-sky-100 text-sky-900 border-sky-200',
  Valid: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  Used: 'bg-slate-100 text-slate-700 border-slate-200',
  Cancelled: 'bg-rose-100 text-rose-900 border-rose-200',
  Expired: 'bg-amber-100 text-amber-900 border-amber-200',
};

function departureDate(ticket: TicketView): string {
  const [year, month, day] = ticket.validity.departureDate.split('-');
  return `${day}/${month}/${year}`;
}

function statusMessage(ticket: TicketView): string {
  switch (ticket.ticketStatus) {
    case 'Valid':
      return ticketMessages.msg93;
    case 'NotYetActive':
      return ticketMessages.msg98(departureDate(ticket));
    case 'Used':
      return ticketMessages.msg95(ticket.checkedInAtUtc ? formatTripDateTime(ticket.checkedInAtUtc) : '');
    case 'Cancelled':
      return ticketMessages.msg139(ticket.bookingCode);
    case 'Expired':
      return ticketMessages.msg140(departureDate(ticket));
  }
}

function participantsText(ticket: TicketView): string {
  const { adult, child, infant } = ticket.participants;
  const parts = [
    adult > 0 ? `${adult} người lớn` : null,
    child > 0 ? `${child} trẻ em` : null,
    infant > 0 ? `${infant} em bé` : null,
  ].filter(Boolean);
  return `${parts.join(', ')} (${ticket.participantCount} khách)`;
}

function asClientError(error: unknown): TicketClientError {
  return error instanceof TicketClientError ? error : new TicketClientError('system', ticketMessages.msg127);
}

function useOnline(): boolean {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  return online;
}

export function BookingTicketView({ ticketKey, returnPath }: BookingTicketViewProps) {
  const searchParams = useSearchParams();
  const allowDemo = searchParams.get('demo') === '1' && isBookingDemoAllowedInCurrentEnv();
  const online = useOnline();

  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [confirming, setConfirming] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const ticketId = 'ticketId' in ticketKey ? ticketKey.ticketId : null;
  const bookingId = 'bookingId' in ticketKey ? ticketKey.bookingId : null;

  // Only the promise callbacks set state, so the initial read in the effect never renders synchronously.
  const request = useCallback(
    (signal?: AbortSignal) => {
      const key: TicketKey = ticketId !== null ? { ticketId } : { bookingId: bookingId ?? '' };
      fetchTicket(key, { allowDemo, signal })
        .then((ticket) => setState({ kind: 'ready', ticket, notice: null }))
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'AbortError') return;
          setState({ kind: 'failed', error: asClientError(error) });
        });
    },
    [allowDemo, ticketId, bookingId],
  );

  useEffect(() => {
    const controller = new AbortController();
    request(controller.signal);
    return () => controller.abort();
  }, [request]);

  const retry = () => {
    setState({ kind: 'loading' });
    request();
  };

  const refresh = async (current: TicketView) => {
    setConfirming(false);
    setRefreshing(true);
    try {
      const ticket = await refreshTicketQr(current.ticketId, { allowDemo });
      setState({ kind: 'ready', ticket, notice: null });
    } catch {
      // The old QR may already be revoked on the server: never keep showing it as valid without re-reading.
      try {
        const ticket = await fetchTicket({ ticketId: current.ticketId }, { allowDemo });
        setState({ kind: 'ready', ticket, notice: null });
      } catch {
        setState({ kind: 'ready', ticket: current, notice: ticketMessages.staleQr });
      }
    } finally {
      setRefreshing(false);
    }
  };

  if (state.kind === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" role="status">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-10 w-10 animate-spin rounded-full border-3 border-[#007d6e] border-t-transparent"
            aria-hidden="true"
          />
          <p className="text-xs font-semibold text-slate-500">Đang tải vé điện tử…</p>
        </div>
      </div>
    );
  }

  if (state.kind === 'failed') {
    const { error } = state;
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center font-sans" lang="vi">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <span className="material-symbols-outlined text-3xl" aria-hidden="true">
              confirmation_number
            </span>
          </div>
          <p className="mb-6 text-sm leading-relaxed text-slate-700" role="alert">
            {error.message}
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            {error.kind === 'signIn' ? (
              <Link
                href={`${ROUTES.signIn}?returnUrl=${encodeURIComponent(returnPath)}`}
                className="rounded-xl bg-[#007d6e] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#006b5f]"
              >
                Đăng nhập
              </Link>
            ) : null}
            {error.kind === 'system' ? (
              <button
                type="button"
                onClick={retry}
                className="rounded-xl bg-[#007d6e] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#006b5f]"
              >
                Thử lại
              </button>
            ) : null}
            <Link
              href={ROUTES.account.trips}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
            >
              Về chuyến đi của tôi
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { ticket, notice } = state;
  const canRefresh = ticket.ticketStatus === 'Valid' || ticket.ticketStatus === 'NotYetActive';
  const date = departureDate(ticket);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 font-sans print:p-0" lang="vi">
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-slate-500 print:hidden">
        <Link href={ROUTES.home} className="transition hover:text-[#007d6e]">
          Trang chủ
        </Link>
        <span className="material-symbols-outlined text-xs" aria-hidden="true">
          chevron_right
        </span>
        <Link href={ROUTES.account.trips} className="transition hover:text-[#007d6e]">
          Chuyến đi của tôi
        </Link>
        <span className="material-symbols-outlined text-xs" aria-hidden="true">
          chevron_right
        </span>
        <span className="font-semibold text-slate-900">Vé điện tử QR</span>
      </nav>

      {ticket.isDemo ? (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-teal-200 bg-teal-50/70 p-3.5 text-xs text-teal-900 print:hidden">
          <span className="font-semibold">Vé điện tử mô phỏng — không dùng để check-in</span>
          <span className="rounded-md bg-teal-200 px-2 py-0.5 text-[10px] font-extrabold uppercase">DEMO ONLY</span>
        </div>
      ) : null}

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-800" role="status">
        {statusMessage(ticket)}
      </div>

      {notice ? (
        <div className="mb-6 space-y-1 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900" role="alert">
          <p>{ticketMessages.msg127}</p>
          <p className="font-semibold">{notice}</p>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="bg-gradient-to-r from-teal-800 to-[#00152a] p-6 text-center text-white">
          <span
            className={`inline-block rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider ${STATUS_STYLE[ticket.ticketStatus]}`}
          >
            {ticketMessages.status[ticket.ticketStatus]}
          </span>
          <h1 className="mt-3 text-lg font-black leading-tight sm:text-xl">{ticket.tour.title}</h1>
          <p className="mt-1 text-xs text-teal-200">{ticket.operatorName}</p>
        </div>

        <div className="border-b border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
          {ticket.qr ? (
            <div className="mx-auto flex justify-center">
              <QrCodeDisplay value={ticket.qr.content} size={220} ariaLabel={`Mã QR vé ${ticket.ticketCode}`} />
            </div>
          ) : null}
          <p className="mt-3 font-mono text-base font-black tracking-widest text-slate-900">{ticket.ticketCode}</p>
          <p className="mt-1 text-[11px] text-slate-500">{ticketMessages.validityNote(date)}</p>
        </div>

        <dl className="space-y-3 divide-y divide-slate-100 p-6 text-xs">
          <div className="flex items-center justify-between gap-4 pt-1">
            <dt className="text-slate-500">Mã vé</dt>
            <dd className="font-mono font-bold text-slate-800">{ticket.ticketCode}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 pt-3">
            <dt className="text-slate-500">Mã đơn đặt tour</dt>
            <dd className="font-mono font-bold text-slate-800">{ticket.bookingCode}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 pt-3">
            <dt className="text-slate-500">Khởi hành</dt>
            <dd className="font-bold text-slate-900">{formatTripDateTime(ticket.schedule.startAtUtc)}</dd>
          </div>
          <div className="flex items-start justify-between gap-4 pt-3">
            <dt className="shrink-0 text-slate-500">Điểm tập trung</dt>
            <dd className="text-right font-bold text-slate-900">
              {ticket.schedule.meetingPoint ?? ticketMessages.meetingPointMissing}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 pt-3">
            <dt className="text-slate-500">Khách tham gia</dt>
            <dd className="font-bold text-slate-900">{participantsText(ticket)}</dd>
          </div>
          {ticket.checkedInAtUtc ? (
            <div className="flex items-center justify-between gap-4 pt-3">
              <dt className="text-slate-500">Check-in lúc</dt>
              <dd className="font-bold text-slate-900">{formatTripDateTime(ticket.checkedInAtUtc)}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      {confirming ? (
        <div
          role="alertdialog"
          aria-labelledby="ticket-refresh-confirm"
          className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950 print:hidden"
        >
          <p id="ticket-refresh-confirm" className="mb-3 font-semibold">
            {ticketMessages.refreshConfirm}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => refresh(ticket)}
              className="rounded-xl bg-[#007d6e] px-4 py-2 font-bold text-white transition hover:bg-[#006b5f]"
            >
              Làm mới
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-bold text-slate-700 transition hover:bg-slate-100"
            >
              Huỷ
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row print:hidden">
        {canRefresh ? (
          <button
            type="button"
            disabled={!online || refreshing}
            onClick={() => setConfirming(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#007d6e] px-6 py-3 text-xs font-bold text-white shadow-md transition hover:bg-[#006b5f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">
              refresh
            </span>
            <span>{refreshing ? 'Đang làm mới…' : 'Làm mới mã QR'}</span>
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-xs font-bold text-white shadow-md transition hover:bg-slate-800"
        >
          <span className="material-symbols-outlined text-base" aria-hidden="true">
            print
          </span>
          <span>In vé</span>
        </button>
        <Link
          href={ROUTES.account.trips}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
        >
          Về chuyến đi của tôi
        </Link>
      </div>
      {canRefresh && !online ? (
        <p className="mt-3 text-center text-xs text-slate-500 print:hidden">{ticketMessages.offline}</p>
      ) : null}
    </div>
  );
}
