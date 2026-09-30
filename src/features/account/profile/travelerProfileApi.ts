import { AuthStorage } from '@/features/auth/session/authSession';
import { getApiBase, type ApiError } from '@/lib/authApi';

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
  messageCode: string;
  message: string;
  profile: TravelerProfileDto;
  isSimulatedFallback?: boolean;
}

const LOCAL_PROFILE_STORAGE_KEY = 'tripmate_traveler_profile_mock';

function getLocalProfile(defaultEmail = '', defaultName = ''): TravelerProfileDto {
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
    const raw = localStorage.getItem(LOCAL_PROFILE_STORAGE_KEY);
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

function saveLocalProfile(profile: TravelerProfileDto): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage write error
  }
}

/**
 * UC-08 Get Traveler Profile
 *
 * ⚠️ PENDING_BE_INTEGRATION:
 * The backend endpoint GET /api/v1/traveler/profile is NOT YET IMPLEMENTED in Capstone_BE.
 * When the backend endpoint is deployed, this function calls it with Bearer token.
 * In the interim, it falls back seamlessly to the session context and local profile cache.
 */
export async function getTravelerProfile(options?: {
  accessToken?: string;
}): Promise<TravelerProfileDto> {
  const context = AuthStorage.getContext();
  const defaultEmail = context?.email ?? '';
  const defaultName = context?.fullName ?? '';
  const token = options?.accessToken ?? context?.accessToken;

  const API_BASE = getApiBase();

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}/traveler/profile`, {
      method: 'GET',
      credentials: 'include',
      headers,
    });

    if (res.ok) {
      const data = (await res.json()) as Record<string, unknown>;
      const profile = (data.data ?? data) as TravelerProfileDto;
      saveLocalProfile(profile);
      return profile;
    }
  } catch {
    // Network or server unreachable; proceed to fallback
  }

  return getLocalProfile(defaultEmail, defaultName);
}

/**
 * UC-08 Update Traveler Profile
 *
 * ⚠️ PENDING_BE_INTEGRATION:
 * The backend endpoint PUT /api/v1/traveler/profile is NOT YET IMPLEMENTED in Capstone_BE.
 * This client provides the canonical contract derived from SRS §3.2.8.
 *
 * If backend returns 404 or fails to respond, a graceful simulated fallback is returned
 * and AuthStorage context is updated so the UI and header reflect user edits immediately.
 */
export async function updateTravelerProfile(
  payload: UpdateTravelerProfilePayload,
  options?: { accessToken?: string },
): Promise<UpdateTravelerProfileResult> {
  const context = AuthStorage.getContext();
  const email = context?.email ?? '';
  const token = options?.accessToken ?? context?.accessToken;
  const API_BASE = getApiBase();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response | null = null;
  try {
    res = await fetch(`${API_BASE}/traveler/profile`, {
      method: 'PUT',
      credentials: 'include',
      headers,
      body: JSON.stringify(payload),
    });
  } catch {
    // Network failure -> proceed to fallback
  }

  if (res && res.ok) {
    let responseBody: Record<string, unknown> = {};
    try {
      responseBody = (await res.json()) as Record<string, unknown>;
    } catch {
      // non-JSON
    }

    const updatedProfile = ((responseBody.data as TravelerProfileDto) ?? {
      ...payload,
      email,
    }) as TravelerProfileDto;

    saveLocalProfile(updatedProfile);

    // Sync AuthStorage so navbar immediately displays the new name
    if (context && payload.fullName) {
      AuthStorage.accept(
        {
          ...context,
          fullName: payload.fullName,
        },
        false,
      );
    }

    return {
      success: true,
      messageCode: 'MSG20',
      message: 'Cập nhật thông tin hồ sơ thành công.',
      profile: updatedProfile,
      isSimulatedFallback: false,
    };
  }

  // Handle BE validation or business rule errors if endpoint exists and rejected
  if (res && !res.ok && res.status !== 404 && res.status !== 501) {
    let body: Record<string, unknown> = {};
    try {
      body = (await res.json()) as Record<string, unknown>;
    } catch {
      // non-JSON
    }

    const errorCode = (body.errorCode as string) ?? (body.code as string) ?? undefined;
    const title = (body.message as string) ?? (body.title as string) ?? undefined;
    const rawErrors = body.errors as Record<string, string | string[]> | undefined;
    let fieldErrors: Record<string, string> | undefined;

    if (rawErrors && typeof rawErrors === 'object') {
      fieldErrors = Object.fromEntries(
        Object.entries(rawErrors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
      );
    }

    throw {
      code: errorCode,
      message: title,
      errors: fieldErrors,
      status: res.status,
    } satisfies ApiError;
  }

  // Graceful fallback for 404 / 501 / Network unreachable (PENDING_BE_INTEGRATION)
  const current = getLocalProfile(email, context?.fullName ?? '');
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

  saveLocalProfile(updatedProfile);

  // Sync AuthStorage
  if (context && payload.fullName) {
    AuthStorage.accept(
      {
        ...context,
        fullName: payload.fullName,
      },
      false,
    );
  }

  return {
    success: true,
    messageCode: 'MSG20',
    message: 'Cập nhật thông tin hồ sơ thành công.',
    profile: updatedProfile,
    isSimulatedFallback: true,
  };
}
