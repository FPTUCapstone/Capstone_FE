'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';

import { useWebSession } from '@/features/auth/session/useWebSession';

import {
  countStayNights,
  formatStayDate,
  STAY_DIRECT_EXCHANGE_NOTICE,
  stayRequest,
  stayStatus,
  type StayFacility,
  type StayInquiry,
} from './stayApi';
import { ClaimStay } from './StayOwnership';

const SURFACE_CARD =
  'rounded-2xl border border-[#DCE2DD] bg-white shadow-[0_4px_20px_-2px_rgba(0,21,42,0.045)]';
const INPUT_CLASS =
  'mt-1.5 block w-full rounded-xl border border-[#BFC9C3] bg-white px-3.5 py-2.5 text-sm text-[#1C2928] placeholder:text-[#7C8E89] transition focus:border-[#174B4A] focus:outline-none focus:ring-3 focus:ring-[#174B4A]/10';
const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#174B4A] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#103B39] disabled:cursor-not-allowed disabled:opacity-50';
const BTN_SECONDARY =
  'inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#BFC9C3] bg-white px-4 py-2.5 text-sm font-bold text-[#1C2928] transition hover:border-[#174B4A] hover:bg-[#FBF9F4] hover:text-[#174B4A] disabled:cursor-not-allowed disabled:opacity-50';
const BTN_TEAL_SOFT =
  'inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#C2D6CC] bg-[#E8F0EA] px-3.5 py-2 text-xs font-bold text-[#174B4A] transition hover:border-[#174B4A] hover:bg-[#DAE8DF]';
const BTN_COPPER_SOFT =
  'inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#EECAB7] bg-[#FDF2EC] px-3.5 py-2 text-xs font-bold text-[#995436] transition hover:border-[#B96D4C] hover:bg-[#FBE6D9]';

function AcceptingBadge({ accepting }: { accepting: boolean }) {
  return accepting ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#A7F3D0] bg-[#E6F7F0] px-2.5 py-1 text-[11px] font-bold text-[#065F46]">
      <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
        check_circle
      </span>
      Đang nhận yêu cầu
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#CFD8D4] bg-[#EFF2F0] px-2.5 py-1 text-[11px] font-bold text-[#475955]">
      <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
        event_busy
      </span>
      Chưa mở nhận yêu cầu
    </span>
  );
}

function InquiryStatusBadge({ status }: { status: StayInquiry['status'] }) {
  if (status === 'Replied') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[#A7F3D0] bg-[#E6F7F0] px-2.5 py-1 text-[11px] font-bold text-[#065F46]">
        <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
          mark_chat_read
        </span>
        {stayStatus.Replied}
      </span>
    );
  }
  if (status === 'Declined') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[#FECDD3] bg-[#FDECEF] px-2.5 py-1 text-[11px] font-bold text-[#991B1B]">
        <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
          cancel
        </span>
        {stayStatus.Declined}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#FDE68A] bg-[#FEF3E2] px-2.5 py-1 text-[11px] font-bold text-[#92400E]">
      <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
        schedule
      </span>
      {stayStatus.Sent}
    </span>
  );
}

function DirectExchangeNotice() {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-[#EECAB7] bg-[#FDF2EC] px-3.5 py-3 text-xs leading-relaxed text-[#1C2928]">
      <span className="material-symbols-outlined mt-0.5 shrink-0 text-[18px] text-[#995436]" aria-hidden="true">
        forum
      </span>
      <p className="font-semibold text-[#995436]">{STAY_DIRECT_EXCHANGE_NOTICE}</p>
    </div>
  );
}

function StayPhotoHeader({
  facility,
  tall = false,
}: {
  facility: StayFacility;
  tall?: boolean;
}) {
  const heightClass = tall ? 'h-56 sm:h-72' : 'h-44';
  if (facility.imageUrl) {
    return (
      <div className={`relative ${heightClass} overflow-hidden bg-[#E8F0EA]`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={facility.imageUrl}
          alt={facility.name}
          className="h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#102A29]/45 via-transparent to-[#102A29]/25" />
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2">
          <AcceptingBadge accepting={facility.acceptingRequests} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex ${heightClass} flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#E8F0EA] via-[#F2EFE6] to-[#F7F5EF] px-4 text-center`}
    >
      <div className="absolute left-3 top-3">
        <AcceptingBadge accepting={facility.acceptingRequests} />
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#C2D6CC] bg-white/90 text-[#174B4A] shadow-2xs">
        <span className="material-symbols-outlined text-[26px]" aria-hidden="true">
          hotel
        </span>
      </div>
      <p className="mt-2 text-xs font-semibold text-[#5B6E69]">Cơ sở lưu trú TripMate</p>
    </div>
  );
}

export function StayCatalog({ itineraryId }: { itineraryId?: number }) {
  const [query, setQuery] = useState('');
  const [term, setTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [items, setItems] = useState<StayFacility[]>([]);
  const [nextId, setNextId] = useState<number>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const searchVersion = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const version = ++searchVersion.current;
    stayRequest<StayFacility[]>(`/stays?query=${encodeURIComponent(term)}`, { signal: controller.signal })
      .then((result) => {
        if (version !== searchVersion.current) return;
        setItems(result);
        setNextId(result.length === 30 ? result.at(-1)?.poiId : undefined);
        setLoading(false);
      })
      .catch((reason: Error) => {
        if (!controller.signal.aborted) {
          setError(reason.message);
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [term]);

  const visibleItems = useMemo(() => {
    if (statusFilter === 'open') return items.filter((item) => item.acceptingRequests);
    if (statusFilter === 'closed') return items.filter((item) => !item.acceptingRequests);
    return items;
  }, [items, statusFilter]);

  async function loadMore() {
    if (!nextId || loading) return;
    const version = searchVersion.current;
    setLoading(true);
    setError('');
    try {
      const result = await stayRequest<StayFacility[]>(
        `/stays?query=${encodeURIComponent(term)}&beforeId=${nextId}`,
      );
      if (version !== searchVersion.current) return;
      setItems((current) => [...current, ...result]);
      setNextId(result.length === 30 ? result.at(-1)?.poiId : undefined);
    } catch (reason) {
      if (version === searchVersion.current && reason instanceof Error) setError(reason.message);
    } finally {
      if (version === searchVersion.current) setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#1C2928]">
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {itineraryId && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#C2D6CC] bg-[#E8F0EA] px-4 py-3 text-sm">
            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined mt-0.5 text-[20px] text-[#174B4A]" aria-hidden="true">
                event_note
              </span>
              <div>
                <p className="font-bold text-[#1C2928]">
                  Đang tìm nơi ở gắn với lịch trình #{itineraryId}
                </p>
                <p className="text-xs text-[#5B6E69]">
                  Yêu cầu lưu trú sẽ tự động gắn với chuyến đi này. Bạn cũng có thể chọn khách sạn làm Điểm xuất phát.
                </p>
              </div>
            </div>
            <Link href={`/itinerary/${itineraryId}`} className={`${BTN_SECONDARY} px-3.5 py-2 text-xs`}>
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                arrow_back
              </span>
              Quay lại lịch trình
            </Link>
          </div>
        )}

        {/* Coastal Heritage Page Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-bold text-[#995436]">
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                hotel
              </span>
              Lưu trú · TripMate Coastal Heritage
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-[#1C2928] sm:text-3xl">
              Tìm nơi ở và gửi yêu cầu lưu trú
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[#5B6E69]">
              Tìm khách sạn, homestay và resort theo tên hoặc khu vực. Gửi yêu cầu lưu trú trực tiếp tới cơ sở hoặc chọn khách sạn làm Điểm xuất phát cho lịch trình.
            </p>
          </div>
          <Link href="/stays/requests" className={BTN_SECONDARY}>
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              receipt_long
            </span>
            Yêu cầu lưu trú của tôi
          </Link>
        </div>

        {/* Filter Surface */}
        <section className={`${SURFACE_CARD} space-y-3.5 p-4 sm:p-5`}>
          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              const next = query.trim();
              if (next !== term) {
                setLoading(true);
                setError('');
                setTerm(next);
              }
            }}
          >
            <div className="min-w-0 flex-1">
              <label htmlFor="stay-search-input" className="block text-xs font-bold text-[#1C2928]">
                Tìm theo tên cơ sở hoặc khu vực
              </label>
              <div className="relative mt-1.5">
                <span
                  className="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[19px] text-[#5B6E69]"
                  aria-hidden="true"
                >
                  search
                </span>
                <input
                  id="stay-search-input"
                  className="block w-full rounded-xl border border-[#BFC9C3] bg-white py-2.5 pl-10 pr-3.5 text-sm text-[#1C2928] placeholder:text-[#7C8E89] focus:border-[#174B4A] focus:outline-none focus:ring-3 focus:ring-[#174B4A]/10"
                  maxLength={150}
                  placeholder="Ví dụ: Hội An, Đà Nẵng, Huế hoặc tên khách sạn..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="submit" className={BTN_PRIMARY}>
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  search
                </span>
                Tìm nơi ở
              </button>
              {(term || statusFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setStatusFilter('all');
                    if (term !== '') {
                      setLoading(true);
                      setError('');
                      setTerm('');
                    }
                  }}
                  className={BTN_SECONDARY}
                >
                  Đặt lại
                </button>
              )}
            </div>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF1ED] pt-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#5B6E69]">Trạng thái nhận yêu cầu:</span>
              {(
                [
                  ['all', 'Tất cả'],
                  ['open', 'Đang nhận yêu cầu'],
                  ['closed', 'Chưa mở nhận yêu cầu'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                    statusFilter === key
                      ? 'border-[#174B4A] bg-[#174B4A] text-white'
                      : 'border-[#DCE2DD] bg-[#FBF9F4] text-[#5B6E69] hover:border-[#174B4A] hover:text-[#174B4A]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {!loading && !error && (
              <span className="text-xs text-[#5B6E69]">
                Hiển thị <strong className="text-[#1C2928]">{visibleItems.length}</strong> cơ sở lưu trú
              </span>
            )}
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="flex items-center gap-2.5 rounded-2xl border border-[#FECDD3] bg-[#FDECEF] px-4 py-3.5 text-sm font-semibold text-[#991B1B]"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              error
            </span>
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && visibleItems.length === 0 && (
          <div className={`${SURFACE_CARD} flex flex-col items-center px-6 py-12 text-center`}>
            <span className="material-symbols-outlined text-[36px] text-[#5B6E69]" aria-hidden="true">
              hotel
            </span>
            <p className="mt-2 text-base font-bold text-[#1C2928]">
              Chưa tìm thấy cơ sở lưu trú phù hợp.
            </p>
            <p className="mt-1 text-xs text-[#5B6E69]">
              Hãy thử từ khóa khu vực khác hoặc đổi bộ lọc trạng thái nhận yêu cầu.
            </p>
          </div>
        )}

        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleItems.map((facility) => {
            const detailHref = `/stays/${facility.poiId}${itineraryId ? `?itineraryId=${itineraryId}` : ''}`;
            return (
              <li
                key={facility.poiId}
                className={`flex flex-col overflow-hidden rounded-2xl border transition hover:border-[#174B4A] ${
                  facility.acceptingRequests
                    ? 'border-[#DCE2DD] bg-white shadow-[0_4px_20px_-2px_rgba(0,21,42,0.045)]'
                    : 'border-[#DCE2DD] bg-[#FCFCFA]'
                }`}
              >
                <Link href={detailHref} className="block">
                  <StayPhotoHeader facility={facility} />
                </Link>
                <div className="flex flex-1 flex-col gap-2.5 p-4 sm:p-5">
                  <Link
                    href={detailHref}
                    className="font-display text-lg font-bold leading-snug text-[#1C2928] transition hover:text-[#174B4A]"
                  >
                    {facility.name}
                  </Link>
                  {facility.address && (
                    <p className="flex items-start gap-1.5 text-xs leading-relaxed text-[#5B6E69]">
                      <span className="material-symbols-outlined mt-0.5 shrink-0 text-[15px]" aria-hidden="true">
                        location_on
                      </span>
                      <span>{facility.address}</span>
                    </p>
                  )}
                  {facility.description && (
                    <p className="line-clamp-2 text-xs leading-relaxed text-[#5B6E69]">
                      {facility.description}
                    </p>
                  )}

                  {/* Strictly separated primary stay inquiry vs start-point actions */}
                  <div className="mt-auto flex flex-col gap-2 border-t border-[#EEF1ED] pt-3.5">
                    <Link
                      href={detailHref}
                      className={facility.acceptingRequests ? `${BTN_PRIMARY} w-full py-2 text-xs` : `${BTN_SECONDARY} w-full py-2 text-xs`}
                    >
                      <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                        {facility.acceptingRequests ? 'mail' : 'info'}
                      </span>
                      {facility.acceptingRequests ? 'Xem & Gửi yêu cầu lưu trú' : 'Xem thông tin cơ sở'}
                    </Link>
                    <Link
                      href={`/plan?stayPoiId=${facility.poiId}`}
                      className={`${BTN_TEAL_SOFT} w-full`}
                    >
                      <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                        trip_origin
                      </span>
                      Dùng làm điểm xuất phát
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {loading && (
          <div role="status" className="flex items-center justify-center gap-2 py-6 text-sm font-semibold text-[#5B6E69]">
            <span className="material-symbols-outlined animate-spin text-[20px] text-[#174B4A]" aria-hidden="true">
              progress_activity
            </span>
            Đang tìm nơi ở…
          </div>
        )}

        {nextId && (
          <div className="flex justify-center pt-2">
            <button type="button" className={BTN_SECONDARY} disabled={loading} onClick={() => void loadMore()}>
              Xem thêm cơ sở lưu trú
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export function StayDetail({ poiId, itineraryId }: { poiId: number; itineraryId?: number }) {
  const session = useWebSession();
  const [facility, setFacility] = useState<StayFacility>();
  const [receipt, setReceipt] = useState<StayInquiry>();
  const [arrival, setArrival] = useState('');
  const [departure, setDeparture] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef<{ body: string; key: string } | null>(null);
  const submitLock = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    stayRequest<StayFacility>(`/stays/${poiId}`, { signal: controller.signal })
      .then(setFacility)
      .catch((reason: Error) => {
        if (!controller.signal.aborted) setError(reason.message);
      });
    return () => controller.abort();
  }, [poiId]);

  const nights = countStayNights(arrival, departure);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLock.current) return;
    const values = new FormData(event.currentTarget);
    const body = JSON.stringify({
      poiId,
      itineraryId,
      arrival: values.get('arrival'),
      departure: values.get('departure'),
      guests: Number(values.get('guests')),
      contactName: values.get('contactName'),
      contact: values.get('contact'),
      note: values.get('note'),
    });
    if (!pending.current || pending.current.body !== body) {
      pending.current = { body, key: crypto.randomUUID() };
    }
    submitLock.current = true;
    setError('');
    setBusy(true);
    try {
      setReceipt(
        await stayRequest<StayInquiry>('/traveler/stay-inquiries', {
          method: 'POST',
          body,
          headers: { 'Idempotency-Key': pending.current.key },
        }),
      );
    } catch (reason) {
      if (reason instanceof Error) setError(reason.message);
    } finally {
      setBusy(false);
      submitLock.current = false;
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#1C2928]">
      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-[#5B6E69]">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/stays${itineraryId ? `?itineraryId=${itineraryId}` : ''}`}
              className="inline-flex items-center gap-1 font-bold text-[#174B4A] hover:underline"
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                arrow_back
              </span>
              Lưu trú
            </Link>
            {facility && (
              <>
                <span aria-hidden="true">/</span>
                <span className="font-bold text-[#1C2928]">{facility.name}</span>
              </>
            )}
          </div>
          {itineraryId && (
            <Link href={`/itinerary/${itineraryId}`} className="font-bold text-[#174B4A] hover:underline">
              Quay lại lịch trình #{itineraryId}
            </Link>
          )}
        </nav>

        {error && (
          <div
            role="alert"
            className="flex items-center gap-2.5 rounded-2xl border border-[#FECDD3] bg-[#FDECEF] px-4 py-3.5 text-sm font-semibold text-[#991B1B]"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              error
            </span>
            <span>{error}</span>
          </div>
        )}

        {!facility && !error && (
          <div role="status" className="flex items-center justify-center gap-2 py-12 text-sm font-semibold text-[#5B6E69]">
            <span className="material-symbols-outlined animate-spin text-[20px] text-[#174B4A]" aria-hidden="true">
              progress_activity
            </span>
            Đang tải thông tin nơi ở…
          </div>
        )}

        {facility && (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            {/* LEFT (60%): Hotel Information + Separate Start-Point CTA */}
            <div className="space-y-5 lg:col-span-7">
              <div className="overflow-hidden rounded-2xl border border-[#DCE2DD] bg-white shadow-[0_4px_20px_-2px_rgba(0,21,42,0.045)]">
                <StayPhotoHeader facility={facility} tall />
                <div className="space-y-4 p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <AcceptingBadge accepting={facility.acceptingRequests} />
                        <span className="rounded-full border border-[#DCE2DD] bg-[#FBF9F4] px-2.5 py-0.5 font-mono text-[11px] font-semibold text-[#5B6E69]">
                          POI #{facility.poiId}
                        </span>
                      </div>
                      <h1 className="font-display text-2xl font-bold tracking-tight text-[#1C2928]">
                        {facility.name}
                      </h1>
                    </div>

                    {/* Separate Start-Point Action */}
                    <Link
                      href={`/plan?stayPoiId=${facility.poiId}`}
                      className={BTN_COPPER_SOFT}
                    >
                      <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                        trip_origin
                      </span>
                      Dùng làm điểm xuất phát
                    </Link>
                  </div>

                  {facility.address && (
                    <p className="flex items-start gap-2 text-sm text-[#5B6E69]">
                      <span className="material-symbols-outlined mt-0.5 shrink-0 text-[18px] text-[#174B4A]" aria-hidden="true">
                        location_on
                      </span>
                      <span>{facility.address}</span>
                    </p>
                  )}

                  {!facility.acceptingRequests && (
                    <div className="flex items-start gap-3 rounded-xl border border-[#CFD8D4] bg-[#EFF2F0] p-4">
                      <span className="material-symbols-outlined shrink-0 text-[22px] text-[#475955]" aria-hidden="true">
                        event_busy
                      </span>
                      <div>
                        <h2 className="text-sm font-bold text-[#1C2928]">Chưa mở nhận yêu cầu</h2>
                        <p className="mt-1 text-xs leading-relaxed text-[#5B6E69]">
                          Cơ sở hiện tạm đóng nhận yêu cầu lưu trú trực tuyến trên TripMate. Bạn vẫn có thể xem đầy đủ thông tin hoặc chọn cơ sở này làm <strong>Điểm xuất phát</strong> khi lập lịch trình.
                        </p>
                      </div>
                    </div>
                  )}

                  {facility.description && (
                    <div className="border-t border-[#EEF1ED] pt-4">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-[#5B6E69]">
                        Giới thiệu cơ sở
                      </h2>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#1C2928]">
                        {facility.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {(session.context?.role === 'Traveler' || session.context?.role === 'ServiceProvider') && (
                <ClaimStay poiId={poiId} />
              )}
            </div>

            {/* RIGHT (40%): Sticky Simplified Inquiry Panel ("Gửi yêu cầu lưu trú") */}
            <aside className="lg:sticky lg:top-24 lg:col-span-5">
              {!facility.acceptingRequests ? (
                <section className="rounded-2xl border border-[#DCE2DD] bg-[#FCFCFA] p-5 shadow-[0_4px_20px_-2px_rgba(0,21,42,0.045)] sm:p-6">
                  <AcceptingBadge accepting={false} />
                  <h2 className="mt-3 font-display text-lg font-bold text-[#1C2928]">
                    Cơ sở tạm đóng nhận yêu cầu
                  </h2>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#5B6E69]">
                    Hiện tại <strong>{facility.name}</strong> chưa mở nhận yêu cầu lưu trú trực tuyến qua TripMate. Bạn có thể quay lại danh mục để chọn các cơ sở đang mở.
                  </p>
                  <div className="mt-4 flex flex-col gap-2">
                    <Link href={`/stays${itineraryId ? `?itineraryId=${itineraryId}` : ''}`} className={`${BTN_PRIMARY} w-full`}>
                      Xem cơ sở đang nhận yêu cầu
                    </Link>
                    <Link href={`/plan?stayPoiId=${facility.poiId}`} className={`${BTN_COPPER_SOFT} w-full py-2.5`}>
                      <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                        trip_origin
                      </span>
                      Dùng làm điểm xuất phát
                    </Link>
                  </div>
                </section>
              ) : (
                <section
                  aria-label="Biểu mẫu gửi yêu cầu lưu trú"
                  className="overflow-hidden rounded-2xl border-2 border-[#C2D6CC] bg-white shadow-[0_4px_20px_-2px_rgba(0,21,42,0.05)]"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-[#C2D6CC] bg-[#E8F0EA] px-5 py-3.5">
                    <h2 className="font-display text-base font-bold text-[#174B4A]">
                      Gửi yêu cầu lưu trú
                    </h2>
                    <span className="rounded-full border border-[#C2D6CC] bg-white px-2.5 py-0.5 text-[11px] font-bold text-[#174B4A]">
                      {itineraryId ? `Gắn lịch trình #${itineraryId}` : 'Gửi trực tiếp'}
                    </span>
                  </div>

                  <div className="space-y-4 p-5">
                    {receipt ? (
                      <div role="status" className="space-y-4">
                        <div className="rounded-xl border border-[#FDE68A] bg-[#FEF3E2] p-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#92400E]">
                              Yêu cầu #{receipt.id}
                            </span>
                            <InquiryStatusBadge status={receipt.status} />
                          </div>
                          <h3 className="mt-2 font-display text-base font-bold text-[#1C2928]">
                            Đã gửi yêu cầu lưu trú tới cơ sở
                          </h3>
                          <p className="mt-1 text-xs leading-relaxed text-[#5B6E69]">
                            Yêu cầu của bạn đã được chuyển tới Hotel Operator của <strong>{facility.name}</strong>.
                          </p>
                        </div>

                        <DirectExchangeNotice />

                        <div className="flex flex-col gap-2">
                          <Link
                            href={`/stays/requests?requestId=${receipt.id}`}
                            className={`${BTN_PRIMARY} w-full`}
                          >
                            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                              receipt_long
                            </span>
                            Theo dõi yêu cầu
                          </Link>
                          {itineraryId && (
                            <Link href={`/itinerary/${itineraryId}`} className={`${BTN_SECONDARY} w-full`}>
                              Quay lại chi tiết lịch trình
                            </Link>
                          )}
                        </div>
                      </div>
                    ) : session.status === 'restoring' ? (
                      <p role="status" className="py-4 text-center text-sm text-[#5B6E69]">
                        Đang tải phiên đăng nhập…
                      </p>
                    ) : session.context?.role === 'Traveler' ? (
                      <form className="space-y-3.5" onSubmit={submit}>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <label htmlFor="stay-arrival" className="block text-xs font-bold text-[#1C2928]">
                              Ngày nhận dự kiến <span className="text-[#E02D4D]">*</span>
                            </label>
                            <input
                              id="stay-arrival"
                              className={INPUT_CLASS}
                              required
                              type="date"
                              name="arrival"
                              value={arrival}
                              onChange={(event) => setArrival(event.target.value)}
                            />
                          </div>
                          <div>
                            <label htmlFor="stay-departure" className="block text-xs font-bold text-[#1C2928]">
                              Ngày trả dự kiến <span className="text-[#E02D4D]">*</span>
                            </label>
                            <input
                              id="stay-departure"
                              className={INPUT_CLASS}
                              required
                              type="date"
                              name="departure"
                              min={arrival || undefined}
                              value={departure}
                              onChange={(event) => setDeparture(event.target.value)}
                            />
                          </div>
                        </div>

                        {nights > 0 && (
                          <p className="text-xs text-[#5B6E69]">
                            Khoảng lưu trú dự kiến:{' '}
                            <strong className="text-[#1C2928]">
                              {formatStayDate(arrival)} – {formatStayDate(departure)} ({nights} đêm)
                            </strong>
                          </p>
                        )}

                        <div>
                          <label htmlFor="stay-guests" className="block text-xs font-bold text-[#1C2928]">
                            Số khách <span className="text-[#E02D4D]">*</span>
                          </label>
                          <input
                            id="stay-guests"
                            className={INPUT_CLASS}
                            required
                            min={1}
                            max={2147483647}
                            type="number"
                            name="guests"
                            defaultValue={2}
                          />
                        </div>

                        <div>
                          <label htmlFor="stay-contact-name" className="block text-xs font-bold text-[#1C2928]">
                            Họ và tên <span className="text-[#E02D4D]">*</span>
                          </label>
                          <input
                            id="stay-contact-name"
                            className={INPUT_CLASS}
                            name="contactName"
                            required
                            maxLength={150}
                            defaultValue={session.context?.fullName ?? ''}
                            placeholder="Nhập họ tên của bạn"
                          />
                        </div>

                        <div>
                          <label htmlFor="stay-contact" className="block text-xs font-bold text-[#1C2928]">
                            Email hoặc số điện thoại <span className="text-[#E02D4D]">*</span>
                          </label>
                          <input
                            id="stay-contact"
                            className={INPUT_CLASS}
                            name="contact"
                            required
                            maxLength={254}
                            defaultValue={session.context?.email ?? ''}
                            placeholder="Nhập email hoặc số điện thoại liên hệ"
                          />
                        </div>

                        <div>
                          <label htmlFor="stay-note" className="block text-xs font-bold text-[#1C2928]">
                            Ghi chú tùy chọn
                          </label>
                          <textarea
                            id="stay-note"
                            className={`${INPUT_CLASS} min-h-[84px] resize-y`}
                            name="note"
                            maxLength={1000}
                            placeholder="Ví dụ: Giờ nhận phòng dự kiến, yêu cầu tư vấn phòng phù hợp..."
                          />
                        </div>

                        <DirectExchangeNotice />

                        <button type="submit" className={`${BTN_PRIMARY} w-full py-3`} disabled={busy}>
                          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                            send
                          </span>
                          {busy ? 'Đang gửi…' : 'Gửi yêu cầu lưu trú'}
                        </button>
                      </form>
                    ) : (
                      <div className="space-y-4">
                        <DirectExchangeNotice />
                        <p className="text-xs leading-relaxed text-[#5B6E69]">
                          Đăng nhập tài khoản Traveler để gửi yêu cầu lưu trú tới <strong>{facility.name}</strong> và theo dõi phản hồi trực tiếp trên TripMate Web.
                        </p>
                        <Link
                          className={`${BTN_PRIMARY} w-full`}
                          href={`/sign-in?returnUrl=${encodeURIComponent(
                            `/stays/${poiId}${itineraryId ? `?itineraryId=${itineraryId}` : ''}`,
                          )}`}
                        >
                          Đăng nhập Traveler để gửi yêu cầu
                        </Link>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

export function StayRequestList({ requestId }: { requestId?: number }) {
  const session = useWebSession();
  const [items, setItems] = useState<StayInquiry[]>();
  const [statusFilter, setStatusFilter] = useState<'all' | StayInquiry['status']>('all');
  const [error, setError] = useState('');
  const authenticated = session.context?.role === 'Traveler';

  useEffect(() => {
    if (!authenticated) return;
    const controller = new AbortController();
    stayRequest<StayInquiry | StayInquiry[]>(
      requestId ? `/traveler/stay-inquiries/${requestId}` : '/traveler/stay-inquiries',
      { signal: controller.signal },
    )
      .then((result) => setItems(Array.isArray(result) ? result : [result]))
      .catch((reason: Error) => {
        if (!controller.signal.aborted) setError(reason.message);
      });
    return () => controller.abort();
  }, [authenticated, requestId]);

  const filteredItems = useMemo(() => {
    if (!items) return undefined;
    if (statusFilter === 'all') return items;
    return items.filter((item) => item.status === statusFilter);
  }, [items, statusFilter]);

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#1C2928]">
      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-bold text-[#995436]">
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                receipt_long
              </span>
              Theo dõi yêu cầu lưu trú
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-[#1C2928] sm:text-3xl">
              Yêu cầu lưu trú của tôi
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {requestId && (
              <Link href="/stays/requests" className={BTN_SECONDARY}>
                Xem tất cả yêu cầu
              </Link>
            )}
            <Link href="/stays" className={BTN_PRIMARY}>
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                hotel
              </span>
              Tìm nơi ở
            </Link>
          </div>
        </div>

        {session.status === 'unauthenticated' && (
          <div className={`${SURFACE_CARD} space-y-3 p-6 text-center`}>
            <p className="text-sm font-semibold text-[#1C2928]">
              Vui lòng đăng nhập tài khoản Traveler để xem danh sách và phản hồi yêu cầu lưu trú.
            </p>
            <Link
              className={BTN_PRIMARY}
              href={`/sign-in?returnUrl=${encodeURIComponent(
                `/stays/requests${requestId ? `?requestId=${requestId}` : ''}`,
              )}`}
            >
              Đăng nhập Traveler
            </Link>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-2xl border border-[#FECDD3] bg-[#FDECEF] px-4 py-3 text-sm font-semibold text-[#991B1B]"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              error
            </span>
            <span>{error}</span>
          </div>
        )}

        {authenticated && !requestId && items && items.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ['all', 'Tất cả'],
                ['Sent', stayStatus.Sent],
                ['Replied', stayStatus.Replied],
                ['Declined', stayStatus.Declined],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                  statusFilter === key
                    ? 'border-[#174B4A] bg-[#174B4A] text-white'
                    : 'border-[#DCE2DD] bg-white text-[#5B6E69] hover:border-[#174B4A] hover:text-[#174B4A]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {filteredItems?.length === 0 && (
          <div className={`${SURFACE_CARD} p-10 text-center`}>
            <p className="text-base font-bold text-[#1C2928]">Bạn chưa có yêu cầu lưu trú nào.</p>
            <p className="mt-1 text-xs text-[#5B6E69]">
              Khám phá danh mục Lưu trú để gửi yêu cầu trực tiếp tới khách sạn, homestay hoặc resort.
            </p>
          </div>
        )}

        <ul className="space-y-4">
          {filteredItems?.map((item) => {
            const nights = countStayNights(item.arrival, item.departure);
            return (
              <li key={item.id} className={`${SURFACE_CARD} space-y-4 p-5 sm:p-6`}>
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#EEF1ED] pb-3.5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#5B6E69]">#{item.id}</span>
                      <InquiryStatusBadge status={item.status} />
                    </div>
                    <h2 className="mt-1.5 font-display text-lg font-bold text-[#1C2928]">
                      {item.facilityName}
                    </h2>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs font-semibold text-[#5B6E69]">Ngày nhận / trả dự kiến</p>
                    <p className="mt-0.5 text-sm font-bold text-[#1C2928]">
                      {formatStayDate(item.arrival)} – {formatStayDate(item.departure)}
                      {nights > 0 ? ` (${nights} đêm)` : ''} · {item.guests} khách
                    </p>
                  </div>
                </div>

                {item.status === 'Replied' && item.reply && (
                  <div className="rounded-xl border border-[#A7F3D0] bg-[#F4FAF7] p-4">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-[#065F46]">
                      <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                        mark_chat_read
                      </span>
                      Phản hồi từ cơ sở
                    </p>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-[#1C2928]">
                      {item.reply}
                    </p>
                  </div>
                )}

                {item.status === 'Declined' && item.reply && (
                  <div className="rounded-xl border border-[#FECDD3] bg-[#FDECEF] p-4">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-[#991B1B]">
                      <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                        info
                      </span>
                      Lý do từ chối từ cơ sở
                    </p>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-[#7F1D1D]">
                      {item.reply}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-2 rounded-xl border border-[#EEF1ED] bg-[#FBF9F4] p-3.5 text-xs sm:grid-cols-2">
                  <div>
                    <span className="font-semibold text-[#5B6E69]">Người liên hệ: </span>
                    <span className="font-bold text-[#1C2928]">{item.contactName}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-[#5B6E69]">Kênh liên hệ: </span>
                    <span className="font-mono font-semibold text-[#1C2928]">{item.contact}</span>
                  </div>
                  {item.note && (
                    <div className="sm:col-span-2">
                      <span className="font-semibold text-[#5B6E69]">Ghi chú: </span>
                      <span className="whitespace-pre-wrap text-[#1C2928]">{item.note}</span>
                    </div>
                  )}
                </div>

                <DirectExchangeNotice />

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  {item.poiId && (
                    <Link href={`/plan?stayPoiId=${item.poiId}`} className={BTN_COPPER_SOFT}>
                      <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                        trip_origin
                      </span>
                      Dùng làm điểm xuất phát
                    </Link>
                  )}
                  {item.itineraryId && (
                    <Link href={`/itinerary/${item.itineraryId}`} className={`${BTN_PRIMARY} py-2 text-xs`}>
                      <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                        map
                      </span>
                      Quay lại chi tiết lịch trình
                    </Link>
                  )}
                  {item.poiId && (
                    <Link href={`/stays/${item.poiId}`} className={`${BTN_SECONDARY} py-2 text-xs`}>
                      Xem cơ sở
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}

export function ItineraryStays({ itineraryId }: { itineraryId: number }) {
  const session = useWebSession();
  const traveler = session.context?.role === 'Traveler';
  const [suggestions, setSuggestions] = useState<StayFacility[]>([]);
  const [requests, setRequests] = useState<StayInquiry[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!traveler) return;
    const controller = new AbortController();
    stayRequest<StayFacility[]>(`/traveler/itineraries/${itineraryId}/stay-suggestions`, {
      signal: controller.signal,
    })
      .then(setSuggestions)
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    stayRequest<StayInquiry[]>(`/traveler/stay-inquiries?itineraryId=${itineraryId}`, {
      signal: controller.signal,
    })
      .then(setRequests)
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [itineraryId, traveler]);

  return (
    <section
      aria-labelledby="stays-heading"
      className="overflow-hidden rounded-2xl border-2 border-[#C2D6CC] bg-white shadow-[0_4px_20px_-2px_rgba(0,21,42,0.045)]"
    >
      <div className="flex items-center justify-between gap-2 border-b border-[#C2D6CC] bg-[#E8F0EA] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[19px] text-[#174B4A]" aria-hidden="true">
            hotel
          </span>
          <h2 id="stays-heading" className="font-display text-base font-bold text-[#174B4A]">
            Lưu trú
          </h2>
        </div>
        <span className="rounded-full border border-[#C2D6CC] bg-white px-2.5 py-0.5 text-[10.5px] font-bold text-[#5B6E69]">
          Tách khỏi tuyến tham quan
        </span>
      </div>

      <div className="space-y-4 p-4">
        <div className="space-y-2.5">
          <p className="text-xs leading-relaxed text-[#5B6E69]">
            Gửi yêu cầu lưu trú trực tiếp tới cơ sở hoặc chọn một khách sạn làm <strong>Điểm xuất phát</strong> cho chuyến đi.
          </p>
          <Link href={`/stays?itineraryId=${itineraryId}`} className={`${BTN_PRIMARY} w-full py-2 text-xs`}>
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
              hotel
            </span>
            Tìm nơi ở
          </Link>
        </div>

        {failed && (
          <p role="status" className="rounded-xl border border-[#DCE2DD] bg-[#FBF9F4] px-3 py-2 text-xs text-[#5B6E69]">
            Chưa tải được dữ liệu lưu trú lúc này. Bạn vẫn có thể bấm Tìm nơi ở ở trên.
          </p>
        )}

        {requests.length > 0 && (
          <div className="space-y-2.5 border-t border-[#EEF1ED] pt-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5B6E69]">
              Yêu cầu đã gửi cho chuyến đi
            </h3>
            {requests.map((item) => (
              <div key={item.id} className="space-y-2 rounded-xl border border-[#DCE2DD] bg-[#FBF9F4] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={`/stays/requests?requestId=${item.id}`}
                    className="text-sm font-bold text-[#1C2928] hover:text-[#174B4A] hover:underline"
                  >
                    {item.facilityName}
                  </Link>
                  <InquiryStatusBadge status={item.status} />
                </div>
                <p className="text-xs font-semibold text-[#5B6E69]">
                  {formatStayDate(item.arrival)} – {formatStayDate(item.departure)} · {item.guests} khách
                </p>
                {item.status === 'Replied' && item.reply && (
                  <p className="line-clamp-2 rounded-lg border border-[#A7F3D0] bg-[#F4FAF7] px-2.5 py-2 text-xs text-[#1C2928]">
                    {item.reply}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 pt-0.5">
                  <Link
                    href={`/stays/requests?requestId=${item.id}`}
                    className={`${BTN_SECONDARY} px-2.5 py-1.5 text-[11px]`}
                  >
                    Chi tiết yêu cầu
                  </Link>
                  {item.poiId && (
                    <Link
                      href={`/plan?stayPoiId=${item.poiId}`}
                      className={`${BTN_COPPER_SOFT} px-2.5 py-1.5 text-[11px]`}
                    >
                      Dùng làm điểm xuất phát
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="space-y-2.5 border-t border-[#EEF1ED] pt-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5B6E69]">
              Gợi ý lưu trú
            </h3>
            <div className="space-y-2.5">
              {suggestions.map((item) => (
                <div
                  key={item.poiId}
                  className="space-y-2.5 rounded-xl border border-[#DCE2DD] bg-white p-3 transition hover:border-[#174B4A]/60"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/stays/${item.poiId}?itineraryId=${itineraryId}`}
                        className="block truncate text-sm font-bold text-[#1C2928] hover:text-[#174B4A]"
                      >
                        {item.name}
                      </Link>
                      {item.address && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-[#5B6E69]">{item.address}</p>
                      )}
                    </div>
                  </div>
                  <AcceptingBadge accepting={item.acceptingRequests} />
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    <Link
                      href={`/stays/${item.poiId}?itineraryId=${itineraryId}`}
                      className={`${BTN_TEAL_SOFT} px-2.5 py-1.5 text-[11px]`}
                    >
                      {item.acceptingRequests ? 'Gửi yêu cầu' : 'Xem thông tin'}
                    </Link>
                    <Link
                      href={`/plan?stayPoiId=${item.poiId}`}
                      className={`${BTN_SECONDARY} px-2.5 py-1.5 text-[11px]`}
                    >
                      Dùng làm điểm xuất phát
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
