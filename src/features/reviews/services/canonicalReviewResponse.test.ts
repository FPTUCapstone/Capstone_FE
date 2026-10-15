import { describe, expect, it } from 'vitest';
import { parseReviewResponse } from './canonicalReviewResponse';
import type { ReviewableRecordKind } from '../types/canonicalReview';

// Replacing a quoted sentinel produces actual numeric JSON tokens, including
// values JavaScript's native JSON.parse would irreversibly round.
const numericId = '__RAW_INT64__';
const timestamp = '2026-10-01T00:00:00Z';
function review(kind: ReviewableRecordKind = 'commerceBooking') {
  return {
    kind: 'new', reviewId: numericId,
    reviewableRecord: { kind, id: numericId },
    [kind === 'commerceBooking' ? 'bookingId' : 'serviceBookingId']: numericId,
    subject: { kind: kind === 'commerceBooking' ? 'tour' : 'poi', id: numericId },
    overallRating: 5, title: 'Great', content: 'Excellent trip', routePacing: null,
    cspRating: null, publishDisplayName: false, publicDisplayName: 'T.',
    publicationStatus: 'published', createdAtUtc: timestamp,
    editDeadlineUtc: '2026-10-08T00:00:00Z', updatedAtUtc: timestamp,
    version: 'AAAAAAAAAAE=', poiRatings: [{ poiId: numericId, rating: 5 }],
    media: [{ mediaId: numericId, deliveryUrl: 'https://example.com/photo.webp' }],
  };
}
function context(kind: ReviewableRecordKind = 'commerceBooking') {
  return {
    reviewableRecord: { kind, id: numericId },
    [kind === 'commerceBooking' ? 'bookingId' : 'serviceBookingId']: numericId,
    bookingStatus: 'Completed', subject: review(kind).subject,
    summary: { name: 'Trip', departureAtUtc: timestamp, bookingReference: 'REF' },
    canSubmit: false, submitUnavailableReason: 'alreadyReviewed',
    existingReviewKind: 'new', review: review(kind), editableFields: ['title', 'content'],
    routePacing: { available: false, reason: null },
    cspRating: { available: false, reason: null },
    poiRatings: { available: true, reason: null },
    eligiblePois: [{ poiId: numericId, name: 'Museum' }],
    displayNamePreview: { initials: 'T.', fullNameWithConsent: null },
  };
}
function wire(value: unknown, id = '123') {
  return JSON.stringify(value).replaceAll(`"${numericId}"`, id);
}
const reference = { kind: 'commerceBooking' as const, id: '123' };

describe('Backend canonical review response boundary', () => {
  it.each(['123', '9007199254740993', '9223372036854775807'])('preserves every known Int64 identity: %s', id => {
    const result = parseReviewResponse(wire(context(), id), { ...reference, id }, 'context');
    expect(result).toMatchObject({
      bookingId: id, reviewableRecord: { id }, subject: { id },
      eligiblePois: [{ poiId: id }],
      review: { reviewId: id, bookingId: id, reviewableRecord: { id },
        subject: { id }, poiRatings: [{ poiId: id }], media: [{ mediaId: id }] },
    });
  });

  it('accepts the service namespace and normalizes standalone create/edit DTOs', () => {
    expect(parseReviewResponse(wire(review('serviceBooking')), { kind: 'serviceBooking', id: '123' }, 'review'))
      .toMatchObject({ serviceBookingId: '123', reviewId: '123', subject: { id: '123' } });
  });

  it('accepts explicitly nullable context subject/summary', () => {
    const dto = { ...context(), subject: null, summary: null, review: null,
      existingReviewKind: 'none', canSubmit: false, submitUnavailableReason: 'unsupportedSubject' };
    expect(parseReviewResponse(wire(dto), reference, 'context')).toMatchObject({ subject: null, summary: null });
  });

  it('accepts read-only legacy context and preserves legacy identities', () => {
    const dto = { ...context(), existingReviewKind: 'legacy', editableFields: [], review: {
      kind: 'legacy', bookingId: numericId, entries: [{ reviewId: numericId,
        targetType: 'Tour', targetId: numericId, rating: 4, comment: null, createdAtUtc: timestamp }],
    } };
    expect(parseReviewResponse(wire(dto, '9007199254740993'), { ...reference, id: '9007199254740993' }, 'context'))
      .toMatchObject({ review: { bookingId: '9007199254740993', entries: [{
        reviewId: '9007199254740993', targetId: '9007199254740993',
      }] } });
  });

  it.each(['0', '-1', '9223372036854775808', '1.5', '1e3', 'null', 'true', '"01"', '"bad"'])
    ('rejects invalid identity token %s', id => {
      expect(() => parseReviewResponse(wire(context(), id), reference, 'context')).toThrow();
    });

  it('rejects a different parent namespace, even when its numeric ID is equal', () => {
    expect(() => parseReviewResponse(wire(context('serviceBooking')), reference, 'context')).toThrow();
  });
  it('rejects a different parent ID', () => {
    expect(() => parseReviewResponse(wire(context(), '124'), reference, 'context')).toThrow();
  });
  it('rejects a different nested parent reference', () => {
    const dto = context();
    dto.review.reviewableRecord.kind = 'serviceBooking';
    expect(() => parseReviewResponse(wire(dto), reference, 'context')).toThrow();
  });

  it.each(['reviewableRecord', 'bookingStatus', 'subject', 'summary', 'canSubmit',
    'submitUnavailableReason', 'existingReviewKind', 'review', 'editableFields',
    'routePacing', 'cspRating', 'poiRatings', 'eligiblePois', 'displayNamePreview'])
    ('rejects context missing required member %s', member => {
      const dto: Record<string, unknown> = context();
      delete dto[member];
      expect(() => parseReviewResponse(wire(dto), reference, 'context')).toThrow();
    });

  it.each(['reviewId', 'subject', 'overallRating', 'title', 'content', 'routePacing',
    'cspRating', 'publishDisplayName', 'publicDisplayName', 'publicationStatus',
    'createdAtUtc', 'editDeadlineUtc', 'updatedAtUtc', 'version', 'poiRatings', 'media'])
    ('rejects review missing required member %s', member => {
      const dto: Record<string, unknown> = review();
      delete dto[member];
      expect(() => parseReviewResponse(wire(dto), reference, 'review')).toThrow();
    });

  it('rejects a status from the other booking namespace', () => {
    expect(() => parseReviewResponse(wire({ ...context(), bookingStatus: 'Pending' }), reference, 'context')).toThrow();
    expect(() => parseReviewResponse(wire({ ...context('serviceBooking'), bookingStatus: 'PendingPayment' }),
      { kind: 'serviceBooking', id: '123' }, 'context')).toThrow();
  });
  it('rejects inconsistent existing-review discriminator', () => {
    expect(() => parseReviewResponse(wire({ ...context(), existingReviewKind: 'none' }), reference, 'context')).toThrow();
  });
  it('rejects malformed JSON', () => {
    expect(() => parseReviewResponse('{', reference, 'context')).toThrow();
  });
  it('rejects required members supplied only through a poisoned prototype', () => {
    const dto: Record<string, unknown> = context();
    const preview = dto.displayNamePreview;
    delete dto.displayNamePreview;
    const raw = wire(dto).replace(/}$/, `,"__proto__":${JSON.stringify({ displayNamePreview: preview })}}`);
    expect(() => parseReviewResponse(raw, reference, 'context')).toThrow();
  });
  it('rejects poisoned prototypes in otherwise unknown nested members', () => {
    const raw = wire(context()).replace(/}$/, ',"future":{"__proto__":{"inherited":true}}}');
    expect(() => parseReviewResponse(raw, reference, 'context')).toThrow();
  });
  it('rejects object identities spoofing the lossless-number marker', () => {
    const raw = wire(context(), '{"isLosslessNumber":true,"value":"123"}');
    expect(() => parseReviewResponse(raw, reference, 'context')).toThrow();
  });
  it('preserves unknown objects containing a lossless-number marker', () => {
    const marker = { isLosslessNumber: true, value: '5', label: 'future DTO value' };
    const raw = wire({ ...context(), future: marker });
    expect(parseReviewResponse(raw, reference, 'context')).toMatchObject({ future: marker });
  });
});
