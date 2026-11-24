import { describe, expect, it } from 'vitest';

import { formatDisplayDate, formatDisplayUtcTimestamp } from '../displayDate';

describe('reordering numeric display dates', () => {
  it('reorders ISO calendar dates without converting the timezone', () => {
    expect(formatDisplayDate('2026-01-08')).toBe('08/01/2026');
    expect(formatDisplayDate('2026-12-31')).toBe('31/12/2026');
    expect(formatDisplayDate('2026/01/08')).toBe('08/01/2026');
  });

  it('leaves already-correct and named-month content unchanged', () => {
    expect(formatDisplayDate('08/01/2026')).toBe('08/01/2026');
    expect(formatDisplayDate('8 Jan 2026')).toBe('8 Jan 2026');
    expect(formatDisplayDate('')).toBe('');
  });

  it('preserves the complete UTC clock including milliseconds', () => {
    expect(formatDisplayUtcTimestamp(new Date('2026-12-31T23:05:06.123Z')))
      .toBe('31/12/2026 23:05:06.123Z');
  });
});
