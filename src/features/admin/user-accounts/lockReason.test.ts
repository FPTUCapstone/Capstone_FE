import { describe, expect, it } from 'vitest';
import { adminUserAccountsEn } from './resources/en';
import {
  composeLockReason,
  lockNoteMaxLength,
  lockReasonIssue,
  MAX_LOCK_REASON_LENGTH,
} from './lockReason';

const cat1 = adminUserAccountsEn.moderation.lock.reasonCategories[0];
const other = adminUserAccountsEn.moderation.lock.otherCategory;

describe('lockReason', () => {
  it('exposes the 200 character limit', () => {
    expect(MAX_LOCK_REASON_LENGTH).toBe(200);
  });

  it('keeps Other as the last predefined category', () => {
    const categories = adminUserAccountsEn.moderation.lock.reasonCategories;
    expect(categories[categories.length - 1]).toBe(other);
  });

  describe('composeLockReason', () => {
    it('joins category and trimmed note with a colon', () => {
      expect(
        composeLockReason('Payment fraud or irregular chargebacks', '  chargeback x3  '),
      ).toBe('Payment fraud or irregular chargebacks: chargeback x3');
    });

    it('returns only the category when the note is blank', () => {
      expect(composeLockReason(cat1, '   ')).toBe(cat1);
    });

    it('returns only the trimmed note for Other', () => {
      expect(composeLockReason(other, ' spam ')).toBe('spam');
    });
  });

  describe('lockReasonIssue', () => {
    it('reports missing when no category is selected', () => {
      expect(lockReasonIssue('', 'x')).toBe('missing');
    });

    it('reports missing when Other has a blank note', () => {
      expect(lockReasonIssue(other, '   ')).toBe('missing');
    });

    it('accepts a category with no note', () => {
      expect(lockReasonIssue(cat1, '')).toBeNull();
    });

    it('reports tooLong when the composed reason exceeds 200 characters', () => {
      expect(lockReasonIssue(cat1, 'x'.repeat(200))).toBe('tooLong');
    });

    it('accepts exactly 200 characters for Other and rejects 201', () => {
      expect(lockReasonIssue(other, 'x'.repeat(200))).toBeNull();
      expect(lockReasonIssue(other, 'x'.repeat(201))).toBe('tooLong');
    });
  });

  describe('lockNoteMaxLength', () => {
    it('is 200 for Other or no category', () => {
      expect(lockNoteMaxLength(other)).toBe(200);
      expect(lockNoteMaxLength('')).toBe(200);
    });

    it('subtracts the category prefix length for predefined categories', () => {
      expect(lockNoteMaxLength(cat1)).toBe(200 - cat1.length - 2);
    });
  });
});
