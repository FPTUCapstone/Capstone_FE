import { describe, expect, it } from 'vitest';

import {
  buildBackendTourQuery,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  formatDateDisplay,
  formatVndPrice,
  parseTourSearchState,
  sanitizeProxyQuery,
  toPublicUrlParams,
  validateTourFilters,
} from './tourQuery';

describe('tourQuery utils', () => {
  describe('parseTourSearchState', () => {
    it('uses defaults when query is empty', () => {
      const state = parseTourSearchState(new URLSearchParams());
      expect(state).toEqual({
        destination: '',
        departureDate: '',
        minPrice: '',
        maxPrice: '',
        page: DEFAULT_PAGE,
        pageSize: DEFAULT_PAGE_SIZE,
      });
    });

    it('parses valid query parameters', () => {
      const params = new URLSearchParams({
        destination: '  Hội An  ',
        departureDate: '2026-10-15',
        minPrice: '500000',
        maxPrice: '1500000',
        page: '2',
        pageSize: '10',
      });
      const state = parseTourSearchState(params);
      expect(state).toEqual({
        destination: 'Hội An',
        departureDate: '2026-10-15',
        minPrice: '500000',
        maxPrice: '1500000',
        page: 2,
        pageSize: 10,
      });
    });

    it('falls back to default page if page is invalid or <= 0', () => {
      const params = new URLSearchParams({ page: '-5', pageSize: 'abc' });
      const state = parseTourSearchState(params);
      expect(state.page).toBe(DEFAULT_PAGE);
      expect(state.pageSize).toBe(DEFAULT_PAGE_SIZE);
    });
  });

  describe('toPublicUrlParams', () => {
    it('serializes state to clean URLSearchParams without default page/pageSize', () => {
      const params = toPublicUrlParams({
        destination: 'Đà Nẵng',
        departureDate: '2026-10-15',
        minPrice: '500000',
        maxPrice: '1500000',
        page: 1,
        pageSize: 20,
      });
      expect(params.get('destination')).toBe('Đà Nẵng');
      expect(params.get('departureDate')).toBe('2026-10-15');
      expect(params.get('minPrice')).toBe('500000');
      expect(params.get('maxPrice')).toBe('1500000');
      expect(params.has('page')).toBe(false);
      expect(params.has('pageSize')).toBe(false);
    });

    it('includes page when > 1', () => {
      const params = toPublicUrlParams({
        destination: '',
        departureDate: '',
        minPrice: '',
        maxPrice: '',
        page: 3,
        pageSize: 10,
      });
      expect(params.get('page')).toBe('3');
      expect(params.get('pageSize')).toBe('10');
    });
  });

  describe('buildBackendTourQuery', () => {
    it('builds canonical backend query strictly with non-empty fields', () => {
      const query = buildBackendTourQuery({
        destination: 'Huế',
        departureDate: '2026-10-20',
        minPrice: '800000',
        maxPrice: '2000000',
        page: 2,
        pageSize: 20,
      });
      expect(query.get('destination')).toBe('Huế');
      expect(query.get('departureDate')).toBe('2026-10-20');
      expect(query.get('minPrice')).toBe('800000');
      expect(query.get('maxPrice')).toBe('2000000');
      expect(query.get('page')).toBe('2');
      expect(query.get('pageSize')).toBe('20');
    });

    it('omits empty optional filters', () => {
      const query = buildBackendTourQuery({
        destination: '   ',
        departureDate: '',
        minPrice: '',
        maxPrice: '',
        page: 1,
        pageSize: 20,
      });
      expect(query.has('destination')).toBe(false);
      expect(query.has('departureDate')).toBe(false);
      expect(query.has('minPrice')).toBe(false);
      expect(query.has('maxPrice')).toBe(false);
      expect(query.get('page')).toBe('1');
      expect(query.get('pageSize')).toBe('20');
    });
  });

  describe('sanitizeProxyQuery', () => {
    it('keeps only supported backend keys and removes malicious or unsupported params', () => {
      const incoming = new URLSearchParams({
        destination: 'Hội An',
        unsupported: 'xyz',
        page: '1',
        sort: 'price',
      });
      const sanitized = sanitizeProxyQuery(incoming);
      expect(sanitized.get('destination')).toBe('Hội An');
      expect(sanitized.get('page')).toBe('1');
      expect(sanitized.has('unsupported')).toBe(false);
      expect(sanitized.has('sort')).toBe(false);
    });
  });

  describe('validateTourFilters', () => {
    it('accepts valid filters', () => {
      const result = validateTourFilters({
        destination: 'Đà Nẵng',
        departureDate: '2026-10-15',
        minPrice: '500000',
        maxPrice: '1500000',
        page: 1,
        pageSize: 20,
      });
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('rejects destination longer than 300 characters', () => {
      const result = validateTourFilters({
        destination: 'A'.repeat(301),
        departureDate: '',
        minPrice: '',
        maxPrice: '',
        page: 1,
        pageSize: 20,
      });
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('300');
    });

    it('rejects minPrice greater than maxPrice (BR-53)', () => {
      const result = validateTourFilters({
        destination: '',
        departureDate: '',
        minPrice: '2000000',
        maxPrice: '1000000',
        page: 1,
        pageSize: 20,
      });
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('Giá tối thiểu không được lớn hơn giá tối đa');
    });

    it('rejects invalid departure date format', () => {
      const result = validateTourFilters({
        destination: '',
        departureDate: '15-10-2026',
        minPrice: '',
        maxPrice: '',
        page: 1,
        pageSize: 20,
      });
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('YYYY-MM-DD');
    });
  });

  describe('formatVndPrice & formatDateDisplay', () => {
    it('formats price in VND correctly', () => {
      const formatted = formatVndPrice(800000);
      expect(formatted).toContain('800.000');
      expect(formatted).toContain('₫');
    });

    it('formats valid date correctly', () => {
      const formatted = formatDateDisplay('2026-10-15T07:30:00Z');
      expect(formatted).toMatch(/15\/10\/2026/);
    });

    it('handles null date gracefully', () => {
      expect(formatDateDisplay(null)).toBe('Liên hệ');
    });
  });
});
