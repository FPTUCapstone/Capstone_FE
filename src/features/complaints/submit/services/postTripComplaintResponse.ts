import { isComplaintCategory } from '../schemas/postTripComplaintValidation';
import type { ExistingPostTripComplaint, PostTripComplaintContext, SubmitPostTripComplaintResponse } from '../types/postTripComplaint';

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
function id(value: unknown): string | null {
  return typeof value === 'string' && /^[1-9]\d*$/.test(value) ? value : typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? String(value) : null;
}
function date(value: unknown): string | null {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? value : null;
}
function textOrNull(value: unknown): string | null { return typeof value === 'string' ? value : value === null ? null : null; }
function dataEnvelope(value: unknown): unknown { const source = record(value); return source && 'data' in source ? source.data : value; }

function complaint(value: unknown): ExistingPostTripComplaint | null {
  const source = record(value); if (!source) return null;
  const complaintId = id(source.complaintId); const submittedAtUtc = date(source.submittedAtUtc); const responseDeadlineUtc = date(source.responseDeadlineUtc);
  if (!complaintId || typeof source.status !== 'string' || !isComplaintCategory(source.reasonCategory) || typeof source.reasonDetail !== 'string' || !submittedAtUtc || !responseDeadlineUtc || !Array.isArray(source.evidence)) return null;
  const evidence = source.evidence.map((entry) => {
    const item = record(entry);
    if (!item || typeof item.fileName !== 'string' || typeof item.contentType !== 'string' || typeof item.sizeBytes !== 'number' || !Number.isSafeInteger(item.sizeBytes) || item.sizeBytes < 0) return null;
    return { fileName: item.fileName, contentType: item.contentType, sizeBytes: item.sizeBytes };
  });
  return evidence.some((entry) => entry === null) ? null : { complaintId, status: source.status, reasonCategory: source.reasonCategory, reasonDetail: source.reasonDetail, submittedAtUtc, responseDeadlineUtc, evidence: evidence as ExistingPostTripComplaint['evidence'] };
}

export function parsePostTripComplaintContext(payload: unknown): PostTripComplaintContext {
  const source = record(dataEnvelope(payload));
  const bookingId = source && id(source.bookingId); const endAtUtc = source && date(source.endAtUtc); const submissionDeadlineUtc = source && date(source.submissionDeadlineUtc);
  if (!source || !bookingId || !endAtUtc || !submissionDeadlineUtc || typeof source.canSubmit !== 'boolean' || !(typeof source.ineligibilityReason === 'string' || source.ineligibilityReason === null) || !(source.complaint === null || complaint(source.complaint))) throw new Error('Invalid post-trip complaint context.');
  return { bookingId, bookingCode: textOrNull(source.bookingCode), tourTitle: textOrNull(source.tourTitle), endAtUtc, submissionDeadlineUtc, canSubmit: source.canSubmit, ineligibilityReason: source.ineligibilityReason, complaint: source.complaint === null ? null : complaint(source.complaint)! };
}

export function parseSubmitPostTripComplaintResponse(payload: unknown): SubmitPostTripComplaintResponse {
  const source = record(dataEnvelope(payload));
  const complaintId = source && id(source.complaintId); const bookingId = source && id(source.bookingId); const submittedAtUtc = source && date(source.submittedAtUtc); const responseDeadlineUtc = source && date(source.responseDeadlineUtc);
  if (!source || !complaintId || !bookingId || source.status !== 'AwaitingOperatorResponse' || !submittedAtUtc || !responseDeadlineUtc || typeof source.isReplay !== 'boolean') throw new Error('Invalid post-trip complaint response.');
  return { complaintId, bookingId, status: source.status, submittedAtUtc, responseDeadlineUtc, isReplay: source.isReplay };
}
