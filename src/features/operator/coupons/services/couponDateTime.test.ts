import { describe, expect, it } from 'vitest';
import { toVietnamDateTimeInput, vietnamDateTimeToUtc } from './couponDateTime';

describe('coupon Vietnam date-time', () => {
  it('converts UTC to Vietnam wall time and back', () => {
    expect(toVietnamDateTimeInput('2026-10-26T03:30:00Z')).toBe('2026-10-26T10:30');
    expect(vietnamDateTimeToUtc('2026-10-26T10:30')).toBe('2026-10-26T03:30:00.000Z');
  });

  it('rejects invalid local date-time rather than silently normalizing it', () => {
    expect(vietnamDateTimeToUtc('2026-02-30T10:30')).toBeNull();
  });
});
