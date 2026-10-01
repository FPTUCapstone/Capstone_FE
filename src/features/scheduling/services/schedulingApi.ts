/**
 * TripMate UC-10 — Create Scheduling Request API Client
 * Connects to ASP.NET Core 8 backend endpoint POST /api/v1/scheduling-requests
 * with Idempotency-Key header and Bearer token.
 */

import { AuthStorage } from '@/features/auth/session/authSession';
import { getApiBase } from '@/lib/authApi';
import {
  CreateSchedulingRequestPayload,
  SchedulingResponseDto,
  SchedulingItemDto,
  CachedItineraryEnvelope,
  isValidSchedulingResponseDto,
} from '../types/schedulingTypes';

export interface CreateSchedulingResult {
  success: boolean;
  messageCode: string;
  message: string;
  data: SchedulingResponseDto;
  isSimulatedFallback?: boolean;
}

export interface SchedulingApiError {
  code?: string;
  message: string;
  status?: number;
  errors?: Record<string, string>;
}

export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const ITINERARY_STORAGE_PREFIX = 'tripmate_itinerary_';

export function saveCachedItinerary(
  itinerary: SchedulingResponseDto,
  ownerUserId?: number | string,
): void {
  if (typeof window === 'undefined') return;
  const resolvedUserId = ownerUserId ?? AuthStorage.getContext()?.userId;
  if (!resolvedUserId) return;

  const envelope: CachedItineraryEnvelope = {
    schemaVersion: 1,
    ownerUserId: resolvedUserId,
    itinerary,
  };
  const serialized = JSON.stringify(envelope);

  try {
    window.sessionStorage.setItem(
      `${ITINERARY_STORAGE_PREFIX}${resolvedUserId}_${itinerary.itineraryId}`,
      serialized,
    );
    window.sessionStorage.setItem(
      `tripmate_latest_itinerary_${resolvedUserId}`,
      serialized,
    );
  } catch {
    // quota or storage unavailable
  }
}

export function getCachedItinerary(
  itineraryId: number | string,
  currentUserId?: number | string,
): SchedulingResponseDto | null {
  if (typeof window === 'undefined') return null;
  const resolvedUserId = currentUserId ?? AuthStorage.getContext()?.userId;
  if (!resolvedUserId) return null;

  try {
    const raw = window.sessionStorage.getItem(
      `${ITINERARY_STORAGE_PREFIX}${resolvedUserId}_${itineraryId}`,
    );
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CachedItineraryEnvelope>;
      if (
        parsed &&
        parsed.schemaVersion === 1 &&
        String(parsed.ownerUserId) === String(resolvedUserId) &&
        isValidSchedulingResponseDto(parsed.itinerary) &&
        String(parsed.itinerary.itineraryId) === String(itineraryId)
      ) {
        return parsed.itinerary;
      }
    }

    const latest = window.sessionStorage.getItem(`tripmate_latest_itinerary_${resolvedUserId}`);
    if (latest) {
      const parsed = JSON.parse(latest) as Partial<CachedItineraryEnvelope>;
      if (
        parsed &&
        parsed.schemaVersion === 1 &&
        String(parsed.ownerUserId) === String(resolvedUserId) &&
        isValidSchedulingResponseDto(parsed.itinerary) &&
        String(parsed.itinerary.itineraryId) === String(itineraryId)
      ) {
        return parsed.itinerary;
      }
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Demo / test fixture helper for generating an itinerary structure.
 * Note: Marked for testing/preview purposes; NOT invoked during production request failures.
 */
export function generateDemoItineraryFixture(payload: CreateSchedulingRequestPayload): SchedulingResponseDto {
  const startDateTime = new Date(payload.startAt);
  const items: SchedulingItemDto[] = [];

  const pois = [
    {
      id: 1,
      name: 'Bảo tàng Điêu khắc Chăm Đà Nẵng',
      stayMin: 60,
      cost: 60000,
      travelMin: 15,
      reason: 'Phù hợp với sở thích Văn hóa & Di sản',
    },
    {
      id: 2,
      name: 'Cầu Rồng & Bờ sông Hàn',
      stayMin: 45,
      cost: 0,
      travelMin: 20,
      reason: 'Biểu tượng Đà Nẵng, nằm trên tuyến di chuyển tối ưu',
    },
    {
      id: 3,
      name: 'Bữa trưa đặc sản Mì Quảng Bà Mua',
      stayMin: 50,
      cost: 65000,
      travelMin: 25,
      kind: 'Rest' as const,
      reason: 'Điểm dừng nghỉ trưa nạp năng lượng & thưởng thức ẩm thực miền Trung',
    },
    {
      id: 4,
      name: 'Chùa Linh Ứng - Bán đảo Sơn Trà',
      stayMin: 75,
      cost: 0,
      travelMin: 30,
      reason: 'Cảnh quan biển ngoạn mục, tượng Phật Bà Quan Âm cao 67m',
    },
    {
      id: 5,
      name: 'Bãi biển Mỹ Khê',
      stayMin: 60,
      cost: 30000,
      travelMin: 20,
      reason: 'Top bãi biển quyến rũ nhất hành tinh, thích hợp dạo biển chiều',
    },
    {
      id: 6,
      name: 'Chợ Đêm Helio & Ẩm thực đêm',
      stayMin: 60,
      cost: 150000,
      travelMin: null,
      reason: 'Thiên đường ẩm thực đêm, giải trí và mua sắm quà lưu niệm',
    },
  ];

  let currentMinutes = 0;
  let currentCost = 0;
  const targetMinutes = Math.min(payload.availableMinutes, 720);

  for (let i = 0; i < pois.length; i++) {
    const poi = pois[i];
    const itemTotal = poi.stayMin + (poi.travelMin ?? 0);
    if (currentMinutes + itemTotal > targetMinutes && items.length >= 2) {
      break;
    }

    const arrival = new Date(startDateTime.getTime() + currentMinutes * 60000);
    const departure = new Date(arrival.getTime() + poi.stayMin * 60000);

    items.push({
      sequenceNo: items.length + 1,
      poiId: poi.id,
      poiName: poi.name,
      itemKind: (poi.kind ?? 'Visit') as 'Visit' | 'Rest',
      plannedArrival: arrival.toISOString(),
      plannedDeparture: departure.toISOString(),
      stayDurationMinutes: poi.stayMin,
      travelDurationToNextMinutes: poi.travelMin,
      estimatedCost: poi.cost,
      isMandatory: i === 0,
      recommendationReason: poi.reason,
    });

    currentMinutes += itemTotal;
    currentCost += poi.cost;
  }

  const generatedItineraryId = Math.floor(Date.now() % 1000000) + 100;
  const requestId = Math.floor(Math.random() * 9000) + 1000;

  return {
    schedulingRequestId: requestId,
    itineraryId: generatedItineraryId,
    title: `Lịch trình khám phá Đà Nẵng (${Math.round(currentMinutes / 60)} giờ)`,
    status: 'OptimalGenerated',
    totalEstimatedCost: currentCost,
    totalDurationMinutes: currentMinutes,
    items,
  };
}

/**
 * Backward compatibility alias for fixture tests
 */
export const generateSimulatedItinerary = generateDemoItineraryFixture;

/**
 * Submit a new scheduling request (UC-10).
 * Calls real ASP.NET Core 8 backend endpoint POST /api/v1/scheduling-requests with Idempotency-Key.
 *
 * In accordance with TripMate integration policy:
 * - If backend responds 201 Created: caches the verified itinerary in sessionStorage and returns success.
 * - If backend responds with error or network fails: throws real ProblemDetails / SchedulingApiError.
 * - Silent fake fallback is strictly prohibited.
 */
export async function createSchedulingRequest(
  payload: CreateSchedulingRequestPayload,
  options?: {
    accessToken?: string;
    idempotencyKey?: string;
    userId?: number | string;
  },
): Promise<CreateSchedulingResult> {
  const context = AuthStorage.getContext();
  const token = options?.accessToken ?? context?.accessToken;
  const idempotencyKey = options?.idempotencyKey ?? generateIdempotencyKey();
  const targetUserId = options?.userId ?? context?.userId;
  const API_BASE = getApiBase();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Idempotency-Key': idempotencyKey,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/scheduling-requests`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify(payload),
    });
  } catch {
    throw {
      code: 'network.unavailable',
      message:
        'Không thể kết nối đến máy chủ TripMate. Vui lòng kiểm tra kết nối mạng và thử lại sau.',
      status: 503,
    } satisfies SchedulingApiError;
  }

  if (res.status === 201) {
    const data = (await res.json()) as SchedulingResponseDto;
    saveCachedItinerary(data, targetUserId);
    return {
      success: true,
      messageCode: 'MSG30',
      message: 'Khởi tạo lịch trình tối ưu thành công! TripMate đã áp dụng thuật toán CSP hoàn tất.',
      data,
      isSimulatedFallback: false,
    };
  }

  // Handle BE errors (400, 401, 403, 409, 422, 5xx)
  let body: Record<string, unknown> = {};
  try {
    body = (await res.json()) as Record<string, unknown>;
  } catch {
    // non-JSON
  }

  const detail =
    (body.detail as string) ?? (body.message as string) ?? (body.title as string) ?? undefined;
  const errorCode = (body.errorCode as string) ?? (body.code as string) ?? undefined;
  const rawErrors = body.errors as Record<string, string | string[]> | undefined;
  let fieldErrors: Record<string, string> | undefined;

  if (rawErrors && typeof rawErrors === 'object') {
    fieldErrors = Object.fromEntries(
      Object.entries(rawErrors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
    );
  }

  if (res.status === 401) {
    throw {
      code: errorCode || 'auth.unauthorized',
      message:
        'Phiên đăng nhập đã hết hạn hoặc bạn chưa đăng nhập. Vui lòng đăng nhập tài khoản Du khách để tạo lịch trình.',
      status: 401,
      errors: fieldErrors,
    } satisfies SchedulingApiError;
  }

  if (res.status === 403) {
    throw {
      code: errorCode || 'auth.forbidden',
      message: 'Tài khoản hiện tại không có quyền tạo lịch trình du lịch.',
      status: 403,
      errors: fieldErrors,
    } satisfies SchedulingApiError;
  }

  if (res.status === 409) {
    throw {
      code: errorCode || 'planning.conflict',
      message:
        detail || 'Yêu cầu tạo lịch trình bị trùng lặp hoặc đang được xử lý. Vui lòng kiểm tra lại.',
      status: 409,
      errors: fieldErrors,
    } satisfies SchedulingApiError;
  }

  if (res.status === 422) {
    throw {
      code: errorCode || 'planning.constraints_infeasible',
      message:
        detail ||
        'Ràng buộc thời gian hoặc khu vực không khả thi để tạo lịch trình. Vui lòng mở rộng bán kính hoặc thời lượng.',
      status: 422,
      errors: fieldErrors,
    } satisfies SchedulingApiError;
  }

  throw {
    code: errorCode || 'scheduling.failed',
    message:
      detail ||
      'Yêu cầu tạo lịch trình không thành công. Vui lòng kiểm tra lại thông tin và thử lại.',
    status: res.status,
    errors: fieldErrors,
  } satisfies SchedulingApiError;
}

/**
 * UC-11 Get Suggested Itinerary By ID
 *
 * ⚠️ PENDING_BE_INTEGRATION:
/**
 * Explicit DEMO_ONLY fixture for visual development and automated testing.
 * Strictly labeled so that it is never presented as authentic user data.
 */
export function getDemoItineraryFixture(itineraryId: number | string = 'DEMO_ONLY'): SchedulingResponseDto {
  const fallbackPayload: CreateSchedulingRequestPayload = {
    startAt: new Date(Date.now() + 86400000).toISOString(),
    timeZoneId: 'Asia/Ho_Chi_Minh',
    startLatitude: 16.0544,
    startLongitude: 108.2022,
    explorationLatitude: 16.0471,
    explorationLongitude: 108.2068,
    endPoiId: null,
    returnToStart: true,
    availableMinutes: 480,
    transportMode: 'Motorbike',
    searchRadiusKm: 10,
    budgetVnd: 800000,
    mandatoryPoiIds: [],
    restPreference: 'Auto',
  };

  const simulated = generateSimulatedItinerary(fallbackPayload);
  return {
    ...simulated,
    itineraryId: typeof itineraryId === 'number' ? itineraryId : 999999,
    title: `[DEMO_ONLY] ${simulated.title}`,
    status: 'DEMO_FIXTURE',
    isDemoFixture: true,
  };
}

/**
 * Retrieve an itinerary by its ID (UC-11).
 *
 * Approved data acquisition flow:
 * A. If itinerary exists in sessionStorage from UC-10: return it.
 * B. If a real backend response exists in the future via GET /api/v1/itineraries/{id}: return it.
 * C. If neither source provides an itinerary: reject with an explicit descriptive error
 *    (Pending Backend Integration / Not Found). Never fabricate data silently.
 *
 * For development & testing fixtures only:
 * - If options.allowDemoFixture is true or itineraryId is 'demo' / 'DEMO_ONLY',
 *   returns an explicitly marked DEMO_ONLY fixture with status 'DEMO_FIXTURE'.
 */
export async function getItineraryById(
  itineraryId: number | string,
  options?: {
    accessToken?: string;
    currentUserId?: number | string;
    allowDemoFixture?: boolean;
  },
): Promise<SchedulingResponseDto> {
  // Source A: Authentic session storage cache generated genuinely by UC-10
  const cached = getCachedItinerary(itineraryId, options?.currentUserId);
  if (cached) {
    return cached;
  }

  // Explicit DEMO_ONLY fixture (for development/testing only, never silently triggered in production)
  const isDemoExplicitlyRequested =
    options?.allowDemoFixture === true ||
    String(itineraryId).toLowerCase() === 'demo' ||
    String(itineraryId).toUpperCase() === 'DEMO_ONLY';

  if (isDemoExplicitlyRequested) {
    return getDemoItineraryFixture(itineraryId);
  }

  // Source C: Neither source provided an itinerary.
  // Explicit unavailable / pending-backend state (NO silent fake data generation)
  throw new Error(
    `Không tìm thấy lịch trình #${itineraryId}. Dữ liệu không tồn tại trong bộ nhớ phiên làm việc (sessionStorage) và tính năng truy xuất lịch trình từ máy chủ đang chờ tích hợp Backend (Pending Backend Integration). Vui lòng quay lại trang Lập lịch trình để tạo kế hoạch mới.`,
  );
}
