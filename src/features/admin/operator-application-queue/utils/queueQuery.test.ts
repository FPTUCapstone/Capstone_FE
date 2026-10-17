import { describe, expect, it } from 'vitest';

import { buildOperatorApplicationQueueHref, parseOperatorApplicationQueueQuery } from './queueQuery';

describe('parseOperatorApplicationQueueQuery', () => {
  it('defaults to page 1 with no keyword', () => {
    expect(parseOperatorApplicationQueueQuery(new URLSearchParams(''))).toEqual({ page: 1, keyword: '' });
  });

  it.each(['0', '-3', '1.5', 'abc', '', '9007199254740993'])('falls back to page 1 for page=%s', (page) => {
    expect(parseOperatorApplicationQueueQuery(new URLSearchParams({ page })).page).toBe(1);
  });

  it('reads a valid page and trims the keyword', () => {
    expect(parseOperatorApplicationQueueQuery(new URLSearchParams('page=3&q=%20Hoi%20An%20'))).toEqual({
      page: 3,
      keyword: 'Hoi An',
    });
  });

  it('caps the keyword at 100 characters', () => {
    const keyword = parseOperatorApplicationQueueQuery(new URLSearchParams({ q: 'a'.repeat(250) })).keyword;
    expect(keyword).toHaveLength(100);
  });
});

describe('buildOperatorApplicationQueueHref', () => {
  it('returns the bare route for the default state', () => {
    expect(buildOperatorApplicationQueueHref({ page: 1, keyword: '' }, false)).toBe('/admin/tour-operator-applications');
  });

  it('keeps page, keyword and the demo flag, and encodes the keyword', () => {
    expect(buildOperatorApplicationQueueHref({ page: 2, keyword: 'Hoi An & Co' }, true)).toBe(
      '/admin/tour-operator-applications?demo=1&page=2&q=Hoi+An+%26+Co',
    );
  });

  it('omits page 1 and an empty keyword', () => {
    expect(buildOperatorApplicationQueueHref({ page: 1, keyword: 'x' }, false)).toBe(
      '/admin/tour-operator-applications?q=x',
    );
  });
});
