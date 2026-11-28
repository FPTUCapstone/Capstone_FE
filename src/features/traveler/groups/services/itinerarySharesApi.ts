import { getApiBase } from '@/lib/apiBase';
import { chatRequest, TravelGroupHttpError } from './travelGroupApi';

export type ShareConversationKind = 'travel_group' | 'chat_group' | 'direct';
export interface ItineraryShareRequest {
  itineraryId: number;
  conversationKind: ShareConversationKind;
  conversationId: number;
  clientRequestId: string;
}
export interface ItineraryShareReceipt { shareId: string; messageId: number }
export interface ItinerarySnapshot {
  shareId: string; title: string; sharedAtUtc: string; itineraryVersion: number;
  items: { sequenceNo: number; name: string; arrivalUtc: string | null; departureUtc: string | null;
    stayDurationMinutes: number; latitude: number | null; longitude: number | null; address: string | null }[];
}
export interface ShareableItinerary { itineraryId: number; title: string | null; version: number; canManage: boolean; stopCount: number }
export interface ShareableItineraryPage { items: ShareableItinerary[]; page: number; pageSize: number; totalCount: number }
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const positive = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) > 0;
const date = (value: unknown): value is string => typeof value === 'string' && /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) && Number.isFinite(Date.parse(value));
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const boundedSignal = (signal?: AbortSignal) => AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(20000)]);
const invalid = () => new TravelGroupHttpError(502, 'Dữ liệu chia sẻ lịch trình không hợp lệ. Vui lòng thử lại.', 'server.invalid_contract');

export function itineraryShareId(content: string): string | null {
  const marker = /^tripmate:itinerary-share:([0-9a-f-]+)$/i.exec(content);
  return marker && uuid.test(marker[1]) ? marker[1].toLowerCase() : null;
}
export async function listShareableItineraries(page: number, signal?: AbortSignal): Promise<ShareableItineraryPage> {
  const data = await chatRequest<unknown>(`${getApiBase()}/itineraries?page=${page}&pageSize=20&sort=newest`, 'GET', undefined, boundedSignal(signal));
  if (!record(data) || !Array.isArray(data.items) || !positive(data.page) || !positive(data.pageSize)
    || !Number.isSafeInteger(data.totalCount) || Number(data.totalCount) < 0
    || !data.items.every(item => record(item) && positive(item.itineraryId) && positive(item.version)
      && (item.title === null || typeof item.title === 'string') && typeof item.canManage === 'boolean'
      && Number.isSafeInteger(item.stopCount) && Number(item.stopCount) >= 0)) throw invalid();
  return data as unknown as ShareableItineraryPage;
}
export async function shareItinerary(payload: ItineraryShareRequest, signal?: AbortSignal): Promise<ItineraryShareReceipt> {
  const data = await chatRequest<unknown>(`${getApiBase()}/messaging/itinerary-shares`, 'POST', payload, boundedSignal(signal));
  if (!record(data) || typeof data.shareId !== 'string' || !uuid.test(data.shareId) || !positive(data.messageId)) throw invalid();
  return data as unknown as ItineraryShareReceipt;
}
export async function fetchItinerarySnapshot(shareId: string, signal?: AbortSignal): Promise<ItinerarySnapshot> {
  if (!uuid.test(shareId)) throw invalid();
  const data = await chatRequest<unknown>(`${getApiBase()}/messaging/itinerary-shares/${shareId}`, 'GET', undefined, boundedSignal(signal));
  const coordinate = (value: unknown, max: number) => value === null || typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= max;
  if (!record(data) || data.shareId !== shareId || typeof data.title !== 'string' || !date(data.sharedAtUtc)
    || !positive(data.itineraryVersion) || !Array.isArray(data.items)
    || !data.items.every(item => record(item) && positive(item.sequenceNo) && typeof item.name === 'string'
      && (item.arrivalUtc === null || date(item.arrivalUtc)) && (item.departureUtc === null || date(item.departureUtc))
      && (item.arrivalUtc === null || item.departureUtc === null || Date.parse(item.departureUtc) >= Date.parse(item.arrivalUtc))
      && Number.isSafeInteger(item.stayDurationMinutes) && Number(item.stayDurationMinutes) >= 0
      && coordinate(item.latitude, 90) && coordinate(item.longitude, 180)
      && (item.address === null || typeof item.address === 'string'))) throw invalid();
  return data as unknown as ItinerarySnapshot;
}
