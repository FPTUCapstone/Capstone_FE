/**
 * UC-35: Create Tour Package
 * UC-36: Update Tour Package
 * UC-37: Submit Tour for Approval
 *
 * Canonical SRS Reference: Report 3 §3.8.2.1, §3.8.2.2, §3.8.2.3,
 * Business Rules: BR-22, BR-56, BR-61, BR-79, BR-101, BR-102, BR-103, BR-104.
 */

export type TourLifecycleStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected' | 'Inactive';

export interface TourItineraryActivity {
  id: string;
  time: string; // e.g. "08:30"
  poiId?: string | number;
  poiName: string;
  stayDurationMinutes: number; // e.g. 60
  transport: string; // e.g. "Coach", "Walk", "Boat"
  notes?: string;
}

export interface TourItineraryDay {
  dayNo: number;
  title?: string;
  activities: TourItineraryActivity[];
}

export interface TourDepartureSchedule {
  id: string;
  departureDate: string; // YYYY-MM-DD
  returnDate: string; // YYYY-MM-DD
  totalCapacity: number;
  reservedCapacity: number; // sold slots (BR-61)
  meetingPoint?: string;
  status: 'Scheduled' | 'Cancelled' | 'Completed';
}

export interface TourMediaItem {
  id: string;
  url: string;
  caption?: string;
  isPrimary?: boolean;
}

export interface TourPackageDto {
  id: string;
  tourCode: string; // e.g. "TP-0142"
  operatorUserId: number | string;
  title: string;
  destination: string;
  category: string;
  durationDays: number;
  basePrice: number;
  childPrice?: number;
  maxCapacity: number;
  description: string;
  inclusions?: string;
  exclusions?: string;
  cancellationPolicy: string;
  status: TourLifecycleStatus;
  rejectionReason?: string;
  version: number;
  itinerary: TourItineraryDay[];
  schedules: TourDepartureSchedule[];
  media: TourMediaItem[];
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export interface CreateTourPackagePayload {
  title: string;
  destination: string;
  category?: string;
  durationDays: number;
  basePrice: number;
  childPrice?: number;
  maxCapacity: number;
  description: string;
  inclusions?: string;
  exclusions?: string;
  cancellationPolicy: string;
  itinerary: TourItineraryDay[];
  schedules: TourDepartureSchedule[];
  mediaFiles?: File[];
}

export interface UpdateTourPackagePayload extends CreateTourPackagePayload {
  id: string;
}

export interface TourValidationErrors {
  title?: string;
  destination?: string;
  category?: string;
  durationDays?: string;
  basePrice?: string;
  maxCapacity?: string;
  description?: string;
  cancellationPolicy?: string;
  itinerary?: string;
  schedules?: string;
  media?: string;
}

export interface TourCompletenessCheckItem {
  key: string;
  label: string;
  isComplete: boolean;
  summaryText: string;
  isMandatory: boolean;
}

export interface TourCompletenessResult {
  isEligibleForSubmission: boolean;
  items: TourCompletenessCheckItem[];
  missingCount: number;
}

export type TourActionResultStatus = 'SUCCESS' | 'PENDING_BE_INTEGRATION' | 'ERROR';

export interface TourActionResult<T = TourPackageDto> {
  status: TourActionResultStatus;
  data?: T;
  message?: string;
  isDemo?: boolean;
}

/**
 * Canonical UC-35/36/37 message constants locked to Report 3 §3.8.2.
 *
 * NOTE on SRS_CONFLICT_UC35_MESSAGE_CODES:
 * Detailed §3.8.2.1:
 * - MSG108 = Tour package created successfully
 * - MSG29 = Departure date in past or return precedes departure
 * - MSG143 = Price or capacity is not a positive value
 * - MSG19 = Image file invalid format or exceeds 5MB (BR-16)
 *
 * NOTE on SRS_CONFLICT_UC36_MESSAGE_CODES:
 * Detailed §3.8.2.2:
 * - MSG109 = Tour package updated successfully
 * - MSG110 = Approved tour package direct edit attempted (offers new draft version)
 * - MSG122 = Tour package currently pending approval (read-only)
 * - MSG143 = Capacity reduced below sold slots (BR-61)
 *
 * NOTE on SRS_CONFLICT_UC37_MESSAGE_CODES:
 * Detailed §3.8.2.3:
 * - MSG111 = Tour package submitted successfully (becomes read-only)
 * - MSG122 = Tour package already pending approval
 * - MSG110 = Tour package already approved
 */
export const OPERATOR_TOUR_MESSAGES = {
  /** Mandatory field empty (MSG01) */
  REQUIRED_FIELD: 'Trường thông tin này là bắt buộc (MSG01).',
  REQUIRED_SUMMARY: 'Vui lòng điền đầy đủ các thông tin bắt buộc của gói tour (MSG01).',

  /** Positive numeric constraints (MSG143, BR-79, BR-101) */
  POSITIVE_NUMERIC: 'Giá tour và sức chứa phải là giá trị số dương lớn hơn 0 (BR-79, MSG143).',
  CAPACITY_BELOW_SOLD: 'Sức chứa không được giảm xuống dưới số lượng chỗ đã bán cho lịch trình này (BR-61, MSG143).',

  /** Departure dates constraints (MSG29, BR-22) */
  INVALID_SCHEDULE_DATE: 'Ngày khởi hành không được ở quá khứ và ngày về phải sau hoặc cùng ngày khởi hành (BR-22, MSG29).',

  /** Media constraints (MSG19, BR-16) */
  INVALID_MEDIA: 'Tệp hình ảnh không hợp lệ hoặc dung lượng vượt quá 5MB (BR-16, MSG19).',

  /** Authorization & Ownership (MSG126, BR-07, BR-102) */
  UNAUTHORIZED_OPERATOR: 'Bạn không có quyền truy cập hoặc quản lý gói tour này (BR-102, MSG126).',

  /** Lifecycle edit constraints (MSG122, MSG110) */
  PENDING_READ_ONLY: 'Gói tour đang chờ kiểm duyệt và không thể chỉnh sửa trong thời gian này (MSG122).',
  APPROVED_DIRECT_EDIT: 'Gói tour đã duyệt không thể sửa trực tiếp. Thay đổi sẽ được lưu vào phiên bản nháp mới (BR-103, MSG110).',

  /** Success transitions */
  CREATE_SUCCESS: 'Tạo gói tour thành công ở trạng thái Bản nháp (MSG108).',
  UPDATE_SUCCESS: 'Cập nhật thông tin gói tour thành công (MSG109).',
  SUBMIT_SUCCESS: 'Gói tour đã được gửi để quản trị viên kiểm duyệt thành công (MSG111).',

  /** System failure */
  SYSTEM_FAILURE: 'TripMate tạm thời không thể xử lý yêu cầu. Vui lòng kiểm tra kết nối và thử lại (MSG127).',

  /** Real mode pending backend integration banner */
  PENDING_BE_INTEGRATION: 'Tính năng quản lý vòng đời gói tour đối tác đang chờ kết nối dịch vụ máy chủ (Capstone_BE).',
} as const;
