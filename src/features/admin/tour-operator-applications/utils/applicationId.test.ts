import { describe, expect, it } from 'vitest';

import { parseApplicationId } from './applicationId';

describe('parseApplicationId', () => {
  it.each([
    ['1', 1],
    ['123', 123],
    [String(Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER],
  ])('accepts canonical positive safe integer %s', (value, expected) => {
    expect(parseApplicationId(value)).toBe(expected);
  });

  it.each([
    '',
    '0',
    '-1',
    '01',
    '1abc',
    '1.5',
    '1e3',
    ' 1',
    '1 ',
    String(Number.MAX_SAFE_INTEGER + 1),
    '999999999999999999999999999999',
  ])('rejects non-canonical or unsafe application ID %j', (value) => {
    expect(parseApplicationId(value)).toBeNull();
  });
});
