export const CHANNEL_STATUSES = ['NotConnected', 'PendingVerification', 'Ready', 'ConnectionError', 'Disabled'] as const;
export type ChannelStatus = typeof CHANNEL_STATUSES[number];
export interface PaymentChannel {
  channelId: number | null;
  status: ChannelStatus;
  channelVersion: number | null;
  beneficiaryAccountNumberMasked: string | null;
  beneficiaryAccountName: string | null;
  beneficiaryBankCode: string | null;
  webhookRegisteredAt: string | null;
  connectedAt: string | null;
  lastVerifiedAt: string | null;
  allowedActions: string[];
}
export interface ChannelCredentials {
  clientId: string;
  apiKey: string;
  checksumKey: string;
  beneficiaryAccountNumber: string;
  beneficiaryAccountName: string;
  beneficiaryBankCode: string;
}
export interface AdminPaymentChannel extends PaymentChannel {
  channelId: number;
  channelVersion: number;
  tourOperatorUserId: number;
  operatorName: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface ChannelPage { items: AdminPaymentChannel[]; totalCount: number; page: number; pageSize: number }
export const CHANNEL_LABELS: Record<ChannelStatus, string> = {
  NotConnected: 'Chưa kết nối', PendingVerification: 'Chờ xác minh', Ready: 'Sẵn sàng nhận thanh toán', ConnectionError: 'Lỗi kết nối', Disabled: 'Đã vô hiệu hóa',
};
export function channelDate(value: string | null | undefined) {
  if (!value || Number.isNaN(Date.parse(value))) return 'Chưa ghi nhận';
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(value));
  const part = (name: string) => parts.find((item) => item.type === name)?.value;
  return `${part('day')}/${part('month')}/${part('year')} ${part('hour')}:${part('minute')}`;
}
export const EMPTY_CREDENTIALS: ChannelCredentials = { clientId: '', apiKey: '', checksumKey: '', beneficiaryAccountNumber: '', beneficiaryAccountName: '', beneficiaryBankCode: '' };
