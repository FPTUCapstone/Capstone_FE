import { describe, expect, it } from 'vitest';

import { operatorApplicationQueueEn } from '../resources/en';
import { formatSubmittedAt } from './format';

describe('formatSubmittedAt (CR-07)', () => {
  it('formats a UTC instant as dd/MM/yyyy HH:mm in Asia/Ho_Chi_Minh', () => {
    expect(formatSubmittedAt('2026-10-08T17:30:00Z')).toBe('09/10/2026 00:30');
  });

  it.each([null, '', 'not-a-date'])('shows "Not available" for %s instead of inventing a date', (value) => {
    expect(formatSubmittedAt(value)).toBe(operatorApplicationQueueEn.format.unavailable);
  });
});
