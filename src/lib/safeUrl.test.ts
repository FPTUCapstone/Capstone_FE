import { describe, expect, it } from 'vitest';

import { safeHttpsUrl } from './safeUrl';

describe('safeHttpsUrl', () => {
  it('keeps absolute https URLs', () => {
    expect(safeHttpsUrl('https://www.tripadvisor.com/Attraction_Review-42')).toBe(
      'https://www.tripadvisor.com/Attraction_Review-42',
    );
  });

  it('drops anything that is not an absolute https URL', () => {
    expect(safeHttpsUrl('javascript:alert(1)')).toBeNull();
    expect(safeHttpsUrl('http://www.tripadvisor.com/x')).toBeNull();
    expect(safeHttpsUrl('//evil.example/x')).toBeNull();
    expect(safeHttpsUrl('not a url')).toBeNull();
    expect(safeHttpsUrl(null)).toBeNull();
    expect(safeHttpsUrl(undefined)).toBeNull();
  });
});
