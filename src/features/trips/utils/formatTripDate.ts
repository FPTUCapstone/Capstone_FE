const VIETNAM_DAY = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Ho_Chi_Minh',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

/**
 * CR-07: every date is shown as dd/MM/yyyy in the Asia/Ho_Chi_Minh time zone. The backend sends UTC
 * instants, so the Vietnam calendar day can differ from the UTC day. An unreadable value gives an empty
 * string rather than "Invalid Date".
 */
export function formatTripDate(instant: string): string {
  const time = Date.parse(instant);
  if (!Number.isFinite(time)) return '';
  const parts = Object.fromEntries(
    VIETNAM_DAY.formatToParts(new Date(time)).map((part) => [part.type, part.value]),
  );
  return `${parts.day}/${parts.month}/${parts.year}`;
}

const VIETNAM_DATE_TIME = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Ho_Chi_Minh',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** `dd/MM/yyyy HH:mm` in Asia/Ho_Chi_Minh on a 24-hour clock; an unreadable value gives an empty string. */
export function formatTripDateTime(instant: string): string {
  const time = Date.parse(instant);
  if (!Number.isFinite(time)) return '';
  const parts = Object.fromEntries(
    VIETNAM_DATE_TIME.formatToParts(new Date(time)).map((part) => [part.type, part.value]),
  );
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`;
}

/** `HH:mm` in Asia/Ho_Chi_Minh on a 24-hour clock. */
export function formatTripTime(instant: string): string {
  const value = formatTripDateTime(instant);
  return value ? value.slice(11) : '';
}
