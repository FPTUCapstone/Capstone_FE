import { describe, expect, it } from 'vitest';
import { escapeCsvCell, toCsvRow } from './csv';

describe('CSV serialization', () => {
  it.each([
    ['plain', 'plain'],
    ['with,comma', '"with,comma"'],
    ['with "quote"', '"with ""quote"""'],
    ['line\r\nbreak', '"line\r\nbreak"'],
    ['Đà Nẵng', 'Đà Nẵng'],
    ['', ''],
    [null, ''],
    [undefined, ''],
  ])('escapes %j as a valid CSV cell', (value, expected) => {
    expect(escapeCsvCell(value)).toBe(expected);
  });

  it.each(['=HYPERLINK("https://attacker.example")', '+cmd', '-2+3', '@SUM(A1:A2)', ' \t=1+1', '\u0000@evil']) (
    'neutralizes spreadsheet formula payload %j',
    (value) => {
      const escaped = escapeCsvCell(value);
      const decoded = escaped.startsWith('"')
        ? escaped.slice(1, -1).replaceAll('""', '"')
        : escaped;
      expect(decoded).toMatch(/^'/);
    }
  );

  it('keeps legitimate financial numbers numeric and does not double-escape', () => {
    expect(toCsvRow(['Tour', 14_000_000, -250_000])).toBe("Tour,14000000,-250000");
    expect(escapeCsvCell('already "quoted"')).toBe('"already ""quoted"""');
  });
});
