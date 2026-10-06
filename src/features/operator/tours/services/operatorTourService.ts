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

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB per BR-16

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
  if (!payload.destination || payload.destination.trim().length === 0) {
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
    errors.itinerary = 'Gói tour phải có ít nhất 1 ngày lịch trình (BR-101, MSG01).';
  } else {
    const hasActivities = payload.itinerary.some(
      (day) => day.activities && day.activities.length > 0
    );
    if (!hasActivities) {
      errors.itinerary = 'Lịch trình phải có ít nhất 1 điểm dừng hoặc hoạt động (BR-101, MSG01).';
    }
  }

  // BR-101: At least one departure schedule
  if (!payload.schedules || payload.schedules.length === 0) {
    errors.schedules = 'Gói tour phải có ít nhất 1 lịch khởi hành (BR-101, MSG01).';
  } else {
    const today = new Date().toISOString().split('T')[0];
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

  // 6. Cover photos (Visual reference Screen #43 checklist)
  const photoCount = 'media' in tour && tour.media ? tour.media.length : 0;
  const hasPhotos = photoCount >= 1;
  items.push({
    key: 'photos',
    label: 'Hình ảnh đại diện gói tour',
    isComplete: hasPhotos,
    summaryText: hasPhotos ? `${photoCount} hình ảnh` : 'Chưa tải ảnh',
    isMandatory: false,
  });

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

  return {
    status: 'PENDING_BE_INTEGRATION',
    data: [],
    message: OPERATOR_TOUR_MESSAGES.PENDING_BE_INTEGRATION,
    isDemo: false,
  };
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

  return {
    status: 'PENDING_BE_INTEGRATION',
    message: OPERATOR_TOUR_MESSAGES.PENDING_BE_INTEGRATION,
    isDemo: false,
  };
}

/**
 * UC-35: Creates a new Tour Package as Draft.
 * Real mode does not simulate fake server persistence.
 */
export async function createTourPackage(
  payload: CreateTourPackagePayload,
  options?: { allowDemo?: boolean }
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

  return {
    status: 'PENDING_BE_INTEGRATION',
    message: OPERATOR_TOUR_MESSAGES.PENDING_BE_INTEGRATION,
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

  if (currentTour.status === 'Approved') {
    if (!createNewVersion) {
      return {
        status: 'ERROR',
        message: OPERATOR_TOUR_MESSAGES.APPROVED_DIRECT_EDIT,
      };
    }

    const allowDemo = Boolean(options?.allowDemo) && isTourDemoAllowedInCurrentEnv();

    if (allowDemo) {
      // BR-103: An Approved tour must NEVER be edited in place.
      // Retain the original Approved version N unchanged.
      // Create a NEW Draft version N+1 with a distinct record ID.
      const newDraftId = `${currentTour.id}-draft-v${currentTour.version + 1}`;
      const draftTour: TourPackageDto = {
        ...currentTour,
        id: newDraftId,
        tourCode: currentTour.tourCode, // preserve logical tour/package identity
        version: currentTour.version + 1,
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

    return {
      status: 'PENDING_BE_INTEGRATION',
      message: OPERATOR_TOUR_MESSAGES.PENDING_BE_INTEGRATION,
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

  return {
    status: 'PENDING_BE_INTEGRATION',
    message: OPERATOR_TOUR_MESSAGES.PENDING_BE_INTEGRATION,
    isDemo: false,
  };
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
      message: 'Gói tour đã ở trạng thái chờ duyệt (MSG122).',
    };
  }
  if (currentTour.status === 'Approved') {
    return {
      status: 'ERROR',
      message: 'Gói tour đã được phê duyệt. Vui lòng tạo phiên bản nháp mới nếu muốn chỉnh sửa (MSG110).',
    };
  }
  const isSubmittableStatus =
    currentTour.status === 'Draft' || currentTour.status === 'Rejected';
  if (!isSubmittableStatus) {
    return {
      status: 'ERROR',
      message: 'Chỉ gói tour ở trạng thái Bản nháp hoặc Bị từ chối mới có thể gửi xét duyệt (BR-104).',
    };
  }

  // 2. Completeness check (BR-101)
  const completeness = evaluateTourCompleteness(currentTour);
  if (!completeness.isEligibleForSubmission) {
    throw new Error('Vui lòng hoàn thành tất cả các mục bắt buộc trước khi gửi xét duyệt (BR-101, MSG01).');
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

  return {
    status: 'PENDING_BE_INTEGRATION',
    message: OPERATOR_TOUR_MESSAGES.PENDING_BE_INTEGRATION,
    isDemo: false,
  };
}
