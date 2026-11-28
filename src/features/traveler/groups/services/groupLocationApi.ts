import { getApiBase } from '@/lib/apiBase';
import { chatRequest, TravelGroupHttpError } from './travelGroupApi';

export interface GroupLocationSharing {
  groupId: number;
  enabled: boolean;
  updatedAtUtc: string | null;
  sessionVersion: string | null;
}
export interface GroupLocation {
  userId: number;
  latitude: number;
  longitude: number;
  recordedAtUtc: string;
}
export interface GroupLocations { groupId: number; locations: GroupLocation[] }
export interface PublishGroupLocation { latitude: number; longitude: number; sessionVersion: string }

const positiveId = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) > 0;
const date = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value));
const coordinates = (latitude: unknown, longitude: unknown) => typeof latitude === 'number' && Number.isFinite(latitude)
  && Math.abs(latitude) <= 90 && typeof longitude === 'number' && Number.isFinite(longitude) && Math.abs(longitude) <= 180;
const boundedSignal = (signal?: AbortSignal) => AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(20000)]);
const invalid = () => new TravelGroupHttpError(502, 'Dữ liệu vị trí từ máy chủ không hợp lệ. Vui lòng tải lại.', 'server.invalid_contract');
function base(groupId: number) {
  if (!positiveId(groupId)) throw new TravelGroupHttpError(400, 'ID nhóm không hợp lệ.', 'validation.id');
  return `${getApiBase()}/travel-groups/${groupId}`;
}
function isLocation(value: unknown): value is GroupLocation {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return positiveId(row.userId) && coordinates(row.latitude, row.longitude) && date(row.recordedAtUtc);
}
function sharing(value: GroupLocationSharing, groupId: number): GroupLocationSharing {
  if (!value || value.groupId !== groupId || typeof value.enabled !== 'boolean'
    || !(value.updatedAtUtc === null || date(value.updatedAtUtc))
    || (value.enabled ? !date(value.updatedAtUtc) || typeof value.sessionVersion !== 'string' || !value.sessionVersion.trim()
      : value.sessionVersion !== null)) throw invalid();
  return value;
}
export async function fetchGroupLocationSharing(groupId: number, signal?: AbortSignal): Promise<GroupLocationSharing> {
  return sharing(await chatRequest<GroupLocationSharing>(`${base(groupId)}/location-sharing`, 'GET', undefined, boundedSignal(signal)), groupId);
}
export async function setGroupLocationSharing(groupId: number, enabled: boolean): Promise<GroupLocationSharing> {
  const result = sharing(await chatRequest<GroupLocationSharing>(`${base(groupId)}/location-sharing`, 'PUT', { enabled }), groupId);
  if (result.enabled !== enabled) throw invalid();
  return result;
}
export async function fetchGroupLocations(groupId: number, signal?: AbortSignal): Promise<GroupLocations> {
  const result = await chatRequest<GroupLocations>(`${base(groupId)}/locations`, 'GET', undefined, boundedSignal(signal));
  if (!result || result.groupId !== groupId || !Array.isArray(result.locations) || !result.locations.every(isLocation)
    || new Set(result.locations.map(row => row.userId)).size !== result.locations.length) throw invalid();
  return result;
}
export async function publishGroupLocation(groupId: number, payload: PublishGroupLocation): Promise<GroupLocation> {
  if (!coordinates(payload.latitude, payload.longitude) || typeof payload.sessionVersion !== 'string' || !payload.sessionVersion.trim()) {
    throw new TravelGroupHttpError(400, 'Tọa độ hoặc phiên chia sẻ không hợp lệ.', 'validation.location');
  }
  const result = await chatRequest<GroupLocation>(`${base(groupId)}/location`, 'PUT', payload);
  if (!isLocation(result)) throw invalid();
  return result;
}
export async function clearGroupLocation(groupId: number): Promise<void> {
  await chatRequest<void>(`${base(groupId)}/location`, 'DELETE');
}
