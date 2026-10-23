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
const MAX_LOGO_BYTES = 5 * 1024 * 1024; // 5 MB per BR-16

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

  constructor(message: string, statusCode: number = 0) {
    super(message);
    this.name = 'OperatorProfileApiError';
    this.statusCode = statusCode;
  }
}

/**
 * Validates operator profile input fields against explicit SRS Report 3 §3.8.1 rules.
 *
 * NOTE on SRS_AMBIGUITY_REQUIRED_FIELDS:
 * Report 3 §3.8.1 states "A required profile field is empty -> Display: MSG01"
 * but does not explicitly enumerate which fields are mandatory.
 * No approved source explicitly establishes specific required fields for profile update;
 * therefore, MSG01 is not enforced on unproven fields merely by assumption.
 *
 * NOTE on WEBSITE & PHONE:
 * Website is listed as UC-34 input data, but Report 3 does not explicitly identify it as a required field.
 * Therefore, no MSG01 client enforcement and no custom URL validation under SRS_AMBIGUITY_REQUIRED_FIELDS.
 * Similarly, Report 3 §3.8.1 defines no phone format rule or regex; no unsupported phone format check is enforced.
 *
 * NOTE on SRS_AMBIGUITY_LOGO_FORMAT & BR-16:
 * BR-16 defines that the uploaded logo must be an image file <= 5 MB.
 * Exact accepted extensions are not specified in the normative text of §3.8.1.
 * Standard defensible image MIME validation (image/*) is applied.
 *
 * NOTE on SRS_CONFLICT_UC34_MESSAGE_CODES:
 * Detailed UC-34 §3.8.1:
 * - MSG19 = invalid / oversized logo (BR-16)
 * - MSG121 = successful Operator Profile update
 * Global Application Messages appendix:
 * - MSG19 = Traveler profile updated successfully
 * - MSG20 = uploaded Traveler avatar invalid format / exceeds 5 MB
 * - MSG121 = cannot review a trip/tour that is not yet completed
 * Decision: Follow detailed UC-34 section as use-case-specific authority.
 * Because Backend remains NO_BACKEND, real mode must never emit MSG121.
 */
export function validateOperatorProfile(
  payload: UpdateOperatorProfilePayload
): OperatorProfileValidationErrors {
  const errors: OperatorProfileValidationErrors = {};

  // Contact email format validation (Explicitly defined in Report 3 §3.8.1 -> MSG02)
  // Only validated when a contact email value is provided.
  if (payload.contactEmail && payload.contactEmail.trim().length > 0) {
    if (!EMAIL_REGEX.test(payload.contactEmail.trim())) {
      errors.contactEmail = OPERATOR_PROFILE_MESSAGES.INVALID_EMAIL;
    }
  }

  // Logo file constraints (Report 3 §3.8.1 & BR-16 -> MSG19)
  if (payload.logoFile) {
    const file = payload.logoFile;
    const isImage = file.type.toLowerCase().startsWith('image/');

    if (!isImage || file.size > MAX_LOGO_BYTES) {
      errors.logo = OPERATOR_PROFILE_MESSAGES.INVALID_LOGO;
    }
  }

  return errors;
}

export interface GetOperatorProfileOptions {
  allowDemo?: boolean;
  accountEmail?: string;
}

/**
 * Retrieves the Tour Operator profile.
 * Strictly respects production environment:
 * - When allowDemo is true AND environment permits, returns demo fixture.
 * - In real mode (NO_BACKEND), returns truthful PENDING_BE_INTEGRATION state without fabricated values.
 */
export async function getOperatorProfile(
  options?: GetOperatorProfileOptions
): Promise<OperatorProfileResult> {
  const allowDemo = Boolean(options?.allowDemo) && isOperatorDemoAllowedInCurrentEnv();

  if (allowDemo) {
    return {
      status: 'SUCCESS',
      profile: { ...DEMO_OPERATOR_PROFILE },
      isDemo: true,
    };
  }

  // REAL MODE with NO_BACKEND: do not invent speculative backend calls.
  // Return neutral pending integration response.
  return {
    status: 'PENDING_BE_INTEGRATION',
    profile: {
      userId: '',
      businessName: '',
      businessDescription: '',
      businessAddress: '',
      contactPhone: '',
      contactEmail: '',
      website: '',
      businessLicenceNumber: '',
      taxCode: '',
      approvalStatus: 'Approved',
      accountEmail: options?.accountEmail,
      isDemo: false,
    },
    isDemo: false,
    message: OPERATOR_PROFILE_MESSAGES.PENDING_BE_INTEGRATION,
  };
}

export interface UpdateOperatorProfileOptions {
  allowDemo?: boolean;
  currentProfile?: OperatorProfileDto;
}

/**
 * Updates the Tour Operator profile.
 * Strictly enforces validation before attempting update.
 * In demo mode, simulates local update with prominent DEMO ONLY indicator.
 * In real mode with NO_BACKEND, never claims MSG121 (fake success) or persists fake data.
 */
export async function updateOperatorProfile(
  payload: UpdateOperatorProfilePayload,
  options?: UpdateOperatorProfileOptions
): Promise<OperatorProfileResult> {
  const errors = validateOperatorProfile(payload);
  if (Object.keys(errors).length > 0) {
    throw new OperatorProfileValidationError(errors);
  }

  const allowDemo = Boolean(options?.allowDemo) && isOperatorDemoAllowedInCurrentEnv();

  if (allowDemo) {
    const updatedProfile: OperatorProfileDto = {
      ...(options?.currentProfile || DEMO_OPERATOR_PROFILE),
      businessName: payload.businessName.trim(),
      businessDescription: payload.businessDescription.trim(),
      businessAddress: payload.businessAddress.trim(),
      contactPhone: payload.contactPhone.trim(),
      contactEmail: payload.contactEmail.trim(),
      website: payload.website?.trim() || '',
      logoUrl: payload.logoPreviewUrl || options?.currentProfile?.logoUrl,
      isDemo: true,
    };

    return {
      status: 'SUCCESS',
      profile: updatedProfile,
      message: 'Bản xem trước DEMO: Cập nhật thông tin hồ sơ đối tác thành công (chưa lưu vào máy chủ).',
      isDemo: true,
    };
  }

  // REAL MODE with NO_BACKEND:
  // Must NOT produce MSG121 or fake persistent save.
  return {
    status: 'PENDING_BE_INTEGRATION',
    isDemo: false,
    message: OPERATOR_PROFILE_MESSAGES.PENDING_BE_INTEGRATION,
  };
}
