import {
  GetAuditLogsParams,
  PaginatedList,
  AuditLogSummaryDto,
  AuditLogDetailDto,
  isAuditLogPage,
  isAuditLogDetail,
} from '../types/auditLogAdmin';

export class AuditLogServiceError extends Error {
  statusCode?: number;
  errorCode?: string;

  constructor(message: string, statusCode?: number, errorCode?: string) {
    super(message);
    this.name = 'AuditLogServiceError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

function getSafeErrorMessage(statusCode: number): string {
  if (statusCode === 400) return 'Please check the audit log filters and try again.';
  if (statusCode === 401) return 'Administrator sign-in is required.';
  if (statusCode === 403) return 'Administrator access is not allowed.';
  return 'TripMate is temporarily unable to process your request. Please check your connection and try again.';
}

export async function getAuditLogs(
  params: GetAuditLogsParams,
  signal?: AbortSignal,
): Promise<PaginatedList<AuditLogSummaryDto>> {
  const queryParams = new URLSearchParams();

  if (params.keyword?.trim()) {
    queryParams.append('keyword', params.keyword.trim());
  }
  if (params.actionType) {
    queryParams.append('actionType', params.actionType);
  }
  if (params.actorRole) {
    queryParams.append('actorRole', params.actorRole);
  }
  if (params.affectedEntity) {
    queryParams.append('affectedEntity', params.affectedEntity);
  }
  if (params.fromDateUtc) {
    queryParams.append('fromDateUtc', params.fromDateUtc);
  }
  if (params.toDateUtc) {
    queryParams.append('toDateUtc', params.toDateUtc);
  }
  if (params.pageNumber && params.pageNumber > 0) {
    queryParams.append('pageNumber', params.pageNumber.toString());
  }
  if (params.pageSize && params.pageSize > 0) {
    queryParams.append('pageSize', params.pageSize.toString());
  }

  const query = queryParams.toString();
  const response = await fetch(`/api/admin/audit-logs${query ? `?${query}` : ''}`, {
    method: 'GET',
    cache: 'no-store',
    signal,
  });

  if (!response.ok) {
    const errorData: unknown = await response.json().catch(() => null);
    const problem = errorData !== null && typeof errorData === 'object'
      ? errorData as Record<string, unknown>
      : {};
    const extensions = problem.extensions !== null && typeof problem.extensions === 'object'
      ? problem.extensions as Record<string, unknown>
      : {};
    const rootErrorCode = typeof problem.errorCode === 'string' ? problem.errorCode : undefined;
    const extensionErrorCode = typeof extensions.errorCode === 'string' ? extensions.errorCode : undefined;

    throw new AuditLogServiceError(
      getSafeErrorMessage(response.status),
      response.status,
      rootErrorCode ?? extensionErrorCode,
    );
  }

  const body: unknown = await response.json().catch(() => null);
  if (!isAuditLogPage(body)) {
    throw new AuditLogServiceError(
      'TripMate is temporarily unable to process your request. Please check your connection and try again.',
      503,
    );
  }

  return body;
}

export async function getAuditLogDetail(
  id: number,
  signal?: AbortSignal,
): Promise<AuditLogDetailDto> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new AuditLogServiceError('A valid audit log ID is required.', 400);
  }

  const response = await fetch(`/api/admin/audit-logs/${id}`, {
    method: 'GET',
    cache: 'no-store',
    signal,
  });

  if (!response.ok) {
    const errorData: unknown = await response.json().catch(() => null);
    const problem = errorData !== null && typeof errorData === 'object'
      ? errorData as Record<string, unknown>
      : {};
    const extensions = problem.extensions !== null && typeof problem.extensions === 'object'
      ? problem.extensions as Record<string, unknown>
      : {};
    const rootErrorCode = typeof problem.errorCode === 'string' ? problem.errorCode : undefined;
    const extensionErrorCode = typeof extensions.errorCode === 'string' ? extensions.errorCode : undefined;

    throw new AuditLogServiceError(
      response.status === 404
        ? 'System audit log entry not found.'
        : getSafeErrorMessage(response.status),
      response.status,
      rootErrorCode ?? extensionErrorCode,
    );
  }

  const body: unknown = await response.json().catch(() => null);
  if (!isAuditLogDetail(body)) {
    throw new AuditLogServiceError(
      'TripMate is temporarily unable to process your request. Please check your connection and try again.',
      503,
    );
  }

  return body;
}
