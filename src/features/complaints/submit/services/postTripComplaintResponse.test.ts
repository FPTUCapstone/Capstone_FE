import { describe, expect, it } from 'vitest';
import { parsePostTripComplaintContext, parseSubmitPostTripComplaintResponse } from './postTripComplaintResponse';

const date = '2026-11-20T08:00:00Z';
describe('post-trip complaint response parsing', () => {
  it('parses a safe server context without storage values', () => {
    expect(parsePostTripComplaintContext({ data: { bookingId: 12, bookingCode: 'BK-12', tourTitle: 'Hue tour', endAtUtc: date, submissionDeadlineUtc: date, canSubmit: true, ineligibilityReason: null, complaint: null } })).toMatchObject({ bookingId: '12', canSubmit: true });
  });
  it('rejects a malformed response', () => expect(() => parsePostTripComplaintContext({ bookingId: 12 })).toThrow());
  it('recognises replay response as one server-issued complaint', () => {
    expect(parseSubmitPostTripComplaintResponse({ complaintId: 1, bookingId: 12, status: 'AwaitingOperatorResponse', submittedAtUtc: date, responseDeadlineUtc: date, isReplay: true }).isReplay).toBe(true);
  });
});
