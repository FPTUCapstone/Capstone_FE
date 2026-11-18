export const invalidAccountDateRange = 'The selected date range is invalid. The start date must be on or before the end date.';

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000-')) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function isAccountDateRangeValid(from: string, to: string): boolean {
  return (!from || (from !== '0001-01-01' && isCalendarDate(from)))
    && (!to || isCalendarDate(to)) && (!from || !to || from <= to);
}
