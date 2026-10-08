import { describe, expect, it } from 'vitest';

import { formatApplicationDateTime } from './format';

describe('CR-07 application date-time formatting', () => {
  it('formats UTC timestamps as dd/MM/yyyy HH:mm in Asia/Ho_Chi_Minh', () => {
    expect(formatApplicationDateTime('2026-10-01T17:05:00Z')).toBe('02/10/2026 00:05');
    expect(formatApplicationDateTime('2026-09-09T08:10:00Z')).toBe('09/09/2026 15:10');
  });

  it('crosses the year boundary in the display time zone', () => {
    expect(formatApplicationDateTime('2025-12-31T17:30:00Z')).toBe('01/01/2026 00:30');
    expect(formatApplicationDateTime('2025-12-31T16:59:00Z')).toBe('31/12/2025 23:59');
  });

  it('respects an explicit offset in the source value', () => {
    expect(formatApplicationDateTime('2026-09-09T15:10:00+07:00')).toBe('09/09/2026 15:10');
  });

  it('returns null for missing or invalid values instead of fabricating a date', () => {
    expect(formatApplicationDateTime(null)).toBeNull();
    expect(formatApplicationDateTime(undefined)).toBeNull();
    expect(formatApplicationDateTime('')).toBeNull();
    expect(formatApplicationDateTime('not-a-date')).toBeNull();
  });
});
