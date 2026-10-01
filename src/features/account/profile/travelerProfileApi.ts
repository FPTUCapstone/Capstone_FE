import { AuthStorage } from '@/features/auth/session/authSession';

export interface TravelerProfileDto {
  userId?: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female' | 'Other' | '';
  address?: string;
  avatarUrl?: string;
}

export interface UpdateTravelerProfilePayload {
  fullName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female' | 'Other' | '';
  address?: string;
  avatarUrl?: string;
}

export interface UpdateTravelerProfileResult {
  success: boolean;
  messageCode: 'LOCAL_DRAFT';
  message: string;
  notice: string;
  profile: TravelerProfileDto;
  storageMode: 'LOCAL_DRAFT';
  integrationStatus: 'PENDING_BE_INTEGRATION';
  isSimulatedFallback?: boolean;
}

const LOCAL_PROFILE_DRAFT_KEY = 'tripmate_traveler_profile_draft';
const LEGACY_STORAGE_KEY = 'tripmate_traveler_profile_mock';

export function getLocalProfileDraft(defaultEmail = '', defaultName = ''): TravelerProfileDto {
  if (typeof window === 'undefined') {
    return {
      fullName: defaultName,
      email: defaultEmail,
      phoneNumber: '',
      dateOfBirth: '',
      gender: '',
      address: '',
      avatarUrl: '',
    };
  }

  try {
    const raw =
      localStorage.getItem(LOCAL_PROFILE_DRAFT_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<TravelerProfileDto>;
      return {
        fullName: parsed.fullName ?? defaultName,
        email: parsed.email ?? defaultEmail,
        phoneNumber: parsed.phoneNumber ?? '',
        dateOfBirth: parsed.dateOfBirth ?? '',
        gender: (parsed.gender as TravelerProfileDto['gender']) ?? '',
        address: parsed.address ?? '',
        avatarUrl: parsed.avatarUrl ?? '',
      };
    }
  } catch {
    // Ignore storage parse error
  }

  return {
    fullName: defaultName,
    email: defaultEmail,
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    avatarUrl: '',
  };
}

export function saveLocalProfileDraft(profile: TravelerProfileDto): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_PROFILE_DRAFT_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage write error
  }
}

/**
 * UC-08 Get Traveler Profile
 *
 * ⚠️ PENDING_BE_INTEGRATION:
 * The backend endpoint GET /api/v1/traveler/profile is NOT YET IMPLEMENTED in Capstone_BE.
 * In accordance with TripMate integration policy, phantom HTTP calls are omitted.
 * Profile data is loaded from the authenticated session context and any local device draft.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getTravelerProfile(_options?: {
  accessToken?: string;
}): Promise<TravelerProfileDto> {
  const context = AuthStorage.getContext();
  const defaultEmail = context?.email ?? '';
  const defaultName = context?.fullName ?? '';

  return getLocalProfileDraft(defaultEmail, defaultName);
}

/**
 * UC-08 Update Traveler Profile
 *
 * ⚠️ PENDING_BE_INTEGRATION:
 * The backend endpoint PUT /api/v1/traveler/profile is NOT YET IMPLEMENTED in Capstone_BE.
 * In accordance with TripMate integration policy, phantom HTTP calls are omitted.
 * Edits are persisted locally as a device-only draft (LOCAL_DRAFT).
 * Canonical AuthStorage session is NOT mutated to preserve verified server identity.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function updateTravelerProfile(
  payload: UpdateTravelerProfilePayload,
  _options?: { accessToken?: string },
): Promise<UpdateTravelerProfileResult> {
  const context = AuthStorage.getContext();
  const email = context?.email ?? '';
  const current = getLocalProfileDraft(email, context?.fullName ?? '');

  const updatedProfile: TravelerProfileDto = {
    ...current,
    fullName: payload.fullName,
    phoneNumber: payload.phoneNumber ?? current.phoneNumber,
    dateOfBirth: payload.dateOfBirth ?? current.dateOfBirth,
    gender: payload.gender ?? current.gender,
    address: payload.address ?? current.address,
    avatarUrl: payload.avatarUrl ?? current.avatarUrl,
    email,
  };

  saveLocalProfileDraft(updatedProfile);

  return {
    success: true,
    messageCode: 'LOCAL_DRAFT',
    message: 'Thông tin tạm thời đã được lưu trên thiết bị này.',
    notice: 'Đồng bộ hồ sơ với máy chủ đang chờ tích hợp.',
    profile: updatedProfile,
    storageMode: 'LOCAL_DRAFT',
    integrationStatus: 'PENDING_BE_INTEGRATION',
    isSimulatedFallback: true,
  };
}
