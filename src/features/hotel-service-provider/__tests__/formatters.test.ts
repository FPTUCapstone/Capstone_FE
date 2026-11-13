import { describe, it, expect } from 'vitest';
import {
  formatVnd,
  formatDate,
  formatTime,
  formatDateTime,
  isDateInPast,
} from '../utils/formatters';

describe('TripMate Formatters & Date/Time Utilities', () => {
  describe('formatVnd (CR-08)', () => {
    it('formats numbers with thousands dot separators and trailing symbol', () => {
      expect(formatVnd(1850000)).toBe('1.850.000 ₫');
      expect(formatVnd(0)).toBe('0 ₫');
      expect(formatVnd(44400000)).toBe('44.400.000 ₫');
      expect(formatVnd(500)).toBe('500 ₫');
    });

    it('handles null, undefined and NaN gracefully', () => {
      expect(formatVnd(null)).toBe('0 ₫');
      expect(formatVnd(undefined)).toBe('0 ₫');
      expect(formatVnd(NaN)).toBe('0 ₫');
    });

    it('rounds decimal numbers to zero decimal places per CR-08', () => {
      expect(formatVnd(1850000.75)).toBe('1.850.001 ₫');
      expect(formatVnd(1850000.25)).toBe('1.850.000 ₫');
    });
  });

  describe('formatDate (CR-07)', () => {
    it('formats YYYY-MM-DD string to dd/MM/yyyy', () => {
      expect(formatDate('2026-12-15')).toBe('15/12/2026');
      expect(formatDate('2026-05-01')).toBe('01/05/2026');
    });

    it('formats ISO datetime string to dd/MM/yyyy in Asia/Ho_Chi_Minh timezone', () => {
      // 2026-11-13T17:30:00Z is 2026-11-14 00:30:00 in UTC+7
      expect(formatDate('2026-11-13T17:30:00Z')).toBe('14/11/2026');
      // 2026-11-13T14:15:00Z is 2026-11-13 21:15:00 in UTC+7
      expect(formatDate('2026-11-13T14:15:00Z')).toBe('13/11/2026');
    });

    it('handles empty/invalid input gracefully', () => {
      expect(formatDate('')).toBe('—');
      expect(formatDate(null)).toBe('—');
      expect(formatDate(undefined)).toBe('—');
      expect(formatDate('invalid-date')).toBe('—');
    });
  });

  describe('formatTime (CR-07)', () => {
    it('formats HH:mm string', () => {
      expect(formatTime('14:00')).toBe('14:00');
      expect(formatTime('09:30:00')).toBe('09:30');
    });

    it('formats ISO string to HH:mm in Asia/Ho_Chi_Minh', () => {
      // 2026-11-13T07:00:00Z is 14:00 in UTC+7
      expect(formatTime('2026-11-13T07:00:00Z')).toBe('14:00');
    });
  });

  describe('formatDateTime (CR-07)', () => {
    it('combines dd/MM/yyyy and HH:mm', () => {
      expect(formatDateTime('2026-11-13T07:15:00Z')).toBe('13/11/2026 14:15');
    });
  });

  describe('isDateInPast', () => {
    it('returns true for past dates', () => {
      expect(isDateInPast('2020-01-01')).toBe(true);
    });

    it('returns false for far future dates', () => {
      expect(isDateInPast('2099-12-31')).toBe(false);
    });
  });
});
