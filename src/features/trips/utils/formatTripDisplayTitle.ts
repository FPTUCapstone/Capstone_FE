import { formatTripDate } from './formatTripDate';

const GENERIC_GENERATED_TITLE_PATTERN = /^Generated itinerary(?:\s*-\s*.+)?$/i;

/**
 * Replaces raw backend boilerplate (`Generated itinerary - 26 Nov 2026`) with
 * a clean Vietnamese date title while keeping custom titles verbatim.
 */
export function formatTripDisplayTitle(title: string, departureAtUtc?: string): string {
  const trimmed = title.trim();
  if (trimmed.length > 0 && !GENERIC_GENERATED_TITLE_PATTERN.test(trimmed)) {
    return trimmed;
  }

  if (departureAtUtc) {
    const formatted = formatTripDate(departureAtUtc);
    if (formatted) {
      const [dd, mm] = formatted.split('/');
      if (dd && mm) {
        return `Lịch trình ${dd}/${mm}`;
      }
      return `Lịch trình ${formatted}`;
    }
  }

  return 'Lịch trình chưa đặt tên';
}
