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
}

export interface OperatorProfileValidationErrors {
  businessName?: string;
  businessDescription?: string;
  businessAddress?: string;
  contactPhone?: string;
  contactEmail?: string;
  website?: string;
  logo?: string;
}

export type OperatorProfileStatus = 'SUCCESS' | 'PENDING_BE_INTEGRATION' | 'ERROR';

export interface OperatorProfileResult {
  status: OperatorProfileStatus;
  profile?: OperatorProfileDto;
  message?: string;
  isDemo?: boolean;
}

/**
 * Canonical UC-34 message constants locked to Report 3 §3.8.1 and message catalog.
 *
 * NOTE on SRS_CONFLICT_UC34_MESSAGE_CODES:
 * Detailed UC-34 §3.8.1:
 * - MSG19 = invalid / oversized logo (BR-16)
 * - MSG121 = successful Operator Profile update
 * Global Application Messages appendix:
 * - MSG19 = Traveler profile updated successfully
 * - MSG20 = uploaded Traveler avatar invalid format / exceeds 5 MB
 * - MSG121 = cannot review a trip/tour that is not yet completed
 *
 * Decision: The detailed UC-34 section is the use-case-specific authority.
 * Because Backend remains NO_BACKEND, real mode must never emit MSG121.
 */
export const OPERATOR_PROFILE_MESSAGES = {
  /** Required field empty (inline/form level) */
  REQUIRED_FIELD: 'Trường thông tin này là bắt buộc (MSG01).',
  REQUIRED_FIELDS_SUMMARY: 'Vui lòng điền đầy đủ các thông tin bắt buộc (MSG01).',
  /** Invalid contact email format */
  INVALID_EMAIL: 'Định dạng email không hợp lệ. Vui lòng nhập địa chỉ email hợp lệ (MSG02).',
  /** Logo invalid image format or exceeds 5 MB (BR-16, MSG19) */
  INVALID_LOGO: 'Tệp logo phải là hình ảnh hợp lệ và dung lượng không vượt quá 5MB (BR-16, MSG19).',
  /** Not approved Tour Operator */
  NOT_APPROVED_OPERATOR: 'Bạn không có quyền truy cập vào chức năng này (MSG126).',
  /** Profile updated successfully */
  UPDATE_SUCCESS: 'Cập nhật thông tin hồ sơ đối tác thành công (MSG121).',
  /** System / network save failure */
  SYSTEM_FAILURE: 'TripMate tạm thời không thể xử lý yêu cầu. Vui lòng kiểm tra kết nối và thử lại (MSG127).',
  /** Real mode pending backend integration banner */
  PENDING_BE_INTEGRATION: 'Tính năng quản lý hồ sơ đối tác đang chờ kết nối dịch vụ máy chủ (Capstone_BE).',
} as const;
