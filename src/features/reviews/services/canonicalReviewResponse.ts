import { LosslessNumber, parse, toSafeNumberOrThrow } from 'lossless-json';
import type { CanonicalReview, ReviewableRecordRef, TripReviewContext } from '../types/canonicalReview';
import { isPositiveInt64 } from '../types/reviewableRecordId';

type ObjectValue = Record<string, unknown>;
function invalid(): never { throw new Error('Invalid review response'); }
function object(value: unknown): ObjectValue {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value instanceof LosslessNumber ||
      Object.getPrototypeOf(value) !== Object.prototype) invalid();
  return value as ObjectValue;
}
function text(value: unknown): asserts value is string { if (typeof value !== 'string') invalid(); }
function nullableText(value: unknown) { if (value !== null) text(value); }
function bool(value: unknown) { if (typeof value !== 'boolean') invalid(); }
function list(value: unknown): unknown[] { if (!Array.isArray(value)) invalid(); return value; }
function date(value: unknown) { text(value); if (!Number.isFinite(Date.parse(value))) invalid(); }
function identity(value: unknown): string {
  const token = value instanceof LosslessNumber ? value.value : value;
  if (typeof token !== 'string' || !isPositiveInt64(token)) invalid();
  return token;
}
function idAt(value: ObjectValue, key: string) { value[key] = identity(value[key]); }
function rating(value: unknown) {
  const number = value instanceof LosslessNumber ? toSafeNumberOrThrow(value.value) : value;
  if (typeof number !== 'number' || !Number.isInteger(number) || number < 1 || number > 5) invalid();
}
function reference(value: unknown, expected: ReviewableRecordRef) {
  const ref = object(value);
  if (Object.keys(ref).length !== 2 || ref.kind !== expected.kind) invalid();
  idAt(ref, 'id');
  if (ref.id !== expected.id) invalid();
}
function parent(value: ObjectValue, expected: ReviewableRecordRef) {
  reference(value.reviewableRecord, expected);
  const key = expected.kind === 'commerceBooking' ? 'bookingId' : 'serviceBookingId';
  const other = expected.kind === 'commerceBooking' ? 'serviceBookingId' : 'bookingId';
  idAt(value, key);
  if (value[key] !== expected.id || other in value) invalid();
}
function subject(value: unknown, expected: ReviewableRecordRef) {
  const item = object(value);
  if (Object.keys(item).length !== 2 || !(expected.kind === 'serviceBooking'
    ? item.kind === 'poi' : item.kind === 'tour' || item.kind === 'itinerary')) invalid();
  idAt(item, 'id');
}
function capability(value: unknown) {
  const item = object(value); bool(item.available); nullableText(item.reason);
}
function canonical(value: unknown, expected: ReviewableRecordRef) {
  const item = object(value);
  if (item.kind !== 'new' || item.publicationStatus !== 'published') invalid();
  parent(item, expected); idAt(item, 'reviewId'); subject(item.subject, expected);
  rating(item.overallRating); bool(item.publishDisplayName);
  for (const key of ['title', 'content', 'publicDisplayName', 'version']) text(item[key]);
  if (!(item.title as string).trim() || (item.title as string).length > 200 ||
      !(item.content as string).trim() || (item.content as string).length > 1000 ||
      !/^[A-Za-z0-9+/]{10}[AEIMQUYcgkosw048]=$/.test(item.version as string)) invalid();
  for (const key of ['createdAtUtc', 'editDeadlineUtc', 'updatedAtUtc']) date(item[key]);
  if (item.routePacing !== null && !['tooTight', 'wellPaced', 'tooLoose'].includes(item.routePacing as string)) invalid();
  if (item.cspRating !== null) rating(item.cspRating);
  for (const value of list(item.poiRatings)) { const poi = object(value); idAt(poi, 'poiId'); rating(poi.rating); }
  for (const value of list(item.media)) { const media = object(value); idAt(media, 'mediaId'); text(media.deliveryUrl); }
}
function context(value: unknown, expected: ReviewableRecordRef) {
  const item = object(value); parent(item, expected);
  const statuses = expected.kind === 'commerceBooking'
    ? ['PendingPayment', 'Confirmed', 'Cancelled', 'Completed', 'Expired']
    : ['Pending', 'Confirmed', 'Cancelled', 'Completed'];
  if (!statuses.includes(item.bookingStatus as string)) invalid();
  if (item.subject !== null) subject(item.subject, expected);
  if (item.summary !== null) {
    const summary = object(item.summary); text(summary.name); text(summary.bookingReference); date(summary.departureAtUtc);
  }
  bool(item.canSubmit); nullableText(item.submitUnavailableReason);
  for (const key of ['routePacing', 'cspRating', 'poiRatings']) capability(item[key]);
  for (const field of list(item.editableFields)) {
    if (!['overallRating', 'title', 'content', 'publishDisplayName'].includes(field as string)) invalid();
  }
  for (const value of list(item.eligiblePois)) { const poi = object(value); idAt(poi, 'poiId'); text(poi.name); }
  const preview = object(item.displayNamePreview); text(preview.initials); nullableText(preview.fullNameWithConsent);
  if (item.existingReviewKind === 'none') { if (item.review !== null) invalid(); }
  else if (item.existingReviewKind === 'new') canonical(item.review, expected);
  else if (item.existingReviewKind === 'legacy') {
    const legacy = object(item.review);
    if (expected.kind !== 'commerceBooking' || legacy.kind !== 'legacy') invalid();
    idAt(legacy, 'bookingId'); if (legacy.bookingId !== expected.id) invalid();
    for (const value of list(legacy.entries)) {
      const entry = object(value); idAt(entry, 'reviewId'); idAt(entry, 'targetId');
      text(entry.targetType); rating(entry.rating); nullableText(entry.comment); date(entry.createdAtUtc);
    }
  } else invalid();
}

// Only schema-declared identity fields become strings. All other numeric fields
// retain their number type, and unsafe unknown numbers fail instead of rounding.
function ordinary(value: unknown): unknown {
  if (value instanceof LosslessNumber) return toSafeNumberOrThrow(value.value);
  if (Array.isArray(value)) return value.map(ordinary);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(object(value)).map(([key, item]) => [key, ordinary(item)]));
  return value;
}
export function parseReviewResponse(text: string, ref: ReviewableRecordRef, mode: 'context'): TripReviewContext;
export function parseReviewResponse(text: string, ref: ReviewableRecordRef, mode: 'review'): CanonicalReview;
export function parseReviewResponse(text: string, ref: ReviewableRecordRef, mode: 'context' | 'review'): TripReviewContext | CanonicalReview {
  if (!isPositiveInt64(ref.id) || !['commerceBooking', 'serviceBooking'].includes(ref.kind)) invalid();
  const value = parse(text);
  if (mode === 'context') context(value, ref); else canonical(value, ref);
  return ordinary(value) as TripReviewContext | CanonicalReview;
}
