/** Reorder a year-first calendar date without parsing or shifting its day. */
export function formatDisplayDate(value: string): string {
  const match = /^(\d{4})([-/])(\d{2})\2(\d{2})$/.exec(value);
  return match ? `${match[4]}/${match[3]}/${match[1]}` : value;
}

/** Preserve the UTC clock, milliseconds and Z suffix of the existing audit display. */
export function formatDisplayUtcTimestamp(value: Date): string {
  const iso = value.toISOString();
  return `${formatDisplayDate(iso.slice(0, 10))} ${iso.slice(11)}`;
}
