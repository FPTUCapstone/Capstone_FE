/**
 * TripMate Formatters & Date/Time Utilities
 * Strictly compliant with CR-07 (dd/MM/yyyy in Asia/Ho_Chi_Minh) and CR-08 (VND currency).
 */

const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Format currency in VND with dots as thousand separators and trailing symbol (CR-08).
 * Example: 1850000 -> "1.850.000 ₫"
 */
export function formatVnd(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0 ₫';
  }
  const rounded = Math.round(amount);
  const parts = Math.abs(rounded).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const sign = rounded < 0 ? '-' : '';
  return `${sign}${parts} ₫`;
}

/**
 * Format date to dd/MM/yyyy in Asia/Ho_Chi_Minh (CR-07).
 * Accepts ISO string, Date object, or YYYY-MM-DD.
 */
export function formatDate(input: string | Date | null | undefined): string {
  if (!input) return '—';
  try {
    let date: Date;
    if (typeof input === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
        const [year, month, day] = input.split('-').map(Number);
        return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
      }
      date = new Date(input);
    } else {
      date = input;
    }
    if (isNaN(date.getTime())) return '—';

    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: VIETNAM_TIMEZONE,
    }).format(date);
  } catch {
    return '—';
  }
}

/**
 * Format time to HH:mm in Asia/Ho_Chi_Minh (CR-07).
 */
export function formatTime(input: string | Date | null | undefined): string {
  if (!input) return '—';
  try {
    if (typeof input === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(input)) {
      return input.substring(0, 5);
    }
    const date = typeof input === 'string' ? new Date(input) : input;
    if (isNaN(date.getTime())) return '—';

    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: VIETNAM_TIMEZONE,
    }).format(date);
  } catch {
    return '—';
  }
}

/**
 * Format datetime to dd/MM/yyyy HH:mm in Asia/Ho_Chi_Minh (CR-07).
 */
export function formatDateTime(input: string | Date | null | undefined): string {
  if (!input) return '—';
  try {
    const date = typeof input === 'string' ? new Date(input) : input;
    if (isNaN(date.getTime())) return '—';

    const formattedDate = formatDate(date);
    const formattedTime = formatTime(date);
    if (formattedDate === '—') return '—';
    return `${formattedDate} ${formattedTime}`;
  } catch {
    return '—';
  }
}

/**
 * Checks if a date string (YYYY-MM-DD or ISO) has already passed compared to current time in Vietnam.
 */
export function isDateInPast(dateString: string): boolean {
  if (!dateString) return false;
  try {
    const todayVN = new Intl.DateTimeFormat('en-CA', {
      timeZone: VIETNAM_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    const checkDate = dateString.substring(0, 10);
    return checkDate <= todayVN;
  } catch {
    return false;
  }
}
