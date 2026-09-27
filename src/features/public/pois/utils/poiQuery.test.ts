import { describe, expect, it } from 'vitest';

import { buildPoiQuery, parsePoiSearchState, sanitizeProxyQuery } from './poiQuery';

describe('POI query helpers', () => {
  it('keeps only supported upstream query parameters', () => {
    const input = new URLSearchParams({
      search: ' Sơn Trà ',
      categoryId: '3',
      page: '2',
      accessToken: 'must-not-forward',
    });

    expect(sanitizeProxyQuery(input).toString()).toBe(
      'search=+S%C6%A1n+Tr%C3%A0+&categoryId=3&page=2',
    );
  });

  it('normalizes invalid URL state to safe public defaults', () => {
    const state = parsePoiSearchState(
      new URLSearchParams({
        search: '  Hội An  ',
        page: '-4',
        sort: 'unsupported',
        openNow: 'yes',
        categoryId: '0',
      }),
    );

    expect(state).toEqual({
      search: 'Hội An',
      categoryId: null,
      openNow: false,
      sort: 'name',
      page: 1,
    });
  });

  it('does not send distance sorting without a complete origin', () => {
    const query = buildPoiQuery(
      {
        search: '',
        categoryId: null,
        openNow: false,
        sort: 'distance',
        page: 1,
      },
      { latitude: 16.0544 },
    );

    expect(query.get('sort')).toBe('name');
    expect(query.has('originLatitude')).toBe(false);
    expect(query.has('originLongitude')).toBe(false);
  });

  it('includes a complete origin and optional distance radius', () => {
    const query = buildPoiQuery(
      {
        search: 'Biển',
        categoryId: 2,
        openNow: true,
        sort: 'distance',
        page: 3,
      },
      { latitude: 16.0544, longitude: 108.2022, maxDistanceKm: 10 },
    );

    expect(Object.fromEntries(query)).toMatchObject({
      search: 'Biển',
      categoryId: '2',
      openNow: 'true',
      sort: 'distance',
      page: '3',
      pageSize: '20',
      originLatitude: '16.054400',
      originLongitude: '108.202200',
      maxDistanceKm: '10',
    });
  });
});
