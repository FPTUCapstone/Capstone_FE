/**
 * Price display shared by the itinerary and the POI detail (Review 2, D1). The API derives `costKind`
 * from the category: `AverageSpend` for food, `AdmissionTicket` otherwise.
 */

export type CostKind = 'AdmissionTicket' | 'AverageSpend';

export const COST_KINDS: readonly CostKind[] = ['AdmissionTicket', 'AverageSpend'];

const vnd = new Intl.NumberFormat('vi-VN');

export function formatVnd(amount: number): string {
  return `${vnd.format(Math.round(amount))} VNĐ`;
}

/** null → unknown, 0 → free, food → average spend, everything else → ticket; always per person. */
export function formatPriceLabel(
  estimatedCost: number | null | undefined,
  costKind: CostKind | null | undefined,
): string {
  if (estimatedCost === null || estimatedCost === undefined) return 'Chưa có thông tin';
  if (estimatedCost <= 0) return 'Miễn phí';
  const prefix = costKind === 'AverageSpend' ? 'Mức chi tiêu dự kiến' : 'Giá vé dự kiến';
  return `${prefix}: ${formatVnd(estimatedCost)}/người`;
}
