import { AuthStorage } from '@/features/auth/session/authSession';
import { getApiBase } from '@/lib/apiBase';
import {
  DEMO_OPERATOR_PROFILE,
  isOperatorDemoAllowedInCurrentEnv,
} from '../data/operatorProfileDemoFixtures';
import {
  OPERATOR_PROFILE_MESSAGES,
  type OperatorProfileDto,
  type OperatorProfileResult,
  type OperatorProfileValidationErrors,
  type UpdateOperatorProfilePayload,
} from '../types/operatorProfile';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^0\d{9}$/;
const MAX_LOGO_BYTES = 5 * 1024 * 1024; // 5 MB per BR-16
const MAX_BUSINESS_NAME_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_ADDRESS_LENGTH = 300;
const MAX_EMAIL_LENGTH = 200;
const MAX_WEBSITE_LENGTH = 300;
const ALLOWED_LOGO_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

let inMemoryDemoProfile: OperatorProfileDto = { ...DEMO_OPERATOR_PROFILE };

export function resetDemoOperatorProfile(): void {
  inMemoryDemoProfile = { ...DEMO_OPERATOR_PROFILE };
}

export class OperatorProfileValidationError extends Error {
  errors: OperatorProfileValidationErrors;

  constructor(errors: OperatorProfileValidationErrors) {
    super(OPERATOR_PROFILE_MESSAGES.REQUIRED_FIELDS_SUMMARY);
    this.name = 'OperatorProfileValidationError';
    this.errors = errors;
  }
}

export class OperatorProfileApiError extends Error {
  statusCode: number;
  errorCode?: string;

  constructor(message: string, statusCode: number = 0, errorCode?: string) {
    super(message);
    this.name = 'OperatorProfileApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

function isValidWebsite(value: string): boolean {
  if (value.length > MAX_WEBSITE_LENGTH) return false;
  try {
    const parsed = new URL(value);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

export function validateOperatorProfile(
  payload: UpdateOperatorProfilePayload
): OperatorProfileValidationErrors {
  const errors: OperatorProfileValidationErrors = {};

  const businessName = payload.businessName.trim();
  if (!businessName) {
    errors.businessName = OPERATOR_PROFILE_MESSAGES.REQUIRED_FIELD;
  } else if (businessName.length > MAX_BUSINESS_NAME_LENGTH) {
    errors.businessName = OPERATOR_PROFILE_MESSAGES.BUSINESS_NAME_TOO_LONG;
  }

  const businessDescription = payload.businessDescription.trim();
  if (businessDescription.length > MAX_DESCRIPTION_LENGTH) {
    errors.businessDescription = OPERATOR_PROFILE_MESSAGES.DESCRIPTION_TOO_LONG;
  }

  const businessAddress = payload.businessAddress.trim();
  if (businessAddress.length > MAX_ADDRESS_LENGTH) {
    errors.businessAddress = OPERATOR_PROFILE_MESSAGES.ADDRESS_TOO_LONG;
  }

  const contactPhone = payload.contactPhone.trim();
  if (contactPhone.length > 0 && !PHONE_REGEX.test(contactPhone)) {
    errors.contactPhone = OPERATOR_PROFILE_MESSAGES.INVALID_PHONE;
  }

  const contactEmail = payload.contactEmail.trim();
  if (contactEmail.length > 0) {
    if (contactEmail.length > MAX_EMAIL_LENGTH) {
      errors.contactEmail = OPERATOR_PROFILE_MESSAGES.EMAIL_TOO_LONG;
    } else if (!EMAIL_REGEX.test(contactEmail)) {
      errors.contactEmail = OPERATOR_PROFILE_MESSAGES.INVALID_EMAIL;
    }
  }

  const website = (payload.website ?? '').trim();
  if (website.length > 0 && !isValidWebsite(website)) {
    errors.website = OPERATOR_PROFILE_MESSAGES.INVALID_WEBSITE;
  }

  if (payload.logoFile) {
    const file = payload.logoFile;
    const mime = file.type.toLowerCase();
    if (!ALLOWED_LOGO_MIME_TYPES.has(mime) || file.size <= 0 || file.size > MAX_LOGO_BYTES) {
      errors.logo = OPERATOR_PROFILE_MESSAGES.INVALID_LOGO;
    }
  }

  return errors;
}

function getRequiredAuthHeader(): Record<string, string> {
  const token = AuthStorage.getAccessToken();
  if (!token) {
    throw new OperatorProfileApiError(
      OPERATOR_PROFILE_MESSAGES.SESSION_EXPIRED,
      401,
      'AUTH_REQUIRED'
    );
  }
  return { Authorization: `Bearer ${token}` };
}

function normalizeProfileDto(raw: Record<string, unknown>): OperatorProfileDto {
  const status = raw.approvalStatus;
  const approvalStatus: OperatorProfileDto['approvalStatus'] =
    status === 'Approved' || status === 'PendingApproval' || status === 'Rejected'
      ? status
      : 'Approved';

  return {
    userId: typeof raw.userId === 'number' || typeof raw.userId === 'string' ? raw.userId : '',
    businessName: typeof raw.businessName === 'string' ? raw.businessName : '',
    businessDescription: typeof raw.businessDescription === 'string' ? raw.businessDescription : '',
    businessAddress: typeof raw.businessAddress === 'string' ? raw.businessAddress : '',
    contactPhone: typeof raw.contactPhone === 'string' ? raw.contactPhone : '',
    contactEmail: typeof raw.contactEmail === 'string' ? raw.contactEmail : '',
    website: typeof raw.website === 'string' && raw.website.length > 0 ? raw.website : undefined,
    logoUrl: typeof raw.logoUrl === 'string' && raw.logoUrl.length > 0 ? raw.logoUrl : undefined,
    businessLicenceNumber:
      typeof raw.businessLicenceNumber === 'string' ? raw.businessLicenceNumber : '',
    taxCode: typeof raw.taxCode === 'string' ? raw.taxCode : '',
    approvalStatus,
    accountEmail: typeof raw.accountEmail === 'string' ? raw.accountEmail : '',
    isDemo: false,
  };
}

function mapFieldCodeToMessage(field: keyof OperatorProfileValidationErrors, code: string): string {
  if (code === 'MSG01') return OPERATOR_PROFILE_MESSAGES.REQUIRED_FIELD;
  if (code === 'MSG02') return OPERATOR_PROFILE_MESSAGES.INVALID_EMAIL;
  if (code === 'MSG04') return OPERATOR_PROFILE_MESSAGES.INVALID_PHONE;
  if (code === 'MSG19') return OPERATOR_PROFILE_MESSAGES.INVALID_LOGO;

  switch (field) {
    case 'businessName':
      return OPERATOR_PROFILE_MESSAGES.BUSINESS_NAME_TOO_LONG;
    case 'businessDescription':
      return OPERATOR_PROFILE_MESSAGES.DESCRIPTION_TOO_LONG;
    case 'businessAddress':
      return OPERATOR_PROFILE_MESSAGES.ADDRESS_TOO_LONG;
    case 'contactPhone':
      return OPERATOR_PROFILE_MESSAGES.INVALID_PHONE;
    case 'contactEmail':
      return OPERATOR_PROFILE_MESSAGES.INVALID_EMAIL;
    case 'website':
      return OPERATOR_PROFILE_MESSAGES.INVALID_WEBSITE;
    case 'logo':
      return OPERATOR_PROFILE_MESSAGES.INVALID_LOGO;
    case 'removeLogo':
      return OPERATOR_PROFILE_MESSAGES.INVALID_REMOVE_LOGO;
  }
}

const KNOWN_ERROR_FIELDS: ReadonlyArray<keyof OperatorProfileValidationErrors> = [
  'businessName',
  'businessDescription',
  'businessAddress',
  'contactPhone',
  'contactEmail',
  'website',
  'logo',
  'removeLogo',
];

function extractProfileFieldErrors(
  rawErrors: unknown
): OperatorProfileValidationErrors | undefined {
  if (!rawErrors || typeof rawErrors !== 'object') return undefined;
  const record = rawErrors as Record<string, unknown>;
  const mapped: OperatorProfileValidationErrors = {};

  for (const field of KNOWN_ERROR_FIELDS) {
    const entry = record[field];
    const firstCode = Array.isArray(entry)
      ? typeof entry[0] === 'string'
        ? entry[0]
        : undefined
      : typeof entry === 'string'
        ? entry
        : undefined;
    if (firstCode) {
      mapped[field] = mapFieldCodeToMessage(field, firstCode);
    }
  }

  return Object.keys(mapped).length > 0 ? mapped : undefined;
}

async function safeParseJson(response: Response): Promise<Record<string, unknown> | null> {
  try {
    const parsed: unknown = await response.json();
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Non-JSON error body
  }
  return null;
}

function readErrorCode(body: Record<string, unknown> | null): string | undefined {
  if (!body) return undefined;
  if (typeof body.errorCode === 'string') return body.errorCode;
  if (typeof body.code === 'string') return body.code;
  if (body.extensions && typeof body.extensions === 'object') {
    const ext = body.extensions as Record<string, unknown>;
    if (typeof ext.errorCode === 'string') return ext.errorCode;
  }
  return undefined;
}

async function handleApiFailure(
  response: Response,
  options: { treat413AndBare400AsOversizedLogo: boolean }
): Promise<never> {
  const body = await safeParseJson(response);
  const errorCode = readErrorCode(body);

  if (response.status === 401) {
    throw new OperatorProfileApiError(OPERATOR_PROFILE_MESSAGES.SESSION_EXPIRED, 401, errorCode);
  }

  if (response.status === 403) {
    throw new OperatorProfileApiError(
      OPERATOR_PROFILE_MESSAGES.NOT_APPROVED_OPERATOR,
      403,
      errorCode
    );
  }

  if (options.treat413AndBare400AsOversizedLogo) {
    if (response.status === 413) {
      throw new OperatorProfileValidationError({
        logo: OPERATOR_PROFILE_MESSAGES.INVALID_LOGO,
      });
    }

    if (response.status === 400) {
      const fieldErrors = extractProfileFieldErrors(body?.errors);
      if (fieldErrors) {
        throw new OperatorProfileValidationError(fieldErrors);
      }
      throw new OperatorProfileValidationError({
        logo: OPERATOR_PROFILE_MESSAGES.INVALID_LOGO,
      });
    }
  }

  throw new OperatorProfileApiError(
    OPERATOR_PROFILE_MESSAGES.SYSTEM_FAILURE,
    response.status,
    errorCode
  );
}

export interface GetOperatorProfileOptions {
  allowDemo?: boolean;
  accountEmail?: string;
}

export async function getOperatorProfile(
  options?: GetOperatorProfileOptions
): Promise<OperatorProfileResult> {
  const allowDemo = Boolean(options?.allowDemo) && isOperatorDemoAllowedInCurrentEnv();

  if (allowDemo) {
    return {
      status: 'SUCCESS',
      profile: { ...inMemoryDemoProfile },
      isDemo: true,
    };
  }

  const headers = getRequiredAuthHeader();
  let response: Response;
  try {
    response = await fetch(`${getApiBase()}/operator/profile`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });
  } catch {
    throw new OperatorProfileApiError(OPERATOR_PROFILE_MESSAGES.SYSTEM_FAILURE, 0, 'NETWORK');
  }

  if (!response.ok) {
    return handleApiFailure(response, { treat413AndBare400AsOversizedLogo: false });
  }

  const body = await safeParseJson(response);
  if (!body) {
    throw new OperatorProfileApiError(OPERATOR_PROFILE_MESSAGES.SYSTEM_FAILURE, response.status);
  }

  return {
    status: 'SUCCESS',
    profile: normalizeProfileDto(body),
    isDemo: false,
  };
}

export interface UpdateOperatorProfileOptions {
  allowDemo?: boolean;
  currentProfile?: OperatorProfileDto;
}

export async function updateOperatorProfile(
  payload: UpdateOperatorProfilePayload,
  options?: UpdateOperatorProfileOptions
): Promise<OperatorProfileResult> {
  const errors = validateOperatorProfile(payload);
  if (Object.keys(errors).length > 0) {
    throw new OperatorProfileValidationError(errors);
  }

  const trimmed = {
    businessName: payload.businessName.trim(),
    businessDescription: payload.businessDescription.trim(),
    businessAddress: payload.businessAddress.trim(),
    contactPhone: payload.contactPhone.trim(),
    contactEmail: payload.contactEmail.trim(),
    website: (payload.website ?? '').trim(),
  };

  const allowDemo = Boolean(options?.allowDemo) && isOperatorDemoAllowedInCurrentEnv();

  if (allowDemo) {
    const base = options?.currentProfile || inMemoryDemoProfile;
    const nextLogoUrl = payload.logoFile
      ? payload.logoPreviewUrl || base.logoUrl
      : payload.removeLogo
        ? undefined
        : payload.logoPreviewUrl ?? base.logoUrl;

    const updatedProfile: OperatorProfileDto = {
      ...base,
      businessName: trimmed.businessName,
      businessDescription: trimmed.businessDescription,
      businessAddress: trimmed.businessAddress,
      contactPhone: trimmed.contactPhone,
      contactEmail: trimmed.contactEmail,
      website: trimmed.website || undefined,
      logoUrl: nextLogoUrl,
      isDemo: true,
    };

    inMemoryDemoProfile = { ...updatedProfile };

    return {
      status: 'SUCCESS',
      profile: updatedProfile,
      message:
        'Bản xem trước DEMO: Cập nhật thông tin hồ sơ đối tác thành công (chưa lưu vào máy chủ).',
      isDemo: true,
    };
  }

  const headers = getRequiredAuthHeader();
  const formData = new FormData();
  formData.append('businessName', trimmed.businessName);
  formData.append('businessDescription', trimmed.businessDescription);
  formData.append('businessAddress', trimmed.businessAddress);
  formData.append('contactPhone', trimmed.contactPhone);
  formData.append('contactEmail', trimmed.contactEmail);
  formData.append('website', trimmed.website);

  // Mutual exclusion: never send both logo and removeLogo=true in the same request.
  if (payload.logoFile) {
    formData.append('logo', payload.logoFile);
  } else if (payload.removeLogo) {
    formData.append('removeLogo', 'true');
  }

  let response: Response;
  try {
    response = await fetch(`${getApiBase()}/operator/profile`, {
      method: 'PUT',
      headers,
      body: formData,
    });
  } catch {
    throw new OperatorProfileApiError(OPERATOR_PROFILE_MESSAGES.SYSTEM_FAILURE, 0, 'NETWORK');
  }

  if (!response.ok) {
    return handleApiFailure(response, { treat413AndBare400AsOversizedLogo: true });
  }

  const body = await safeParseJson(response);
  const rawProfile =
    body && body.profile && typeof body.profile === 'object'
      ? (body.profile as Record<string, unknown>)
      : null;

  let profile: OperatorProfileDto;
  if (rawProfile) {
    profile = normalizeProfileDto(rawProfile);
  } else {
    const reloaded = await getOperatorProfile({ allowDemo: false });
    if (!reloaded.profile) {
      throw new OperatorProfileApiError(OPERATOR_PROFILE_MESSAGES.SYSTEM_FAILURE, response.status);
    }
    profile = reloaded.profile;
  }

  return {
    status: 'SUCCESS',
    profile,
    message: OPERATOR_PROFILE_MESSAGES.UPDATE_SUCCESS,
    isDemo: false,
  };
}
