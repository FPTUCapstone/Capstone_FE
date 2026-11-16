import { describe, expect, it } from 'vitest';
import { parseMyPostTripComplaints, parsePostTripComplaintContext, parseSubmitPostTripComplaintResponse } from './postTripComplaintResponse';

const date = '2026-11-20T08:00:00Z';
describe('post-trip complaint response parsing', () => {
  it('parses a safe server context without storage values', () => {
    expect(parsePostTripComplaintContext({ data: { bookingId: 12, bookingCode: 'BK-12', tourTitle: 'Hue tour', endAtUtc: date, submissionDeadlineUtc: date, canSubmit: true, canAmendEvidence: false, ineligibilityReason: null, complaint: null } })).toMatchObject({ bookingId: '12', canSubmit: true, canAmendEvidence: false });
  });
  it('parses evidence IDs used for an authorised download', () => {
    const context = parsePostTripComplaintContext({ data: { bookingId: 12, bookingCode: 'BK-12', tourTitle: 'Hue tour', endAtUtc: date, submissionDeadlineUtc: date, canSubmit: false, canAmendEvidence: true, ineligibilityReason: 'complaint.already_exists', complaint: { complaintId: 8, status: 'AwaitingOperatorResponse', reasonCategory: 'Other', reasonDetail: 'Details', submittedAtUtc: date, responseDeadlineUtc: date, evidence: [{ evidenceId: 22, fileName: 'proof.pdf', contentType: 'application/pdf', sizeBytes: 12 }] } } });
    expect(context.complaint?.evidence[0]).toMatchObject({ evidenceId: '22', fileName: 'proof.pdf' });
    expect(context.canAmendEvidence).toBe(true);
  });
  it('rejects a malformed response', () => expect(() => parsePostTripComplaintContext({ bookingId: 12 })).toThrow());
  it('recognises replay response as one server-issued complaint', () => {
    expect(parseSubmitPostTripComplaintResponse({ complaintId: 1, bookingId: 12, status: 'AwaitingOperatorResponse', submittedAtUtc: date, responseDeadlineUtc: date, isReplay: true }).isReplay).toBe(true);
  });
  it('parses the authenticated traveler complaint list', () => {
    expect(parseMyPostTripComplaints([{ complaintId: 1, bookingId: 12, bookingCode: 'BK-12', tourTitle: 'Hue tour', status: 'AwaitingOperatorResponse', reasonCategory: 'Other', submittedAtUtc: date, responseDeadlineUtc: date, evidenceCount: 1 }])[0]?.bookingId).toBe('12');
  });
});
