export function complaintDate(value: string | null | undefined): string {
  if (!value || Number.isNaN(Date.parse(value))) return '—';
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value));
}
export const complaintMoney = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)} ₫`;
export const panelClass = 'rounded-2xl border border-border bg-surface p-5';
export const inputClass = 'w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-60';
export async function readComplaintResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(response.status === 401 ? 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.' : response.status === 403 ? 'Chức năng này chỉ dành cho Staff.' : body?.title ?? 'Chưa thể tải hồ sơ. Vui lòng thử lại.');
  if (!body) throw new Error('Dữ liệu chưa sẵn sàng. Vui lòng thử lại.');
  return body as T;
}
