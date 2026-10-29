import { describe, expect, it } from 'vitest';

import { buildDevTourQuery, clearDevTourFilters, parseDevTourSearchState, validateDevTourFilters } from './devTourQuery';

describe('approved development Search V2 query', () => {
  it('preserves all canonical filters and mode in copied URLs', () => {
    const query = new URLSearchParams('keyword=quiet+beach&destination=Hoi+An&startDate=2027-01-01&endDate=2027-01-31&minPrice=0&maxPrice=500000&durationDays=2&category=SEA&minimumRating=4&sort=priceAsc&page=2&pageSize=5&mode=hybrid');
    expect(buildDevTourQuery(parseDevTourSearchState(query)).toString()).toBe(query.toString().replace('pageSize=5', 'pageSize=20'));
  });

  it('uses the approved fixed page size and clears filters without clearing keyword or mode', () => {
    const state = parseDevTourSearchState(new URLSearchParams('keyword=quiet+beach&destination=Hoi+An&startDate=2027-01-01&endDate=2027-01-31&minPrice=0&maxPrice=500000&durationDays=2&category=SEA&minimumRating=4&sort=priceAsc&page=2&pageSize=99&mode=hybrid'));
    expect(state.pageSize).toBe(20);
    expect(clearDevTourFilters(state)).toEqual({
      keyword: 'quiet beach', destination: '', startDate: '', endDate: '', minPrice: '', maxPrice: '',
      durationDays: '', category: '', minimumRating: '', sort: 'relevance', mode: 'hybrid', page: 1, pageSize: 20,
    });
  });

  it('defaults to lexical without interpreting legacy departureDate as a V2 range', () => {
    const state = parseDevTourSearchState(new URLSearchParams('departureDate=2027-01-01'));
    expect(state).toMatchObject({ mode: 'lexical', startDate: '', endDate: '', page: 1, pageSize: 20 });
    expect(buildDevTourQuery(state).has('departureDate')).toBe(false);
  });

  it.each([
    'startDate=2027-02-30', 'startDate=2027-02-01&endDate=2027-01-01',
    'minPrice=10&maxPrice=5', 'minPrice=-1', 'durationDays=1.5',
    'minimumRating=6', 'minimumRating=0', 'minPrice=10000000000', 'mode=unknown', 'page=1oops',
    `keyword=${'x'.repeat(301)}`,
  ])('rejects invalid filters before any request: %s', (query) => {
    expect(validateDevTourFilters(parseDevTourSearchState(new URLSearchParams(query)))).toBeTruthy();
  });
});
