import { describe, expect, it } from 'vitest';
import {
  formatCurrencyVND,
  formatVietnamDate,
  formatVietnamDateTime,
  VIETNAM_TIMEZONE,
} from './dateFormat';

describe('dateFormat utilities (CR-07)', () => {
  it('uses Asia/Ho_Chi_Minh timezone constant', () => {
    expect(VIETNAM_TIMEZONE).toBe('Asia/Ho_Chi_Minh');
  });

  it('formats dates in dd/MM/yyyy format under Asia/Ho_Chi_Minh', () => {
    // 2026-09-19T00:30:00Z is 2026-09-19 07:30:00 in Vietnam (UTC+7)
    const isoString = '2026-09-19T00:30:00Z';
    expect(formatVietnamDate(isoString)).toBe('19/09/2026');
  });

  it('correctly shifts date boundary across UTC and UTC+7', () => {
    // 2026-09-18T18:00:00Z is 2026-09-19 01:00:00 in Vietnam
    const isoString = '2026-09-18T18:00:00Z';
    expect(formatVietnamDate(isoString)).toBe('19/09/2026');
  });

  it('handles null, undefined, and empty string safely', () => {
    expect(formatVietnamDate(null)).toBe('-');
    expect(formatVietnamDate(undefined)).toBe('-');
    expect(formatVietnamDate('')).toBe('-');
  });

  it('formats datetime in dd/MM/yyyy, HH:mm format', () => {
    const isoString = '2026-09-19T01:15:00Z'; // 08:15 in Vietnam
    const formatted = formatVietnamDateTime(isoString);
    expect(formatted).toMatch(/19\/09\/2026/);
    expect(formatted).toMatch(/08:15/);
  });

  it('formats VND currency properly', () => {
    const formatted = formatCurrencyVND(1400000);
    expect(formatted).toMatch(/1\.400\.000/);
  });
});
