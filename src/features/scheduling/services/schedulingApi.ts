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
  isValidSchedulingResponseDto,
  ItineraryDetailDto,
  isValidItineraryDetailDto,
  isValidItineraryId,
} from '../types/schedulingTypes';

export class ItineraryHttpError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ItineraryHttpError';
    this.status = status;
    this.code = code;
  }
}

export function isDemoAllowedInCurrentEnv(): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES === 'true'
  );
}

export interface CreateSchedulingResult {
  success: boolean;
  messageCode: string;
  message: string;
  data: SchedulingResponseDto;
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
 * Submit a new scheduling request (UC-10).
 * Calls real ASP.NET Core 8 backend endpoint POST /api/v1/scheduling-requests with Idempotency-Key.
 *
 * In accordance with TripMate integration policy:
 * - If backend responds 201 Created: runtime-validates response contract (isValidSchedulingResponseDto) and returns success.
 * - UC-11 retrieves persisted itinerary detail authoritatively via the server GET flow. No sessionStorage itinerary cache exists.
 * - If backend responds with error or network fails: throws real ProblemDetails / SchedulingApiError.
 * - Silent fake fallback is strictly prohibited.
 */
export async function createSchedulingRequest(
  payload: CreateSchedulingRequestPayload,
  options?: {
    accessToken?: string;
    idempotencyKey?: string;
  },
): Promise<CreateSchedulingResult> {
  const context = AuthStorage.getContext();
  const token = options?.accessToken ?? context?.accessToken;
  const idempotencyKey = options?.idempotencyKey ?? generateIdempotencyKey();
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
    let body: unknown;

    try {
      body = await res.json();
    } catch {
      throw {
        code: 'server.malformed_response',
        message: 'Dữ liệu phản hồi từ máy chủ không hợp lệ.',
        status: 502,
      } satisfies SchedulingApiError;
    }

    if (!isValidSchedulingResponseDto(body)) {
      throw {
        code: 'server.invalid_contract',
        message: 'Cấu trúc dữ liệu lịch trình không khớp hợp đồng TripMate.',
        status: 502,
      } satisfies SchedulingApiError;
    }

    return {
      success: true,
      messageCode: 'MSG30',
      message: 'Khởi tạo lịch trình tối ưu thành công! TripMate đã áp dụng thuật toán CSP hoàn tất.',
      data: body,
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
 * Explicit DEMO_ONLY fixture for visual development and automated testing.
 * Strictly labeled so that it is never presented as authentic user data.
 * The caller is responsible for enforcing the environment and explicit-intent gate.
 */
function getDemoItineraryFixture(
  itineraryId: number | string = 'DEMO_ONLY',
): ItineraryDetailDto {
  const numericId = typeof itineraryId === 'number' ? itineraryId : 999999;
  const now = Date.now();
  const startTime = new Date(now + 86400000);

  return {
    itineraryId: numericId,
    schedulingRequestId: 1001,
    title: '[DEMO_ONLY] Lịch trình khám phá Đà Nẵng',
    version: 1,
    status: 'DEMO_FIXTURE',
    validFrom: startTime.toISOString(),
    validTo: new Date(startTime.getTime() + 480 * 60000).toISOString(),
    canManage: true,
    totalEstimatedCost: 305000,
    totalDurationMinutes: 480,
    isDemoFixture: true,
    items: [
      {
        itemId: 1,
        sequenceNo: 1,
        poiId: 1,
        poiName: 'Bảo tàng Điêu khắc Chăm Đà Nẵng',
        category: 'Văn hóa & Di sản',
        kind: 'Visit',
        plannedArrival: startTime.toISOString(),
        plannedDeparture: new Date(startTime.getTime() + 60 * 60000).toISOString(),
        travelDurationFromPreviousMinutes: null,
        stayDurationMinutes: 60,
        estimatedCost: 60000,
        isMandatory: true,
        recommendationReason: 'Phù hợp với sở thích Văn hóa & Di sản',
        isUnavailable: false,
      },
      {
        itemId: 2,
        sequenceNo: 2,
        poiId: 2,
        poiName: 'Cầu Rồng & Bờ sông Hàn',
        category: 'Kiến trúc & Cảnh quan',
        kind: 'Visit',
        plannedArrival: new Date(startTime.getTime() + 75 * 60000).toISOString(),
        plannedDeparture: new Date(startTime.getTime() + 120 * 60000).toISOString(),
        travelDurationFromPreviousMinutes: 15,
        stayDurationMinutes: 45,
        estimatedCost: 0,
        isMandatory: false,
        recommendationReason: 'Biểu tượng Đà Nẵng, nằm trên tuyến di chuyển tối ưu',
        isUnavailable: false,
      },
      {
        itemId: 3,
        sequenceNo: 3,
        poiId: 3,
        poiName: 'Bữa trưa đặc sản Mì Quảng Bà Mua',
        category: 'Ẩm thực',
        kind: 'Rest',
        plannedArrival: new Date(startTime.getTime() + 140 * 60000).toISOString(),
        plannedDeparture: new Date(startTime.getTime() + 190 * 60000).toISOString(),
        travelDurationFromPreviousMinutes: 20,
        stayDurationMinutes: 50,
        estimatedCost: 65000,
        isMandatory: false,
        recommendationReason: 'Điểm dừng nghỉ trưa nạp năng lượng & thưởng thức ẩm thực miền Trung',
        isUnavailable: false,
      },
      {
        itemId: 4,
        sequenceNo: 4,
        poiId: 4,
        poiName: 'Chùa Linh Ứng - Bán đảo Sơn Trà',
        category: 'Tâm linh & Cảnh quan',
        kind: 'Visit',
        plannedArrival: new Date(startTime.getTime() + 215 * 60000).toISOString(),
        plannedDeparture: new Date(startTime.getTime() + 290 * 60000).toISOString(),
        travelDurationFromPreviousMinutes: 25,
        stayDurationMinutes: 75,
        estimatedCost: 0,
        isMandatory: false,
        recommendationReason: 'Cảnh quan biển ngoạn mục, tượng Phật Bà Quan Âm cao 67m',
        isUnavailable: false,
      },
      {
        itemId: 5,
        sequenceNo: 5,
        poiId: 5,
        poiName: 'Bãi biển Mỹ Khê',
        category: 'Biển & Nghỉ dưỡng',
        kind: 'Visit',
        plannedArrival: new Date(startTime.getTime() + 320 * 60000).toISOString(),
        plannedDeparture: new Date(startTime.getTime() + 380 * 60000).toISOString(),
        travelDurationFromPreviousMinutes: 30,
        stayDurationMinutes: 60,
        estimatedCost: 30000,
        isMandatory: false,
        recommendationReason: 'Top bãi biển quyến rũ nhất hành tinh, thích hợp dạo biển chiều',
        isUnavailable: false,
      },
      {
        itemId: 6,
        sequenceNo: 6,
        poiId: 6,
        poiName: 'Chợ Đêm Helio & Ẩm thực đêm',
        category: 'Mua sắm & Ẩm thực',
        kind: 'Visit',
        plannedArrival: new Date(startTime.getTime() + 400 * 60000).toISOString(),
        plannedDeparture: new Date(startTime.getTime() + 460 * 60000).toISOString(),
        travelDurationFromPreviousMinutes: 20,
        stayDurationMinutes: 60,
        estimatedCost: 150000,
        isMandatory: false,
        recommendationReason: 'Thiên đường ẩm thực đêm, giải trí và mua sắm quà lưu niệm',
        isUnavailable: false,
      },
    ],
  };
}

/**
 * Retrieve an itinerary by its ID (UC-11).
 *
 * Authoritative Server Architecture:
 * 1. Validates itineraryId format before dispatching network request.
 * 2. A non-production environment flag and explicit demo intent are both required for fixtures.
 * 3. In production, demo fixtures are completely locked down regardless of the public flag.
 * 4. Calls real ASP.NET Core 8 backend endpoint GET /api/v1/itineraries/{itineraryId} with Traveler Bearer token.
 * 5. On 200 OK: executes runtime validation (isValidItineraryDetailDto).
 * 6. On 401/403/404/5xx or network error: throws typed ItineraryHttpError.
 */
export async function getItineraryById(
  itineraryId: number | string,
  options?: {
    accessToken?: string;
    allowDemoFixture?: boolean;
  },
): Promise<ItineraryDetailDto> {
  const isDemoExplicitlyRequested =
    options?.allowDemoFixture === true ||
    String(itineraryId).toLowerCase() === 'demo' ||
    String(itineraryId).toUpperCase() === 'DEMO_ONLY';

  if (isDemoAllowedInCurrentEnv() && isDemoExplicitlyRequested) {
    return getDemoItineraryFixture(itineraryId);
  }

  // Route ID Validation
  if (!isValidItineraryId(itineraryId)) {
    throw new ItineraryHttpError(
      404,
      `Không tìm thấy lịch trình. Mã lịch trình "${itineraryId}" không hợp lệ.`,
      'itinerary.invalid_id',
    );
  }

  const numericId = typeof itineraryId === 'number' ? itineraryId : parseInt(itineraryId, 10);
  const context = AuthStorage.getContext();
  const token = options?.accessToken ?? context?.accessToken;
  const API_BASE = getApiBase();

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/itineraries/${numericId}`, {
      method: 'GET',
      credentials: 'include',
      headers,
    });
  } catch {
    throw new ItineraryHttpError(
      503,
      'Không thể kết nối đến máy chủ TripMate. Vui lòng kiểm tra kết nối mạng và thử lại sau.',
      'network.unavailable',
    );
  }

  if (res.status === 200) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      throw new ItineraryHttpError(
        502,
        'Dữ liệu phản hồi từ máy chủ không hợp lệ.',
        'server.malformed_response',
      );
    }

    if (!isValidItineraryDetailDto(body)) {
      throw new ItineraryHttpError(
        502,
        'Cấu trúc dữ liệu chi tiết lịch trình không khớp hợp đồng TripMate.',
        'server.invalid_contract',
      );
    }

    return body;
  }

  if (res.status === 401) {
    throw new ItineraryHttpError(
      401,
      'Phiên đăng nhập đã hết hạn hoặc bạn chưa đăng nhập. Vui lòng đăng nhập tài khoản Du khách để xem lịch trình.',
      'auth.unauthorized',
    );
  }

  if (res.status === 403) {
    throw new ItineraryHttpError(
      403,
      'Bạn không có quyền xem lịch trình này.',
      'auth.forbidden',
    );
  }

  if (res.status === 404) {
    throw new ItineraryHttpError(
      404,
      'Không tìm thấy lịch trình.',
      'itinerary.not_found',
    );
  }

  throw new ItineraryHttpError(
    res.status,
    'Không thể tải lịch trình từ máy chủ. Vui lòng thử lại sau.',
    'server.error',
  );
}

type ItineraryMutationOptions = {
  accessToken?: string;
  idempotencyKey?: string;
};

async function mutateItinerary(
  itineraryId: number,
  path: string,
  method: 'POST' | 'PUT',
  options?: ItineraryMutationOptions,
  body?: unknown,
): Promise<ItineraryDetailDto> {
  if (!isValidItineraryId(itineraryId)) {
    throw new ItineraryHttpError(404, 'Không tìm thấy lịch trình.', 'itinerary.invalid_id');
  }

  const context = AuthStorage.getContext();
  const token = options?.accessToken ?? context?.accessToken;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options?.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;

  let response: Response;
  try {
    response = await fetch(`${getApiBase()}/itineraries/${itineraryId}${path}`, {
      method,
      credentials: 'include',
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ItineraryHttpError(
      503,
      'Không thể kết nối đến máy chủ TripMate. Vui lòng thử lại sau.',
      'network.unavailable',
    );
  }

  if (response.status >= 200 && response.status < 300) {
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new ItineraryHttpError(502, 'Dữ liệu phản hồi từ máy chủ không hợp lệ.', 'server.malformed_response');
    }
    if (!isValidItineraryDetailDto(data)) {
      throw new ItineraryHttpError(502, 'Cấu trúc dữ liệu lịch trình không khớp hợp đồng TripMate.', 'server.invalid_contract');
    }
    return data;
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = (await response.json()) as Record<string, unknown>;
  } catch {
    // Preserve a safe generic message for non-JSON failures.
  }
  const detail = typeof payload.detail === 'string' ? payload.detail : undefined;
  const code = typeof payload.errorCode === 'string'
    ? payload.errorCode
    : typeof payload.code === 'string'
      ? payload.code
      : 'itinerary.mutation_failed';
  throw new ItineraryHttpError(
    response.status,
    detail ?? 'Không thể cập nhật lịch trình. Vui lòng thử lại sau.',
    code,
  );
}

export function acceptItinerary(
  itineraryId: number,
  options?: Pick<ItineraryMutationOptions, 'accessToken'>,
): Promise<ItineraryDetailDto> {
  return mutateItinerary(itineraryId, '/accept', 'POST', options);
}

export function regenerateItinerary(
  itineraryId: number,
  options?: ItineraryMutationOptions,
): Promise<ItineraryDetailDto> {
  return mutateItinerary(itineraryId, '/regenerate', 'POST', {
    ...options,
    idempotencyKey: options?.idempotencyKey ?? generateIdempotencyKey(),
  });
}

export function adjustItineraryItems(
  itineraryId: number,
  orderedVisitPoiIds: number[],
  options?: ItineraryMutationOptions,
): Promise<ItineraryDetailDto> {
  return mutateItinerary(
    itineraryId,
    '/items',
    'PUT',
    { ...options, idempotencyKey: options?.idempotencyKey ?? generateIdempotencyKey() },
    { orderedVisitPoiIds },
  );
}
