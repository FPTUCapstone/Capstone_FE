import { describe, expect, it } from 'vitest';
import { validateComplaintInput, validateEvidenceAddition } from './postTripComplaintValidation';

const file = (name: string, type: string, size = 10) => new File([new Uint8Array(size)], name, { type });

describe('post-trip complaint validation', () => {
  it('requires category and non-blank detail', () => {
    expect(validateComplaintInput({ reasonCategory: '', reasonDetail: '   ', evidence: [] })).toEqual({ reasonCategory: 'requiredCategory', reasonDetail: 'requiredDetail' });
  });
  it('rejects unsupported evidence while retaining accepted additions', () => {
    const result = validateEvidenceAddition([], [file('proof.pdf', 'application/pdf'), file('bad.exe', 'application/octet-stream')]);
    expect(result.accepted.map((item) => item.name)).toEqual(['proof.pdf']);
    expect(result.error).toBe('complaint.evidence_type');
  });
  it('enforces a 2,000 character detail limit', () => {
    expect(validateComplaintInput({ reasonCategory: 'Other', reasonDetail: 'x'.repeat(2001), evidence: [] }).reasonDetail).toBe('detailTooLong');
  });
});
