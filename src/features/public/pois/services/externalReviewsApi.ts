/**
 * Tripadvisor (Terra) reviews through the TripMate API (Review 2, §3.6). Signed-in Travelers only.
 * Terra policy: review text must never be server-rendered, so these calls run in the browser after the
 * page has rendered, and robots.txt disallows the review path.
 */

import { AuthStorage } from '@/features/auth/session/authSession';
import { getApiBase } from '@/lib/authApi';
import { messageForStatus, requestJson } from '@/lib/jsonRequest';
import { isBoolean, isFiniteNumber, isOptional, isRecord, isString } from '@/lib/typeGuards';

export interface ExternalReviewDto {
  id: number;
  rating: number;
  title: string | null;
  text: string | null;
  language: string | null;
  publishedAt: string | null;
  travelDate: string | null;
  author: string | null;
  url: string | null;
  ratingImageUrl: string | null;
}

export interface ExternalReviewsDto {
  poiId: number;
  translationAvailable: boolean;
  /** null = the POI is not linked or Tripadvisor is switched off: hide the block. */
  source: 'Tripadvisor' | null;
  rating: number | null;
  reviewCount: number;
  ratingImageUrl: string | null;
  url: string | null;
  reviews: ExternalReviewDto[];
}

export interface TranslatedReviewDto {
  reviewId: number;
  language: string;
  title: string | null;
  text: string | null;
  machineTranslated: boolean;
}

export class ExternalReviewsError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ExternalReviewsError';
  }
}

const optionalString = (value: unknown) => isOptional(value, isString);

function isReview(value: unknown): value is ExternalReviewDto {
  if (!isRecord(value)) return false;
  return (
    isFiniteNumber(value.id) &&
    isFiniteNumber(value.rating) &&
    optionalString(value.title) &&
    optionalString(value.text) &&
    optionalString(value.language) &&
    optionalString(value.publishedAt) &&
    optionalString(value.travelDate) &&
    optionalString(value.author) &&
    optionalString(value.url) &&
    optionalString(value.ratingImageUrl)
  );
}

function isReviews(value: unknown): value is ExternalReviewsDto {
  if (!isRecord(value)) return false;
  return (
    isFiniteNumber(value.poiId) &&
    isBoolean(value.translationAvailable) &&
    (value.source === null || value.source === 'Tripadvisor') &&
    isOptional(value.rating, isFiniteNumber) &&
    isFiniteNumber(value.reviewCount) &&
    optionalString(value.ratingImageUrl) &&
    optionalString(value.url) &&
    Array.isArray(value.reviews) &&
    value.reviews.every(isReview)
  );
}

function isTranslation(value: unknown): value is TranslatedReviewDto {
  if (!isRecord(value)) return false;
  return (
    isFiniteNumber(value.reviewId) &&
    isString(value.language) &&
    optionalString(value.title) &&
    optionalString(value.text)
  );
}

interface RequestOptions {
  accessToken?: string;
  signal?: AbortSignal;
}

function get(path: string, options?: RequestOptions) {
  return requestJson(`${getApiBase()}${path}`, {
    accessToken: options?.accessToken ?? AuthStorage.getContext()?.accessToken,
    signal: options?.signal,
    networkError: () => new ExternalReviewsError('Không thể kết nối máy chủ TripMate.', 0),
  });
}

export async function getExternalReviews(
  poiId: number,
  options?: RequestOptions & { size?: number },
): Promise<ExternalReviewsDto> {
  const size = options?.size ?? 5;
  const { status, body } = await get(`/pois/${poiId}/external-reviews?size=${size}`, options);
  if (status !== 200) {
    const signIn = 'Đăng nhập tài khoản Du khách để xem đánh giá Tripadvisor.';
    throw new ExternalReviewsError(
      messageForStatus(status, { 401: signIn, 403: signIn }, 'Không tải được đánh giá Tripadvisor lúc này.'),
      status,
    );
  }
  if (!isReviews(body)) {
    throw new ExternalReviewsError('Dữ liệu đánh giá Tripadvisor không hợp lệ.', 502);
  }
  return body;
}

export async function translateExternalReview(
  poiId: number,
  reviewId: number,
  options?: RequestOptions,
): Promise<TranslatedReviewDto> {
  const { status, body } = await get(`/pois/${poiId}/external-reviews/${reviewId}/translation?target=vi`, options);
  if (status !== 200) {
    throw new ExternalReviewsError(
      messageForStatus(status, { 503: 'Tính năng dịch đang tạm tắt.' }, 'Không dịch được đánh giá này lúc này.'),
      status,
    );
  }
  if (!isTranslation(body)) {
    throw new ExternalReviewsError('Dữ liệu bản dịch không hợp lệ.', 502);
  }
  return body;
}
