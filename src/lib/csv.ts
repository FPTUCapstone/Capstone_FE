export type CsvCell = string | number | boolean | null | undefined;

const SPREADSHEET_FORMULA_PREFIX = /^[\u0000-\u0020\u007f-\u009f]*[=+\-@]/;

/**
 * Serializes one untrusted value as an RFC 4180-compatible CSV cell.
 * Text that spreadsheet applications could interpret as a formula is prefixed
 * with an apostrophe before CSV quoting. Numeric values stay numeric so
 * legitimate financial amounts are not converted to text.
 */
export function escapeCsvCell(value: CsvCell): string {
  if (value === null || value === undefined) return '';

  let text = String(value);
  if (typeof value === 'string' && SPREADSHEET_FORMULA_PREFIX.test(text)) {
    text = `'${text}`;
  }

  if (/[",\r\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

export function toCsvRow(values: readonly CsvCell[]): string {
  return values.map(escapeCsvCell).join(',');
}
