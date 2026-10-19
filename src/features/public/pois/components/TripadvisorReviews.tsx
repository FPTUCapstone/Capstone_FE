'use client';

import { useEffect, useState } from 'react';

import {
  ExternalReviewDto,
  ExternalReviewsDto,
  getExternalReviews,
  translateExternalReview,
  TranslatedReviewDto,
} from '../services/externalReviewsApi';
import { formatTripadvisorScore, TripadvisorAttribution } from './TripadvisorAttribution';

interface TripadvisorReviewsProps {
  poiId: number;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: ExternalReviewsDto };


/**
 * Tripadvisor rating + recent reviews (Review 2, D6). Loaded in the browser after render so review text
 * never appears in server-rendered HTML (Terra policy). Hidden when the POI is not linked. Reviews are read
 * inside TripMate only: nothing here links out to Tripadvisor.
 */
export function TripadvisorReviews({ poiId }: TripadvisorReviewsProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    getExternalReviews(poiId, { signal: controller.signal })
      .then((data) => setState({ status: 'ready', data }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Không tải được đánh giá Tripadvisor lúc này.',
        });
      });
    return () => controller.abort();
  }, [poiId]);

  if (state.status === 'loading') {
    return (
      <p className="text-xs text-slate-500" aria-busy="true">
        Đang tải đánh giá Tripadvisor…
      </p>
    );
  }
  if (state.status === 'error') {
    return <p className="text-xs text-slate-500">{state.message}</p>;
  }

  const { data } = state;
  if (data.source === null) return null;

  return (
    <section aria-label="Đánh giá" className="space-y-3">
      <TripadvisorAttribution rating={data.rating} reviewCount={data.reviewCount} />

      {/* Tripadvisor serves only a recent pool, so a place can count reviews with none left to show. */}
      {data.reviews.length === 0 ? (
        <p className="text-xs text-slate-500">Chưa có đánh giá gần đây để hiển thị.</p>
      ) : (
        <ul className="space-y-3">
          {data.reviews.map((review) => (
            <ReviewItem
              key={review.id}
              poiId={poiId}
              review={review}
              canTranslate={data.translationAvailable && review.language !== 'vi'}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function ReviewItem({
  poiId,
  review,
  canTranslate,
}: {
  poiId: number;
  review: ExternalReviewDto;
  canTranslate: boolean;
}) {
  const [translation, setTranslation] = useState<TranslatedReviewDto | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);

  const translate = async () => {
    if (translation) {
      setShowTranslation(true);
      return;
    }
    setTranslating(true);
    setTranslateError(null);
    try {
      setTranslation(await translateExternalReview(poiId, review.id));
      setShowTranslation(true);
    } catch (error) {
      setTranslateError(error instanceof Error ? error.message : 'Không dịch được đánh giá này lúc này.');
    } finally {
      setTranslating(false);
    }
  };

  const title = showTranslation && translation ? translation.title : review.title;
  const text = showTranslation && translation ? translation.text : review.text;
  const published = review.publishedAt ? new Date(review.publishedAt) : null;

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="font-bold text-slate-900">{formatTripadvisorScore(review.rating)}</span>
        {review.author && <span className="font-semibold text-slate-700">{review.author}</span>}
        {published && !Number.isNaN(published.getTime()) && (
          <span>{published.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</span>
        )}
      </div>
      {title && <p className="mt-1 font-bold text-slate-900">{title}</p>}
      {text && <p className="mt-1 whitespace-pre-line text-slate-700">{text}</p>}
      {canTranslate && (
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
          {showTranslation ? (
            <span className="text-slate-500">
              Bản dịch tự động ·{' '}
              <button
                type="button"
                onClick={() => setShowTranslation(false)}
                className="font-bold text-[#007d6e] hover:underline"
              >
                Xem bản gốc
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => void translate()}
              disabled={translating}
              className="font-bold text-[#007d6e] hover:underline disabled:opacity-60"
            >
              {translating ? 'Đang dịch…' : 'Dịch sang tiếng Việt'}
            </button>
          )}
        </div>
      )}
      {translateError && <p className="mt-1 text-xs text-rose-600">{translateError}</p>}
    </li>
  );
}
