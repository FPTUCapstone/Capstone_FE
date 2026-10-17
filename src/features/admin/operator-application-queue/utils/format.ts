import { operatorApplicationQueueEn } from '../resources/en';

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Ho_Chi_Minh',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** CR-07: dd/MM/yyyy HH:mm in Asia/Ho_Chi_Minh; a missing or invalid instant is never replaced by a made-up date. */
export function formatSubmittedAt(isoUtc: string | null): string {
  if (!isoUtc) return operatorApplicationQueueEn.format.unavailable;
  const date = new Date(isoUtc);
  if (Number.isNaN(date.getTime())) return operatorApplicationQueueEn.format.unavailable;
  const parts = Object.fromEntries(dateTimeFormatter.formatToParts(date).map((part) => [part.type, part.value]));
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`;
}
