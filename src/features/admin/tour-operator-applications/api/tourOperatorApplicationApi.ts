import type {
  ApproveOperatorApplicationResponseDto,
  TourOperatorApplicationDetailDto,
} from '@/types/tour-operator-application';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public errorCode: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function readError(response: Response, fallback: string): Promise<ApiError> {
  const body: unknown = await response.json().catch(() => null);
  const record = body && typeof body === 'object' ? body as Record<string, unknown> : undefined;
  const message = [record?.detail, record?.title, record?.message].find(value => typeof value === 'string');
  const code = [record?.errorCode, record?.code].find(value => typeof value === 'string');
  return new ApiError(
    response.status,
    typeof code === 'string' ? code : 'TOUR_OPERATOR_APPLICATION_REQUEST_FAILED',
    typeof message === 'string' ? message : fallback,
  );
}

export async function fetchOperatorApplicationDetail(userId: number): Promise<TourOperatorApplicationDetailDto> {
  const response = await fetch(`/api/admin/tour-operator-applications/${userId}`, {
    method: 'GET',
    cache: 'no-store',
  });
  if (!response.ok) throw await readError(response, 'Unable to load this Tour Operator application.');
  return response.json() as Promise<TourOperatorApplicationDetailDto>;
}

export async function approveOperatorApplication(userId: number): Promise<ApproveOperatorApplicationResponseDto> {
  const response = await fetch(`/api/admin/tour-operator-applications/${userId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw await readError(response, 'Unable to approve this Tour Operator application.');
  return response.json() as Promise<ApproveOperatorApplicationResponseDto>;
}

export async function rejectOperatorApplication(userId: number, reason: string): Promise<void> {
  const response = await fetch(`/api/admin/tour-operator-applications/${userId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  if (!response.ok) throw await readError(response, 'Unable to reject this Tour Operator application.');
}
