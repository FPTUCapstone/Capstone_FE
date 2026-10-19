import type {
  CanonicalReview,
  ReviewWriteInput,
  ReviewableRecordRef,
  TripReviewContext,
} from '../types/canonicalReview';
import { CanonicalReviewApiError } from '../types/canonicalReview';
import { parseReviewResponse } from './canonicalReviewResponse';

function path(ref: ReviewableRecordRef): string {
  const namespace = ref.kind === 'commerceBooking' ? 'bookings' : 'service-bookings';
  return `/api/v1/${namespace}/${ref.id}/review`;
}

async function parse(response: Response, ref: ReviewableRecordRef, mode: 'context'): Promise<TripReviewContext>;
async function parse(response: Response, ref: ReviewableRecordRef, mode: 'review'): Promise<CanonicalReview>;
async function parse(response: Response, ref: ReviewableRecordRef, mode: 'context' | 'review'): Promise<TripReviewContext | CanonicalReview> {
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const code = body && typeof body === 'object' && 'errorCode' in body &&
      typeof body.errorCode === 'string' ? body.errorCode : 'MSG127';
    throw new CanonicalReviewApiError(response.status, code);
  }
  try {
    const text = await response.text();
    return mode === 'context' ? parseReviewResponse(text, ref, 'context') : parseReviewResponse(text, ref, 'review');
  } catch {
    throw new CanonicalReviewApiError(502, 'trip_review.invalid_response');
  }
}

export async function getReviewContext(ref: ReviewableRecordRef): Promise<TripReviewContext> {
  return parse(await fetch(path(ref), { cache: 'no-store' }), ref, 'context');
}

export async function createReview(ref: ReviewableRecordRef, input: ReviewWriteInput): Promise<CanonicalReview> {
  const form = new FormData();
  form.set('metadata', JSON.stringify({
    overallRating: input.overallRating,
    title: input.title,
    content: input.content,
    poiRatings: [],
    routePacing: null,
    cspRating: null,
    publishDisplayName: input.publishDisplayName,
  }));
  for (const file of input.files ?? []) form.append('files', file, file.name);
  return parse(await fetch(path(ref), { method: 'POST', body: form }), ref, 'review');
}

export async function updateReview(ref: ReviewableRecordRef, input: ReviewWriteInput): Promise<CanonicalReview> {
  return parse(await fetch(path(ref), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      overallRating: input.overallRating,
      title: input.title,
      content: input.content,
      publishDisplayName: input.publishDisplayName,
      version: input.version,
    }),
  }), ref, 'review');
}
