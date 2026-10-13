import { describe, expect, it } from 'vitest';
import { parseRouteId } from './routeIdValidator';

describe('parseRouteId', () => {
  it('parses valid positive integer strings as normalized strings', () => {
    expect(parseRouteId('1')).toBe('1');
    expect(parseRouteId('42')).toBe('42');
    expect(parseRouteId(' 100 ')).toBe('100');
  });

  it('accepts valid SQL Server BIGINT IDs beyond Number.MAX_SAFE_INTEGER as strings', () => {
    const beyondSafeInteger = String(Number.MAX_SAFE_INTEGER + 10);
    expect(parseRouteId(beyondSafeInteger)).toBe(beyondSafeInteger);
    expect(parseRouteId('9223372036854775807')).toBe('9223372036854775807');
  });

  it('rejects non-positive numbers and zero', () => {
    expect(parseRouteId('0')).toBeNull();
    expect(parseRouteId('-1')).toBeNull();
    expect(parseRouteId('-100')).toBeNull();
  });

  it('rejects floats and non-numeric strings', () => {
    expect(parseRouteId('1.5')).toBeNull();
    expect(parseRouteId('abc')).toBeNull();
    expect(parseRouteId('12a')).toBeNull();
    expect(parseRouteId('')).toBeNull();
    expect(parseRouteId('   ')).toBeNull();
  });

  it('rejects numbers exceeding SQL Server signed BIGINT max', () => {
    expect(parseRouteId('9223372036854775808')).toBeNull();
  });
});
