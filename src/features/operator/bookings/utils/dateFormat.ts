/**
 * Date and currency formatting utilities adhering to CR-07:
 * - Timezone: Asia/Ho_Chi_Minh
 * - Format: dd/MM/yyyy
 */

export const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

export function formatVietnamDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);

    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: VIETNAM_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    return formatter.format(d);
  } catch {
    return String(dateInput);
  }
}

export function formatVietnamDateTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);

    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: VIETNAM_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return formatter.format(d);
  } catch {
    return String(dateInput);
  }
}

export function formatCurrencyVND(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}
