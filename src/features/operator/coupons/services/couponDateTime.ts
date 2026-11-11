const vietnamTimeZone = 'Asia/Ho_Chi_Minh';

export function toVietnamDateTimeInput(instant: string): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: vietnamTimeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(instant));
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`;
}

export function vietnamDateTimeToUtc(local: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return null;
  const instant = new Date(`${local}:00+07:00`);
  if (!Number.isFinite(instant.getTime()) || toVietnamDateTimeInput(instant.toISOString()) !== local) return null;
  return instant.toISOString();
}
