export type CommissionPayment = { paymentId: number; provider: 'Mock' | 'PayOS'; status: string; checkoutUrl: string | null; expiresAtUtc: string | null; canCompleteMock: boolean };
export type CommissionCalculation = { grossRevenueVnd: number; completedRefundsVnd: number; revenueCommissionVnd: number; refundCommissionCreditVnd: number; creditBroughtForwardVnd: number; creditAppliedVnd: number; creditCarriedForwardVnd: number; heldBookingCount: number; ambiguousLegacyBookingCount: number };
export type CommissionStatement = { id: number; statementCode?: string; tourOperatorUserId?: number; period: string; eligibleBaseVnd: number; commissionRateSnapshot: number; commissionAmountVnd: number; status: string; issuedAtUtc?: string; dueAtUtc?: string | null; paidAtUtc?: string | null; paidAmountVnd?: number; allowedActions: string[]; payment?: CommissionPayment | null; calculation?: CommissionCalculation | null };
export type CommissionPage = { items: CommissionStatement[]; totalCount: number; pageNumber: number; pageSize: number };
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
export const unwrapCommission = (v: unknown) => record(v) && 'data' in v ? v.data : v;
export function readStatement(value: unknown): CommissionStatement {
  const v = unwrapCommission(value);
  if (!record(v) || !Number.isSafeInteger(v.id) || Number(v.id) <= 0 || typeof v.period !== 'string' || typeof v.status !== 'string' ||
    !Number.isSafeInteger(v.commissionAmountVnd) || Number(v.commissionAmountVnd) < 0 || !Number.isSafeInteger(v.eligibleBaseVnd) ||
    typeof v.commissionRateSnapshot !== 'number' || !Number.isFinite(v.commissionRateSnapshot) || !Array.isArray(v.allowedActions)) throw new Error('Dữ liệu đối soát chưa hợp lệ. Vui lòng tải lại.');
  if (v.payment != null && (!record(v.payment) || !Number.isSafeInteger(v.payment.paymentId) || !['Mock', 'PayOS'].includes(String(v.payment.provider)) || typeof v.payment.canCompleteMock !== 'boolean')) throw new Error('Dữ liệu thanh toán chưa hợp lệ.');
  if (v.calculation != null && (!record(v.calculation) || ['grossRevenueVnd', 'completedRefundsVnd', 'revenueCommissionVnd', 'refundCommissionCreditVnd', 'creditBroughtForwardVnd', 'creditAppliedVnd', 'creditCarriedForwardVnd', 'heldBookingCount', 'ambiguousLegacyBookingCount'].some(key => !Number.isSafeInteger((v.calculation as Record<string, unknown>)[key]) || Number((v.calculation as Record<string, unknown>)[key]) < 0))) throw new Error('Dữ liệu tính hoa hồng chưa hợp lệ.');
  return v as CommissionStatement;
}
export function readStatementPage(value: unknown): CommissionPage {
  const v = unwrapCommission(value);
  if (!record(v) || !Array.isArray(v.items) || !Number.isSafeInteger(v.totalCount) || !Number.isSafeInteger(v.pageNumber) || !Number.isSafeInteger(v.pageSize)) throw new Error('Chưa thể đọc danh sách đối soát. Vui lòng tải lại.');
  return { items: v.items.map(readStatement), totalCount: Number(v.totalCount), pageNumber: Number(v.pageNumber), pageSize: Number(v.pageSize) };
}
export function safePayOsCheckout(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password && (url.hostname === 'payos.vn' || url.hostname.endsWith('.payos.vn')); } catch { return false; }
}
export const commissionMoney = (n: number) => `${new Intl.NumberFormat('vi-VN').format(n)} ₫`;
export function commissionDate(value?: string | null) { const date = value ? new Date(value) : null; return date && Number.isFinite(date.getTime()) ? date.toLocaleDateString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh' }) : '—'; }
export const commissionPeriod = (value: string) => /^\d{4}-\d{2}$/.test(value) ? `${value.slice(5)}/${value.slice(0, 4)}` : value;
export const commissionStatus = (value: string) => ({ Issued: 'Chưa thanh toán', Overdue: 'Quá hạn', Paid: 'Đã thanh toán', Cancelled: 'Đã hủy', PaymentReported: 'Chờ xác nhận' } as Record<string, string>)[value] ?? value;
export const commissionStatusClass = (value: string) => value === 'Paid' ? 'bg-emerald-50 text-emerald-800' : value === 'Overdue' ? 'bg-rose-50 text-rose-800' : 'bg-amber-50 text-amber-800';
export async function readCommissionResponse(response: Response) {
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const code = record(body) ? body.errorCode : null;
    throw new Error(code === 'commission.payment_in_progress' ? 'Liên kết đang được tạo. Vui lòng tải lại sau ít phút.' : response.status === 401 ? 'Phiên đăng nhập đã hết hạn.' : response.status === 403 ? 'Bạn không có quyền thực hiện thao tác này.' : response.status === 409 ? 'Thông tin thanh toán đã thay đổi. Vui lòng tải lại.' : 'Chưa thể xử lý đối soát. Vui lòng thử lại.');
  }
  return unwrapCommission(body);
}

export function commissionDateTime(value?: string | null) { const date = value ? new Date(value) : null; return date && Number.isFinite(date.getTime()) ? `${commissionDate(value)} ${new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date)}` : '—'; }
