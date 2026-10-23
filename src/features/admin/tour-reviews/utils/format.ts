import { tourModerationEn } from '../resources/en';

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

const amountFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

function zonedParts(isoUtc: string): Record<string, string> | null {
  const date = new Date(isoUtc);
  if (Number.isNaN(date.getTime())) return null;
  return Object.fromEntries(
    dateTimeFormatter.formatToParts(date).map((part) => [part.type, part.value]),
  );
}

/** CR-07: dd/MM/yyyy in Asia/Ho_Chi_Minh. */
export function formatDisplayDate(isoUtc: string): string {
  const parts = zonedParts(isoUtc);
  return parts ? `${parts.day}/${parts.month}/${parts.year}` : tourModerationEn.format.unavailable;
}

/** CR-07: HH:mm (24-hour) in Asia/Ho_Chi_Minh. */
export function formatDisplayTime(isoUtc: string): string {
  const parts = zonedParts(isoUtc);
  return parts ? `${parts.hour}:${parts.minute}` : tourModerationEn.format.unavailable;
}

/** CR-07: dd/MM/yyyy HH:mm in Asia/Ho_Chi_Minh. */
export function formatDisplayDateTime(isoUtc: string): string {
  const parts = zonedParts(isoUtc);
  return parts
    ? `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`
    : tourModerationEn.format.unavailable;
}

/** CR-08: whole Vietnamese dong with a thousands separator and no decimal places. */
export function formatVnd(amount: number): string {
  if (!Number.isFinite(amount)) return tourModerationEn.format.unavailable;
  return tourModerationEn.format.currency(amountFormatter.format(Math.round(amount)));
}
