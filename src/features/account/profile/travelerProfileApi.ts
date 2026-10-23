import { AUTH_ERROR_MESSAGES } from '@/lib/authErrorMapper';

export interface TravelerProfileDto {
  userId: number;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  dateOfBirth: string | null;
  avatarUrl: string | null;
}

export interface UpdateTravelerProfilePayload {
  fullName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  avatarFile?: File;
  removeAvatar?: boolean;
}

export interface UpdateTravelerProfileResult {
  messageCode: string;
  message: string;
  profile: TravelerProfileDto;
}

export const TRAVELER_PROFILE_UPDATED_EVENT = 'tripmate:traveler-profile-updated';

export function announceTravelerProfileUpdated(profile: TravelerProfileDto): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<TravelerProfileDto>(
      TRAVELER_PROFILE_UPDATED_EVENT, { detail: profile },
    ));
  }
}

export class TravelerProfileApiError extends Error {
  constructor(public readonly status: number, public readonly code: string) {
    super(code === 'MSG_PHONE_DUP' ? AUTH_ERROR_MESSAGES.MSG_PHONE_DUP :
      code === 'MSG19' ? 'Ảnh đại diện không hợp lệ.' :
      code === 'MSG04' ? 'Số điện thoại không hợp lệ.' :
      code === 'MSG01' ? 'Vui lòng nhập họ và tên.' :
      code === 'MSG02' ? 'Thông tin hồ sơ không hợp lệ.' :
      status === 403 ? 'Tài khoản không có quyền truy cập hồ sơ Du khách.' :
      status === 404 ? 'Không tìm thấy hồ sơ Du khách.' :
      'Không thể xử lý hồ sơ lúc này. Vui lòng thử lại.');
    this.name = 'TravelerProfileApiError';
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const body = data && typeof data === 'object' ? data as Record<string, unknown> : {};
    throw new TravelerProfileApiError(response.status,
      typeof body.errorCode === 'string' ? body.errorCode : 'MSG127');
  }
  if (!data || typeof data !== 'object') throw new TravelerProfileApiError(503, 'MSG127');
  return data as T;
}

export async function getTravelerProfile(): Promise<TravelerProfileDto> {
  const response = await fetch('/api/traveler/profile', { cache: 'no-store' });
  return parseResponse<TravelerProfileDto>(response);
}

export async function updateTravelerProfile(
  payload: UpdateTravelerProfilePayload,
): Promise<UpdateTravelerProfileResult> {
  const form = new FormData();
  form.set('fullName', payload.fullName);
  form.set('phoneNumber', payload.phoneNumber ?? '');
  if (payload.dateOfBirth) form.set('dateOfBirth', payload.dateOfBirth);
  if (payload.avatarFile) form.set('avatar', payload.avatarFile);
  form.set('removeAvatar', String(Boolean(payload.removeAvatar)));
  const response = await fetch('/api/traveler/profile', { method: 'PUT', body: form });
  return parseResponse<UpdateTravelerProfileResult>(response);
}
