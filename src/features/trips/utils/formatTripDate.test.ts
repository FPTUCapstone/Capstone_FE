import { describe, expect, it } from 'vitest';

import { formatTripDate, formatTripDateTime, formatTripTime } from './formatTripDate';

describe('formatTripDate', () => {
  it('shows the Vietnam calendar day as dd/MM/yyyy', () => {
    expect(formatTripDate('2026-10-20T17:00:00+00:00')).toBe('21/10/2026');
    expect(formatTripDate('2026-10-20T16:59:59+00:00')).toBe('20/10/2026');
    expect(formatTripDate('2026-10-01T02:00:00+00:00')).toBe('01/10/2026');
  });

  it('is independent of the offset the instant is written with', () => {
    expect(formatTripDate('2026-10-21T00:00:00+07:00')).toBe('21/10/2026');
    expect(formatTripDate('2026-10-20T17:00:00Z')).toBe('21/10/2026');
  });

  it('zero-pads day and month', () => {
    expect(formatTripDate('2027-01-05T03:00:00+00:00')).toBe('05/01/2027');
  });

  it.each(['', 'not a date', '2026-13-45T00:00:00Z'])('returns an empty string for %j instead of "Invalid Date"', (value) => {
    expect(formatTripDate(value)).toBe('');
  });
});

describe('formatTripDateTime', () => {
  it('shows dd/MM/yyyy HH:mm in Vietnam time', () => {
    expect(formatTripDateTime('2026-10-20T17:00:00+00:00')).toBe('21/10/2026 00:00');
    expect(formatTripDateTime('2026-10-01T02:05:00+00:00')).toBe('01/10/2026 09:05');
    expect(formatTripDateTime('2026-10-01T16:59:00Z')).toBe('01/10/2026 23:59');
  });

  it('never uses a 12-hour clock or an "24:00" midnight', () => {
    expect(formatTripDateTime('2026-10-01T13:30:00+00:00')).toBe('01/10/2026 20:30');
    expect(formatTripDateTime('2026-10-01T17:00:00+00:00')).toBe('02/10/2026 00:00');
  });

  it.each(['', 'nope'])('returns an empty string for %j', (value) => {
    expect(formatTripDateTime(value)).toBe('');
  });
});

describe('formatTripTime', () => {
  it('shows HH:mm in Vietnam time on a 24-hour clock', () => {
    expect(formatTripTime('2026-10-01T02:05:00+00:00')).toBe('09:05');
    expect(formatTripTime('2026-10-01T17:00:00Z')).toBe('00:00');
  });

  it.each(['', 'nope'])('returns an empty string for %j', (value) => {
    expect(formatTripTime(value)).toBe('');
  });
});
