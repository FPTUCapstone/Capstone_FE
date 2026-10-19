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
  type TourPackageDto,
  type TourValidationErrors,
  type UpdateTourPackagePayload,
} from '../types/tourLifecycle';
import {
  createTour,
  getTour,
  listTourMedia,
  uploadTourMedia,
  reorderTourMedia,
  deleteTourMedia,
  deleteOperatorTour,
  listCancellationPolicies,
  listDestinations,
  listCategories,
  searchSelectablePois,
  listTours,
  submitTour,
  updateTour,
  type ApiCreateTour,
  type ApiTourDetail,
  type ApiTourListItem,
  type ApiTourMedia,
} from './operatorTourApi';

export { OperatorTourApiError } from './operatorTourApi';
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

function toIsoDateTime(date: string, time: 'start' | 'end'): string {
  return `${date}T${time === 'start' ? '00:00:00.000' : '23:59:59.999'}Z`;
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
  // Keep the exact instants and prices the backend already holds unless the operator moved the date.
  const unchangedDates =
    terms !== undefined &&
    dateOnly(terms.startAtUtc) === schedule.departureDate &&
    dateOnly(terms.endAtUtc) === schedule.returnDate;
  // An untouched deadline keeps the server's exact instant; an edited one is a UTC date at midnight.
  const editedDeadline = schedule.registrationDeadlineDate;
  const serverDeadline = terms?.registrationDeadlineAtUtc ?? null;
  const deadlineUntouched =
    editedDeadline === undefined || editedDeadline === (serverDeadline ? dateOnly(serverDeadline) : '');
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

function dateOnly(value: string): string { return value.slice(0, 10); }

function vietnamToday(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

const API_TOUR_STATUSES: readonly TourPackageDto['status'][] = [
  'Draft', 'Pending', 'Approved', 'Rejected', 'Published', 'Inactive',
];

/** An unknown status is a contract error: never present it as an editable Draft. */
function statusFromApi(value: string): TourPackageDto['status'] {
  const status = API_TOUR_STATUSES.find((candidate) => candidate === value);
  if (!status) throw new Error(`Trạng thái gói tour không được hỗ trợ: ${value}.`);
  return status;
}

function mapDetail(detail: ApiTourDetail, media: ApiTourMedia[] = []): TourPackageDto {
  const itinerary = new Map<number, TourPackageDto['itinerary'][number]>();
  for (const item of detail.itineraryItems) {
    const day = itinerary.get(item.dayNo) ?? { dayNo: item.dayNo, activities: [] };
    const [transport = '', ...noteParts] = (item.notes ?? '').split(' | ');
    day.activities.push({
      id: `${item.dayNo}-${item.sequenceNo}`,
      time: item.plannedTime?.slice(0, 5) ?? '',
      poiId: item.poiId,
      poiName: `POI #${item.poiId}`,
      stayDurationMinutes: item.stayDurationMinutes,
      transport,
      notes: noteParts.join(' | ') || undefined,
    });
    itinerary.set(item.dayNo, day);
  }
  const schedules = detail.departures.map((departure) => ({
    id: String(departure.id),
    departureDate: dateOnly(departure.startAtUtc),
    returnDate: dateOnly(departure.endAtUtc),
    totalCapacity: departure.totalCapacity,
    reservedCapacity: departure.reservedCapacity,
    meetingPoint: departure.meetingPoint ?? undefined,
    status: (departure.status === 'Cancelled' || departure.status === 'Completed'
      ? departure.status
      : 'Scheduled') as 'Scheduled' | 'Cancelled' | 'Completed',
    minimumCapacity: departure.minimumCapacity,
    adultPrice: departure.adultPrice ?? undefined,
    childPrice: departure.childPrice,
    infantPrice: departure.infantPrice,
    registrationDeadlineDate: departure.registrationDeadlineAtUtc ? dateOnly(departure.registrationDeadlineAtUtc) : '',
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
    createdAt: item.updatedAtUtc, updatedAt: item.updatedAtUtc,
  };
}

export class OperatorTourValidationError extends Error {
  errors: TourValidationErrors;

  constructor(errors: TourValidationErrors) {
    super(OPERATOR_TOUR_MESSAGES.REQUIRED_SUMMARY);
    this.name = 'OperatorTourValidationError';
    this.errors = errors;
  }
}

/**
 * Validates Tour Package creation payload per Report 3 §3.8.2.1 and BR-101, BR-22, BR-79.
 */
export function validateCreateTourPackage(
  payload: CreateTourPackagePayload
): TourValidationErrors {
  const errors: TourValidationErrors = {};

  // BR-101 Mandatory basic fields
  if (!payload.title || payload.title.trim().length === 0) {
    errors.title = OPERATOR_TOUR_MESSAGES.REQUIRED_FIELD;
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

  // Duration, Price & Capacity (BR-79, BR-101 -> MSG143)
  if (!payload.durationDays || payload.durationDays <= 0) {
    errors.durationDays = OPERATOR_TOUR_MESSAGES.POSITIVE_NUMERIC;
  }
  if (!payload.basePrice || payload.basePrice <= 0) {
    errors.basePrice = OPERATOR_TOUR_MESSAGES.POSITIVE_NUMERIC;
  }
  if (!payload.maxCapacity || payload.maxCapacity <= 0) {
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
    for (const schedule of payload.schedules) {
      if (schedule.totalCapacity <= 0) {
        errors.schedules = OPERATOR_TOUR_MESSAGES.POSITIVE_NUMERIC;
        break;
      }
      // BR-22 Departure date in past or return precedes departure
      if (schedule.departureDate < today || schedule.returnDate < schedule.departureDate) {
        errors.schedules = OPERATOR_TOUR_MESSAGES.INVALID_SCHEDULE_DATE;
        break;
      }
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
  const errors = validateCreateTourPackage(payload);

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
      }
    }
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
  const created = await createTour(toBackendPayload(payload), options?.idempotencyKey ?? crypto.randomUUID());
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
    }, crypto.randomUUID());
    return {
      status: 'SUCCESS',
      data: await loadTourDetail(created.tourId),
      message: 'Đã tạo bản nháp mới từ tour đã duyệt. Hãy kiểm tra và gửi xét duyệt lại để thay đổi có hiệu lực.',
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
  await updateTour(tourId, toBackendPayload(payload));
  return { status: 'SUCCESS', data: await loadTourDetail(tourId), message: OPERATOR_TOUR_MESSAGES.UPDATE_SUCCESS, isDemo: false };
}

/**
 * UC-37: Submits a Tour Package for Administrator approval.
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

  const response = await submitTour(asBackendId(tourId, 'Mã gói tour'));
  return { status: 'SUCCESS', data: await loadTourDetail(response.tourId), message: OPERATOR_TOUR_MESSAGES.SUBMIT_SUCCESS, isDemo: false };
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

export async function removeTourImage(tourId: string, mediaId: string): Promise<TourPackageDto['media']> {
  const id = asBackendId(tourId, 'Mã gói tour');
  await deleteTourMedia(id, asBackendId(mediaId, 'Mã ảnh'));
  return mapMedia(await listTourMedia(id));
}

export async function removeOperatorTour(tourId: string): Promise<void> {
  await deleteOperatorTour(asBackendId(tourId, 'Mã gói tour'));
}
