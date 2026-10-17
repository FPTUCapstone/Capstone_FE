const DISPLAY_TIME_ZONE = 'Asia/Ho_Chi_Minh';

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: DISPLAY_TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/**
 * CR-07: dd/MM/yyyy HH:mm in Asia/Ho_Chi_Minh. Returns null for a missing or invalid value so
 * the caller can show an explicit "not available" label instead of a fabricated date.
 */
export function formatApplicationDateTime(value: string | null | undefined): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = Object.fromEntries(
    dateTimeFormatter.formatToParts(date).map((part) => [part.type, part.value]),
  );
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`;
}
