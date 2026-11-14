import { describe, expect, it } from 'vitest';
import { publicSearchCopy, resolveSearchLocale, resolveSearchText } from './publicSearch';

describe('public Search locale', () => {
  it('falls back per key without mutating either catalog or exposing missing keys', () => {
    const en = Object.freeze({ title: 'Search tours', retry: 'Retry' });
    const vi = Object.freeze({ title: 'Tìm tour' });
    expect(resolveSearchText('title', 'vi', en, vi)).toBe('Tìm tour');
    expect(resolveSearchText('title', 'en', en, vi)).toBe('Search tours');
    expect(resolveSearchText('retry', 'vi', en, vi)).toBe('Retry');
    expect(resolveSearchText('internalMissingKey', 'vi', en, vi)).toBe('—');
    expect(resolveSearchText('constructor', 'en', en, vi)).toBe('—');
    expect(vi).toEqual({ title: 'Tìm tour' });
    expect(en).toEqual({ title: 'Search tours', retry: 'Retry' });
  });
  it('uses browser language only when there is no valid saved selection', () => {
    expect(resolveSearchLocale(null, 'vi-VN')).toBe('vi');
    expect(resolveSearchLocale(null, 'en-US')).toBe('en');
    expect(resolveSearchLocale(null, 'fr-FR')).toBe('en');
    expect(resolveSearchLocale('en', 'vi-VN')).toBe('en');
    expect(resolveSearchLocale('vi', 'en-US')).toBe('vi');
  });

  it('renders matching resource shapes with a value for every key', () => {
    function compare(en: object, vi: object) {
      expect(Object.keys(vi).sort()).toEqual(Object.keys(en).sort());
      for (const [key, value] of Object.entries(en)) {
        const translated = (vi as Record<string, unknown>)[key];
        expect(typeof translated).toBe(typeof value);
        if (typeof translated === 'object' && translated && typeof value === 'object') {
          compare(value, translated);
        } else if (typeof translated === 'string') {
          expect(translated.trim()).not.toBe('');
          expect(translated).not.toBe(key);
        }
      }
    }
    compare(publicSearchCopy('en'), publicSearchCopy('vi'));
  });
});
