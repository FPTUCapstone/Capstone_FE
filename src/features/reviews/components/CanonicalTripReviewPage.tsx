'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ROUTES } from '@/lib/routes';
import { formatTripDateTime } from '@/features/trips/utils/formatTripDate';
import { createReview, getReviewContext, updateReview } from '../services/canonicalReviewApi';
import type { CanonicalReview, ReviewableRecordRef, TripReviewContext } from '../types/canonicalReview';
import { CanonicalReviewApiError } from '../types/canonicalReview';
import { canonicalReviewMessage } from '../resources/canonicalReviewMessages';
import { isPositiveInt64 } from '../types/reviewableRecordId';

const MAX_FILE_BYTES = 5_000_000;
const DUPLICATE_RECOVERY_ERROR = 'Không thể tải đánh giá hiện có. Vui lòng thử lại.';
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

const RATING_LABELS: Record<number, string> = {
  1: '1/5 · Không hài lòng',
  2: '2/5 · Cần cải thiện',
  3: '3/5 · Tạm ổn',
  4: '4/5 · Rất hài lòng',
  5: '5/5 · Tuyệt vời',
};

function hasUsableRecoveredReview(value: TripReviewContext, reference: ReviewableRecordRef): boolean {
  const review = value?.review;
  return value?.existingReviewKind === 'new' &&
    value.reviewableRecord?.kind === reference.kind && value.reviewableRecord.id === reference.id &&
    Array.isArray(value.editableFields) && value.editableFields.every(field => typeof field === 'string') &&
    review?.kind === 'new' && typeof review.reviewId === 'string' && isPositiveInt64(review.reviewId) &&
    review.reviewableRecord?.kind === reference.kind && review.reviewableRecord.id === reference.id &&
    Number.isInteger(review.overallRating) && review.overallRating >= 1 && review.overallRating <= 5 &&
    typeof review.title === 'string' && review.title.trim().length > 0 &&
    typeof review.content === 'string' && review.content.trim().length > 0 &&
    typeof review.publishDisplayName === 'boolean' &&
    typeof review.version === 'string' && review.version.length > 0;
}

export function CanonicalTripReviewPage({ reference }: { reference: ReviewableRecordRef }) {
  const router = useRouter();
  const [context, setContext] = useState<TripReviewContext | null>(null);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [publishDisplayName, setPublishDisplayName] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  const load = async (
    clearCurrentContext = false,
    accept: (value: TripReviewContext) => boolean = () => true,
  ): Promise<TripReviewContext | null> => {
    setBusy(true);
    setMessage(null);
    if (clearCurrentContext) setContext(null);
    try {
      const value = await getReviewContext(reference);
      if (!accept(value)) return null;
      setContext(value);
      if (value.review?.kind === 'new') {
        setRating(value.review.overallRating);
        setTitle(value.review.title);
        setContent(value.review.content);
        setPublishDisplayName(value.review.publishDisplayName);
      }
      return value;
    } catch (error) {
      setMessage(canonicalReviewMessage(error instanceof CanonicalReviewApiError ? error.errorCode : 'MSG127'));
      return null;
    } finally { setBusy(false); }
  };

  // Loading is the effect's external synchronization; state updates occur after the request settles.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [reference.kind, reference.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = context?.review?.kind === 'new' ? context.review as CanonicalReview : null;
  const editable = Boolean(current && context?.editableFields.length);
  const readOnly = Boolean(current && !editable);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (rating < 1 || rating > 5 || !title.trim() || !content.trim()) {
      setMessage('Vui lòng chọn số sao, nhập tiêu đề và nội dung đánh giá.'); return;
    }
    setBusy(true); setMessage(null);
    try {
      const input = { overallRating: rating, title: title.trim(), content: content.trim(), publishDisplayName, files,
        version: current?.version };
      await (current ? updateReview(reference, input) : createReview(reference, input));
      setFiles([]);
      if (current) { await load(); setMessage('Đã cập nhật đánh giá.'); }
      else {
        setMessage('Đã đăng đánh giá. Đang quay lại Lịch sử chuyến đi…');
        window.setTimeout(() => router.push(ROUTES.account.trips), 800);
      }
    } catch (error) {
      const code = error instanceof CanonicalReviewApiError ? error.errorCode : 'MSG127';
      if (code === 'trip_review.duplicate') {
        const recovered = await load(true, value => hasUsableRecoveredReview(value, reference));
        if (recovered) {
          setMessage(canonicalReviewMessage(code));
        } else {
          setContext(null);
          setMessage(DUPLICATE_RECOVERY_ERROR);
        }
      } else {
        setMessage(canonicalReviewMessage(code));
        setBusy(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#1C2928]" lang="vi">
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        <nav aria-label="Đường dẫn điều hướng" className="mb-5 flex items-center gap-2 text-xs text-[#5B6E69]">
          <Link href={ROUTES.home} className="hover:text-[#174B4A] hover:underline">
            Trang chủ
          </Link>
          <span aria-hidden="true">/</span>
          <Link href={ROUTES.account.trips} className="hover:text-[#174B4A] hover:underline">
            Lịch sử chuyến đi
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-[#1C2928]">Đánh giá chuyến đi</span>
        </nav>

        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-[#1C2928] sm:text-3xl">
            Đánh giá chuyến đi
          </h1>
          <p className="mt-1 text-sm text-[#5B6E69]">
            Chia sẻ trải nghiệm thực tế của bạn để giúp du khách khác chọn lựa tốt hơn.
          </p>
        </div>

        <Link
          href={ROUTES.account.trips}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#174B4A] hover:underline"
        >
          ← Quay lại Lịch sử chuyến đi
        </Link>

        {busy && !context ? (
          <p className="mt-6 text-sm text-[#5B6E69]" role="status">
            Đang tải thông tin đánh giá…
          </p>
        ) : null}

        {message ? (
          <p
            className="mt-4 rounded-xl border border-[#F2D8B3] bg-[#FEF3E2] px-4 py-3 text-sm font-medium text-[#8F5419]"
            role="status"
          >
            {message}
          </p>
        ) : null}

        {context ? (
          <>
            <section className="mt-5 rounded-2xl border border-[#DCE2DD] bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-[#995436]">Tour đã hoàn thành</span>
                <span className="text-[#5B6E69]">
                  {context.summary?.departureAtUtc ? formatTripDateTime(context.summary.departureAtUtc) : ''}
                </span>
              </div>
              <h2 className="mt-1.5 text-base font-bold text-[#1C2928]">
                {context.summary?.name ?? 'Chuyến đi'}
              </h2>
              {context.summary?.bookingReference ? (
                <p className="mt-1 text-xs text-[#5B6E69]">{context.summary.bookingReference}</p>
              ) : null}
            </section>

            {context.existingReviewKind === 'legacy' ? (
              <p className="mt-5 rounded-xl border border-[#F2D8B3] bg-[#FEF3E2] p-4 text-sm text-[#8F5419]">
                Đánh giá cũ này hiện chỉ có thể xem.
              </p>
            ) : !current && !context.canSubmit ? (
              <p className="mt-5 rounded-xl border border-[#F2D8B3] bg-[#FEF3E2] p-4 text-sm text-[#8F5419]">
                Chưa thể đánh giá: {context.submitUnavailableReason}
              </p>
            ) : (
              <form onSubmit={submit} className="mt-4 space-y-5 rounded-2xl border border-[#DCE2DD] bg-white p-6">
                {readOnly ? (
                  <p className="rounded-xl border border-[#EDEAE1] bg-[#F7F5EF] px-4 py-3 text-xs font-medium text-[#5B6E69]">
                    Đã hết thời hạn 7 ngày chỉnh sửa. Đánh giá này hiện chỉ có thể xem.
                  </p>
                ) : null}

                <fieldset disabled={readOnly || busy} className="space-y-5">
                  <legend className="sr-only">Nội dung đánh giá</legend>

                  <fieldset>
                    <legend className="block text-xs font-semibold text-[#1C2928]">
                      Mức độ hài lòng của bạn
                    </legend>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Đánh giá">
                      {[1, 2, 3, 4, 5].map(v => (
                        <button
                          key={v}
                          type="button"
                          role="radio"
                          aria-checked={rating === v}
                          aria-label={`${v} sao`}
                          onClick={() => setRating(v)}
                          className={`text-3xl transition ${v <= rating ? 'text-[#D97706]' : 'text-[#DCE2DD] hover:text-[#D97706]/60'}`}
                        >
                          ★
                        </button>
                      ))}
                      {rating > 0 && (
                        <span className="ml-2 text-xs font-semibold text-[#1C2928]">
                          {RATING_LABELS[rating]}
                        </span>
                      )}
                    </div>
                  </fieldset>

                  <label className="block text-xs font-semibold text-[#1C2928]">
                    Tiêu đề đánh giá
                    <input
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      maxLength={200}
                      required
                      placeholder="Tóm tắt ngắn gọn trải nghiệm của bạn"
                      className="mt-1.5 block w-full rounded-xl border border-[#DCE2DD] bg-[#F7F5EF]/50 px-3.5 py-2.5 text-sm font-normal text-[#1C2928] focus:border-[#174B4A] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#174B4A]/15"
                    />
                  </label>

                  <label className="block text-xs font-semibold text-[#1C2928]">
                    Chia sẻ trải nghiệm
                    <textarea
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      maxLength={1000}
                      required
                      rows={5}
                      placeholder="Chia sẻ cảm nhận về lịch trình, hướng dẫn viên, dịch vụ…"
                      className="mt-1.5 block w-full resize-none rounded-xl border border-[#DCE2DD] bg-[#F7F5EF]/50 px-3.5 py-2.5 text-sm font-normal leading-relaxed text-[#1C2928] focus:border-[#174B4A] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#174B4A]/15"
                    />
                  </label>

                  {!current ? (
                    <label className="block text-xs font-semibold text-[#1C2928]">
                      Ảnh thực tế (không bắt buộc, tối đa 5 ảnh)
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp"
                        onChange={e => {
                          const selected = Array.from(e.target.files ?? []);
                          const valid = selected.length <= 5 && selected.every(file => file.size > 0 && file.size <= MAX_FILE_BYTES && allowedTypes.has(file.type));
                          if (!valid) {
                            setMessage('Chỉ chọn tối đa 5 ảnh định dạng JPEG, PNG hoặc WebP, mỗi ảnh không quá 5 MB.');
                            e.target.value = '';
                            return;
                          }
                          setFiles(selected);
                          setMessage(null);
                        }}
                        className="mt-1.5 block w-full rounded-xl border border-dashed border-[#DCE2DD] bg-[#F7F5EF]/50 p-3 text-xs font-normal text-[#5B6E69] file:mr-3 file:rounded-lg file:border-0 file:bg-[#E8F0EA] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#174B4A]"
                      />
                    </label>
                  ) : null}

                  <label className="flex items-center gap-2.5 border-t border-[#EDEAE1] pt-4 text-xs font-medium text-[#1C2928]">
                    <input
                      type="checkbox"
                      checked={publishDisplayName}
                      onChange={e => setPublishDisplayName(e.target.checked)}
                      className="h-4 w-4 rounded border-[#DCE2DD] accent-[#174B4A]"
                    />
                    <span>Hiển thị tên của bạn trên đánh giá</span>
                  </label>

                  <div className="flex flex-col-reverse gap-2.5 border-t border-[#EDEAE1] pt-4 sm:flex-row sm:justify-end">
                    <Link
                      href={ROUTES.account.trips}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#DCE2DD] bg-white px-4 py-2 text-xs font-semibold text-[#1C2928] transition hover:bg-[#F7F5EF]"
                    >
                      Hủy
                    </Link>
                    {!readOnly ? (
                      <button
                        className="rounded-xl bg-[#174B4A] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#103B39] disabled:opacity-50"
                        type="submit"
                      >
                        {current ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
                      </button>
                    ) : null}
                  </div>
                </fieldset>
              </form>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}
