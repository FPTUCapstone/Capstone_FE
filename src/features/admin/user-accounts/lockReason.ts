import { adminUserAccountsEn } from './resources/en';

export const MAX_LOCK_REASON_LENGTH = 200;

export type LockReasonIssue = 'missing' | 'tooLong';

const OTHER_CATEGORY: string = adminUserAccountsEn.moderation.lock.otherCategory;
const CATEGORY_SEPARATOR = ': ';

function isOther(category: string): boolean {
  return category === OTHER_CATEGORY;
}

/**
 * Builds the single `reason` string sent to the lock API:
 * "<Category>: <note>", "<Category>" when the note is blank, or just "<note>" for Other.
 */
export function composeLockReason(category: string, note: string): string {
  const trimmedNote = note.trim();

  if (isOther(category)) {
    return trimmedNote;
  }

  return trimmedNote ? `${category}${CATEGORY_SEPARATOR}${trimmedNote}` : category;
}

export function lockReasonIssue(category: string, note: string): LockReasonIssue | null {
  if (!category || (isOther(category) && !note.trim())) {
    return 'missing';
  }

  return composeLockReason(category, note).length > MAX_LOCK_REASON_LENGTH ? 'tooLong' : null;
}

/** Max note length that still keeps the composed reason within the limit. */
export function lockNoteMaxLength(category: string): number {
  if (!category || isOther(category)) {
    return MAX_LOCK_REASON_LENGTH;
  }

  return Math.max(0, MAX_LOCK_REASON_LENGTH - category.length - CATEGORY_SEPARATOR.length);
}
