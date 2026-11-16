import { isComplaintCategory } from '../schemas/postTripComplaintValidation';
import type { AmendPostTripComplaintEvidenceResponse, ExistingPostTripComplaint, MyPostTripComplaint, PostTripComplaintContext, SubmitPostTripComplaintResponse } from '../types/postTripComplaint';

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
    const evidenceId = item && id(item.evidenceId);
    if (!item || !evidenceId || typeof item.fileName !== 'string' || typeof item.contentType !== 'string' || typeof item.sizeBytes !== 'number' || !Number.isSafeInteger(item.sizeBytes) || item.sizeBytes < 0) return null;
    return { evidenceId, fileName: item.fileName, contentType: item.contentType, sizeBytes: item.sizeBytes };
  });
  return evidence.some((entry) => entry === null) ? null : { complaintId, status: source.status, reasonCategory: source.reasonCategory, reasonDetail: source.reasonDetail, submittedAtUtc, responseDeadlineUtc, evidence: evidence as ExistingPostTripComplaint['evidence'] };
}

export function parsePostTripComplaintContext(payload: unknown): PostTripComplaintContext {
  const source = record(dataEnvelope(payload));
  const bookingId = source && id(source.bookingId); const endAtUtc = source && date(source.endAtUtc); const submissionDeadlineUtc = source && date(source.submissionDeadlineUtc);
  if (!source || !bookingId || !endAtUtc || !submissionDeadlineUtc || typeof source.canSubmit !== 'boolean' || typeof source.canAmendEvidence !== 'boolean' || !(typeof source.ineligibilityReason === 'string' || source.ineligibilityReason === null) || !(source.complaint === null || complaint(source.complaint))) throw new Error('Invalid post-trip complaint context.');
  return { bookingId, bookingCode: textOrNull(source.bookingCode), tourTitle: textOrNull(source.tourTitle), endAtUtc, submissionDeadlineUtc, canSubmit: source.canSubmit, canAmendEvidence: source.canAmendEvidence, ineligibilityReason: source.ineligibilityReason, complaint: source.complaint === null ? null : complaint(source.complaint)! };
}

export function parseAmendPostTripComplaintEvidenceResponse(payload: unknown): AmendPostTripComplaintEvidenceResponse {
  const source = record(dataEnvelope(payload));
  const complaintId = source && id(source.complaintId); const evidenceAmendmentUsedAtUtc = source && date(source.evidenceAmendmentUsedAtUtc);
  if (!source || !complaintId || !evidenceAmendmentUsedAtUtc || typeof source.evidenceCount !== 'number' || !Number.isSafeInteger(source.evidenceCount) || source.evidenceCount < 1 || typeof source.evidenceTotalBytes !== 'number' || !Number.isSafeInteger(source.evidenceTotalBytes) || source.evidenceTotalBytes < 0 || typeof source.isReplay !== 'boolean') throw new Error('Invalid post-trip complaint evidence amendment response.');
  return { complaintId, evidenceAmendmentUsedAtUtc, evidenceCount: source.evidenceCount, evidenceTotalBytes: source.evidenceTotalBytes, isReplay: source.isReplay };
}

export function parseMyPostTripComplaints(payload: unknown): readonly MyPostTripComplaint[] {
  const source = dataEnvelope(payload);
  if (!Array.isArray(source)) throw new Error('Invalid post-trip complaints response.');
  const complaints = source.map((value) => {
    const item = record(value); const complaintId = item && id(item.complaintId); const bookingId = item && id(item.bookingId); const submittedAtUtc = item && date(item.submittedAtUtc); const responseDeadlineUtc = item && date(item.responseDeadlineUtc);
    if (!item || !complaintId || !bookingId || typeof item.bookingCode !== 'string' || typeof item.tourTitle !== 'string' || typeof item.status !== 'string' || !isComplaintCategory(item.reasonCategory) || !submittedAtUtc || !responseDeadlineUtc || typeof item.evidenceCount !== 'number' || !Number.isSafeInteger(item.evidenceCount) || item.evidenceCount < 0) return null;
    return { complaintId, bookingId, bookingCode: item.bookingCode, tourTitle: item.tourTitle, status: item.status, reasonCategory: item.reasonCategory, submittedAtUtc, responseDeadlineUtc, evidenceCount: item.evidenceCount };
  });
  if (complaints.some((item) => item === null)) throw new Error('Invalid post-trip complaints response.');
  return complaints as MyPostTripComplaint[];
}

export function parseSubmitPostTripComplaintResponse(payload: unknown): SubmitPostTripComplaintResponse {
  const source = record(dataEnvelope(payload));
  const complaintId = source && id(source.complaintId); const bookingId = source && id(source.bookingId); const submittedAtUtc = source && date(source.submittedAtUtc); const responseDeadlineUtc = source && date(source.responseDeadlineUtc);
  if (!source || !complaintId || !bookingId || source.status !== 'AwaitingOperatorResponse' || !submittedAtUtc || !responseDeadlineUtc || typeof source.isReplay !== 'boolean') throw new Error('Invalid post-trip complaint response.');
  return { complaintId, bookingId, status: source.status, submittedAtUtc, responseDeadlineUtc, isReplay: source.isReplay };
}
