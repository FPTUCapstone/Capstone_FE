/**
 * Currency and date formatting utilities for Tour Operator Finance workspace.
 * Enforces CR-07 (dd/MM/yyyy in Asia/Ho_Chi_Minh) and CR-08 (VND with thousands separators, no fractional decimals).
 */

const VIETNAM_TZ = 'Asia/Ho_Chi_Minh';

/**
 * Formats monetary amounts in Vietnamese Dong (VND) per CR-08.
 * e.g., 12500000 -> "12.500.000 ₫"
 */
export function formatVndCurrency(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0 ₫';
  }
  const rounded = Math.round(amount);
  const formattedNumber = new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0,
  }).format(rounded);
  return `${formattedNumber} ₫`;
}

/**
 * Formats date string into dd/MM/yyyy in Asia/Ho_Chi_Minh timezone per CR-07.
 */
export function formatFinanceDate(dateString?: string): string {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: VIETNAM_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  return formatter.format(d);
}

/**
 * Formats datetime string into HH:mm dd/MM/yyyy in Asia/Ho_Chi_Minh timezone per CR-07.
 */
export function formatFinanceDateTime(dateString?: string): string {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;

  const dateFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: VIETNAM_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: VIETNAM_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return `${timeFormatter.format(d)} ${dateFormatter.format(d)}`;
}

/**
 * Formats a Date object to YYYY-MM-DD string for HTML5 date inputs.
 */
export function formatDateToIsoInput(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
