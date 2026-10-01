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
}

export class LocalProfileStorageError extends Error {
  constructor(
    public readonly code: 'LOCAL_DRAFT_STORAGE_FAILED' | 'UNAUTHORIZED_ROLE' | 'NO_SESSION',
    message: string,
  ) {
    super(message);
    this.name = 'LocalProfileStorageError';
  }
}

export interface StoredProfileDraftEnvelope {
  ownerUserId: number;
  profile: {
    fullName: string;
    email?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    gender?: 'Male' | 'Female' | 'Other' | '';
    address?: string;
  };
}

export const USER_PROFILE_DRAFT_KEY_PREFIX = 'tripmate_traveler_profile_draft:';
export const LEGACY_STORAGE_KEYS = [
  'tripmate_traveler_profile_draft',
  'tripmate_traveler_profile_mock',
] as const;

export function getUserProfileDraftKey(userId: number): string {
  return `${USER_PROFILE_DRAFT_KEY_PREFIX}${userId}`;
}

export function purgeLegacyGenericDrafts(): void {
  if (typeof window === 'undefined') return;
  try {
    for (const key of LEGACY_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
  } catch {
    // Ignore storage purge errors
  }
}

export function getLocalProfileDraft(
  userId?: number,
  defaultEmail = '',
  defaultName = '',
): TravelerProfileDto {
  const fallbackProfile: TravelerProfileDto = {
    userId,
    fullName: defaultName,
    email: defaultEmail,
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    avatarUrl: '',
  };

  if (typeof window === 'undefined') {
    return fallbackProfile;
  }

  // Purge legacy generic drafts so they are never adopted
  purgeLegacyGenericDrafts();

  // Fail closed if trusted userId is missing
  if (!userId || userId <= 0) {
    return fallbackProfile;
  }

  const key = getUserProfileDraftKey(userId);

  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallbackProfile;
    }

    const parsed = JSON.parse(raw) as Partial<StoredProfileDraftEnvelope>;

    // Verify ownership envelope
    if (!parsed || parsed.ownerUserId !== userId || !parsed.profile) {
      // Mismatched or corrupted draft - remove and reject
      localStorage.removeItem(key);
      return fallbackProfile;
    }

    const draft = parsed.profile;

    return {
      userId,
      fullName: draft.fullName ?? defaultName,
      email: defaultEmail,
      phoneNumber: draft.phoneNumber ?? '',
      dateOfBirth: draft.dateOfBirth ?? '',
      gender: (draft.gender as TravelerProfileDto['gender']) ?? '',
      address: draft.address ?? '',
      // Avatar is session-preview-only and never restored from localStorage
      avatarUrl: '',
    };
  } catch {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore
    }
    return fallbackProfile;
  }
}

export function saveLocalProfileDraft(
  userId: number,
  draftOrEnvelope: Partial<TravelerProfileDto> | StoredProfileDraftEnvelope,
): void {
  if (typeof window === 'undefined') return;

  if (!userId || userId <= 0) {
    throw new LocalProfileStorageError(
      'LOCAL_DRAFT_STORAGE_FAILED',
      'Không thể lưu thông tin vào bộ nhớ thiết bị mà không có định danh người dùng hợp lệ.',
    );
  }

  // Purge legacy generic drafts
  purgeLegacyGenericDrafts();

  let profileData: StoredProfileDraftEnvelope['profile'];

  if ('ownerUserId' in draftOrEnvelope && 'profile' in draftOrEnvelope) {
    profileData = { ...draftOrEnvelope.profile };
  } else {
    const p = draftOrEnvelope as Partial<TravelerProfileDto>;
    profileData = {
      fullName: p.fullName ?? '',
      email: p.email,
      phoneNumber: p.phoneNumber ?? '',
      dateOfBirth: p.dateOfBirth ?? '',
      gender: p.gender ?? '',
      address: p.address ?? '',
    };
  }

  // Enforce: avatarUrl is NEVER persisted to localStorage
  delete (profileData as Record<string, unknown>).avatarUrl;

  const envelope: StoredProfileDraftEnvelope = {
    ownerUserId: userId,
    profile: profileData,
  };

  try {
    localStorage.setItem(getUserProfileDraftKey(userId), JSON.stringify(envelope));
  } catch {
    throw new LocalProfileStorageError(
      'LOCAL_DRAFT_STORAGE_FAILED',
      'Không thể lưu thông tin vào bộ nhớ thiết bị. Vui lòng kiểm tra dung lượng trình duyệt.',
    );
  }
}

/**
 * UC-08 Get Traveler Profile
 *
 * ⚠️ PENDING_BE_INTEGRATION:
 * The backend endpoint GET /api/v1/traveler/profile is NOT YET IMPLEMENTED in Capstone_BE.
 * In accordance with TripMate integration policy, phantom HTTP calls are omitted.
 * Profile data is loaded from the authenticated session context and any user-scoped local draft.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getTravelerProfile(_options?: {
  accessToken?: string;
}): Promise<TravelerProfileDto> {
  const context = AuthStorage.getContext();
  const defaultEmail = context?.email ?? '';
  const defaultName = context?.fullName ?? '';

  if (!context || context.role !== 'Traveler' || !context.userId) {
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

  return getLocalProfileDraft(context.userId, defaultEmail, defaultName);
}

/**
 * UC-08 Update Traveler Profile
 *
 * ⚠️ PENDING_BE_INTEGRATION:
 * The backend endpoint PUT /api/v1/traveler/profile is NOT YET IMPLEMENTED in Capstone_BE.
 * In accordance with TripMate integration policy, phantom HTTP calls are omitted.
 * Edits are persisted locally as a user-scoped device draft (LOCAL_DRAFT).
 * Canonical AuthStorage session is NOT mutated to preserve verified server identity.
 */
export async function updateTravelerProfile(
  payload: UpdateTravelerProfilePayload,
  _options?: { accessToken?: string },
): Promise<UpdateTravelerProfileResult> {
  void _options;
  const context = AuthStorage.getContext();
  if (!context || context.role !== 'Traveler' || !context.userId || context.userId <= 0) {
    throw new LocalProfileStorageError(
      'UNAUTHORIZED_ROLE',
      'Không thể cập nhật hồ sơ. Yêu cầu đăng nhập với tài khoản Du khách.',
    );
  }

  saveLocalProfileDraft(context.userId, {
    fullName: payload.fullName,
    email: context.email,
    phoneNumber: payload.phoneNumber,
    dateOfBirth: payload.dateOfBirth,
    gender: payload.gender,
    address: payload.address,
  });

  const updatedProfile: TravelerProfileDto = {
    userId: context.userId,
    fullName: payload.fullName,
    email: context.email,
    phoneNumber: payload.phoneNumber ?? '',
    dateOfBirth: payload.dateOfBirth ?? '',
    gender: payload.gender ?? '',
    address: payload.address ?? '',
    // Ephemeral in-memory avatar remains in returned result for current session UI preview
    avatarUrl: payload.avatarUrl,
  };

  return {
    success: true,
    messageCode: 'LOCAL_DRAFT',
    message: 'Thông tin tạm thời đã được lưu trên thiết bị này.',
    notice: 'Đồng bộ hồ sơ với máy chủ đang chờ tích hợp.',
    profile: updatedProfile,
    storageMode: 'LOCAL_DRAFT',
    integrationStatus: 'PENDING_BE_INTEGRATION',
  };
}
