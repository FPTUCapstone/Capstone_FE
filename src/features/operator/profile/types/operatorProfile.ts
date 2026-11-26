/**
 * UC-34 — Update Tour Operator Profile
 * SRS Reference: Report 3 §3.8.1, BR-07, BR-08, BR-16, BR-17
 */

export interface OperatorProfileDto {
  userId: number | string;
  /** Editable business name (Tên doanh nghiệp) */
  businessName: string;
  /** Editable business description (Mô tả doanh nghiệp) */
  businessDescription: string;
  /** Editable head office address (Địa chỉ trụ sở) */
  businessAddress: string;
  /** Editable contact phone (Số điện thoại liên hệ) */
  contactPhone: string;
  /** Editable contact email (Email liên hệ doanh nghiệp) */
  contactEmail: string;
  /** Editable official website */
  website?: string;
  /** Optional logo image URL or preview */
  logoUrl?: string;
  /** Read-only system data: Business licence number (Số GPKD, BR-08) */
  businessLicenceNumber: string;
  /** Read-only system data: Tax code (Mã số thuế, BR-08) */
  taxCode: string;
  /** Read-only system data: Application approval status (Trạng thái xét duyệt) */
  approvalStatus: 'Approved' | 'PendingApproval' | 'Rejected';
  /** Read-only authentication account email (BR-17) */
  accountEmail?: string;
  /** Explicit indicator for demo fixtures */
  isDemo?: boolean;
}

export interface UpdateOperatorProfilePayload {
  businessName: string;
  businessDescription: string;
  businessAddress: string;
  contactPhone: string;
  contactEmail: string;
  website?: string;
  logoFile?: File | null;
  logoPreviewUrl?: string | null;
  removeLogo?: boolean;
}

export interface OperatorProfileValidationErrors {
  businessName?: string;
  businessDescription?: string;
  businessAddress?: string;
  contactPhone?: string;
  contactEmail?: string;
  website?: string;
  logo?: string;
  removeLogo?: string;
}

export type OperatorProfileStatus = 'SUCCESS' | 'ERROR';

export interface OperatorProfileResult {
  status: OperatorProfileStatus;
  profile?: OperatorProfileDto;
  message?: string;
  isDemo?: boolean;
}

/**
 * Canonical UC-34 message constants aligned with docs/UC-34-api-contract.md.
 * Success copy intentionally omits MSG121 due to SRS message-code conflict.
 */
export const OPERATOR_PROFILE_MESSAGES = {
  /** Required field empty (inline/form level) */
  REQUIRED_FIELD: 'Trường thông tin này là bắt buộc (MSG01).',
  REQUIRED_FIELDS_SUMMARY: 'Vui lòng kiểm tra lại các thông tin không hợp lệ.',
  /** Max length errors */
  BUSINESS_NAME_TOO_LONG: 'Tên doanh nghiệp không được vượt quá 200 ký tự.',
  DESCRIPTION_TOO_LONG: 'Mô tả doanh nghiệp không được vượt quá 2000 ký tự.',
  ADDRESS_TOO_LONG: 'Địa chỉ trụ sở không được vượt quá 300 ký tự.',
  EMAIL_TOO_LONG: 'Email liên hệ không được vượt quá 200 ký tự.',
  /** Invalid contact phone format (^0\d{9}$, MSG04) */
  INVALID_PHONE: 'Số điện thoại không hợp lệ. Vui lòng nhập 10 chữ số bắt đầu bằng 0 (MSG04).',
  /** Invalid contact email format (MSG02) */
  INVALID_EMAIL: 'Định dạng email không hợp lệ. Vui lòng nhập địa chỉ email hợp lệ (MSG02).',
  /** Invalid website URL */
  INVALID_WEBSITE:
    'Website phải là đường dẫn hợp lệ bắt đầu bằng http:// hoặc https:// (tối đa 300 ký tự).',
  /** Logo invalid image format or exceeds 5 MB (BR-16, MSG19) */
  INVALID_LOGO:
    'Tệp logo phải là ảnh JPG, PNG hoặc WebP và dung lượng không vượt quá 5MB (BR-16, MSG19).',
  /** Invalid removeLogo flag */
  INVALID_REMOVE_LOGO: 'Yêu cầu xóa logo không hợp lệ.',
  /** Not approved Tour Operator (MSG126) */
  NOT_APPROVED_OPERATOR: 'Bạn không có quyền truy cập vào chức năng này (MSG126).',
  /** Expired or missing authentication session (401) */
  SESSION_EXPIRED: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  /** Profile updated successfully (code = operator_profile.updated, intentionally no MSG121) */
  UPDATE_SUCCESS: 'Cập nhật thông tin hồ sơ đối tác thành công.',
  /** System / network / storage failure (MSG127) */
  SYSTEM_FAILURE:
    'TripMate tạm thời không thể xử lý yêu cầu. Vui lòng kiểm tra kết nối và thử lại (MSG127).',
} as const;
