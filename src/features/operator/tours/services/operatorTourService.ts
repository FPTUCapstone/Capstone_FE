import {
  isTourDemoAllowedInCurrentEnv,
  INITIAL_DEMO_TOURS,
} from '../data/operatorTourDemoFixtures';
import {
  OPERATOR_TOUR_MESSAGES,
  type CreateTourPackagePayload,
  type TourActionResult,
  type TourCompletenessCheckItem,
  type TourCompletenessResult,
  type TourDepartureSchedule,
  type TourPackageDto,
  type TourValidationErrors,
  type UpdateTourPackagePayload,
} from '../types/tourLifecycle';
import {
  addTourDeparture,
  createOrResumePendingChange,
  createTour,
  discardPendingChange,
  getCurrentPendingChange,
  getTour,
  listTourMedia,
  uploadTourMedia,
  reorderTourMedia,
  deleteTourMedia,
  deleteOperatorTour,
  listCancellationPolicies,
  listDestinations,
  listCategories,
  savePendingChange,
  searchSelectablePois,
  listTours,
  OperatorTourApiError,
  submitPendingChange,
  submitTour,
  updateTour,
  type ApiAddDepartureRequest,
  type ApiCreateTour,
  type ApiItineraryItem,
  type ApiPendingChange,
  type ApiPendingChangeSaveBody,
  type ApiPendingChangeScheduleItem,
  type ApiTourDetail,
  type ApiTourListItem,
  type ApiTourMedia,
} from './operatorTourApi';

export { OperatorTourApiError };
export async function getCancellationPolicyOptions() {
  return listCancellationPolicies();
}
export async function getSelectableTourPois() {
  return searchSelectablePois();
}
export async function getCategoryOptions() {
  return listCategories();
}
export async function getDestinationOptions() {
  return listDestinations();
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB per BR-16

export const REVIEW_BLOCKER_MESSAGES: Record<string, string> = {
  required_fields_missing: 'Cần hoàn tất thông tin bắt buộc của tour',
  itinerary_missing: 'Cần ít nhất 1 ngày lịch trình có hoạt động',
  primary_image_missing: 'Cần có ảnh đại diện đang hoạt động',
  future_departure_missing: 'Cần ít nhất 1 lịch khởi hành trong tương lai có giá người lớn',
  cancellation_policy_missing: 'Cần chọn chính sách hủy tour',
  destination_missing: 'Cần chọn ít nhất 1 điểm đến',
};

export const TOUR_WARNING_MESSAGES: Record<string, string> = {
  duplicate_poi: 'Điểm tham quan này đã xuất hiện trước đó trong lịch trình.',
  poi_closed_on_day: 'Điểm tham quan đóng cửa vào ngày này của chuyến đi.',
  outside_opening_hours: 'Thời gian tham quan nằm ngoài giờ mở cửa của điểm này.',
  opening_hours_unknown: 'Chưa có giờ mở cửa cho điểm này vào ngày diễn ra, hệ thống chưa thể kiểm tra.',
};

function asBackendId(value: string | number | undefined, field: string): number {
  const id = typeof value === 'number' ? value : Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error(`${field} phải là mã số hợp lệ đã có trên hệ thống.`);
  }
  return id;
}

const MAX_MONEY_AMOUNT = 9_999_999_999;

function toIsoDateTime(date: string, time: 'start' | 'end'): string {
  const parsed = new Date(`${date}T${time === 'start' ? '00:00:00' : '23:59:59'}+07:00`);
  if (Number.isNaN(parsed.getTime())) {
    return `${date}T${time === 'start' ? '00:00:00.000' : '23:59:59.999'}Z`;
  }
  return parsed.toISOString();
}

function daysBetweenDates(startYmd: string, endYmd: string): number {
  const startMs = Date.parse(`${startYmd}T00:00:00Z`);
  const endMs = Date.parse(`${endYmd}T00:00:00Z`);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return 0;
  return Math.round((endMs - startMs) / 86_400_000);
}

function minutesSinceMidnight(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours * 60) + minutes;
}

function timeFromMinutes(minutes: number): string {
  const normalized = ((minutes % 1_440) + 1_440) % 1_440;
  return `${Math.floor(normalized / 60).toString().padStart(2, '0')}:${(normalized % 60).toString().padStart(2, '0')}`;
}

function toBackendDestinationIds(payload: CreateTourPackagePayload): number[] {
  const ids = payload.destinationIds ?? [];
  if (ids.length === 0) {
    throw new Error('Vui lòng chọn ít nhất một điểm đến từ danh mục của hệ thống.');
  }
  return ids.map((id) => asBackendId(id, 'Mã điểm đến'));
}

function toBackendSchedule(
  schedule: CreateTourPackagePayload['schedules'][number],
  payload: CreateTourPackagePayload,
): ApiCreateTour['schedules'][number] {
  const terms = schedule.serverTerms;
  const tz = payload.timeZoneId || 'Asia/Ho_Chi_Minh';
  // Keep the exact instants and prices the backend already holds unless the operator moved the date.
  const unchangedDates =
    terms !== undefined &&
    dateOnly(terms.startAtUtc, tz) === schedule.departureDate &&
    dateOnly(terms.endAtUtc, tz) === schedule.returnDate;
  // An untouched deadline keeps the server's exact instant; an edited one is a UTC date at midnight.
  const editedDeadline = schedule.registrationDeadlineDate;
  const serverDeadline = terms?.registrationDeadlineAtUtc ?? null;
  const deadlineUntouched =
    editedDeadline === undefined || editedDeadline === (serverDeadline ? dateOnly(serverDeadline, tz) : '');
  const registrationDeadlineAtUtc = deadlineUntouched
    ? serverDeadline
    : editedDeadline ? `${editedDeadline}T00:00:00.000Z` : null;
  return {
    startAtUtc: unchangedDates ? terms.startAtUtc : toIsoDateTime(schedule.departureDate, 'start'),
    endAtUtc: unchangedDates ? terms.endAtUtc : toIsoDateTime(schedule.returnDate, 'end'),
    meetingPoint: schedule.meetingPoint?.trim() || null,
    minimumCapacity: Math.min(schedule.minimumCapacity ?? terms?.minimumCapacity ?? 1, schedule.totalCapacity),
    totalCapacity: schedule.totalCapacity,
    registrationDeadlineAtUtc,
    adultPrice: schedule.adultPrice ?? terms?.adultPrice ?? payload.basePrice,
    childPrice: schedule.childPrice !== undefined ? schedule.childPrice : terms ? terms.childPrice : payload.childPrice ?? null,
    infantPrice: schedule.infantPrice !== undefined ? schedule.infantPrice : terms?.infantPrice ?? null,
    meetingLatitude: schedule.meetingLatitude ?? null,
    meetingLongitude: schedule.meetingLongitude ?? null,
  };
}

function toBackendPayload(payload: CreateTourPackagePayload): ApiCreateTour {
  return {
    title: payload.title.trim(),
    destinationIds: toBackendDestinationIds(payload),
    cancellationPolicyTemplateId: asBackendId(payload.cancellationPolicy, 'Mã chính sách hủy'),
    description: payload.description.trim(),
    inclusions: payload.inclusions?.trim() || undefined,
    exclusions: payload.exclusions?.trim() || undefined,
    highlights: payload.highlights?.trim() || undefined,
    travellerRequirements: payload.travellerRequirements?.trim() || undefined,
    timeZoneId: payload.timeZoneId?.trim() || undefined,
    allowDeposit: Boolean(payload.allowDeposit),
    depositPercent: payload.allowDeposit ? (payload.depositPercent ?? null) : null,
    balanceDueDaysBeforeDeparture: payload.allowDeposit ? (payload.balanceDueDaysBeforeDeparture ?? null) : null,
    ...(payload.category && /^\d+$/.test(payload.category.trim())
      ? { categoryId: asBackendId(payload.category, 'Mã danh mục') }
      : {}),
    basePrice: payload.basePrice,
    durationDays: payload.durationDays,
    itineraryItems: payload.itinerary.flatMap((day) => day.activities.map((activity, index) => ({
      dayNo: day.dayNo,
      sequenceNo: index + 1,
      poiId: asBackendId(activity.poiId, 'Mã điểm đến trong lịch trình'),
      plannedTime: /^\d{2}:\d{2}$/.test(activity.time) ? `${activity.time}:00` : null,
      stayDurationMinutes: activity.stayDurationMinutes,
      notes: [activity.transport, activity.notes].filter(Boolean).join(' | ') || null,
    }))),
    schedules: payload.schedules.map((schedule) => toBackendSchedule(schedule, payload)),
  };
}

function dateOnly(value: string, timeZoneId = 'Asia/Ho_Chi_Minh'): string {
  if (!value) return '';
  if (!value.includes('T')) return value.slice(0, 10);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10);
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timeZoneId || 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(parsed);
    const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? '';
    const y = part('year');
    const m = part('month');
    const d = part('day');
    return y && m && d ? `${y}-${m}-${d}` : value.slice(0, 10);
  } catch {
    return value.slice(0, 10);
  }
}

function vietnamToday(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

const API_TOUR_STATUSES: readonly TourPackageDto['status'][] = [
  'Draft', 'Pending', 'Approved', 'Rejected', 'Published', 'Inactive', 'PendingReview',
];

/** An unknown status is a contract error: never present it as an editable Draft. */
function statusFromApi(value: string): TourPackageDto['status'] {
  const status = API_TOUR_STATUSES.find((candidate) => candidate === value);
  if (!status) throw new Error(`Trạng thái gói tour không được hỗ trợ: ${value}.`);
  return status;
}

function mapDetail(detail: ApiTourDetail, media: ApiTourMedia[] = []): TourPackageDto {
  const tz = detail.timeZoneId || 'Asia/Ho_Chi_Minh';
  const itinerary = new Map<number, TourPackageDto['itinerary'][number]>();
  for (const item of detail.itineraryItems) {
    const day = itinerary.get(item.dayNo) ?? { dayNo: item.dayNo, activities: [] };
    const [transport = '', ...noteParts] = (item.notes ?? '').split(' | ');
    day.activities.push({
      id: `${item.dayNo}-${item.sequenceNo}`,
      time: item.plannedTime?.slice(0, 5) ?? '',
      poiId: item.poiId,
      poiName: item.poiName?.trim() || `POI #${item.poiId}`,
      stayDurationMinutes: item.stayDurationMinutes,
      transport,
      notes: noteParts.join(' | ') || undefined,
    });
    itinerary.set(item.dayNo, day);
  }
  const schedules = detail.departures.map((departure) => ({
    id: String(departure.id),
    departureDate: dateOnly(departure.startAtUtc, tz),
    returnDate: dateOnly(departure.endAtUtc, tz),
    totalCapacity: departure.totalCapacity,
    reservedCapacity: departure.reservedCapacity,
    meetingPoint: departure.meetingPoint ?? undefined,
    meetingLatitude: departure.meetingLatitude ?? null,
    meetingLongitude: departure.meetingLongitude ?? null,
    isCompleted: departure.isCompleted ?? (departure.status === 'Completed'),
    status: (departure.status === 'Cancelled' || departure.status === 'Completed'
      ? departure.status
      : 'Scheduled') as 'Scheduled' | 'Cancelled' | 'Completed',
    minimumCapacity: departure.minimumCapacity,
    adultPrice: departure.adultPrice ?? undefined,
    childPrice: departure.childPrice,
    infantPrice: departure.infantPrice,
    registrationDeadlineDate: departure.registrationDeadlineAtUtc ? dateOnly(departure.registrationDeadlineAtUtc, tz) : '',
    serverTerms: {
      startAtUtc: departure.startAtUtc,
      endAtUtc: departure.endAtUtc,
      minimumCapacity: departure.minimumCapacity,
      registrationDeadlineAtUtc: departure.registrationDeadlineAtUtc,
      adultPrice: departure.adultPrice,
      childPrice: departure.childPrice,
      infantPrice: departure.infantPrice,
    },
  }));
  return {
    id: String(detail.id), tourCode: `TP-${detail.id}`, operatorUserId: 0,
    title: detail.title, destination: detail.destination,
    destinationIds: detail.destinations.map((item) => item.destinationId),
    category: detail.categoryId ? String(detail.categoryId) : '',
    durationDays: detail.durationDays, basePrice: detail.basePrice,
    childPrice: detail.departures[0]?.childPrice ?? undefined,
    maxCapacity: detail.departures[0]?.totalCapacity ?? 0,
    description: detail.description,
    inclusions: detail.inclusions ?? undefined,
    exclusions: detail.exclusions ?? undefined,
    highlights: detail.highlights ?? undefined,
    travellerRequirements: detail.travellerRequirements ?? undefined,
    timeZoneId: detail.timeZoneId,
    allowDeposit: Boolean(detail.allowDeposit),
    depositPercent: detail.depositPercent ?? null,
    balanceDueDaysBeforeDeparture: detail.balanceDueDaysBeforeDeparture ?? null,
    versions: Array.isArray(detail.versions)
      ? detail.versions.map((item) => ({
          tourId: String(item.tourId),
          versionNo: item.versionNo,
          status: statusFromApi(item.status),
          createdAtUtc: item.createdAtUtc,
          publishedAtUtc: item.publishedAtUtc ?? null,
          rejectionReason: item.rejectionReason ?? null,
        }))
      : undefined,
    reviewBlockers: detail.reviewBlockers,
    canSubmitForReview: detail.canSubmitForReview,
    warnings: detail.warnings.map((warning) => ({
      code: warning.code,
      dayNo: warning.dayNo ?? undefined,
      sequenceNo: warning.sequenceNo ?? undefined,
      poiId: warning.poiId ?? undefined,
    })),
    cancellationPolicy: detail.cancellationPolicyTemplateId ? String(detail.cancellationPolicyTemplateId) : '',
    status: statusFromApi(detail.status),
    rejectionReason: detail.rejectionReason ?? undefined,
    submissionNote: detail.submissionNote ?? null,
    submittedAtUtc: detail.submittedAtUtc ?? null,
    publishedAtUtc: detail.publishedAtUtc ?? null,
    version: detail.versionNo ?? 1, itinerary: [...itinerary.values()].sort((a, b) => a.dayNo - b.dayNo), schedules,
    media: mapMedia(media),
    createdAt: '', updatedAt: '',
  };
}

function mapMedia(media: ApiTourMedia[]): TourPackageDto['media'] {
  return media
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => ({
      id: String(item.tourMediaId),
      url: item.deliveryUrl,
      caption: item.caption ?? undefined,
      isPrimary: item.isPrimary,
    }));
}

/** Detail and media are separate backend resources; the screens always need both. */
async function loadTourDetail(tourId: number): Promise<TourPackageDto> {
  const [detail, media] = await Promise.all([getTour(tourId), listTourMedia(tourId)]);
  return mapDetail(detail, media);
}

function mapListItem(item: ApiTourListItem): TourPackageDto {
  return {
    id: String(item.id), tourCode: `TP-${item.id}`, operatorUserId: 0,
    title: item.title, destination: item.destination, category: '', durationDays: item.durationDays,
    basePrice: item.basePrice, maxCapacity: 0, description: '', cancellationPolicy: '',
    status: statusFromApi(item.status), version: item.versionNo ?? 1, itinerary: [], schedules: [], media: [],
    publishedAtUtc: item.publishedAtUtc ?? null,
    upcomingDepartureCount: item.upcomingDepartureCount,
    completedDepartureCount: item.completedDepartureCount,
    totalDepartureCount: item.totalDepartureCount,
    createdAt: item.updatedAtUtc, updatedAt: item.updatedAtUtc,
  };
}

export class OperatorTourValidationError extends Error {
  errors: TourValidationErrors;

  constructor(errors: TourValidationErrors, message?: string) {
    super(message || OPERATOR_TOUR_MESSAGES.REQUIRED_SUMMARY);
    this.name = 'OperatorTourValidationError';
    this.errors = errors;
  }
}

function mapApiFieldKey(rawKey: string): keyof TourValidationErrors | null {
  const normalized = rawKey.replace(/^\$\./, '').trim().toLowerCase();
  if (normalized === 'title') return 'title';
  if (normalized === 'description') return 'description';
  if (normalized === 'baseprice') return 'basePrice';
  if (normalized === 'durationdays') return 'durationDays';
  if (normalized === 'cancellationpolicytemplateid' || normalized === 'cancellationpolicy') return 'cancellationPolicy';
  if (normalized === 'destinationids' || normalized === 'destination') return 'destination';
  if (normalized === 'categoryid' || normalized === 'category') return 'category';
  if (normalized === 'highlights') return 'highlights';
  if (normalized === 'inclusions') return 'inclusions';
  if (normalized === 'exclusions') return 'exclusions';
  if (normalized === 'travellerrequirements') return 'travellerRequirements';
  if (normalized === 'depositpercent') return 'depositPercent';
  if (normalized === 'balanceduedaysbeforedeparture') return 'balanceDueDaysBeforeDeparture';
  if (normalized.startsWith('itineraryitems') || normalized.startsWith('itinerary')) return 'itinerary';
  if (normalized.startsWith('schedules')) return 'schedules';
  return null;
}

function mapApiFieldErrorsToValidationErrors(fieldErrors: Record<string, string[]>): TourValidationErrors {
  const mapped: TourValidationErrors = {};
  for (const [key, messages] of Object.entries(fieldErrors)) {
    const field = mapApiFieldKey(key);
    const first = messages[0];
    if (field && first && !mapped[field]) {
      mapped[field] = first;
    }
  }
  return mapped;
}

function rethrowMappedValidationError(err: unknown): never {
  if (err instanceof OperatorTourApiError && err.fieldErrors) {
    const mapped = mapApiFieldErrorsToValidationErrors(err.fieldErrors);
    if (Object.keys(mapped).length > 0) {
      throw new OperatorTourValidationError(mapped, err.message);
    }
  }
  throw err;
}

export function validateScheduleEntry(
  schedule: TourDepartureSchedule,
  durationDays: number,
  today: string,
  seenDates?: Set<string>,
): string | null {
  if (!Number.isInteger(schedule.totalCapacity) || schedule.totalCapacity <= 0) {
    return OPERATOR_TOUR_MESSAGES.POSITIVE_NUMERIC;
  }
  if (
    schedule.minimumCapacity !== undefined &&
    (!Number.isInteger(schedule.minimumCapacity) ||
      schedule.minimumCapacity < 1 ||
      schedule.minimumCapacity > schedule.totalCapacity)
  ) {
    return 'Sức chứa tối thiểu phải từ 1 đến bằng sức chứa tổng cộng.';
  }
  if (!schedule.departureDate || !schedule.returnDate || schedule.departureDate <= today || schedule.returnDate < schedule.departureDate) {
    return OPERATOR_TOUR_MESSAGES.INVALID_SCHEDULE_DATE;
  }
  if (durationDays > 0 && daysBetweenDates(schedule.departureDate, schedule.returnDate) + 1 < durationDays) {
    return `Ngày về phải bảo đảm tối thiểu ${durationDays} ngày theo thời lượng tour.`;
  }
  if (seenDates?.has(schedule.departureDate)) {
    return `Ngày khởi hành ${schedule.departureDate} bị trùng lặp.`;
  }
  if (
    schedule.registrationDeadlineDate &&
    (schedule.registrationDeadlineDate <= today || schedule.registrationDeadlineDate >= schedule.departureDate)
  ) {
    return 'Hạn đăng ký phải từ ngày mai trở đi và trước ngày khởi hành.';
  }
  if (schedule.meetingPoint && schedule.meetingPoint.trim().length > 500) {
    return 'Điểm tập trung không được vượt quá 500 ký tự.';
  }
  if (
    schedule.adultPrice !== undefined &&
    (!Number.isFinite(schedule.adultPrice) || !Number.isInteger(schedule.adultPrice) || schedule.adultPrice <= 0 || schedule.adultPrice > MAX_MONEY_AMOUNT)
  ) {
    return 'Giá người lớn phải là số nguyên dương (VNĐ) và không vượt quá 9.999.999.999đ.';
  }
  if (
    schedule.childPrice !== undefined &&
    schedule.childPrice !== null &&
    (!Number.isFinite(schedule.childPrice) || !Number.isInteger(schedule.childPrice) || schedule.childPrice < 0 || schedule.childPrice > MAX_MONEY_AMOUNT)
  ) {
    return 'Giá trẻ em phải là số nguyên không âm (VNĐ) và không vượt quá 9.999.999.999đ.';
  }
  if (
    schedule.infantPrice !== undefined &&
    schedule.infantPrice !== null &&
    (!Number.isFinite(schedule.infantPrice) || !Number.isInteger(schedule.infantPrice) || schedule.infantPrice < 0 || schedule.infantPrice > MAX_MONEY_AMOUNT)
  ) {
    return 'Giá em bé phải là số nguyên không âm (VNĐ) và không vượt quá 9.999.999.999đ.';
  }
  const hasLat = schedule.meetingLatitude !== undefined && schedule.meetingLatitude !== null;
  const hasLng = schedule.meetingLongitude !== undefined && schedule.meetingLongitude !== null;
  if (hasLat !== hasLng) {
    return 'Vui lòng nhập đầy đủ cả vĩ độ và kinh độ điểm tập trung.';
  }
  if (
    hasLat &&
    (!Number.isFinite(schedule.meetingLatitude!) ||
      !Number.isFinite(schedule.meetingLongitude!) ||
      schedule.meetingLatitude! < -90 ||
      schedule.meetingLatitude! > 90 ||
      schedule.meetingLongitude! < -180 ||
      schedule.meetingLongitude! > 180)
  ) {
    return 'Tọa độ điểm tập trung không hợp lệ (Vĩ độ [-90..90], Kinh độ [-180..180]).';
  }
  return null;
}

/**
 * Validates Tour Package creation payload per Report 3 §3.8.2.1 and BR-101, BR-22, BR-79.
 *
 * `pastDepartureScheduleIds`, when given, exempts those schedule ids from BR-22's "not in the
 * past" check (TM-82 backend spec §0/§6 — a past-departure schedule carried over unchanged by a
 * draft version of an Approved/Published tour is never re-validated against BR-22, since it is
 * neither new nor a future schedule being edited; §9 AC 8). Creation never passes this, since a
 * brand-new tour has no existing schedule to exempt.
 */
export function validateCreateTourPackage(
  payload: CreateTourPackagePayload,
  pastDepartureScheduleIds?: ReadonlySet<string>,
): TourValidationErrors {
  const errors: TourValidationErrors = {};

  // BR-101 Mandatory basic fields
  if (!payload.title || payload.title.trim().length === 0) {
    errors.title = OPERATOR_TOUR_MESSAGES.REQUIRED_FIELD;
  } else if (payload.title.trim().length > 200) {
    errors.title = 'Tên gói tour không được vượt quá 200 ký tự.';
  }
  const hasCatalogueDestination = (payload.destinationIds?.length ?? 0) > 0;
  if (!hasCatalogueDestination && (!payload.destination || payload.destination.trim().length === 0)) {
    errors.destination = OPERATOR_TOUR_MESSAGES.REQUIRED_FIELD;
  }
  if (!payload.description || payload.description.trim().length === 0) {
    errors.description = OPERATOR_TOUR_MESSAGES.REQUIRED_FIELD;
  }
  if (!payload.cancellationPolicy || payload.cancellationPolicy.trim().length === 0) {
    errors.cancellationPolicy = OPERATOR_TOUR_MESSAGES.REQUIRED_FIELD;
  }
  if (payload.inclusions && payload.inclusions.trim().length > 4000) {
    errors.inclusions = 'Dịch vụ bao gồm không được vượt quá 4.000 ký tự.';
  }
  if (payload.exclusions && payload.exclusions.trim().length > 4000) {
    errors.exclusions = 'Dịch vụ không bao gồm không được vượt quá 4.000 ký tự.';
  }
  if (payload.highlights && payload.highlights.trim().length > 4000) {
    errors.highlights = 'Điểm nổi bật không được vượt quá 4.000 ký tự.';
  }
  if (payload.travellerRequirements && payload.travellerRequirements.trim().length > 4000) {
    errors.travellerRequirements = 'Yêu cầu đối với du khách không được vượt quá 4.000 ký tự.';
  }
  if (payload.allowDeposit) {
    const percent = payload.depositPercent;
    if (percent === undefined || percent === null || !Number.isFinite(percent) || percent < 10 || percent > 90) {
      errors.depositPercent = 'Tỉ lệ đặt cọc phải từ 10% đến 90%.';
    }
    const dueDays = payload.balanceDueDaysBeforeDeparture;
    if (
      dueDays === undefined ||
      dueDays === null ||
      !Number.isInteger(dueDays) ||
      dueDays < 4 ||
      dueDays > 180
    ) {
      errors.balanceDueDaysBeforeDeparture =
        'Hạn tất toán phần còn lại phải từ 4 đến 180 ngày trước ngày khởi hành (trước mốc khóa 72 giờ).';
    }
  }

  // Duration, Price & Capacity (BR-79, BR-101 -> MSG143)
  if (!Number.isInteger(payload.durationDays) || payload.durationDays <= 0) {
    errors.durationDays = OPERATOR_TOUR_MESSAGES.POSITIVE_NUMERIC;
  }
  if (!Number.isFinite(payload.basePrice) || payload.basePrice <= 0) {
    errors.basePrice = OPERATOR_TOUR_MESSAGES.POSITIVE_NUMERIC;
  } else if (!Number.isInteger(payload.basePrice)) {
    errors.basePrice = 'Giá tour cơ bản phải là số nguyên (VNĐ).';
  } else if (payload.basePrice > MAX_MONEY_AMOUNT) {
    errors.basePrice = 'Giá tour cơ bản không được vượt quá 9.999.999.999đ.';
  }
  if (
    payload.childPrice !== undefined &&
    (!Number.isFinite(payload.childPrice) || !Number.isInteger(payload.childPrice) || payload.childPrice < 0 || payload.childPrice > MAX_MONEY_AMOUNT)
  ) {
    errors.childPrice = 'Giá trẻ em phải là số nguyên không âm và không vượt quá 9.999.999.999đ.';
  }
  if (!Number.isInteger(payload.maxCapacity) || payload.maxCapacity <= 0) {
    errors.maxCapacity = OPERATOR_TOUR_MESSAGES.POSITIVE_NUMERIC;
  }

  // BR-101: At least one itinerary day with activities
  if (!payload.itinerary || payload.itinerary.length === 0) {
    errors.itinerary = 'Gói tour phải có ít nhất 1 ngày lịch trình.';
  } else {
    const hasActivities = payload.itinerary.some(
      (day) => day.activities && day.activities.length > 0
    );
    if (!hasActivities) {
      errors.itinerary = 'Lịch trình phải có ít nhất 1 điểm dừng hoặc hoạt động.';
    } else {
      for (const day of payload.itinerary) {
        if (day.activities.some((activity) => !Number.isFinite(activity.stayDurationMinutes) || activity.stayDurationMinutes <= 0)) {
          errors.itinerary = `Ngày ${day.dayNo}: thời gian lưu lại tại mỗi điểm dừng phải lớn hơn 0 phút.`;
          break;
        }
        const times = day.activities.map((activity) => activity.time);
        if (times.some((time) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(time))) {
          errors.itinerary = `Ngày ${day.dayNo} có thời gian không hợp lệ.`;
          break;
        }
        if (new Set(times).size !== times.length) {
          const duplicateTime = times.find((time, index) => times.indexOf(time) !== index)!;
          errors.itinerary = `Ngày ${day.dayNo}: có nhiều điểm dừng cùng bắt đầu lúc ${duplicateTime}. Hãy chọn giờ khác cho từng điểm dừng.`;
          break;
        }
        const chronological = day.activities.map((activity, index) => ({ activity, index })).sort(
          (left, right) => minutesSinceMidnight(left.activity.time) - minutesSinceMidnight(right.activity.time),
        );
        for (let index = 1; index < chronological.length; index++) {
          const previous = chronological[index - 1];
          const current = chronological[index];
          const availableFrom = minutesSinceMidnight(previous.activity.time) + previous.activity.stayDurationMinutes;
          if (minutesSinceMidnight(current.activity.time) < availableFrom) {
            errors.itinerary = `Ngày ${day.dayNo}: Điểm dừng ${current.index + 1} bắt đầu lúc ${current.activity.time}, nhưng Điểm dừng ${previous.index + 1} lưu đến ${timeFromMinutes(availableFrom)}. Hãy chọn giờ từ ${timeFromMinutes(availableFrom)} trở đi (hoặc giảm thời gian lưu lại).`;
            break;
          }
        }
        if (errors.itinerary) break;
        if (
          day.activities.some(
            (activity) => [activity.transport, activity.notes].filter(Boolean).join(' | ').length > 500,
          )
        ) {
          errors.itinerary = `Ngày ${day.dayNo}: phương tiện và ghi chú mỗi điểm dừng không được vượt quá 500 ký tự.`;
          break;
        }
        if ((payload.destinationIds?.length ?? 0) > 0 && day.activities.some((activity) => !Number.isSafeInteger(Number(activity.poiId)) || Number(activity.poiId) <= 0)) {
          errors.itinerary = `Vui lòng chọn điểm dừng hợp lệ cho ngày ${day.dayNo}.`;
          break;
        }
      }
    }
  }

  // BR-101: At least one departure schedule
  if (!payload.schedules || payload.schedules.length === 0) {
    errors.schedules = 'Gói tour phải có ít nhất 1 lịch khởi hành.';
  } else {
    const today = vietnamToday();
    const seenDates = new Set<string>();
    for (const schedule of payload.schedules) {
      if (pastDepartureScheduleIds?.has(schedule.id)) {
        if (!Number.isInteger(schedule.totalCapacity) || schedule.totalCapacity <= 0) {
          errors.schedules = OPERATOR_TOUR_MESSAGES.POSITIVE_NUMERIC;
          break;
        }
        seenDates.add(schedule.departureDate);
        continue;
      }
      const scheduleError = validateScheduleEntry(schedule, payload.durationDays, today, seenDates);
      if (scheduleError) {
        errors.schedules = scheduleError;
        break;
      }
      seenDates.add(schedule.departureDate);
    }
  }

  // Media validation (BR-16 -> MSG19)
  if (payload.mediaFiles && payload.mediaFiles.length > 0) {
    for (const file of payload.mediaFiles) {
      const isImage = file.type.toLowerCase().startsWith('image/');
      if (!isImage || file.size > MAX_IMAGE_BYTES) {
        errors.media = OPERATOR_TOUR_MESSAGES.INVALID_MEDIA;
        break;
      }
    }
  }

  return errors;
}

/**
 * Validates Tour Package update payload per Report 3 §3.8.2.2 and BR-61.
 */
export function validateUpdateTourPackage(
  payload: UpdateTourPackagePayload,
  currentTour: TourPackageDto
): TourValidationErrors {
  const today = vietnamToday();
  const pastDepartureScheduleIds = new Set(
    (currentTour.schedules ?? [])
      .filter((schedule) => schedule.departureDate < today)
      .map((schedule) => schedule.id),
  );
  const errors = validateCreateTourPackage(payload, pastDepartureScheduleIds);

  // BR-61: Capacity of a schedule must not be reduced below sold slots
  if (payload.schedules && currentTour.schedules) {
    for (const schedule of payload.schedules) {
      const existing = currentTour.schedules.find((s) => s.id === schedule.id);
      if (existing && existing.reservedCapacity > 0) {
        if (schedule.totalCapacity < existing.reservedCapacity) {
          errors.schedules = OPERATOR_TOUR_MESSAGES.CAPACITY_BELOW_SOLD;
          break;
        }
      }
    }
  }

  return errors;
}

/**
 * Evaluates the UC-37 completeness checklist per Report 3 §3.8.2.3 and Screen #43.
 */
export function evaluateTourCompleteness(
  tour: TourPackageDto | CreateTourPackagePayload
): TourCompletenessResult {
  const items: TourCompletenessCheckItem[] = [];

  // 1. Tour Name, Destination, Description (BR-101)
  const hasBasic =
    Boolean(tour.title && tour.title.trim().length > 0) &&
    Boolean(tour.destination && tour.destination.trim().length > 0) &&
    Boolean(tour.description && tour.description.trim().length > 0);
  items.push({
    key: 'basic-info',
    label: 'Tên tour, điểm đến và mô tả chi tiết',
    isComplete: hasBasic,
    summaryText: hasBasic ? 'Đầy đủ thông tin' : 'Chưa hoàn thành',
    isMandatory: true,
  });

  // 2. Itinerary with stops (BR-101)
  const totalStops = tour.itinerary
    ? tour.itinerary.reduce((acc, day) => acc + (day.activities?.length || 0), 0)
    : 0;
  const hasItinerary = Boolean(tour.itinerary && tour.itinerary.length >= 1 && totalStops >= 1);
  items.push({
    key: 'itinerary',
    label: 'Lịch trình chi tiết và điểm tham quan',
    isComplete: hasItinerary,
    summaryText: hasItinerary ? `${totalStops} điểm dừng` : 'Cần ít nhất 1 điểm dừng',
    isMandatory: true,
  });

  // 3. Pricing and slot capacity (BR-101, BR-79)
  const hasPriceCapacity = tour.basePrice > 0 && tour.maxCapacity > 0;
  items.push({
    key: 'pricing-capacity',
    label: 'Giá tour và sức chứa chỗ',
    isComplete: hasPriceCapacity,
    summaryText: hasPriceCapacity ? 'Đã thiết lập' : 'Chưa hợp lệ',
    isMandatory: true,
  });

  // 4. Cancellation policy (BR-101)
  const hasPolicy = Boolean(tour.cancellationPolicy && tour.cancellationPolicy.trim().length > 0);
  items.push({
    key: 'cancellation-policy',
    label: 'Chính sách hủy tour',
    isComplete: hasPolicy,
    summaryText: hasPolicy ? 'Đã chọn chính sách' : 'Bắt buộc chọn',
    isMandatory: true,
  });

  // 5. Departure schedule (BR-101, BR-22)
  const hasSchedule = Boolean(tour.schedules && tour.schedules.length >= 1);
  items.push({
    key: 'schedules',
    label: 'Lịch khởi hành mở bán',
    isComplete: hasSchedule,
    summaryText: hasSchedule ? `${tour.schedules.length} lịch khởi hành` : 'Cần ít nhất 1 lịch',
    isMandatory: true,
  });

  // 6. Cover photo. The backend requires an active primary image, so it is mandatory
  // whenever the server has reported readiness for this tour (real mode).
  const media = 'media' in tour && tour.media ? tour.media : [];
  const photoCount = media.length;
  const hasPrimaryPhoto = media.some((item) => item.isPrimary);
  const serverReadiness = 'reviewBlockers' in tour ? tour.reviewBlockers : undefined;
  const hasPhotos = serverReadiness ? hasPrimaryPhoto : photoCount >= 1;
  items.push({
    key: 'photos',
    label: 'Hình ảnh đại diện gói tour',
    isComplete: hasPhotos,
    summaryText: hasPhotos
      ? `${photoCount} hình ảnh`
      : serverReadiness && photoCount > 0 ? 'Cần chọn một ảnh đại diện' : 'Chưa tải ảnh',
    isMandatory: serverReadiness !== undefined,
  });

  // The server is the authority on review prerequisites: honour any blocker it still reports.
  if (serverReadiness) {
    const blockerToItem: Record<string, string> = {
      required_fields_missing: 'basic-info',
      itinerary_missing: 'itinerary',
      primary_image_missing: 'photos',
      future_departure_missing: 'schedules',
      cancellation_policy_missing: 'cancellation-policy',
      destination_missing: 'basic-info',
    };
    for (const blocker of serverReadiness) {
      const item = items.find((candidate) => candidate.key === blockerToItem[blocker]);
      if (item) {
        item.isComplete = false;
        item.isMandatory = true;
        item.summaryText = REVIEW_BLOCKER_MESSAGES[blocker] ?? item.summaryText;
      } else {
        items.push({ key: blocker, label: 'Điều kiện gửi duyệt từ máy chủ', isComplete: false,
          summaryText: 'Vui lòng tải lại tour và kiểm tra thông tin trước khi gửi duyệt.', isMandatory: true });
      }
    }
  }

  if ('canSubmitForReview' in tour && tour.canSubmitForReview === false && !items.some((item) => item.isMandatory && !item.isComplete)) {
    items.push({ key: 'server-readiness', label: 'Điều kiện gửi duyệt từ máy chủ', isComplete: false,
      summaryText: 'Tour chưa được phép gửi duyệt. Vui lòng tải lại để kiểm tra trạng thái.', isMandatory: true });
  }

  const mandatoryItems = items.filter((item) => item.isMandatory);
  const missingMandatory = mandatoryItems.filter((item) => !item.isComplete);

  return {
    isEligibleForSubmission: missingMandatory.length === 0,
    items,
    missingCount: missingMandatory.length,
  };
}

// In-memory demo state for interactive UI preview
let demoToursStore: TourPackageDto[] = [...INITIAL_DEMO_TOURS];

export function resetDemoToursStore(): void {
  demoToursStore = [...INITIAL_DEMO_TOURS];
}

/**
 * Retrieves Tour Operator tours list.
 * Real mode (NO_BACKEND) returns truthful PENDING_BE_INTEGRATION with zero fabricated records.
 */
export async function getOperatorTours(options?: {
  allowDemo?: boolean;
}): Promise<TourActionResult<TourPackageDto[]>> {
  const allowDemo = Boolean(options?.allowDemo) && isTourDemoAllowedInCurrentEnv();

  if (allowDemo) {
    return {
      status: 'SUCCESS',
      data: [...demoToursStore],
      isDemo: true,
    };
  }

  const tours = await listTours();
  return { status: 'SUCCESS', data: tours.map(mapListItem), isDemo: false };
}

/**
 * Retrieves a single Tour Package by ID.
 * Returns exact record by ID, or latest version when querying by tourCode.
 */
export async function getOperatorTourById(
  id: string,
  options?: { allowDemo?: boolean }
): Promise<TourActionResult<TourPackageDto>> {
  const allowDemo = Boolean(options?.allowDemo) && isTourDemoAllowedInCurrentEnv();

  if (allowDemo) {
    // 1. Primary lookup: deterministic unique record ID
    const exactMatch = demoToursStore.find((t) => t.id === id);
    if (exactMatch) {
      return {
        status: 'SUCCESS',
        data: { ...exactMatch },
        isDemo: true,
      };
    }

    // 2. Secondary fallback lookup by tourCode:
    // If multiple versions share the same tourCode, deterministically return the latest version
    const codeMatches = demoToursStore.filter((t) => t.tourCode === id);
    if (codeMatches.length > 0) {
      const latestVersion = [...codeMatches].sort((a, b) => b.version - a.version)[0];
      return {
        status: 'SUCCESS',
        data: { ...latestVersion },
        isDemo: true,
      };
    }

    return {
      status: 'ERROR',
      message: 'Không tìm thấy gói tour trong bộ dữ liệu mẫu.',
      isDemo: true,
    };
  }

  return { status: 'SUCCESS', data: await loadTourDetail(asBackendId(id, 'Mã gói tour')), isDemo: false };
}

/**
 * UC-35: Creates a new Tour Package as Draft.
 * Real mode does not simulate fake server persistence.
 */
export async function createTourPackage(
  payload: CreateTourPackagePayload,
  options?: { allowDemo?: boolean; idempotencyKey?: string }
): Promise<TourActionResult<TourPackageDto>> {
  const errors = validateCreateTourPackage(payload);
  if (Object.keys(errors).length > 0) {
    throw new OperatorTourValidationError(errors);
  }

  const allowDemo = Boolean(options?.allowDemo) && isTourDemoAllowedInCurrentEnv();

  if (allowDemo) {
    const newId = `tour-new-${Date.now()}`;
    const newCode = `TP-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTour: TourPackageDto = {
      id: newId,
      tourCode: newCode,
      operatorUserId: 101,
      title: payload.title,
      destination: payload.destination,
      category: payload.category || 'Du lịch trải nghiệm',
      durationDays: payload.durationDays,
      basePrice: payload.basePrice,
      childPrice: payload.childPrice,
      maxCapacity: payload.maxCapacity,
      description: payload.description,
      inclusions: payload.inclusions,
      exclusions: payload.exclusions,
      highlights: payload.highlights,
      travellerRequirements: payload.travellerRequirements,
      allowDeposit: Boolean(payload.allowDeposit),
      depositPercent: payload.allowDeposit ? (payload.depositPercent ?? null) : null,
      balanceDueDaysBeforeDeparture: payload.allowDeposit ? (payload.balanceDueDaysBeforeDeparture ?? null) : null,
      cancellationPolicy: payload.cancellationPolicy,
      status: 'Draft',
      version: 1,
      itinerary: payload.itinerary,
      schedules: payload.schedules,
      media: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDemo: true,
    };

    demoToursStore = [newTour, ...demoToursStore];

    return {
      status: 'SUCCESS',
      data: newTour,
      message: OPERATOR_TOUR_MESSAGES.CREATE_SUCCESS,
      isDemo: true,
    };
  }

  // The caller keeps one key per unchanged payload so a retry after a lost response replays the same draft.
  const created = await createTour(
    toBackendPayload(payload),
    options?.idempotencyKey ?? crypto.randomUUID(),
  ).catch(rethrowMappedValidationError);
  try {
    for (let index = 0; index < (payload.mediaFiles?.length ?? 0); index += 1) {
      const file = payload.mediaFiles![index];
      await uploadTourMedia(created.tourId, file, `${payload.title} - ${file.name}`.slice(0, 500), index === 0, crypto.randomUUID());
    }
  } catch {
    return { status: 'SUCCESS', data: await loadTourDetail(created.tourId), message: 'Đã lưu bản nháp. Hình ảnh chưa tải được, bạn có thể thử lại trong màn hình chỉnh sửa.', isDemo: false };
  }
  return {
    status: 'SUCCESS',
    data: await loadTourDetail(created.tourId),
    message: OPERATOR_TOUR_MESSAGES.CREATE_SUCCESS,
    isDemo: false,
  };
}

/**
 * UC-36: Updates an existing Tour Package.
 * Adheres to BR-103 version preservation and BR-61 capacity constraints.
 * Editing an Approved tour creates a distinct Draft vN+1 record while keeping
 * the original Approved version intact in the demo store.
 */
/**
 * UC-36 direct edit. Only for `Draft`/`Rejected` tours — an `Approved`/`Published` tour is edited
 * through a draft version instead (`createOrResumeDraftVersion`/`saveDraftVersion`/
 * `submitDraftVersion` below), never through this function.
 */
export async function updateTourPackage(
  payload: UpdateTourPackagePayload,
  options: {
    allowDemo?: boolean;
    currentTour: TourPackageDto;
    createNewVersion?: boolean;
  }
): Promise<TourActionResult<TourPackageDto>> {
  const { currentTour, createNewVersion } = options;

  // Validation
  const errors = validateUpdateTourPackage(payload, currentTour);
  if (Object.keys(errors).length > 0) {
    throw new OperatorTourValidationError(errors);
  }

  // Lifecycle rules (§3.8.2.2)
  if (currentTour.status === 'Pending') {
    return {
      status: 'ERROR',
      message: OPERATOR_TOUR_MESSAGES.PENDING_READ_ONLY,
    };
  }

  if (currentTour.status === 'Inactive') {
    return {
      status: 'ERROR',
      message: 'Gói tour đang ngừng hoạt động và không thể chỉnh sửa.',
    };
  }

  if (currentTour.status === 'Approved' || currentTour.status === 'Published') {
    if (!createNewVersion) {
      return {
        status: 'ERROR',
        message: OPERATOR_TOUR_MESSAGES.APPROVED_DIRECT_EDIT,
      };
    }

    const allowDemo = Boolean(options?.allowDemo) && isTourDemoAllowedInCurrentEnv();

    if (allowDemo) {
      // BR-103 Lineage Resolution:
      // An Approved tour must NEVER be edited in place. Retain the original Approved record unchanged.
      if (!demoToursStore.some((t) => t.id === currentTour.id)) {
        demoToursStore = [...demoToursStore, currentTour];
      }

      // Search the store for all records belonging to the same tourCode lineage.
      const lineage = demoToursStore.filter((t) => t.tourCode === currentTour.tourCode);
      const successors = lineage.filter((t) => t.version > currentTour.version);

      // 1. Fail closed if any successor is currently Pending approval (MSG122)
      const pendingSuccessor = successors.find((t) => t.status === 'Pending');
      if (pendingSuccessor) {
        return {
          status: 'ERROR',
          message: OPERATOR_TOUR_MESSAGES.PENDING_READ_ONLY,
          isDemo: true,
        };
      }

      // 2. Reuse / update existing editable Draft or Rejected successor if one exists
      const editableSuccessor = successors.find(
        (t) => t.status === 'Draft' || t.status === 'Rejected'
      );
      if (editableSuccessor) {
        const updatedSuccessor: TourPackageDto = {
          ...editableSuccessor,
          title: payload.title,
          destination: payload.destination,
          category: payload.category || editableSuccessor.category,
          durationDays: payload.durationDays,
          basePrice: payload.basePrice,
          childPrice: payload.childPrice,
          maxCapacity: payload.maxCapacity,
          description: payload.description,
          inclusions: payload.inclusions,
          exclusions: payload.exclusions,
          highlights: payload.highlights,
          travellerRequirements: payload.travellerRequirements,
          allowDeposit: Boolean(payload.allowDeposit),
          depositPercent: payload.allowDeposit ? (payload.depositPercent ?? null) : null,
          balanceDueDaysBeforeDeparture: payload.allowDeposit ? (payload.balanceDueDaysBeforeDeparture ?? null) : null,
          cancellationPolicy: payload.cancellationPolicy,
          itinerary: payload.itinerary,
          schedules: payload.schedules,
          status: 'Draft',
          updatedAt: new Date().toISOString(),
          isDemo: true,
        };

        demoToursStore = demoToursStore.map((t) =>
          t.id === editableSuccessor.id ? updatedSuccessor : t
        );

        return {
          status: 'SUCCESS',
          data: updatedSuccessor,
          message: OPERATOR_TOUR_MESSAGES.UPDATE_SUCCESS,
          isDemo: true,
        };
      }

      // 3. Otherwise allocate maxVersion + 1 with guaranteed store-wide unique record ID
      const maxVersion = lineage.reduce(
        (max, t) => Math.max(max, t.version),
        currentTour.version
      );
      const nextVersion = maxVersion + 1;

      let candidateId = `${currentTour.id}-draft-v${nextVersion}`;
      let counter = 1;
      while (demoToursStore.some((t) => t.id === candidateId)) {
        candidateId = `${currentTour.id}-draft-v${nextVersion}-${counter++}`;
      }
      const newDraftId = candidateId;

      const draftTour: TourPackageDto = {
        ...currentTour,
        id: newDraftId,
        tourCode: currentTour.tourCode, // preserve logical tour/package identity
        version: nextVersion,
        status: 'Draft',
        title: payload.title,
        destination: payload.destination,
        category: payload.category || currentTour.category,
        durationDays: payload.durationDays,
        basePrice: payload.basePrice,
        childPrice: payload.childPrice,
        maxCapacity: payload.maxCapacity,
        description: payload.description,
        inclusions: payload.inclusions,
        exclusions: payload.exclusions,
        highlights: payload.highlights,
        travellerRequirements: payload.travellerRequirements,
        allowDeposit: Boolean(payload.allowDeposit),
        depositPercent: payload.allowDeposit ? (payload.depositPercent ?? null) : null,
        balanceDueDaysBeforeDeparture: payload.allowDeposit ? (payload.balanceDueDaysBeforeDeparture ?? null) : null,
        cancellationPolicy: payload.cancellationPolicy,
        itinerary: payload.itinerary,
        schedules: payload.schedules,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDemo: true,
      };

      // Add the new Draft version to the demo store without replacing the Approved tour
      demoToursStore = [draftTour, ...demoToursStore];

      return {
        status: 'SUCCESS',
        data: draftTour,
        message: OPERATOR_TOUR_MESSAGES.UPDATE_SUCCESS,
        isDemo: true,
      };
    }

    const created = await createTour({
      ...toBackendPayload(payload),
      sourceTourId: asBackendId(currentTour.id, 'Mã gói tour nguồn'),
    }, crypto.randomUUID()).catch(rethrowMappedValidationError);
    return {
      status: 'SUCCESS',
      data: await loadTourDetail(created.tourId),
      message: OPERATOR_TOUR_MESSAGES.UPDATE_SUCCESS,
      isDemo: false,
    };
  }

  const allowDemo = Boolean(options?.allowDemo) && isTourDemoAllowedInCurrentEnv();

  if (allowDemo) {
    // Draft or Rejected tour editing: update the existing editable record in place
    const updatedTour: TourPackageDto = {
      ...currentTour,
      title: payload.title,
      destination: payload.destination,
      category: payload.category || currentTour.category,
      durationDays: payload.durationDays,
      basePrice: payload.basePrice,
      childPrice: payload.childPrice,
      maxCapacity: payload.maxCapacity,
      description: payload.description,
      inclusions: payload.inclusions,
      exclusions: payload.exclusions,
      highlights: payload.highlights,
      travellerRequirements: payload.travellerRequirements,
      allowDeposit: Boolean(payload.allowDeposit),
      depositPercent: payload.allowDeposit ? (payload.depositPercent ?? null) : null,
      balanceDueDaysBeforeDeparture: payload.allowDeposit ? (payload.balanceDueDaysBeforeDeparture ?? null) : null,
      cancellationPolicy: payload.cancellationPolicy,
      status: currentTour.status,
      version: currentTour.version,
      itinerary: payload.itinerary,
      schedules: payload.schedules,
      updatedAt: new Date().toISOString(),
      isDemo: true,
    };

    demoToursStore = demoToursStore.map((t) => (t.id === currentTour.id ? updatedTour : t));

    return {
      status: 'SUCCESS',
      data: updatedTour,
      message: OPERATOR_TOUR_MESSAGES.UPDATE_SUCCESS,
      isDemo: true,
    };
  }

  const tourId = asBackendId(payload.id, 'Mã gói tour');
  await updateTour(tourId, toBackendPayload(payload)).catch(rethrowMappedValidationError);
  return { status: 'SUCCESS', data: await loadTourDetail(tourId), message: OPERATOR_TOUR_MESSAGES.UPDATE_SUCCESS, isDemo: false };
}

/**
 * A client-only schedule row's id (e.g. `sch-user-3`) is never a plain positive integer; a row
 * loaded from the server (draft or live) always is. `scheduleId: null` tells the backend this is
 * a newly proposed schedule rather than an update to an existing `TourSchedule` row (spec TM-82 §4
 * — the backend updates a matched id in place and never replaces a past-departure schedule, so
 * losing an existing id here would silently create a duplicate instead of updating it).
 */
function toPendingChangeScheduleId(id: string): number | null {
  return /^\d+$/.test(id) ? Number(id) : null;
}

function toPendingChangeSchedule(
  schedule: CreateTourPackagePayload['schedules'][number],
  payload: CreateTourPackagePayload,
): ApiPendingChangeScheduleItem {
  const base = toBackendSchedule(schedule, payload);
  return { scheduleId: toPendingChangeScheduleId(schedule.id), ...base };
}

/** Mirrors `toBackendPayload`, but for `PUT .../pending-changes/{id}` (TM-82 §4 — a distinct DTO). */
function toPendingChangeSaveBody(payload: UpdateTourPackagePayload): ApiPendingChangeSaveBody {
  const backend = toBackendPayload(payload);
  return {
    title: backend.title,
    description: backend.description,
    categoryId: backend.categoryId,
    basePrice: backend.basePrice,
    durationDays: backend.durationDays,
    destinationIds: backend.destinationIds,
    cancellationPolicyTemplateId: backend.cancellationPolicyTemplateId,
    inclusions: backend.inclusions,
    exclusions: backend.exclusions,
    highlights: backend.highlights,
    travellerRequirements: backend.travellerRequirements,
    timeZoneId: backend.timeZoneId,
    itineraryItems: backend.itineraryItems,
    schedules: payload.schedules.map((schedule) => toPendingChangeSchedule(schedule, payload)),
  };
}

function mapPendingChangeItineraryItem(item: ApiItineraryItem, index: number): TourPackageDto['itinerary'][number]['activities'][number] {
  const [transport = '', ...noteParts] = (item.notes ?? '').split(' | ');
  return {
    id: `${item.dayNo}-${item.sequenceNo}-${index}`,
    time: item.plannedTime?.slice(0, 5) ?? '',
    poiId: item.poiId,
    poiName: `POI #${item.poiId}`,
    stayDurationMinutes: item.stayDurationMinutes,
    transport,
    notes: noteParts.join(' | ') || undefined,
  };
}

function mapPendingChangeSchedule(schedule: ApiPendingChangeScheduleItem): TourPackageDto['schedules'][number] {
  return {
    // A new proposed schedule (scheduleId: null) has no server id yet; give it a stable
    // client-only one so the form can track it until the next save assigns a real id.
    id: schedule.scheduleId === null ? `sch-pending-${crypto.randomUUID()}` : String(schedule.scheduleId),
    departureDate: dateOnly(schedule.startAtUtc),
    returnDate: dateOnly(schedule.endAtUtc),
    totalCapacity: schedule.totalCapacity,
    reservedCapacity: 0, // Pending changes never carry a reserved-capacity figure of their own (spec §4).
    meetingPoint: schedule.meetingPoint ?? undefined,
    status: 'Scheduled',
    minimumCapacity: schedule.minimumCapacity,
    adultPrice: schedule.adultPrice ?? undefined,
    childPrice: schedule.childPrice,
    infantPrice: schedule.infantPrice,
    registrationDeadlineDate: schedule.registrationDeadlineAtUtc ? dateOnly(schedule.registrationDeadlineAtUtc) : '',
    serverTerms: {
      startAtUtc: schedule.startAtUtc,
      endAtUtc: schedule.endAtUtc,
      minimumCapacity: schedule.minimumCapacity,
      registrationDeadlineAtUtc: schedule.registrationDeadlineAtUtc,
      adultPrice: schedule.adultPrice,
      childPrice: schedule.childPrice,
      infantPrice: schedule.infantPrice,
    },
  };
}

/**
 * Maps a draft version (`TourPendingChangeSet`, read via `GetCurrentPendingChangeResponse`) onto
 * the same `TourPackageDto` shape the Operator UI already renders for a live tour, so
 * `UpdateTourPackageView` does not need two separate rendering code paths. `id`/`status` on the
 * returned DTO describe the **draft version itself** (e.g. `status: 'PendingReview'` while Staff
 * is reviewing it), not the live tour, which is the entire point of this flow (spec TM-82 §5.3).
 */
function mapPendingChangeToDto(pendingChange: ApiPendingChange, liveTour: TourPackageDto): TourPackageDto {
  const itinerary = new Map<number, TourPackageDto['itinerary'][number]>();
  pendingChange.itineraryItems.forEach((item, index) => {
    const day = itinerary.get(item.dayNo) ?? { dayNo: item.dayNo, activities: [] };
    day.activities.push(mapPendingChangeItineraryItem(item, index));
    itinerary.set(item.dayNo, day);
  });
  return {
    ...liveTour,
    id: String(pendingChange.id),
    tourCode: liveTour.tourCode,
    operatorUserId: liveTour.operatorUserId,
    title: pendingChange.title,
    destination: pendingChange.destinationSummary,
    destinationIds: pendingChange.destinationIds,
    category: pendingChange.categoryId ? String(pendingChange.categoryId) : '',
    durationDays: pendingChange.durationDays,
    basePrice: pendingChange.basePrice,
    childPrice: pendingChange.schedules[0]?.childPrice ?? undefined,
    maxCapacity: pendingChange.schedules[0]?.totalCapacity ?? 0,
    description: pendingChange.description,
    inclusions: pendingChange.inclusions ?? undefined,
    exclusions: pendingChange.exclusions ?? undefined,
    highlights: pendingChange.highlights ?? undefined,
    travellerRequirements: pendingChange.travellerRequirements ?? undefined,
    timeZoneId: pendingChange.timeZoneId,
    cancellationPolicy: pendingChange.cancellationPolicyTemplateId
      ? String(pendingChange.cancellationPolicyTemplateId) : '',
    status: statusFromApi(pendingChange.status),
    rejectionReason: pendingChange.rejectionReason ?? undefined,
    submittedAtUtc: pendingChange.submittedAtUtc,
    itinerary: [...itinerary.values()].sort((a, b) => a.dayNo - b.dayNo),
    schedules: pendingChange.schedules.map(mapPendingChangeSchedule),
    createdAt: pendingChange.createdAtUtc,
    updatedAt: pendingChange.updatedAtUtc,
    isDemo: false,
  };
}

/**
 * Creates (or resumes, idempotently) the open draft version for an `Approved`/`Published` tour,
 * then loads its full proposed content (spec TM-82 §5.1/§5.3, edge cases 1-2). Call this — never
 * `updateTourPackage` — to start editing such a tour.
 */
export async function createOrResumeDraftVersion(
  tourId: string,
  liveTour: TourPackageDto,
): Promise<TourPackageDto> {
  const id = asBackendId(tourId, 'Mã gói tour');
  await createOrResumePendingChange(id);
  const pendingChange = await getCurrentPendingChange(id);
  if (!pendingChange) {
    throw new Error('Không tìm thấy bản nháp vừa tạo hoặc tiếp tục. Vui lòng tải lại trang.');
  }
  return mapPendingChangeToDto(pendingChange, liveTour);
}

/** Saves a draft version's content. Only valid while the draft is `Draft`/`Rejected` (spec §5.1). */
export async function saveDraftVersion(
  tourId: string,
  pendingChangeId: string,
  payload: UpdateTourPackagePayload,
  liveTour: TourPackageDto,
): Promise<TourActionResult<TourPackageDto>> {
  const errors = validateUpdateTourPackage(payload, liveTour);
  if (Object.keys(errors).length > 0) {
    throw new OperatorTourValidationError(errors);
  }
  const tId = asBackendId(tourId, 'Mã gói tour');
  const pcId = asBackendId(pendingChangeId, 'Mã bản nháp');
  await savePendingChange(tId, pcId, toPendingChangeSaveBody(payload));
  const pendingChange = await getCurrentPendingChange(tId);
  if (!pendingChange) {
    throw new Error('Không tìm thấy bản nháp sau khi lưu. Vui lòng tải lại trang.');
  }
  return {
    status: 'SUCCESS',
    data: mapPendingChangeToDto(pendingChange, liveTour),
    message: OPERATOR_TOUR_MESSAGES.UPDATE_SUCCESS,
    isDemo: false,
  };
}

/** Discards (deletes) a draft version outright. Only valid while `Draft`/`Rejected` (spec §5.1). */
export async function discardDraftVersion(tourId: string, pendingChangeId: string): Promise<void> {
  await discardPendingChange(asBackendId(tourId, 'Mã gói tour'), asBackendId(pendingChangeId, 'Mã bản nháp'));
}

/** Submits a draft version for Staff review. Only valid while `Draft`/`Rejected` (spec §5.1). */
export async function submitDraftVersion(
  tourId: string,
  pendingChangeId: string,
  liveTour: TourPackageDto,
): Promise<TourActionResult<TourPackageDto>> {
  const tId = asBackendId(tourId, 'Mã gói tour');
  await submitPendingChange(tId, asBackendId(pendingChangeId, 'Mã bản nháp'));
  const pendingChange = await getCurrentPendingChange(tId);
  if (!pendingChange) {
    throw new Error('Không tìm thấy bản nháp sau khi gửi duyệt. Vui lòng tải lại trang.');
  }
  return {
    status: 'SUCCESS',
    data: mapPendingChangeToDto(pendingChange, liveTour),
    message: OPERATOR_TOUR_MESSAGES.SUBMIT_SUCCESS,
    isDemo: false,
  };
}

/**
 * UC-37: Submits a Tour Package for Staff approval.
 * Adheres to BR-104 allow-list (ONLY Draft or Rejected) and BR-101 completeness.
 * Status eligibility is strictly evaluated BEFORE completeness checks.
 */
export async function submitTourForApproval(
  tourId: string,
  options: {
    allowDemo?: boolean;
    currentTour: TourPackageDto;
    note?: string;
  }
): Promise<TourActionResult<TourPackageDto>> {
  const { currentTour } = options;
  const submissionNote = options.note?.trim() || null;
  if (submissionNote && submissionNote.length > 4000) {
    throw new Error('Ghi chú không được vượt quá 4.000 ký tự.');
  }

  // 1. Status eligibility (BR-104 allow-list: ONLY Draft or Rejected)
  // Check BEFORE evaluateTourCompleteness so non-submittable tours fail immediately
  if (currentTour.status === 'Pending') {
    return {
      status: 'ERROR',
      message: 'Gói tour đã ở trạng thái chờ duyệt.',
    };
  }
  if (currentTour.status === 'Approved') {
    return {
      status: 'ERROR',
      message: 'Gói tour đã được phê duyệt. Vui lòng tạo phiên bản nháp mới nếu muốn chỉnh sửa.',
    };
  }
  const isSubmittableStatus =
    currentTour.status === 'Draft' || currentTour.status === 'Rejected';
  if (!isSubmittableStatus) {
    return {
      status: 'ERROR',
      message: 'Chỉ gói tour ở trạng thái Bản nháp hoặc Bị từ chối mới có thể gửi xét duyệt.',
    };
  }

  // 2. Completeness check (BR-101)
  const completeness = evaluateTourCompleteness(currentTour);
  if (!completeness.isEligibleForSubmission) {
    throw new Error('Vui lòng hoàn thành tất cả các mục bắt buộc trước khi gửi xét duyệt.');
  }

  const allowDemo = Boolean(options?.allowDemo) && isTourDemoAllowedInCurrentEnv();

  if (allowDemo) {
    const submittedTour: TourPackageDto = {
      ...currentTour,
      status: 'Pending',
      submissionNote,
      submittedAtUtc: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDemo: true,
    };

    demoToursStore = demoToursStore.map((t) => (t.id === tourId ? submittedTour : t));

    return {
      status: 'SUCCESS',
      data: submittedTour,
      message: OPERATOR_TOUR_MESSAGES.SUBMIT_SUCCESS,
      isDemo: true,
    };
  }

  const response = await submitTour(asBackendId(tourId, 'Mã gói tour'), submissionNote);
  // The command confirms persistence. A failed subsequent read must not turn it into a failed write.
  return { status: 'SUCCESS', data: { ...currentTour, status: 'Pending', submissionNote,
    submittedAtUtc: response.submittedAtUtc ?? null, canSubmitForReview: false },
    message: OPERATOR_TOUR_MESSAGES.SUBMIT_SUCCESS, isDemo: false };
}


/** Validates a cover-photo file before any request (BR-16 -> MSG19). */
export function validateTourImage(file: File): string | null {
  const isImage = file.type.toLowerCase().startsWith('image/');
  return !isImage || file.size > MAX_IMAGE_BYTES ? OPERATOR_TOUR_MESSAGES.INVALID_MEDIA : null;
}

/**
 * Uploads one image through the backend media flow and returns the refreshed list.
 * The first image becomes the primary one. The caller keeps one idempotencyKey per chosen file so a
 * retry after a lost response does not store the picture twice.
 */
export async function uploadTourImage(
  tourId: string,
  file: File,
  altText: string,
  options: { makePrimary: boolean; idempotencyKey: string },
): Promise<TourPackageDto['media']> {
  const invalid = validateTourImage(file);
  if (invalid) throw new Error(invalid);
  if (!altText.trim()) throw new Error('Vui lòng nhập mô tả ngắn cho ảnh (văn bản thay thế).');
  const id = asBackendId(tourId, 'Mã gói tour');
  await uploadTourMedia(id, file, altText.trim(), options.makePrimary, options.idempotencyKey);
  return mapMedia(await listTourMedia(id));
}

export async function setPrimaryTourImage(tourId: string, mediaId: string): Promise<TourPackageDto['media']> {
  const id = asBackendId(tourId, 'Mã gói tour');
  const current = await listTourMedia(id);
  const ordered = current.slice().sort((a, b) => a.sortOrder - b.sortOrder).map((item) => item.tourMediaId);
  return mapMedia(await reorderTourMedia(id, ordered, asBackendId(mediaId, 'Mã ảnh')));
}

export async function reorderTourImages(
  tourId: string,
  orderedIds: string[],
  primaryMediaId: string,
): Promise<TourPackageDto['media']> {
  const id = asBackendId(tourId, 'Mã gói tour');
  return mapMedia(
    await reorderTourMedia(
      id,
      orderedIds.map((mediaId) => asBackendId(mediaId, 'Mã ảnh')),
      asBackendId(primaryMediaId, 'Mã ảnh đại diện'),
    ),
  );
}

export async function addOperatorTourDeparture(
  tourId: string,
  schedule: TourDepartureSchedule,
  options: {
    allowDemo?: boolean;
    currentTour: TourPackageDto;
    idempotencyKey: string;
  },
): Promise<TourActionResult<TourPackageDto>> {
  const { currentTour } = options;
  if (currentTour.status !== 'Approved' && currentTour.status !== 'Published') {
    return {
      status: 'ERROR',
      message: 'Chỉ có thể mở bán đợt khởi hành mới cho gói tour đã được duyệt hoặc đang xuất bản.',
    };
  }

  const normalizedSchedule: TourDepartureSchedule = {
    ...schedule,
    adultPrice: schedule.adultPrice ?? currentTour.basePrice,
  };
  const existingDates = new Set(currentTour.schedules.filter((s) => s.status === 'Scheduled').map((s) => s.departureDate));
  const validationError = validateScheduleEntry(
    normalizedSchedule,
    currentTour.durationDays,
    vietnamToday(),
    existingDates,
  );
  if (validationError) {
    throw new OperatorTourValidationError({ schedules: validationError });
  }

  const allowDemo = Boolean(options.allowDemo) && isTourDemoAllowedInCurrentEnv();
  if (allowDemo) {
    const updatedTour: TourPackageDto = {
      ...currentTour,
      schedules: [...currentTour.schedules, { ...normalizedSchedule, id: `sch-${Date.now()}`, reservedCapacity: 0, status: 'Scheduled', isCompleted: false }],
      updatedAt: new Date().toISOString(),
      isDemo: true,
    };
    demoToursStore = demoToursStore.map((t) => (t.id === currentTour.id ? updatedTour : t));
    return {
      status: 'SUCCESS',
      data: updatedTour,
      message: OPERATOR_TOUR_MESSAGES.ADD_DEPARTURE_SUCCESS,
      isDemo: true,
    };
  }

  const body: ApiAddDepartureRequest = {
    startAtUtc: toIsoDateTime(normalizedSchedule.departureDate, 'start'),
    endAtUtc: toIsoDateTime(normalizedSchedule.returnDate, 'end'),
    meetingPoint: normalizedSchedule.meetingPoint?.trim() || null,
    totalCapacity: normalizedSchedule.totalCapacity,
    minimumCapacity: Math.min(normalizedSchedule.minimumCapacity ?? 1, normalizedSchedule.totalCapacity),
    registrationDeadlineAtUtc: normalizedSchedule.registrationDeadlineDate
      ? `${normalizedSchedule.registrationDeadlineDate}T00:00:00.000Z`
      : null,
    adultPrice: normalizedSchedule.adultPrice ?? currentTour.basePrice,
    childPrice: normalizedSchedule.childPrice ?? null,
    infantPrice: normalizedSchedule.infantPrice ?? null,
    meetingLatitude: normalizedSchedule.meetingLatitude ?? null,
    meetingLongitude: normalizedSchedule.meetingLongitude ?? null,
  };

  const id = asBackendId(tourId, 'Mã gói tour');
  await addTourDeparture(id, body, options.idempotencyKey);
  return {
    status: 'SUCCESS',
    data: await loadTourDetail(id),
    message: OPERATOR_TOUR_MESSAGES.ADD_DEPARTURE_SUCCESS,
    isDemo: false,
  };
}

export async function removeTourImage(tourId: string, mediaId: string): Promise<TourPackageDto['media']> {
  const id = asBackendId(tourId, 'Mã gói tour');
  await deleteTourMedia(id, asBackendId(mediaId, 'Mã ảnh'));
  return mapMedia(await listTourMedia(id));
}

export async function removeOperatorTour(tourId: string): Promise<void> {
  await deleteOperatorTour(asBackendId(tourId, 'Mã gói tour'));
}
