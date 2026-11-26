'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  countStayNights,
  formatStayDate,
  STAY_DIRECT_EXCHANGE_NOTICE,
  stayRequest,
  stayStatus,
  type StayFacility,
  type StayInquiry,
} from './stayApi';

const CARD_CLASS =
  'rounded-2xl border border-[#DCE2DD] bg-white p-5 shadow-[0_4px_20px_-2px_rgba(0,21,42,0.045)] sm:p-6';
const TEXTAREA_CLASS =
  'mt-1.5 block w-full rounded-xl border border-[#BFC9C3] bg-white px-3.5 py-2.5 text-sm text-[#1C2928] placeholder:text-[#7C8E89] focus:border-[#174B4A] focus:outline-none focus:ring-3 focus:ring-[#174B4A]/10';
const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#174B4A] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#103B39] disabled:cursor-not-allowed disabled:opacity-50';
const BTN_DANGER =
  'inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#FECDD3] bg-white px-4 py-2.5 text-sm font-bold text-[#991B1B] transition hover:bg-[#FDECEF] disabled:cursor-not-allowed disabled:opacity-50';
const BTN_SECONDARY =
  'inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#BFC9C3] bg-white px-3.5 py-2 text-xs font-bold text-[#1C2928] transition hover:border-[#174B4A] hover:text-[#174B4A] disabled:opacity-50';

function OperatorStatusBadge({ status }: { status: StayInquiry['status'] }) {
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

function ListingEditor({ facility }: { facility: StayFacility }) {
  const [published, setPublished] = useState(facility.published);
  const [accepting, setAccepting] = useState(facility.acceptingRequests);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setBusy(true);
    setFeedback(null);
    try {
      await stayRequest<StayFacility>(`/api/provider/stays/listings/${facility.poiId}`, {
        method: 'PUT',
        body: JSON.stringify({
          description: values.get('description'),
          published: values.has('published'),
          acceptingRequests: values.has('acceptingRequests'),
        }),
      });
      setFeedback({ ok: true, text: 'Đã lưu cập nhật bài cơ sở lưu trú.' });
    } catch (reason) {
      if (reason instanceof Error) setFeedback({ ok: false, text: reason.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={`${CARD_CLASS} space-y-4`} onSubmit={save}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#EEF1ED] pb-3.5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-[#A7F3D0] bg-[#E6F7F0] px-2.5 py-0.5 text-[11px] font-bold text-[#065F46]">
              <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                verified
              </span>
              Đã được Staff xác minh
            </span>
            <span className="font-mono text-xs text-[#5B6E69]">POI #{facility.poiId}</span>
          </div>
          <h3 className="mt-2 font-display text-lg font-bold text-[#1C2928]">{facility.name}</h3>
          {facility.address && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-[#5B6E69]">
              <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                location_on
              </span>
              {facility.address}
            </p>
          )}
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
            accepting
              ? 'border-[#A7F3D0] bg-[#E6F7F0] text-[#065F46]'
              : 'border-[#CFD8D4] bg-[#EFF2F0] text-[#475955]'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
            {accepting ? 'check_circle' : 'event_busy'}
          </span>
          {accepting ? 'Đang nhận yêu cầu' : 'Chưa mở nhận yêu cầu'}
        </span>
      </div>

      {/* Bật / Tắt công bố & nhận yêu cầu */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label
          className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3.5 transition ${
            accepting
              ? 'border-[#C2D6CC] bg-[#E8F0EA]/70'
              : 'border-[#CFD8D4] bg-[#EFF2F0]/70'
          }`}
        >
          <div>
            <span className="block text-sm font-bold text-[#1C2928]">Mở nhận yêu cầu lưu trú</span>
            <span className="mt-0.5 block text-xs text-[#5B6E69]">
              {accepting
                ? 'Traveler có thể gửi yêu cầu trực tiếp trên Web.'
                : 'Hiển thị nhãn "Chưa mở nhận yêu cầu".'}
            </span>
          </div>
          <span className="relative inline-flex shrink-0 items-center">
            <input
              name="acceptingRequests"
              type="checkbox"
              checked={accepting}
              onChange={(event) => setAccepting(event.target.checked)}
              className="peer sr-only"
            />
            <span className="h-6 w-11 rounded-full bg-[#BFC9C3] transition-colors peer-checked:bg-[#174B4A] peer-focus-visible:ring-2 peer-focus-visible:ring-[#174B4A]/30" />
            <span className="pointer-events-none absolute left-1 h-4 w-4 rounded-full bg-white shadow-xs transition-transform peer-checked:translate-x-5" />
          </span>
        </label>

        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[#DCE2DD] bg-[#FBF9F4] p-3.5">
          <div>
            <span className="block text-sm font-bold text-[#1C2928]">Công bố bài lưu trú</span>
            <span className="mt-0.5 block text-xs text-[#5B6E69]">
              Hiển thị bài giới thiệu cơ sở trên trang Lưu trú.
            </span>
          </div>
          <span className="relative inline-flex shrink-0 items-center">
            <input
              name="published"
              type="checkbox"
              checked={published}
              onChange={(event) => setPublished(event.target.checked)}
              className="peer sr-only"
            />
            <span className="h-6 w-11 rounded-full bg-[#BFC9C3] transition-colors peer-checked:bg-[#174B4A] peer-focus-visible:ring-2 peer-focus-visible:ring-[#174B4A]/30" />
            <span className="pointer-events-none absolute left-1 h-4 w-4 rounded-full bg-white shadow-xs transition-transform peer-checked:translate-x-5" />
          </span>
        </label>
      </div>

      <div>
        <label htmlFor={`listing-desc-${facility.poiId}`} className="block text-xs font-bold text-[#1C2928]">
          Giới thiệu cơ sở lưu trú
        </label>
        <textarea
          id={`listing-desc-${facility.poiId}`}
          className={`${TEXTAREA_CLASS} min-h-[96px]`}
          name="description"
          maxLength={2000}
          defaultValue={facility.description ?? ''}
          placeholder="Mô tả vị trí, tiện ích, giờ nhận/trả phòng và kênh liên hệ trực tiếp..."
        />
      </div>

      {feedback && (
        <div
          role="status"
          className={`rounded-xl border px-3.5 py-2.5 text-xs font-semibold ${
            feedback.ok
              ? 'border-[#A7F3D0] bg-[#E6F7F0] text-[#065F46]'
              : 'border-[#FECDD3] bg-[#FDECEF] text-[#991B1B]'
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="flex justify-end">
        <button type="submit" className={BTN_PRIMARY} disabled={busy}>
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            save
          </span>
          {busy ? 'Đang lưu…' : 'Lưu thay đổi'}
        </button>
      </div>
    </form>
  );
}

function InquiryReply({
  initial,
  onUpdated,
}: {
  initial: StayInquiry;
  onUpdated?: (updated: StayInquiry) => void;
}) {
  const [inquiry, setInquiry] = useState(initial);
  const [replyText, setReplyText] = useState('');
  const [busyAction, setBusyAction] = useState<'reply' | 'decline' | null>(null);
  const [error, setError] = useState('');
  const nights = countStayNights(inquiry.arrival, inquiry.departure);

  async function submitDecision(declined: boolean) {
    const trimmed = replyText.trim();
    if (!trimmed) {
      setError(
        declined
          ? 'Vui lòng nhập lý do từ chối để thông báo tới khách hàng.'
          : 'Vui lòng nhập nội dung phản hồi cho khách hàng.',
      );
      return;
    }
    setBusyAction(declined ? 'decline' : 'reply');
    setError('');
    try {
      const updated = await stayRequest<StayInquiry>(`/api/provider/stays/inquiries/${inquiry.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ reply: trimmed, declined }),
      });
      setInquiry(updated);
      setReplyText('');
      onUpdated?.(updated);
    } catch (reason) {
      if (reason instanceof Error) setError(reason.message);
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <article className={`${CARD_CLASS} space-y-4`}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#EEF1ED] pb-3.5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#5B6E69]">#{inquiry.id}</span>
            <OperatorStatusBadge status={inquiry.status} />
          </div>
          <h3 className="mt-1.5 font-display text-lg font-bold text-[#1C2928]">
            {inquiry.facilityName}
          </h3>
        </div>
        <div className="rounded-xl border border-[#DCE2DD] bg-[#FBF9F4] px-3.5 py-2 text-xs">
          <p className="font-semibold text-[#5B6E69]">Ngày ở dự kiến · Số khách</p>
          <p className="mt-0.5 font-bold text-[#1C2928]">
            {formatStayDate(inquiry.arrival)} – {formatStayDate(inquiry.departure)}
            {nights > 0 ? ` (${nights} đêm)` : ''} · {inquiry.guests} khách
          </p>
        </div>
      </div>

      {/* Guest Contact & Notes */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#EEF1ED] bg-[#FBF9F4] p-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold text-[#5B6E69]">Khách hàng</p>
          <p className="mt-0.5 font-bold text-[#1C2928]">{inquiry.contactName}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-[#5B6E69]">Thông tin liên hệ</p>
          <p className="mt-0.5 break-all font-mono text-xs font-bold text-[#1C2928]">{inquiry.contact}</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs font-semibold text-[#5B6E69]">Ghi chú của khách</p>
          <p className="mt-0.5 whitespace-pre-wrap text-sm text-[#1C2928]">
            {inquiry.note || 'Không có ghi chú'}
          </p>
        </div>
      </div>

      {inquiry.status === 'Sent' ? (
        <div className="space-y-3 border-t border-[#EEF1ED] pt-3.5">
          <div>
            <label htmlFor={`op-reply-${inquiry.id}`} className="block text-xs font-bold text-[#1C2928]">
              Nội dung phản hồi hoặc lý do từ chối <span className="text-[#E02D4D]">*</span>
            </label>
            <textarea
              id={`op-reply-${inquiry.id}`}
              className={`${TEXTAREA_CLASS} min-h-[96px]`}
              maxLength={1000}
              value={replyText}
              onChange={(event) => {
                setReplyText(event.target.value);
                if (error) setError('');
              }}
              placeholder="Nhập thông tin tư vấn phòng trống, giá tham khảo và cách liên hệ trực tiếp, hoặc lý do từ chối..."
            />
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-[#EECAB7] bg-[#FDF2EC] px-3 py-2.5 text-xs text-[#995436]">
            <span className="material-symbols-outlined mt-0.5 shrink-0 text-[16px]" aria-hidden="true">
              forum
            </span>
            <span>{STAY_DIRECT_EXCHANGE_NOTICE}</span>
          </div>

          {error && (
            <p role="alert" className="text-xs font-semibold text-[#991B1B]">
              {error}
            </p>
          )}

          {/* Two distinct primary actions: "Gửi phản hồi" and "Từ chối yêu cầu" */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              className={BTN_PRIMARY}
              disabled={busyAction !== null}
              onClick={() => void submitDecision(false)}
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                send
              </span>
              {busyAction === 'reply' ? 'Đang gửi phản hồi…' : 'Gửi phản hồi'}
            </button>
            <button
              type="button"
              className={BTN_DANGER}
              disabled={busyAction !== null}
              onClick={() => void submitDecision(true)}
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                cancel
              </span>
              {busyAction === 'decline' ? 'Đang từ chối…' : 'Từ chối yêu cầu'}
            </button>
          </div>
        </div>
      ) : inquiry.status === 'Replied' && inquiry.reply ? (
        <div className="rounded-xl border border-[#A7F3D0] bg-[#F4FAF7] p-4">
          <p className="text-xs font-bold text-[#065F46]">Phản hồi đã gửi tới khách</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-[#1C2928]">{inquiry.reply}</p>
        </div>
      ) : inquiry.reply ? (
        <div className="rounded-xl border border-[#FECDD3] bg-[#FDECEF] p-4">
          <p className="text-xs font-bold text-[#991B1B]">Đã từ chối yêu cầu</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-[#7F1D1D]">{inquiry.reply}</p>
        </div>
      ) : null}
    </article>
  );
}

export function ProviderStays({ requestId }: { requestId?: number }) {
  const [activeTab, setActiveTab] = useState<'inquiries' | 'listings'>('inquiries');
  const [statusFilter, setStatusFilter] = useState<'all' | StayInquiry['status']>('all');
  const [facilities, setFacilities] = useState<StayFacility[]>();
  const [inquiries, setInquiries] = useState<StayInquiry[]>();
  const [error, setError] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [beforeId, setBeforeId] = useState<number>();

  useEffect(() => {
    const controller = new AbortController();
    const fail = (reason: Error) => {
      if (!controller.signal.aborted) setError(reason.message);
    };
    if (!requestId) {
      stayRequest<StayFacility[]>('/api/provider/stays/listings', { signal: controller.signal })
        .then(setFacilities)
        .catch(fail);
    }
    stayRequest<StayInquiry | StayInquiry[]>(
      `/api/provider/stays/inquiries${requestId ? `/${requestId}` : ''}`,
      { signal: controller.signal },
    )
      .then((result) => {
        const items = Array.isArray(result) ? result : [result];
        setInquiries(items);
        setBeforeId(items.length === 30 ? items.at(-1)?.id : undefined);
      })
      .catch(fail);
    return () => controller.abort();
  }, [requestId]);

  const pendingCount = useMemo(
    () => (inquiries ?? []).filter((item) => item.status === 'Sent').length,
    [inquiries],
  );

  const visibleInquiries = useMemo(() => {
    if (!inquiries) return undefined;
    if (statusFilter === 'all') return inquiries;
    return inquiries.filter((item) => item.status === statusFilter);
  }, [inquiries, statusFilter]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const next = await stayRequest<StayInquiry[]>(`/api/provider/stays/inquiries?beforeId=${beforeId}`);
      setInquiries((current) => [...(current ?? []), ...next]);
      setBeforeId(next.length === 30 ? next.at(-1)?.id : undefined);
    } catch (reason) {
      if (reason instanceof Error) setError(reason.message);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-md border border-[#EECAB7] bg-[#FDF2EC] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#995436]">
              Hotel Operator
            </span>
            <span className="text-xs font-semibold text-[#5B6E69]">
              Quản lý cơ sở lưu trú &amp; phản hồi khách hàng
            </span>
          </div>
          <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-[#1C2928]">
            {requestId ? `Chi tiết yêu cầu lưu trú #${requestId}` : 'Quản lý lưu trú'}
          </h1>
        </div>
        {requestId && (
          <Link href="/provider/stays" className={BTN_SECONDARY}>
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
              arrow_back
            </span>
            Quay lại danh sách yêu cầu
          </Link>
        )}
      </div>

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

      {/* Workspace Tabs (Inquiries vs Verified Stay Listings) */}
      {!requestId && (
        <div className="flex flex-wrap items-center gap-2 border-b border-[#DCE2DD] pb-3" role="tablist" aria-label="Mục quản lý lưu trú">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'inquiries'}
            onClick={() => setActiveTab('inquiries')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
              activeTab === 'inquiries'
                ? 'bg-[#174B4A] text-white'
                : 'border border-[#DCE2DD] bg-white text-[#5B6E69] hover:border-[#174B4A] hover:text-[#174B4A]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              inbox
            </span>
            Yêu cầu lưu trú
            {pendingCount > 0 && (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
                  activeTab === 'inquiries' ? 'bg-white/20 text-white' : 'bg-[#B96D4C] text-white'
                }`}
              >
                {pendingCount}
              </span>
            )}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'listings'}
            onClick={() => setActiveTab('listings')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
              activeTab === 'listings'
                ? 'bg-[#174B4A] text-white'
                : 'border border-[#DCE2DD] bg-white text-[#5B6E69] hover:border-[#174B4A] hover:text-[#174B4A]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              hotel
            </span>
            Hồ sơ cơ sở lưu trú
            {facilities && (
              <span className="rounded-full bg-black/10 px-2 py-0.5 text-[11px] font-bold">
                {facilities.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* TAB 1: INQUIRIES */}
      {(requestId || activeTab === 'inquiries') && (
        <section className="space-y-4">
          {!requestId && inquiries && inquiries.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  ['all', 'Tất cả'],
                  ['Sent', `${stayStatus.Sent} (chờ phản hồi)`],
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

          {!inquiries && !error && (
            <div role="status" className="py-8 text-center text-sm font-semibold text-[#5B6E69]">
              Đang tải danh sách yêu cầu lưu trú…
            </div>
          )}

          {visibleInquiries?.length === 0 && (
            <div className={`${CARD_CLASS} py-10 text-center`}>
              <p className="text-base font-bold text-[#1C2928]">Chưa có yêu cầu lưu trú phù hợp.</p>
              <p className="mt-1 text-xs text-[#5B6E69]">
                Yêu cầu mới từ Traveler sẽ xuất hiện tại đây và qua chuông thông báo.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {visibleInquiries?.map((inquiry) => (
              <InquiryReply
                key={inquiry.id}
                initial={inquiry}
                onUpdated={(updated) =>
                  setInquiries((current) =>
                    current?.map((item) => (item.id === updated.id ? updated : item)),
                  )
                }
              />
            ))}
          </div>

          {beforeId && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                className={BTN_SECONDARY}
                disabled={loadingMore}
                onClick={() => void loadMore()}
              >
                {loadingMore ? 'Đang tải…' : 'Xem thêm yêu cầu'}
              </button>
            </div>
          )}
        </section>
      )}

      {/* TAB 2: VERIFIED STAY LISTINGS */}
      {!requestId && activeTab === 'listings' && (
        <section className="space-y-4">
          {!facilities && !error && (
            <div role="status" className="py-8 text-center text-sm font-semibold text-[#5B6E69]">
              Đang tải hồ sơ cơ sở lưu trú…
            </div>
          )}
          {facilities?.length === 0 && (
            <div className={`${CARD_CLASS} py-10 text-center`}>
              <p className="text-base font-bold text-[#1C2928]">
                Tài khoản chưa được Staff giao quản lý cơ sở lưu trú nào.
              </p>
              <p className="mt-1 text-xs text-[#5B6E69]">
                Sau khi Staff xác minh quyền đại diện, cơ sở của bạn sẽ xuất hiện tại đây để bật/tắt nhận yêu cầu.
              </p>
            </div>
          )}
          {facilities?.map((facility) => (
            <ListingEditor key={facility.poiId} facility={facility} />
          ))}
        </section>
      )}
    </div>
  );
}
