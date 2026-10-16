/** Operator tour-package lifecycle data. */

export type TourLifecycleStatus =
  | 'Draft'
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Published'
  | 'Inactive';

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

/** Departure fields the form does not edit; kept so a replace-all update never discards them. */
export interface TourDepartureServerTerms {
  startAtUtc: string;
  endAtUtc: string;
  minimumCapacity: number;
  registrationDeadlineAtUtc: string | null;
  adultPrice: number | null;
  childPrice: number | null;
  infantPrice: number | null;
}

export interface TourDepartureSchedule {
  id: string;
  departureDate: string; // YYYY-MM-DD
  returnDate: string; // YYYY-MM-DD
  totalCapacity: number;
  reservedCapacity: number; // sold slots (BR-61)
  meetingPoint?: string;
  status: 'Scheduled' | 'Cancelled' | 'Completed';
  /** Selling terms. Undefined = not edited (use the server's value or a default); null = cleared. */
  minimumCapacity?: number;
  adultPrice?: number;
  childPrice?: number | null;
  infantPrice?: number | null;
  /** YYYY-MM-DD, strictly before the departure date; '' = no deadline. */
  registrationDeadlineDate?: string;
  /** Present only for a departure loaded from the backend. */
  serverTerms?: TourDepartureServerTerms;
}

export interface TourMediaItem {
  id: string;
  url: string;
  caption?: string;
  isPrimary?: boolean;
}

export interface TourWarning {
  code: string;
  dayNo?: number;
  sequenceNo?: number;
  poiId?: number;
}

export interface TourPackageDto {
  id: string;
  tourCode: string; // e.g. "TP-0142"
  operatorUserId: number | string;
  title: string;
  destination: string;
  /** Catalogue destination ids (backend `destinationIds`); empty for demo fixtures. */
  destinationIds?: number[];
  category: string;
  durationDays: number;
  basePrice: number;
  childPrice?: number;
  maxCapacity: number;
  description: string;
  inclusions?: string;
  exclusions?: string;
  highlights?: string;
  travellerRequirements?: string;
  timeZoneId?: string;
  /** Server-computed readiness (real mode only). Undefined for demo fixtures. */
  reviewBlockers?: string[];
  canSubmitForReview?: boolean;
  warnings?: TourWarning[];
  /** Real mode: the selected cancellation policy template id as a string. Demo: free text. */
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
  /** Catalogue destination ids. Required for a real (non-demo) save. */
  destinationIds?: number[];
  category?: string;
  durationDays: number;
  basePrice: number;
  childPrice?: number;
  maxCapacity: number;
  description: string;
  inclusions?: string;
  exclusions?: string;
  highlights?: string;
  travellerRequirements?: string;
  timeZoneId?: string;
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

export const OPERATOR_TOUR_MESSAGES = {
  REQUIRED_FIELD: 'Trường thông tin này là bắt buộc.',
  REQUIRED_SUMMARY: 'Vui lòng điền đầy đủ các thông tin bắt buộc của gói tour.',
  POSITIVE_NUMERIC: 'Giá tour và sức chứa phải là giá trị số dương lớn hơn 0.',
  CAPACITY_BELOW_SOLD: 'Sức chứa không được giảm xuống dưới số lượng chỗ đã bán cho lịch trình này.',
  INVALID_SCHEDULE_DATE: 'Ngày khởi hành không được ở quá khứ và ngày về phải sau hoặc cùng ngày khởi hành.',
  INVALID_MEDIA: 'Tệp hình ảnh không hợp lệ hoặc dung lượng vượt quá 5MB.',
  UNAUTHORIZED_OPERATOR: 'Bạn không có quyền truy cập hoặc quản lý gói tour này.',
  PENDING_READ_ONLY: 'Gói tour đang chờ kiểm duyệt và không thể chỉnh sửa trong thời gian này.',
  APPROVED_DIRECT_EDIT: 'Gói tour đã duyệt không thể sửa trực tiếp. Thay đổi sẽ được lưu vào phiên bản nháp mới.',
  CREATE_SUCCESS: 'Tạo gói tour thành công ở trạng thái Bản nháp.',
  UPDATE_SUCCESS: 'Cập nhật thông tin gói tour thành công.',
  SUBMIT_SUCCESS: 'Gói tour đã được gửi để quản trị viên kiểm duyệt thành công.',
  SYSTEM_FAILURE: 'TripMate tạm thời không thể xử lý yêu cầu. Vui lòng kiểm tra kết nối và thử lại.',
  PENDING_BE_INTEGRATION: 'Tính năng quản lý gói tour hiện chưa thể kết nối máy chủ.',
} as const;
