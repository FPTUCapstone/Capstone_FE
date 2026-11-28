import { CHANNEL_STATUSES, type ChannelCredentials, type ChannelPage, type PaymentChannel } from './paymentChannel';

const messages: Record<string, string> = {
  'payment_channel.verification_failed': 'Chưa thể xác minh kết nối payOS. Kiểm tra thông tin kênh rồi thử lại.',
  'payment_channel.credentials_missing': 'Vui lòng lưu đủ thông tin kết nối trước khi kiểm tra.',
  'payment_channel.version_conflict': 'Kênh đã thay đổi. Hãy tải lại danh sách và kiểm tra trước khi quyết định.',
  'payment_channel.invalid_state': 'Trạng thái kênh đã thay đổi hoặc không cho phép thao tác này. Vui lòng tải lại.',
  'payment_channel.validation_failed': 'Thông tin chưa hợp lệ. Kiểm tra các trường và lý do thao tác.',
  'payment_channel.not_found': 'Không tìm thấy kênh thanh toán.',
};
export class PaymentChannelError extends Error {
  constructor(public readonly status: number, public readonly errorCode?: string) {
    super(status === 401 ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' : status === 403 ? 'Bạn không có quyền thực hiện thao tác này.' : messages[errorCode ?? ''] ?? 'Chưa thể xử lý kênh thanh toán. Vui lòng thử lại.');
  }
}
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try { response = await fetch(url, { ...init, cache: 'no-store', credentials: 'same-origin' }); }
  catch (error) { if (error instanceof DOMException && error.name === 'AbortError') throw error; throw new PaymentChannelError(503); }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new PaymentChannelError(response.status, data?.errorCode);
  if (!data || typeof data !== 'object') throw new PaymentChannelError(502);
  return data as T;
}
async function channelRequest(url: string, init?: RequestInit): Promise<PaymentChannel> {
  const data = await request<PaymentChannel>(url, init);
  if (!CHANNEL_STATUSES.includes(data.status) || !Array.isArray(data.allowedActions)) throw new PaymentChannelError(502);
  return data;
}
const operatorBase = '/api/operator/payment-channel';
const adminBase = '/api/admin/operator-payment-channels';
export const getChannel = (signal?: AbortSignal) => channelRequest(operatorBase, { signal });
export const submitChannel = (body: ChannelCredentials) => channelRequest(operatorBase, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
export const verifyChannel = () => channelRequest(`${operatorBase}/verify`, { method: 'POST' });
export async function listChannels(status = '', page = 1, signal?: AbortSignal): Promise<ChannelPage> {
  const query = new URLSearchParams({ page: String(page), pageSize: '20' });
  if (status) query.set('status', status);
  const data = await request<ChannelPage>(`${adminBase}?${query}`, { signal });
  if (!Array.isArray(data.items) || !Number.isInteger(data.totalCount) || !Number.isInteger(data.page) || !Number.isInteger(data.pageSize) || data.pageSize <= 0) throw new PaymentChannelError(502);
  return data;
}
export const decideChannel = (id: number, action: 'approve' | 'disable', body: { operationId: string; expectedVersion: number; reason: string }) => channelRequest(`${adminBase}/${id}/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
