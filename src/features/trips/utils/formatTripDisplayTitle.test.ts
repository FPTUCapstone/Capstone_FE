import { describe, expect, it } from 'vitest';
import { formatTripDisplayTitle } from './formatTripDisplayTitle';

describe('formatTripDisplayTitle', () => {
  it('replaces raw backend Generated itinerary boilerplate with a Vietnamese date title', () => {
    expect(
      formatTripDisplayTitle('Generated itinerary - 26 Nov 2026', '2026-11-26T01:00:00+00:00'),
    ).toBe('Lịch trình 26/11');
  });

  it('keeps custom itinerary titles verbatim', () => {
    expect(formatTripDisplayTitle('Da Nang 2 days', '2026-09-20T01:00:00+00:00')).toBe(
      'Da Nang 2 days',
    );
  });

  it('falls back cleanly when title is blank and date is omitted', () => {
    expect(formatTripDisplayTitle('   ')).toBe('Lịch trình chưa đặt tên');
  });
});
