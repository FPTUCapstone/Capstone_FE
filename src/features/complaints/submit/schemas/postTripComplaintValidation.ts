import { COMPLAINT_CATEGORIES, type ComplaintCategory, type SubmitPostTripComplaintInput } from '../types/postTripComplaint';

export const MAX_EVIDENCE_FILES = 5;
export const MAX_EVIDENCE_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_EVIDENCE_TOTAL_BYTES = 30 * 1024 * 1024;
export const MAX_REASON_DETAIL_LENGTH = 2000;
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const ACCEPTED_EXTENSIONS = /\.(jpe?g|png|webp|pdf)$/i;

export type ComplaintValidationErrors = Partial<Record<'reasonCategory' | 'reasonDetail' | 'evidence', string>>;

export function isComplaintCategory(value: unknown): value is ComplaintCategory {
  return typeof value === 'string' && (COMPLAINT_CATEGORIES as readonly string[]).includes(value);
}

export function validateEvidenceAddition(existing: readonly Pick<File, 'size'>[], additions: readonly File[]): { accepted: File[]; error?: 'complaint.evidence_limit' | 'complaint.evidence_type' } {
  const accepted: File[] = [];
  let total = existing.reduce((sum, file) => sum + file.size, 0);
  for (const file of additions) {
    if ((!ACCEPTED_TYPES.has(file.type) && !ACCEPTED_EXTENSIONS.test(file.name)) || file.size > MAX_EVIDENCE_FILE_BYTES) {
      return { accepted, error: file.size > MAX_EVIDENCE_FILE_BYTES ? 'complaint.evidence_limit' : 'complaint.evidence_type' };
    }
    if (existing.length + accepted.length >= MAX_EVIDENCE_FILES || total + file.size > MAX_EVIDENCE_TOTAL_BYTES) {
      return { accepted, error: 'complaint.evidence_limit' };
    }
    accepted.push(file);
    total += file.size;
  }
  return { accepted };
}

export function validateComplaintInput(input: { reasonCategory: unknown; reasonDetail: string; evidence: readonly File[] }): ComplaintValidationErrors {
  const errors: ComplaintValidationErrors = {};
  if (!isComplaintCategory(input.reasonCategory)) errors.reasonCategory = 'requiredCategory';
  const detail = input.reasonDetail.trim();
  if (!detail) errors.reasonDetail = 'requiredDetail';
  else if (detail.length > MAX_REASON_DETAIL_LENGTH) errors.reasonDetail = 'detailTooLong';
  const evidence = validateEvidenceAddition([], input.evidence);
  if (evidence.accepted.length !== input.evidence.length || input.evidence.length > MAX_EVIDENCE_FILES) errors.evidence = evidence.error === 'complaint.evidence_type' ? 'evidenceType' : 'evidenceLimit';
  return errors;
}

export function normalizeComplaintInput(input: { reasonCategory: ComplaintCategory; reasonDetail: string; evidence: readonly File[] }): SubmitPostTripComplaintInput {
  return { reasonCategory: input.reasonCategory, reasonDetail: input.reasonDetail.trim(), evidence: [...input.evidence] };
}
