import { AuthStorage } from '@/features/auth/session/authSession';
import { getApiBase } from '@/lib/apiBase';

export interface StayFacility {
  poiId: number;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  description: string | null;
  published: boolean;
  acceptingRequests: boolean;
  imageUrl?: string | null;
}

export interface StayInquiry {
  id: number;
  poiId?: number;
  facilityName: string;
  itineraryId?: number | null;
  arrival: string;
  departure: string;
  guests: number;
  contactName: string;
  contact: string;
  note: string | null;
  status: 'Sent' | 'Replied' | 'Declined';
  reply: string | null;
}

export const stayStatus = {
  Sent: 'Đã gửi',
  Replied: 'Cơ sở đã phản hồi',
  Declined: 'Đã từ chối',
} as const;

export const STAY_DIRECT_EXCHANGE_NOTICE =
  'Bạn sẽ trao đổi trực tiếp với cơ sở về phòng trống, giá, giữ chỗ và thanh toán.';

export function formatStayDate(iso?: string | null): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso || '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

export function countStayNights(arrival?: string | null, departure?: string | null): number {
  if (!arrival || !departure) return 0;
  const start = Date.parse(`${arrival.slice(0, 10)}T00:00:00Z`);
  const end = Date.parse(`${departure.slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return Math.round((end - start) / 86_400_000);
}

export async function stayRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set('Accept', 'application/json');
  if (init?.body) headers.set('Content-Type', 'application/json');
  const proxyRequest = path.startsWith('/api/');
  const accessToken = AuthStorage.getContext()?.accessToken;
  if (accessToken && !proxyRequest) headers.set('Authorization', `Bearer ${accessToken}`);
  const response = await fetch(proxyRequest ? path : `${getApiBase()}${path}`,
    { ...init, headers, cache: 'no-store' });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(response.status === 401 ? 'Vui lòng đăng nhập để tiếp tục.'
      : typeof error?.title === 'string' && response.status < 500 ? error.title
        : 'Không thể tải dữ liệu lưu trú. Vui lòng thử lại.');
  }
  return response.json() as Promise<T>;
}

export function positiveId(value: unknown): number | null {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
