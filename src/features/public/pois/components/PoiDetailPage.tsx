'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { PublicNavigation } from '@/components/navigation/PublicNavigation';
import { fetchPoiDetail } from '../services/poiApi';
import { PoiApiError, type PoiDetail } from '../types/poi';
import { formatDuration, formatReviewCount } from '../utils/poiPresentation';
import { PoiImage } from './PoiImage';

interface PoiDetailPageProps {
  id: string;
}

type DetailFailure = 'invalid' | 'not-found' | 'network';

const DAYS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];

function detailStatusText(failure: DetailFailure): { title: string; description: string } {
  if (failure === 'invalid') {
    return { title: 'Liên kết địa điểm không hợp lệ', description: 'Mã địa điểm trong đường dẫn phải là một số nguyên lớn hơn 0.' };
  }
  if (failure === 'not-found') {
    return { title: 'Địa điểm không tồn tại hoặc đã đóng', description: 'Điểm tham quan này không còn hiển thị công khai hoặc đường dẫn đã thay đổi.' };
  }
  return { title: 'Không thể tải thông tin địa điểm', description: 'Máy chủ khám phá đang gián đoạn hoặc thiết bị mất kết nối mạng.' };
}

function DetailLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-8 sm:px-8" aria-busy="true" aria-label="Đang tải chi tiết địa điểm">
      <div className="aspect-[16/7] rounded-[28px] bg-[#dfe6e8]" />
      <div className="mt-7 h-10 w-2/3 rounded bg-[#dfe6e8]" />
      <div className="mt-4 h-5 w-5/6 rounded bg-[#e8edef]" />
      <div className="mt-8 grid gap-4 sm:grid-cols-3"><div className="h-28 rounded-2xl bg-[#e3e9eb]" /><div className="h-28 rounded-2xl bg-[#e3e9eb]" /><div className="h-28 rounded-2xl bg-[#e3e9eb]" /></div>
    </div>
  );
}

export function PoiDetailPage({ id }: PoiDetailPageProps) {
  const router = useRouter();
  const validId = /^\d+$/.test(id) && Number(id) > 0;
  const [detail, setDetail] = useState<PoiDetail | null>(null);
  const [failure, setFailure] = useState<DetailFailure | null>(validId ? null : 'invalid');
  const [loading, setLoading] = useState(validId);
  const [requestVersion, setRequestVersion] = useState(0);
  const [copyMessage, setCopyMessage] = useState('Sao chép tọa độ');
  const [todayVietnam] = useState(() => new Date(Date.now() + 7 * 60 * 60 * 1000).getUTCDay());

  useEffect(() => {
    if (!validId) return;
    const controller = new AbortController();
    fetchPoiDetail(id, controller.signal)
      .then((nextDetail) => {
        setDetail(nextDetail);
        setFailure(null);
      })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === 'AbortError') return;
        if (caught instanceof PoiApiError && caught.status === 404) setFailure('not-found');
        else if (caught instanceof PoiApiError && caught.status === 400) setFailure('invalid');
        else setFailure('network');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [id, requestVersion, validId]);

  async function copyCoordinates() {
    if (!detail || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(`${detail.latitude.toFixed(6)}, ${detail.longitude.toFixed(6)}`);
      setCopyMessage('Đã sao chép');
    } catch {
      setCopyMessage('Không thể sao chép');
    }
    window.setTimeout(() => setCopyMessage('Sao chép tọa độ'), 1600);
  }

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push('/pois');
  }

  if (loading) {
    return <div className="min-h-screen bg-white" lang="vi"><PublicNavigation /><DetailLoading /></div>;
  }

  if (failure || !detail) {
    const content = detailStatusText(failure ?? 'network');
    return (
      <div className="min-h-screen bg-[#f3f6f7]" lang="vi">
        <PublicNavigation />
        <main className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-4 py-12 sm:px-8">
          <section className="w-full rounded-[28px] border border-[#d5e0e3] bg-white p-8 text-center shadow-[0_18px_50px_rgba(0,21,42,.08)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#edf1f2] text-2xl text-[#5f6c73]" aria-hidden="true">⌖</div>
            <h1 className="mt-5 text-2xl font-black text-[#00152a] sm:text-3xl">{content.title}</h1>
            <p className="mt-3 text-sm leading-relaxed text-[#59676e]">{content.description}</p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              {failure === 'network' ? (
                <button type="button" onClick={() => { setLoading(true); setFailure(null); setRequestVersion((value) => value + 1); }} className="min-h-11 rounded-xl bg-[#007d6e] px-5 text-sm font-bold text-white">Thử lại</button>
              ) : null}
              <Link href="/pois" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#cbd7db] bg-white px-5 text-sm font-bold text-[#29404a]">Về trang Khám phá</Link>
            </div>
          </section>
        </main>
      </div>
    );
  }

  const hours = new Map(detail.openingHours.map((item) => [item.dayOfWeek, item]));
  const heroPhotos = detail.photos.slice(0, 5);

  return (
    <div className="min-h-screen bg-white text-[#00152a]" lang="vi">
      <PublicNavigation />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={goBack} className="inline-flex min-h-11 items-center rounded-xl px-2 text-sm font-extrabold text-[#006b5f] hover:bg-[#edf8f5]">← Quay lại kết quả khám phá</button>
          <nav aria-label="Đường dẫn" className="text-xs font-semibold text-[#66747b]">
            <Link href="/" className="hover:text-[#006b5f]">Trang chủ</Link> <span aria-hidden="true">/</span>{' '}
            <Link href="/pois" className="hover:text-[#006b5f]">Địa điểm</Link> <span aria-hidden="true">/</span>{' '}
            <span aria-current="page" className="text-[#00152a]">{detail.name}</span>
          </nav>
        </div>

        <section className={`grid min-h-[300px] gap-3 overflow-hidden rounded-[28px] sm:min-h-[420px] ${heroPhotos.length > 1 ? 'lg:grid-cols-[1.08fr_.92fr]' : ''}`} aria-label="Hình ảnh địa điểm">
          <PoiImage src={heroPhotos[0]?.url ?? null} alt={heroPhotos[0]?.caption ?? detail.name} className="h-full min-h-[300px] w-full rounded-[24px]" />
          {heroPhotos.length > 1 ? <div className="hidden grid-cols-2 grid-rows-2 gap-3 lg:grid">
            {[1, 2, 3, 4].map((index) => (
              <PoiImage key={index} src={heroPhotos[index]?.url ?? null} alt={heroPhotos[index]?.caption ?? `${detail.name} - ảnh ${index + 1}`} className="h-full min-h-0 w-full rounded-[18px]" />
            ))}
          </div> : null}
        </section>

        <section className="py-7 sm:py-9">
          <div className="flex flex-wrap gap-2 text-xs font-extrabold">
            <span className="rounded-full bg-[#00152a] px-3 py-2 text-white">{detail.categoryName}</span>
            <span className={`rounded-full px-3 py-2 ${detail.isOpenNow ? 'bg-[#d9f3ed] text-[#006b5f]' : 'bg-[#e8edef] text-[#4f5e65]'}`}>
              {detail.isOpenNow ? '● Đang mở cửa hôm nay' : '○ Hiện đang đóng cửa'}
            </span>
          </div>
          <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div className="max-w-4xl">
              <h1 className="text-4xl font-black leading-tight tracking-[-.04em] text-[#00152a] sm:text-5xl">{detail.name}</h1>
              <p className="mt-4 text-base leading-relaxed text-[#536169] sm:text-lg">{detail.address ?? 'Địa chỉ đang được cập nhật'}</p>
            </div>
            <div className="flex w-fit items-center gap-3 rounded-2xl bg-[#f0f4f5] px-4 py-3">
              <span className="rounded-xl bg-[#007d6e] px-3 py-2 text-xl font-black text-white">{detail.averageRating?.toFixed(1) ?? '—'}</span>
              <div>
                {detail.averageRating !== null ? (
                  <p className="font-black text-[#e65100]" aria-label={`${detail.averageRating.toFixed(1)} trên 5 sao`}>
                    {'★'.repeat(Math.round(detail.averageRating))}{'☆'.repeat(5 - Math.round(detail.averageRating))}
                  </p>
                ) : null}
                <p className="text-xs font-semibold text-[#59686f]">{detail.reviewCount > 0 ? `${formatReviewCount(detail.reviewCount)} lượt đánh giá` : 'Chưa có đánh giá'}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Thông tin nhanh">
          <InfoCard eyebrow="Thời lượng gợi ý" value={formatDuration(detail.averageVisitDurationMinutes)} detail="Thời lượng trung bình" />
          <InfoCard eyebrow="Không gian" value={detail.indoorOutdoor === 'Outdoor' ? 'Ngoài trời' : detail.indoorOutdoor === 'Indoor' ? 'Trong nhà' : 'Hỗn hợp'} detail="Theo thông tin catalogue" />
          <InfoCard eyebrow="Mái che" value={detail.hasShelter ? 'Có mái che' : 'Không có mái che'} detail="Cân nhắc thời tiết khi tham quan" />
          {detail.scenicScore !== null || detail.photoRating !== null ? (
            <InfoCard eyebrow="Điểm cảnh quan" value={[detail.scenicScore !== null ? `Scenic ${detail.scenicScore}` : '', detail.photoRating !== null ? `Photo ${detail.photoRating}` : ''].filter(Boolean).join(' / ')} detail="Điểm đánh giá trong catalogue" />
          ) : null}
        </section>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <article className="min-w-0">
            <h2 className="text-2xl font-black tracking-tight">Giới thiệu địa điểm</h2>
            <p className="mt-4 whitespace-pre-line text-base leading-8 text-[#4d5c63]">{detail.description}</p>
            {detail.tags.length > 0 ? (
              <section className="mt-8" aria-labelledby="poi-tags-heading">
                <h3 id="poi-tags-heading" className="text-xs font-black uppercase tracking-[.14em] text-[#526068]">Thẻ danh mục và đặc trưng</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {detail.tags.map((tag) => <span key={tag.id} className="rounded-full bg-[#e8edef] px-3 py-2 text-sm font-bold text-[#35474f]">{tag.name}</span>)}
                </div>
              </section>
            ) : null}
            <div className="mt-8 rounded-2xl border border-[#cfe1de] bg-[#eef9f6] p-5">
              <h3 className="font-black text-[#075b52]">Thông tin tham quan phi thương mại</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#37665f]">TripMate hiển thị thông tin catalogue để hỗ trợ khám phá. Màn hình này không bán vé, nhận đặt chỗ hoặc thu phí giao dịch.</p>
            </div>
          </article>

          <aside className="space-y-5">
            <section className="rounded-[24px] bg-[#f0f4f5] p-5" aria-labelledby="opening-hours-heading">
              <h2 id="opening-hours-heading" className="text-xl font-black">Lịch mở cửa tuần</h2>
              <div className="mt-4 space-y-1">
                {DAYS.map((day, dayOfWeek) => {
                  const item = hours.get(dayOfWeek);
                  const hoursLabel = item && !item.isClosed && item.openTime !== null && item.closeTime !== null
                    ? `${item.openTime.slice(0, 5)}–${item.closeTime.slice(0, 5)}`
                    : null;
                  const closed = hoursLabel === null;
                  return (
                    <div key={day} className={`flex min-h-11 items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm ${dayOfWeek === todayVietnam ? 'bg-[#dce4e5] font-extrabold' : ''}`}>
                      <span>{day}{dayOfWeek === todayVietnam ? ' (Hôm nay)' : ''}</span>
                      <span className={closed ? 'text-[#68767c]' : 'font-bold text-[#006b5f]'}>{hoursLabel ?? 'Đóng cửa'}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[24px] bg-[#f0f4f5] p-5" aria-labelledby="location-heading">
              <h2 id="location-heading" className="text-xl font-black">Vị trí và tọa độ</h2>
              <p className="mt-3 text-sm leading-relaxed text-[#46575f]">{detail.address ?? 'Địa chỉ đang được cập nhật'}</p>
              <div className="relative mt-4 min-h-44 overflow-hidden rounded-2xl bg-[linear-gradient(35deg,transparent_45%,white_46%,white_49%,transparent_50%),linear-gradient(115deg,#d3e9e4,#e5ecef)]" aria-label="Vị trí minh họa của địa điểm">
                <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white bg-[#007d6e] font-black text-white shadow-lg" aria-hidden="true">⌖</span>
                <span className="absolute bottom-3 left-3 rounded-lg bg-white/90 px-2 py-1 text-[11px] font-bold text-[#365058]">Bản đồ minh họa vị trí</span>
              </div>
              <p className="mt-3 break-all rounded-xl bg-white px-3 py-2 font-mono text-xs text-[#526169]">{detail.latitude.toFixed(6)}, {detail.longitude.toFixed(6)}</p>
              <button type="button" onClick={copyCoordinates} className="mt-3 min-h-11 w-full rounded-xl border border-[#a9c9c3] bg-white px-4 text-sm font-extrabold text-[#006b5f]">{copyMessage}</button>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}

interface InfoCardProps {
  eyebrow: string;
  value: string;
  detail: string;
}

function InfoCard({ eyebrow, value, detail }: InfoCardProps) {
  return (
    <article className="rounded-[20px] bg-[#f0f4f5] p-5">
      <p className="text-xs font-black uppercase tracking-[.11em] text-[#007d6e]">{eyebrow}</p>
      <p className="mt-2 text-lg font-black text-[#00152a]">{value}</p>
      <p className="mt-2 text-xs leading-relaxed text-[#66747b]">{detail}</p>
    </article>
  );
}
