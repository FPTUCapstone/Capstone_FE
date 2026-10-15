import type {
  CanonicalReview,
  ReviewWriteInput,
  ReviewableRecordRef,
  TripReviewContext,
} from '../types/canonicalReview';
import { CanonicalReviewApiError } from '../types/canonicalReview';

function path(ref: ReviewableRecordRef): string {
  const namespace = ref.kind === 'commerceBooking' ? 'bookings' : 'service-bookings';
  return `/api/v1/${namespace}/${ref.id}/review`;
}

async function parse<T>(response: Response): Promise<T> {
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const code = body && typeof body === 'object' && 'errorCode' in body &&
      typeof body.errorCode === 'string' ? body.errorCode : 'MSG127';
    throw new CanonicalReviewApiError(response.status, code);
  }
  return body as T;
}

export async function getReviewContext(ref: ReviewableRecordRef): Promise<TripReviewContext> {
  return parse<TripReviewContext>(await fetch(path(ref), { cache: 'no-store' }));
}

export async function createReview(ref: ReviewableRecordRef, input: ReviewWriteInput): Promise<CanonicalReview> {
  const form = new FormData();
  form.set('metadata', new Blob([JSON.stringify({
    overallRating: input.overallRating,
    title: input.title,
    content: input.content,
    poiRatings: [],
    routePacing: null,
    cspRating: null,
    publishDisplayName: input.publishDisplayName,
  })], { type: 'application/json;charset=utf-8' }), 'metadata.json');
  for (const file of input.files ?? []) form.append('files', file, file.name);
  return parse<CanonicalReview>(await fetch(path(ref), { method: 'POST', body: form }));
}

export async function updateReview(ref: ReviewableRecordRef, input: ReviewWriteInput): Promise<CanonicalReview> {
  return parse<CanonicalReview>(await fetch(path(ref), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      overallRating: input.overallRating,
      title: input.title,
      content: input.content,
      publishDisplayName: input.publishDisplayName,
      version: input.version,
    }),
  }));
}
